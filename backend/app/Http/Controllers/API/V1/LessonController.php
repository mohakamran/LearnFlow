<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\LessonResource;
use App\Models\Lesson;
use App\Services\AI\AIService;
use App\Services\RoadmapService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function __construct(
        private RoadmapService $roadmapService,
        private AIService $aiService
    ) {}

    public function show(Request $request, string $id): JsonResponse
    {
        $lesson = Lesson::with(['topic.skill.roadmap', 'learningResources', 'quiz'])
            ->whereHas('topic.skill.roadmap', fn($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        return response()->json(['lesson' => new LessonResource($lesson)]);
    }

    public function complete(Request $request, string $id): JsonResponse
    {
        $lesson = Lesson::whereHas('topic.skill.roadmap', fn($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        $result = $this->roadmapService->completeLesson($request->user(), $lesson);

        return response()->json([
            'message' => $result['already_completed'] ?? false ? 'Lesson already completed.' : 'Lesson completed! Great work!',
            'xp_earned' => $result['xp_earned'],
            'new_level' => $result['new_level'] ?? null,
            'streak_days' => $result['streak_days'] ?? null,
        ]);
    }

    public function explain(Request $request, string $id): JsonResponse
    {
        $lesson = Lesson::whereHas('topic.skill.roadmap', fn($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        $request->validate([
            'question' => 'sometimes|string|max:500',
        ]);

        try {
            $context = "Lesson: {$lesson->title}. Topic: {$lesson->topic->name}.";
            $explanation = $this->aiService->explainTopic(
                $request->question ?? $lesson->title,
                $context
            );

            return response()->json(['explanation' => $explanation]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }
    }

    public function generateQuiz(Request $request, string $id): JsonResponse
    {
        $lesson = Lesson::with('topic')
            ->whereHas('topic.skill.roadmap', fn($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        if ($lesson->quiz) {
            return response()->json(['quiz' => $lesson->quiz]);
        }

        try {
            $quizData = $this->aiService->generateQuiz([
                'name' => $lesson->topic->name,
                'description' => $lesson->topic->description ?? $lesson->title,
                'difficulty' => $lesson->topic->difficulty,
                'question_count' => 5,
            ]);

            $quiz = $lesson->quiz()->create([
                'title' => $quizData['title'] ?? "Quiz: {$lesson->title}",
                'description' => $quizData['description'] ?? null,
                'passing_score' => $quizData['passing_score'] ?? 70,
                'time_limit_minutes' => $quizData['time_limit_minutes'] ?? 10,
                'max_attempts' => 3,
                'questions' => $quizData['questions'] ?? [],
                'total_points' => $quizData['total_points'] ?? 50,
            ]);

            return response()->json(['quiz' => $quiz]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }
    }
}
