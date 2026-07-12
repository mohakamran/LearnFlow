<?php

use App\Http\Controllers\API\V1\AdminController;
use App\Http\Controllers\API\V1\AIController;
use App\Http\Controllers\API\V1\AuthController;
use App\Http\Controllers\API\V1\DashboardController;
use App\Http\Controllers\API\V1\LessonController;
use App\Http\Controllers\API\V1\NotificationController;
use App\Http\Controllers\API\V1\QuizController;
use App\Http\Controllers\API\V1\RoadmapController;
use App\Http\Controllers\API\V1\SocialAuthController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->name('api.v1.')->group(function () {

    // ── Public Routes ─────────────────────────────────────────────────────────
    Route::prefix('auth')->name('auth.')->group(function () {
        Route::post('register', [AuthController::class, 'register'])->name('register');
        Route::post('login', [AuthController::class, 'login'])->name('login')
            ->middleware('throttle:10,1');
        Route::post('forgot-password', [AuthController::class, 'forgotPassword'])->name('forgot-password')
            ->middleware('throttle:5,1');
        Route::post('reset-password', [AuthController::class, 'resetPassword'])->name('reset-password');
        Route::get('verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('verify-email');

        // OAuth
        Route::get('social/{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('social.redirect');
        Route::get('social/{provider}/callback', [SocialAuthController::class, 'callback'])->name('social.callback');
    });

    // AI status (public for setup check)
    Route::get('ai/status', [AIController::class, 'status'])->name('ai.status');

    // ── Authenticated Routes ───────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {

        // Auth
        Route::prefix('auth')->name('auth.')->group(function () {
            Route::post('logout', [AuthController::class, 'logout'])->name('logout');
            Route::get('me', [AuthController::class, 'me'])->name('me');
            Route::put('profile', [AuthController::class, 'updateProfile'])->name('profile');
            Route::put('password', [AuthController::class, 'changePassword'])->name('password');
            Route::delete('account', [AuthController::class, 'deleteAccount'])->name('account.delete');
            Route::post('resend-verification', [AuthController::class, 'resendVerification'])->name('resend-verification');
        });

        // Dashboard
        Route::prefix('dashboard')->name('dashboard.')->group(function () {
            Route::get('/', [DashboardController::class, 'index'])->name('index');
            Route::get('motivation', [DashboardController::class, 'motivation'])->name('motivation');
            Route::get('today', [DashboardController::class, 'todaysPlan'])->name('today');
        });

        // Roadmaps
        Route::prefix('roadmaps')->name('roadmaps.')->group(function () {
            Route::get('/', [RoadmapController::class, 'index'])->name('index');
            Route::post('generate', [RoadmapController::class, 'generate'])->name('generate')
                ->middleware('throttle:5,60');
            Route::get('active', [RoadmapController::class, 'active'])->name('active');
            Route::get('{id}', [RoadmapController::class, 'show'])->name('show');
            Route::post('{id}/pause', [RoadmapController::class, 'pause'])->name('pause');
            Route::post('{id}/resume', [RoadmapController::class, 'resume'])->name('resume');
            Route::post('{id}/archive', [RoadmapController::class, 'archive'])->name('archive');
            Route::delete('{id}', [RoadmapController::class, 'delete'])->name('delete');
            Route::post('{id}/regenerate', [RoadmapController::class, 'regenerate'])->name('regenerate')
                ->middleware('throttle:3,60');
        });

        // Lessons
        Route::prefix('lessons')->name('lessons.')->group(function () {
            Route::get('{id}', [LessonController::class, 'show'])->name('show');
            Route::post('{id}/complete', [LessonController::class, 'complete'])->name('complete');
            Route::post('{id}/explain', [LessonController::class, 'explain'])->name('explain')
                ->middleware('throttle:20,1');
            Route::post('{id}/generate-quiz', [LessonController::class, 'generateQuiz'])->name('generate-quiz')
                ->middleware('throttle:10,60');
        });

        // Quizzes
        Route::prefix('quizzes')->name('quizzes.')->group(function () {
            Route::get('{id}', [QuizController::class, 'show'])->name('show');
            Route::post('{id}/start', [QuizController::class, 'start'])->name('start');
            Route::post('{id}/submit', [QuizController::class, 'submit'])->name('submit');
            Route::get('{id}/history', [QuizController::class, 'history'])->name('history');
        });

        // Notifications
        Route::prefix('notifications')->name('notifications.')->group(function () {
            Route::get('/', [NotificationController::class, 'index'])->name('index');
            Route::post('{id}/read', [NotificationController::class, 'markRead'])->name('read');
            Route::post('read-all', [NotificationController::class, 'markAllRead'])->name('read-all');
        });

        // AI Features
        Route::prefix('ai')->name('ai.')->middleware('throttle:20,1')->group(function () {
            Route::post('chat', [AIController::class, 'chat'])->name('chat');
            Route::post('explain', [AIController::class, 'explain'])->name('explain');
            Route::post('review-code', [AIController::class, 'reviewCode'])->name('review-code');
            Route::post('review-project/{projectId}', [AIController::class, 'reviewProject'])->name('review-project');
            Route::get('analyze-progress', [AIController::class, 'analyzeProgress'])->name('analyze-progress');
        });

        // ── Admin Routes ───────────────────────────────────────────────────────
        Route::middleware('can:admin')->prefix('admin')->name('admin.')->group(function () {
            Route::get('dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
            Route::get('users', [AdminController::class, 'users'])->name('users');
            Route::put('users/{id}', [AdminController::class, 'updateUser'])->name('users.update');
            Route::get('settings', [AdminController::class, 'getSettings'])->name('settings');
            Route::put('settings', [AdminController::class, 'updateSettings'])->name('settings.update');
            Route::post('settings/openai-key', [AdminController::class, 'updateOpenAIKey'])->name('settings.openai-key');
            Route::get('settings/validate-openai', [AdminController::class, 'validateOpenAIKey'])->name('settings.validate-openai');
            Route::get('ai-usage', [AdminController::class, 'aiUsage'])->name('ai-usage');
            Route::get('plans', [AdminController::class, 'plans'])->name('plans');
            Route::post('plans', [AdminController::class, 'createPlan'])->name('plans.create');
            Route::get('logs', [AdminController::class, 'logs'])->name('logs');
        });
    });
});
