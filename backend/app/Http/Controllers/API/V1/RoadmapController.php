<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\RoadmapResource;
use App\Models\Lesson;
use App\Models\Roadmap;
use App\Services\RoadmapService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoadmapController extends Controller
{
    public function __construct(private RoadmapService $roadmapService) {}

    public function index(Request $request): JsonResponse
    {
        $roadmaps = $request->user()->roadmaps()
            ->with('skills')
            ->latest()
            ->paginate(10);

        return response()->json($roadmaps);
    }

    public function active(Request $request): JsonResponse
    {
        $roadmap = $request->user()->activeRoadmap()
            ->with(['skills.topics.lessons.learningResources', 'projects'])
            ->first();

        if (!$roadmap) {
            return response()->json(['roadmap' => null, 'needs_onboarding' => true]);
        }

        return response()->json(['roadmap' => new RoadmapResource($roadmap)]);
    }

    public function generate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'goal' => 'required|string|max:200',
            'experience_level' => 'required|in:beginner,intermediate,advanced',
            'daily_hours' => 'required|numeric|min:0.5|max:12',
            'preferred_language' => 'required|string|max:50',
            'learning_style' => 'required|in:visual,reading,hands_on,mixed',
            'deadline' => 'nullable|date|after:today',
        ]);

        try {
            $roadmap = $this->roadmapService->generateForUser($request->user(), $validated);

            return response()->json([
                'message' => 'Your personalized roadmap has been generated!',
                'roadmap' => new RoadmapResource($roadmap),
            ], 201);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $roadmap = $request->user()->roadmaps()
            ->with(['skills.topics.lessons.learningResources', 'projects'])
            ->findOrFail($id);

        return response()->json(['roadmap' => new RoadmapResource($roadmap)]);
    }

    public function pause(Request $request, string $id): JsonResponse
    {
        $roadmap = $request->user()->roadmaps()->findOrFail($id);
        $roadmap->update(['status' => 'paused']);

        return response()->json(['message' => 'Roadmap paused.', 'roadmap' => $roadmap]);
    }

    public function resume(Request $request, string $id): JsonResponse
    {
        // Ensure no other active roadmap
        if ($request->user()->activeRoadmap) {
            return response()->json(['message' => 'You already have an active roadmap.'], 422);
        }

        $roadmap = $request->user()->roadmaps()->findOrFail($id);
        $roadmap->update(['status' => 'active']);

        return response()->json(['message' => 'Roadmap resumed.', 'roadmap' => $roadmap]);
    }

    public function archive(Request $request, string $id): JsonResponse
    {
        $roadmap = $request->user()->roadmaps()->findOrFail($id);
        $roadmap->update(['status' => 'archived']);

        return response()->json(['message' => 'Roadmap archived.']);
    }

    public function delete(Request $request, string $id): JsonResponse
    {
        $roadmap = $request->user()->roadmaps()->findOrFail($id);
        $user = $request->user();

        // Collect stats from completed lessons before cascade deletes them
        $completedLessons = Lesson::whereHas('topic.skill', fn($q) => $q->where('roadmap_id', $roadmap->id))
            ->where('status', 'completed')
            ->selectRaw('COUNT(*) as count, COALESCE(SUM(xp_reward), 0) as total_xp')
            ->first();

        $lessonCount = (int) ($completedLessons->count ?? 0);
        $xpToRemove  = (int) ($completedLessons->total_xp ?? 0);

        // forceDelete bypasses SoftDeletes so MySQL FKs cascade and clean up
        // skills → topics → lessons → learning_resources and daily_tasks
        $roadmap->forceDelete();

        // Subtract stats from profile so counters stay accurate
        if ($lessonCount > 0 || $xpToRemove > 0) {
            $profile = $user->profile;
            $profile->total_lessons_completed = max(0, $profile->total_lessons_completed - $lessonCount);
            $profile->xp_points = max(0, $profile->xp_points - $xpToRemove);
            $profile->save();
        }

        return response()->json(['message' => 'Roadmap deleted successfully.']);
    }

    public function regenerate(Request $request, string $id): JsonResponse
    {
        $roadmap = $request->user()->roadmaps()->findOrFail($id);

        $validated = $request->validate([
            'goal' => 'sometimes|string|max:200',
            'experience_level' => 'sometimes|in:beginner,intermediate,advanced',
            'daily_hours' => 'sometimes|numeric|min:0.5|max:12',
        ]);

        $goals = array_merge([
            'goal' => $roadmap->goal,
            'experience_level' => $roadmap->experience_level,
            'daily_hours' => $roadmap->daily_hours,
            'preferred_language' => $roadmap->preferred_language,
            'learning_style' => $roadmap->learning_style,
            'deadline' => $roadmap->deadline,
        ], $validated);

        $roadmap->update(['status' => 'archived']);

        try {
            $newRoadmap = $this->roadmapService->generateForUser($request->user(), $goals);
            return response()->json([
                'message' => 'Roadmap regenerated successfully.',
                'roadmap' => new RoadmapResource($newRoadmap),
            ]);
        } catch (\RuntimeException $e) {
            $roadmap->update(['status' => 'active']);
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
