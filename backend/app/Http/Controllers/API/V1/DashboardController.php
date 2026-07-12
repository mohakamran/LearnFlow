<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\DailyTask;
use App\Models\Lesson;
use App\Models\Topic;
use App\Services\AI\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __construct(private AIService $aiService) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user()->load('profile', 'activeRoadmap.skills.topics');

        $today = now()->toDateString();
        $activeRoadmap = $user->activeRoadmap;

        // Only return tasks that belong to the currently active roadmap
        $todaysTasks = $activeRoadmap
            ? DailyTask::where('user_id', $user->id)
                ->where('roadmap_id', $activeRoadmap->id)
                ->where('scheduled_date', $today)
                ->with('lesson')
                ->orderBy('order')
                ->get()
            : collect();
        $currentLesson = null;
        $currentTopic = null;

        if ($activeRoadmap) {
            $currentLesson = Lesson::whereHas('topic.skill', fn($q) => $q->where('roadmap_id', $activeRoadmap->id))
                ->where('status', 'available')
                ->with('topic.skill')
                ->orderBy('order')
                ->first();

            $currentTopic = Topic::whereHas('skill', fn($q) => $q->where('roadmap_id', $activeRoadmap->id))
                ->where('status', 'in_progress')
                ->with('skill')
                ->first();
        }

        // Due reviews
        $dueReviews = Topic::whereHas('skill.roadmap', fn($q) => $q->where('user_id', $user->id))
            ->where('next_review_at', '<=', now())
            ->where('status', 'completed')
            ->count();

        // Weekly stats
        $weeklyStats = DailyTask::where('user_id', $user->id)
            ->where('scheduled_date', '>=', now()->subDays(7)->toDateString())
            ->selectRaw('scheduled_date, COUNT(*) as total, SUM(status = "completed") as completed')
            ->groupBy('scheduled_date')
            ->orderBy('scheduled_date')
            ->get();

        // Recent activity
        $recentActivity = $user->activityLogs()
            ->latest()
            ->limit(10)
            ->get();

        return response()->json([
            'user' => new UserResource($user),
            'today_tasks' => $todaysTasks,
            'current_lesson' => $currentLesson,
            'current_topic' => $currentTopic,
            'active_roadmap' => $activeRoadmap ? [
                'id' => $activeRoadmap->id,
                'title' => $activeRoadmap->title,
                'goal' => $activeRoadmap->goal,
                'progress_percentage' => $activeRoadmap->progress_percentage,
                'completed_lessons' => $activeRoadmap->completed_lessons,
                'total_lessons' => $activeRoadmap->total_lessons,
                'estimated_completion' => $activeRoadmap->estimated_completion,
            ] : null,
            'stats' => [
                'xp_points' => $user->profile->xp_points ?? 0,
                'level' => $user->profile->level ?? 1,
                'streak_days' => $user->profile->streak_days ?? 0,
                'total_lessons_completed' => $user->profile->total_lessons_completed ?? 0,
                'due_reviews' => $dueReviews,
                'tasks_today' => [
                    'total' => $todaysTasks->count(),
                    'completed' => $todaysTasks->where('status', 'completed')->count(),
                ],
            ],
            'weekly_stats' => $weeklyStats,
            'recent_activity' => $recentActivity,
            'level_progress' => $user->profile?->level_progress ?? ['current' => 0, 'required' => 100, 'percentage' => 0],
        ]);
    }

    public function motivation(Request $request): JsonResponse
    {
        $user = $request->user()->load('profile', 'activeRoadmap');

        try {
            $motivation = $this->aiService->generateMotivation([
                'streak' => $user->profile->streak_days ?? 0,
                'completed_lessons' => $user->profile->total_lessons_completed ?? 0,
                'progress' => $user->activeRoadmap?->progress_percentage ?? 0,
                'goal' => $user->activeRoadmap?->goal ?? 'learning',
            ]);

            return response()->json(['message' => $motivation]);
        } catch (\Exception) {
            return response()->json(['message' => "Keep going! Every step forward is progress. You're building something great!"]);
        }
    }

    public function todaysPlan(Request $request): JsonResponse
    {
        $user = $request->user()->load('profile', 'activeRoadmap');

        $today = now()->toDateString();
        $tasks = DailyTask::where('user_id', $user->id)
            ->where('scheduled_date', $today)
            ->with('lesson.topic')
            ->orderBy('order')
            ->get();

        if ($tasks->isEmpty() && $user->activeRoadmap) {
            // Generate tasks for today if none exist
            app(RoadmapService::class)->generateInitialDailyTasks($user->activeRoadmap, $user);
            $tasks = DailyTask::where('user_id', $user->id)
                ->where('scheduled_date', $today)
                ->with('lesson.topic')
                ->orderBy('order')
                ->get();
        }

        return response()->json([
            'date' => $today,
            'tasks' => $tasks,
            'summary' => [
                'total' => $tasks->count(),
                'completed' => $tasks->where('status', 'completed')->count(),
                'estimated_minutes' => $tasks->sum('estimated_minutes'),
            ],
        ]);
    }
}
