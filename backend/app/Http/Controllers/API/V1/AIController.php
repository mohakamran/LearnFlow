<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Project;
use App\Services\AI\AIService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AIController extends Controller
{
    public function __construct(private AIService $aiService) {}

    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:2000',
            'context' => 'nullable|string|max:500',
            'history' => 'nullable|array|max:10',
        ]);

        try {
            $messages = [];

            $systemPrompt = "You are LearnFlow AI Mentor, a personalized learning assistant. " .
                "Help users understand concepts, answer questions, and stay motivated. " .
                "Be concise, encouraging, and practical. Use markdown formatting.";

            if ($request->context) {
                $systemPrompt .= "\n\nContext: " . $request->context;
            }

            $messages[] = ['role' => 'system', 'content' => $systemPrompt];

            foreach ($request->history ?? [] as $msg) {
                if (isset($msg['role'], $msg['content'])) {
                    $messages[] = ['role' => $msg['role'], 'content' => substr($msg['content'], 0, 1000)];
                }
            }

            $messages[] = ['role' => 'user', 'content' => $request->message];

            $response = $this->aiService->chat($messages);

            return response()->json([
                'message' => $response['content'],
                'tokens_used' => $response['usage']['total_tokens'] ?? null,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }
    }

    public function explain(Request $request): JsonResponse
    {
        $request->validate([
            'topic' => 'required|string|max:200',
            'context' => 'nullable|string|max:500',
        ]);

        try {
            $explanation = $this->aiService->explainTopic(
                $request->topic,
                $request->context ?? ''
            );

            return response()->json(['explanation' => $explanation]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }
    }

    public function reviewCode(Request $request): JsonResponse
    {
        $request->validate([
            'code' => 'required|string|max:10000',
            'language' => 'required|string|max:50',
        ]);

        try {
            $review = $this->aiService->reviewCode($request->code, $request->language);

            return response()->json(['review' => $review]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }
    }

    public function reviewProject(Request $request, string $projectId): JsonResponse
    {
        $project = Project::where('user_id', $request->user()->id)->findOrFail($projectId);

        $request->validate([
            'submission_url' => 'required|url',
            'notes' => 'nullable|string|max:1000',
        ]);

        try {
            $feedback = $this->aiService->chat([
                ['role' => 'system', 'content' => "You are a senior developer reviewing a student project. Provide constructive, detailed feedback. Return JSON with: overall_score (0-100), strengths (array), improvements (array), next_steps (array), detailed_feedback (string)."],
                ['role' => 'user', 'content' => "Review this project:\nTitle: {$project->title}\nDescription: {$project->description}\nRequirements: {$project->requirements}\nTechnologies: " . implode(', ', $project->technologies ?? []) . "\nSubmission: {$request->submission_url}\nStudent notes: {$request->notes}"],
            ], ['response_format' => ['type' => 'json_object']]);

            $feedbackData = json_decode($feedback['content'], true) ?? [];

            $project->update([
                'submission_url' => $request->submission_url,
                'submission_notes' => $request->notes,
                'ai_feedback' => $feedbackData,
                'score' => $feedbackData['overall_score'] ?? null,
                'status' => 'reviewed',
                'submitted_at' => now(),
            ]);

            if (($feedbackData['overall_score'] ?? 0) >= 70) {
                $project->update(['status' => 'completed', 'completed_at' => now()]);
                $request->user()->profile->increment('xp_points', $project->xp_reward);
                $request->user()->profile->increment('total_projects_completed');
            }

            return response()->json([
                'feedback' => $feedbackData,
                'project' => $project->fresh(),
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }
    }

    public function analyzeProgress(Request $request): JsonResponse
    {
        $user = $request->user()->load('profile', 'activeRoadmap.skills.topics');

        if (!$user->activeRoadmap) {
            return response()->json(['message' => 'No active roadmap found.'], 404);
        }

        $progressData = [
            'goal' => $user->activeRoadmap->goal,
            'overall_progress' => $user->activeRoadmap->progress_percentage,
            'streak' => $user->profile->streak_days,
            'xp' => $user->profile->xp_points,
            'level' => $user->profile->level,
            'completed_lessons' => $user->profile->total_lessons_completed,
            'skills' => $user->activeRoadmap->skills->map(fn($skill) => [
                'name' => $skill->name,
                'status' => $skill->status,
                'progress' => $skill->progress_percentage,
            ]),
        ];

        try {
            $analysis = $this->aiService->analyzeWeaknesses($progressData);

            return response()->json([
                'analysis' => $analysis,
                'progress' => $progressData,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => $e->getMessage()], 503);
        }
    }

    public function status(): JsonResponse
    {
        return response()->json([
            'available' => $this->aiService->isAvailable(),
            'provider' => $this->aiService->getProviderName(),
        ]);
    }
}
