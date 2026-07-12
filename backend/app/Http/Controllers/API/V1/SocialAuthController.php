<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Plan;
use App\Models\Profile;
use App\Models\SocialAccount;
use App\Models\Subscription;
use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    public function __construct(private ActivityLogService $activityLog) {}

    public function redirect(string $provider): JsonResponse
    {
        $this->validateProvider($provider);

        $url = Socialite::driver($provider)->stateless()->redirect()->getTargetUrl();

        return response()->json(['redirect_url' => $url]);
    }

    public function callback(Request $request, string $provider): JsonResponse
    {
        $this->validateProvider($provider);

        try {
            $socialUser = Socialite::driver($provider)->stateless()->user();
        } catch (\Exception $e) {
            return response()->json(['message' => 'Failed to authenticate with ' . ucfirst($provider)], 400);
        }

        $socialAccount = SocialAccount::where('provider', $provider)
            ->where('provider_id', $socialUser->getId())
            ->with('user')
            ->first();

        if ($socialAccount) {
            $user = $socialAccount->user;
            $socialAccount->update([
                'provider_token' => $socialUser->token,
                'provider_refresh_token' => $socialUser->refreshToken,
            ]);
        } else {
            // Find existing user by email or create new one
            $user = User::where('email', $socialUser->getEmail())->first();

            if (!$user) {
                $user = User::create([
                    'name' => $socialUser->getName() ?? $socialUser->getNickname() ?? 'User',
                    'email' => $socialUser->getEmail(),
                    'avatar' => $socialUser->getAvatar(),
                    'email_verified_at' => now(),
                ]);

                Profile::create(['user_id' => $user->id]);

                $freePlan = Plan::where('is_default', true)->first();
                if ($freePlan) {
                    Subscription::create([
                        'user_id' => $user->id,
                        'plan_id' => $freePlan->id,
                        'status' => 'trial',
                        'billing_cycle' => 'monthly',
                        'starts_at' => now(),
                        'trial_ends_at' => now()->addDays(14),
                    ]);
                }
            }

            SocialAccount::create([
                'user_id' => $user->id,
                'provider' => $provider,
                'provider_id' => $socialUser->getId(),
                'provider_token' => $socialUser->token,
                'provider_refresh_token' => $socialUser->refreshToken,
            ]);
        }

        if (!$user->is_active) {
            return response()->json(['message' => 'Your account has been deactivated.'], 403);
        }

        $user->update(['last_login_at' => now(), 'last_login_ip' => request()->ip()]);
        $token = $user->createToken('auth_token')->plainTextToken;

        $this->activityLog->log($user, "login_via_{$provider}");

        // Redirect to frontend with token
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        return redirect("{$frontendUrl}/auth/callback?token={$token}&provider={$provider}");
    }

    private function validateProvider(string $provider): void
    {
        if (!in_array($provider, ['google', 'github'])) {
            abort(404, 'Unsupported OAuth provider');
        }
    }
}
