<?php

namespace App\Services\AI\Providers;

use App\Models\AiUsageLog;
use App\Services\AI\Contracts\AIProviderInterface;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAIProvider implements AIProviderInterface
{
    private string $apiKey;
    private string $model;
    private int $maxTokens;
    private string $baseUrl = 'https://api.openai.com/v1';

    public function __construct()
    {
        $this->apiKey = config('ai.providers.openai.api_key', '');
        $this->model = config('ai.providers.openai.model', 'gpt-4o');
        $this->maxTokens = config('ai.providers.openai.max_tokens', 4096);
    }

    public function chat(array $messages, array $options = []): array
    {
        $startTime = microtime(true);

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])->timeout(120)->post("{$this->baseUrl}/chat/completions", [
                'model' => $options['model'] ?? $this->model,
                'messages' => $messages,
                'max_tokens' => $options['max_tokens'] ?? $this->maxTokens,
                'temperature' => $options['temperature'] ?? 0.7,
                'response_format' => $options['response_format'] ?? ['type' => 'text'],
            ]);

            if ($response->failed()) {
                $this->logUsage('chat', 0, 0, false, $response->json('error.message'), $startTime);
                throw new \RuntimeException($response->json('error.message', 'OpenAI API error'));
            }

            $data = $response->json();
            $usage = $data['usage'] ?? [];

            $this->logUsage(
                'chat',
                $usage['prompt_tokens'] ?? 0,
                $usage['completion_tokens'] ?? 0,
                true,
                null,
                $startTime
            );

            return [
                'content' => $data['choices'][0]['message']['content'] ?? '',
                'usage' => $usage,
            ];
        } catch (\Exception $e) {
            $this->logUsage('chat', 0, 0, false, $e->getMessage(), $startTime);
            Log::error('OpenAI API error', ['error' => $e->getMessage()]);
            throw $e;
        }
    }

    public function generateRoadmap(array $userGoals): array
    {
        $prompt = $this->buildRoadmapPrompt($userGoals);

        $response = $this->chat([
            ['role' => 'system', 'content' => $this->getRoadmapSystemPrompt()],
            ['role' => 'user', 'content' => $prompt],
        ], ['response_format' => ['type' => 'json_object'], 'temperature' => 0.4, 'max_tokens' => 4096]);

        return json_decode($response['content'], true) ?? [];
    }

    public function generateQuiz(array $topicData): array
    {
        $response = $this->chat([
            ['role' => 'system', 'content' => $this->getQuizSystemPrompt()],
            ['role' => 'user', 'content' => "Generate a quiz for: {$topicData['name']}. Context: {$topicData['description']}. Difficulty: {$topicData['difficulty']}. Number of questions: " . ($topicData['question_count'] ?? 5)],
        ], ['response_format' => ['type' => 'json_object'], 'temperature' => 0.6]);

        return json_decode($response['content'], true) ?? [];
    }

    public function generateLessonContent(array $lessonData): array
    {
        $response = $this->chat([
            ['role' => 'system', 'content' => $this->getLessonSystemPrompt()],
            ['role' => 'user', 'content' => "Create detailed lesson content for: {$lessonData['title']}. Topic: {$lessonData['topic']}. Level: {$lessonData['level']}. Learning objectives: {$lessonData['objectives']}"],
        ], ['response_format' => ['type' => 'json_object'], 'temperature' => 0.5]);

        return json_decode($response['content'], true) ?? [];
    }

    public function generateDailyPlan(array $context): array
    {
        $response = $this->chat([
            ['role' => 'system', 'content' => "You are a personalized learning coach. Create focused daily learning plans. Return JSON."],
            ['role' => 'user', 'content' => "Create today's learning plan. Available time: {$context['daily_hours']} hours. Current roadmap progress: {$context['progress']}%. Next topic: {$context['next_topic']}. User level: {$context['level']}."],
        ], ['response_format' => ['type' => 'json_object'], 'temperature' => 0.6]);

        return json_decode($response['content'], true) ?? [];
    }

    public function explainTopic(string $topic, string $context = ''): string
    {
        $response = $this->chat([
            ['role' => 'system', 'content' => "You are an expert teacher. Explain concepts clearly with examples, analogies, and practical applications. Use markdown formatting."],
            ['role' => 'user', 'content' => "Explain: {$topic}" . ($context ? "\nContext: {$context}" : '')],
        ], ['temperature' => 0.7]);

        return $response['content'];
    }

    public function reviewCode(string $code, string $language): array
    {
        $response = $this->chat([
            ['role' => 'system', 'content' => "You are a senior software engineer. Review code for correctness, best practices, security, performance, and readability. Return JSON with findings."],
            ['role' => 'user', 'content' => "Review this {$language} code:\n\n```{$language}\n{$code}\n```"],
        ], ['response_format' => ['type' => 'json_object'], 'temperature' => 0.3]);

        return json_decode($response['content'], true) ?? [];
    }

    public function generateProject(array $skillData): array
    {
        $response = $this->chat([
            ['role' => 'system', 'content' => "You are a curriculum designer. Create practical, real-world projects that reinforce learning. Return JSON."],
            ['role' => 'user', 'content' => "Create a project for skill: {$skillData['name']}. Level: {$skillData['level']}. Topics covered: " . implode(', ', $skillData['topics'])],
        ], ['response_format' => ['type' => 'json_object'], 'temperature' => 0.6]);

        return json_decode($response['content'], true) ?? [];
    }

    public function analyzeWeaknesses(array $progressData): array
    {
        $response = $this->chat([
            ['role' => 'system', 'content' => "You are a learning analytics expert. Identify weak areas and suggest focused review sessions. Return JSON."],
            ['role' => 'user', 'content' => "Analyze learning progress and identify weak topics: " . json_encode($progressData)],
        ], ['response_format' => ['type' => 'json_object'], 'temperature' => 0.4]);

        return json_decode($response['content'], true) ?? [];
    }

    public function generateMotivation(array $userContext): string
    {
        $response = $this->chat([
            ['role' => 'system', 'content' => "You are a motivational learning coach. Provide personalized, genuine encouragement based on user progress. Be concise and uplifting."],
            ['role' => 'user', 'content' => "Motivate a learner: streak={$userContext['streak']} days, completed={$userContext['completed_lessons']} lessons, progress={$userContext['progress']}%, goal={$userContext['goal']}."],
        ], ['temperature' => 0.8, 'max_tokens' => 200]);

        return $response['content'];
    }

    public function isAvailable(): bool
    {
        return !empty($this->apiKey);
    }

    public function getProviderName(): string
    {
        return 'openai';
    }

    public function validateApiKey(string $key): bool
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $key,
            ])->timeout(10)->get("{$this->baseUrl}/models");

            return $response->successful();
        } catch (\Exception) {
            return false;
        }
    }

    private function buildRoadmapPrompt(array $goals): string
    {
        $lessonTarget = match ($goals['experience_level']) {
            'beginner'     => '10–12 lessons total (e.g. 2 skills × 2 topics × 2-3 lessons each)',
            'intermediate' => '12–18 lessons total (e.g. 3 skills × 2 topics × 2-3 lessons each)',
            'advanced'     => '18–25 lessons total (e.g. 3-4 skills × 2-3 topics × 2-3 lessons each)',
            default        => '10–12 lessons total',
        };

        return sprintf(
            "Create a curated resource roadmap for: \"%s\"\n" .
            "Experience level: %s\n" .
            "Available time: %s hours per day\n" .
            "Preferred language: %s\n" .
            "Learning style: %s\n" .
            "Deadline: %s\n\n" .
            "LESSON COUNT: %s — do not exceed this.\n\n" .
            "Each lesson = a title + 2-3 real external links (YouTube, docs, articles). " .
            "Lessons have NO written content — the links ARE the learning material.",
            $goals['goal'],
            $goals['experience_level'],
            $goals['daily_hours'],
            $goals['preferred_language'],
            $goals['learning_style'],
            $goals['deadline'] ?? 'flexible',
            $lessonTarget
        );
    }

    private function getRoadmapSystemPrompt(): string
    {
        return <<<'PROMPT'
You are an expert curriculum curator. Your job is to curate the best existing online resources — YouTube videos, articles, and official documentation — into a structured step-by-step roadmap.

CRITICAL RULES:
1. Do NOT write lesson content or explanations. Lessons are titles + curated external links only.
2. Every resource URL must be a real, working link. Use well-known sources:
   - YouTube: https://www.youtube.com/watch?v=VIDEO_ID (Fireship, Traversy Media, The Net Ninja, Kevin Powell, Codevolution, Academind, etc.)
   - Official docs: MDN, php.net, laravel.com/docs, react.dev, typescriptlang.org, python.org, etc.
   - Free articles: freeCodeCamp.org, css-tricks.com, dev.to, javascript.info, etc.
3. Each lesson must have 2–4 resources that together fully cover the lesson title.
4. Resource types: "video", "article", "documentation", "course"
5. Follow the lesson count target given in the user message.
6. Ensure resources are free (is_free: true) unless it's a notable paid course.

Return ONLY valid JSON with this exact structure:
{
  "title": "Roadmap title",
  "description": "One sentence describing what the learner will achieve",
  "estimated_weeks": 8,
  "skills": [
    {
      "name": "Skill area name",
      "description": "What this skill group covers",
      "order": 1,
      "topics": [
        {
          "name": "Topic name",
          "description": "What this topic is about",
          "learning_objectives": "What the learner will be able to do after this topic",
          "order": 1,
          "estimated_minutes": 120,
          "difficulty": 1.5,
          "xp_reward": 50,
          "lessons": [
            {
              "title": "Lesson title — what the learner will watch or read",
              "description": "One sentence on what this lesson covers",
              "type": "lesson",
              "order": 1,
              "estimated_minutes": 25,
              "xp_reward": 25,
              "resources": [
                {
                  "title": "Exact video or article title",
                  "url": "https://www.youtube.com/watch?v=REAL_VIDEO_ID",
                  "type": "video",
                  "source": "Fireship",
                  "description": "Brief note on what this resource covers",
                  "is_free": true,
                  "duration_minutes": 10
                },
                {
                  "title": "Official docs page title",
                  "url": "https://developer.mozilla.org/en-US/docs/...",
                  "type": "documentation",
                  "source": "MDN",
                  "description": "Reference documentation",
                  "is_free": true,
                  "duration_minutes": 15
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  "projects": [
    {
      "title": "Project title",
      "description": "What to build and why it reinforces the skills",
      "requirements": "Specific features to implement",
      "technologies": ["tech1", "tech2"],
      "difficulty": "beginner",
      "estimated_hours": 6,
      "xp_reward": 200
    }
  ]
}

Structure guidance by level (strictly follow the LESSON COUNT in the user message):
- beginner: 2 skills, 2 topics each, 2–3 lessons each ≈ 10–12 lessons
- intermediate: 3 skills, 2 topics each, 2–3 lessons each ≈ 12–18 lessons
- advanced: 3–4 skills, 2–3 topics each, 2–3 lessons each ≈ 18–25 lessons

Keep skills and topics focused. 2–3 lessons per topic is enough.
Add 1–2 practical projects at the end (no more).
PROMPT;
    }

    private function getQuizSystemPrompt(): string
    {
        return <<<PROMPT
You are a quiz generator expert. Create engaging, educational quizzes.

Return JSON with this structure:
{
  "title": "Quiz title",
  "description": "Quiz description",
  "passing_score": 70,
  "time_limit_minutes": 10,
  "questions": [
    {
      "id": 1,
      "type": "multiple_choice",
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correct_answer": 0,
      "explanation": "Why this is correct",
      "points": 10
    }
  ],
  "total_points": 50
}

Types: multiple_choice, true_false, short_answer
Include 5-10 questions covering key concepts.
PROMPT;
    }

    private function getLessonSystemPrompt(): string
    {
        return <<<PROMPT
You are an expert educator creating comprehensive lesson content.

Return JSON with this structure:
{
  "content": "Full markdown lesson content with examples, code snippets, and explanations",
  "key_points": ["Point 1", "Point 2"],
  "practical_exercises": ["Exercise 1", "Exercise 2"],
  "common_mistakes": ["Mistake 1", "Mistake 2"],
  "summary": "Concise summary of the lesson"
}

Make content engaging, practical, and beginner-friendly where appropriate.
Include code examples in markdown code blocks.
PROMPT;
    }

    private function logUsage(string $action, int $promptTokens, int $completionTokens, bool $success, ?string $error, float $startTime): void
    {
        try {
            AiUsageLog::create([
                'user_id' => auth()->id(),
                'provider' => 'openai',
                'model' => $this->model,
                'action' => $action,
                'prompt_tokens' => $promptTokens,
                'completion_tokens' => $completionTokens,
                'total_tokens' => $promptTokens + $completionTokens,
                'cost_usd' => $this->calculateCost($promptTokens, $completionTokens),
                'success' => $success,
                'error_message' => $error,
                'response_time_ms' => (int) ((microtime(true) - $startTime) * 1000),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to log AI usage', ['error' => $e->getMessage()]);
        }
    }

    private function calculateCost(int $promptTokens, int $completionTokens): float
    {
        // GPT-4o pricing: $0.005 per 1K input, $0.015 per 1K output
        return ($promptTokens / 1000 * 0.005) + ($completionTokens / 1000 * 0.015);
    }
}
