<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\AiUsageLog;
use App\Models\ActivityLog;
use App\Models\Plan;
use App\Models\Roadmap;
use App\Models\Setting;
use App\Models\User;
use App\Services\AI\Providers\OpenAIProvider;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminController extends Controller
{
    public function dashboard(): JsonResponse
    {
        $stats = [
            'total_users' => User::count(),
            'active_users_today' => User::where('last_login_at', '>=', now()->startOfDay())->count(),
            'total_roadmaps' => Roadmap::count(),
            'active_roadmaps' => Roadmap::where('status', 'active')->count(),
            'ai_requests_today' => AiUsageLog::where('created_at', '>=', now()->startOfDay())->count(),
            'ai_cost_today' => AiUsageLog::where('created_at', '>=', now()->startOfDay())->sum('cost_usd'),
            'ai_cost_month' => AiUsageLog::where('created_at', '>=', now()->startOfMonth())->sum('cost_usd'),
            'new_users_week' => User::where('created_at', '>=', now()->subDays(7))->count(),
        ];

        $recentUsers = User::with('profile')->latest()->limit(5)->get(['id', 'name', 'email', 'created_at', 'last_login_at']);
        $recentLogs = ActivityLog::with('user')->latest()->limit(10)->get();

        return response()->json(compact('stats', 'recentUsers', 'recentLogs'));
    }

    public function users(Request $request): JsonResponse
    {
        $users = User::with('profile', 'subscription.plan')
            ->when($request->search, fn($q) => $q->where('name', 'like', "%{$request->search}%")->orWhere('email', 'like', "%{$request->search}%"))
            ->when($request->role, fn($q) => $q->where('role', $request->role))
            ->latest()
            ->paginate(20);

        return response()->json($users);
    }

    public function updateUser(Request $request, string $id): JsonResponse
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'role' => 'sometimes|in:user,admin',
            'is_active' => 'sometimes|boolean',
        ]);

        $user->update($validated);

        return response()->json(['message' => 'User updated.', 'user' => $user]);
    }

    public function getSettings(): JsonResponse
    {
        $publicSettings = Setting::where('group', '!=', 'secrets')->get(['key', 'value', 'type', 'group', 'description', 'is_public']);

        $aiStatus = [
            'provider' => config('ai.provider', 'openai'),
            'openai_configured' => !empty(config('ai.providers.openai.api_key')),
            'model' => config('ai.providers.openai.model'),
        ];

        return response()->json([
            'settings' => $publicSettings,
            'ai_status' => $aiStatus,
        ]);
    }

    public function updateSettings(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'required',
        ]);

        foreach ($request->settings as $setting) {
            Setting::set($setting['key'], $setting['value'], $setting['type'] ?? 'string');
        }

        return response()->json(['message' => 'Settings updated.']);
    }

    public function updateOpenAIKey(Request $request): JsonResponse
    {
        $request->validate([
            'api_key' => 'required|string|starts_with:sk-',
        ]);

        $provider = new OpenAIProvider();

        // Temporarily set the key for validation
        $isValid = $provider->validateApiKey($request->api_key);

        if (!$isValid) {
            return response()->json(['message' => 'Invalid OpenAI API key. Please check and try again.'], 422);
        }

        Setting::set('openai_api_key', $request->api_key, 'encrypted');

        // Also update .env file via artisan or config
        $envFile = base_path('.env');
        $content = file_get_contents($envFile);
        $content = preg_replace('/OPENAI_API_KEY=.*/', 'OPENAI_API_KEY=' . $request->api_key, $content);
        file_put_contents($envFile, $content);

        return response()->json(['message' => 'OpenAI API key updated and validated successfully.', 'status' => 'connected']);
    }

    public function validateOpenAIKey(Request $request): JsonResponse
    {
        $apiKey = Setting::get('openai_api_key') ?? config('ai.providers.openai.api_key');

        if (empty($apiKey)) {
            return response()->json(['status' => 'not_configured', 'message' => 'No API key configured.']);
        }

        $provider = new OpenAIProvider();
        $isValid = $provider->validateApiKey($apiKey);

        return response()->json([
            'status' => $isValid ? 'connected' : 'invalid',
            'message' => $isValid ? 'API key is valid and connected.' : 'API key is invalid or expired.',
        ]);
    }

    public function aiUsage(Request $request): JsonResponse
    {
        $usage = AiUsageLog::selectRaw('
            provider,
            model,
            action,
            COUNT(*) as requests,
            SUM(prompt_tokens) as prompt_tokens,
            SUM(completion_tokens) as completion_tokens,
            SUM(total_tokens) as total_tokens,
            SUM(cost_usd) as total_cost,
            AVG(response_time_ms) as avg_response_ms,
            SUM(success = 1) as successful,
            SUM(success = 0) as failed
        ')
            ->when($request->from, fn($q) => $q->where('created_at', '>=', $request->from))
            ->when($request->to, fn($q) => $q->where('created_at', '<=', $request->to))
            ->groupBy('provider', 'model', 'action')
            ->get();

        $dailyUsage = AiUsageLog::selectRaw('DATE(created_at) as date, COUNT(*) as requests, SUM(cost_usd) as cost')
            ->where('created_at', '>=', now()->subDays(30))
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json(compact('usage', 'dailyUsage'));
    }

    public function plans(): JsonResponse
    {
        return response()->json(['plans' => Plan::all()]);
    }

    public function createPlan(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:plans',
            'description' => 'nullable|string',
            'price_monthly' => 'required|numeric|min:0',
            'price_yearly' => 'required|numeric|min:0',
            'features' => 'required|array',
            'ai_requests_per_month' => 'required|integer|min:0',
        ]);

        $plan = Plan::create($validated);

        return response()->json(['message' => 'Plan created.', 'plan' => $plan], 201);
    }

    public function logs(Request $request): JsonResponse
    {
        $logs = ActivityLog::with('user')
            ->when($request->action, fn($q) => $q->where('action', $request->action))
            ->when($request->user_id, fn($q) => $q->where('user_id', $request->user_id))
            ->when($request->search, fn($q) => $q->whereHas('user', fn($u) =>
                $u->where('name', 'like', "%{$request->search}%")->orWhere('email', 'like', "%{$request->search}%")
            )->orWhere('action', 'like', "%{$request->search}%"))
            ->latest()
            ->paginate(50);

        return response()->json($logs);
    }
}
