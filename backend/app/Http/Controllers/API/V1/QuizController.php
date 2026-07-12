<?php

namespace App\Http\Controllers\API\V1;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class QuizController extends Controller
{
    public function show(Request $request, string $id): JsonResponse
    {
        $quiz = Quiz::with('lesson.topic.skill.roadmap')
            ->whereHas('lesson.topic.skill.roadmap', fn($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        $userAttempts = $quiz->userAttempts($request->user()->id)->count();
        $canAttempt = $userAttempts < $quiz->max_attempts;
        $bestScore = $quiz->userAttempts($request->user()->id)->max('percentage') ?? 0;

        $questions = $quiz->questions;
        if ($quiz->randomize_questions) {
            shuffle($questions);
        }

        // Hide correct answers from response
        $safeQuestions = array_map(function ($q) {
            unset($q['correct_answer'], $q['explanation']);
            return $q;
        }, $questions);

        return response()->json([
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'time_limit_minutes' => $quiz->time_limit_minutes,
                'passing_score' => $quiz->passing_score,
                'total_points' => $quiz->total_points,
                'questions_count' => count($questions),
                'questions' => $canAttempt ? $safeQuestions : [],
                'can_attempt' => $canAttempt,
                'attempts_remaining' => max(0, $quiz->max_attempts - $userAttempts),
                'best_score' => $bestScore,
            ],
        ]);
    }

    public function start(Request $request, string $id): JsonResponse
    {
        $quiz = Quiz::whereHas('lesson.topic.skill.roadmap', fn($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        $attemptsCount = $quiz->userAttempts($request->user()->id)->count();
        if ($attemptsCount >= $quiz->max_attempts) {
            return response()->json(['message' => 'Maximum attempts reached for this quiz.'], 422);
        }

        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $request->user()->id,
            'answers' => [],
            'score' => 0,
            'total_points' => $quiz->total_points,
            'percentage' => 0,
            'passed' => false,
            'started_at' => now(),
        ]);

        return response()->json([
            'attempt_id' => $attempt->id,
            'started_at' => $attempt->started_at,
            'time_limit_minutes' => $quiz->time_limit_minutes,
        ]);
    }

    public function submit(Request $request, string $id): JsonResponse
    {
        $quiz = Quiz::whereHas('lesson.topic.skill.roadmap', fn($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        $request->validate([
            'attempt_id' => 'required|uuid',
            'answers' => 'required|array',
            'time_taken_seconds' => 'nullable|integer',
        ]);

        $attempt = QuizAttempt::where('id', $request->attempt_id)
            ->where('user_id', $request->user()->id)
            ->where('quiz_id', $quiz->id)
            ->whereNull('completed_at')
            ->firstOrFail();

        // Grade the quiz
        $score = 0;
        $gradedAnswers = [];
        $questions = $quiz->questions;

        foreach ($questions as $question) {
            $questionId = $question['id'];
            $userAnswer = $request->answers[$questionId] ?? null;
            $isCorrect = $userAnswer === $question['correct_answer'];

            if ($isCorrect) {
                $score += $question['points'] ?? 10;
            }

            $gradedAnswers[$questionId] = [
                'answer' => $userAnswer,
                'correct' => $isCorrect,
                'correct_answer' => $quiz->show_answers_after ? $question['correct_answer'] : null,
                'explanation' => $quiz->show_answers_after ? ($question['explanation'] ?? null) : null,
            ];
        }

        $percentage = $quiz->total_points > 0 ? round(($score / $quiz->total_points) * 100, 2) : 0;
        $passed = $percentage >= $quiz->passing_score;

        $attempt->update([
            'answers' => $gradedAnswers,
            'score' => $score,
            'percentage' => $percentage,
            'passed' => $passed,
            'time_taken_seconds' => $request->time_taken_seconds,
            'completed_at' => now(),
        ]);

        // Award XP if passed
        if ($passed) {
            $xpReward = (int) ($quiz->total_points * 0.5);
            $request->user()->profile->increment('xp_points', $xpReward);
            $request->user()->profile->increment('total_quizzes_passed');
        }

        return response()->json([
            'score' => $score,
            'total_points' => $quiz->total_points,
            'percentage' => $percentage,
            'passed' => $passed,
            'passing_score' => $quiz->passing_score,
            'answers' => $gradedAnswers,
            'xp_earned' => $passed ? (int) ($quiz->total_points * 0.5) : 0,
        ]);
    }

    public function history(Request $request, string $id): JsonResponse
    {
        $quiz = Quiz::whereHas('lesson.topic.skill.roadmap', fn($q) => $q->where('user_id', $request->user()->id))
            ->findOrFail($id);

        $attempts = $quiz->userAttempts($request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get(['id', 'score', 'total_points', 'percentage', 'passed', 'time_taken_seconds', 'completed_at']);

        return response()->json(['attempts' => $attempts]);
    }
}
