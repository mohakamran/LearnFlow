<?php

namespace App\Services\AI;

use App\Services\AI\Contracts\AIProviderInterface;
use App\Services\AI\Providers\OpenAIProvider;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class AIService
{
    private AIProviderInterface $provider;

    public function __construct()
    {
        $this->provider = $this->resolveProvider();
    }

    private function resolveProvider(): AIProviderInterface
    {
        $providerName = config('ai.provider', 'openai');

        return match ($providerName) {
            'openai' => new OpenAIProvider(),
            // Future providers:
            // 'anthropic' => new AnthropicProvider(),
            // 'gemini' => new GeminiProvider(),
            // 'deepseek' => new DeepSeekProvider(),
            default => new OpenAIProvider(),
        };
    }

    public function generateRoadmap(array $userGoals): array
    {
        $this->ensureAvailable();

        try {
            return $this->provider->generateRoadmap($userGoals);
        } catch (\Exception $e) {
            Log::error('Roadmap generation failed', ['error' => $e->getMessage()]);
            throw new RuntimeException('Failed to generate roadmap: ' . $this->sanitizeError($e->getMessage()));
        }
    }

    public function generateQuiz(array $topicData): array
    {
        $this->ensureAvailable();

        try {
            return $this->provider->generateQuiz($topicData);
        } catch (\Exception $e) {
            Log::error('Quiz generation failed', ['error' => $e->getMessage()]);
            throw new RuntimeException('Failed to generate quiz: ' . $this->sanitizeError($e->getMessage()));
        }
    }

    public function generateLessonContent(array $lessonData): array
    {
        $this->ensureAvailable();

        try {
            return $this->provider->generateLessonContent($lessonData);
        } catch (\Exception $e) {
            Log::error('Lesson content generation failed', ['error' => $e->getMessage()]);
            throw new RuntimeException('Failed to generate lesson content: ' . $this->sanitizeError($e->getMessage()));
        }
    }

    public function generateDailyPlan(array $context): array
    {
        $this->ensureAvailable();

        try {
            return $this->provider->generateDailyPlan($context);
        } catch (\Exception $e) {
            Log::error('Daily plan generation failed', ['error' => $e->getMessage()]);
            throw new RuntimeException('Failed to generate daily plan: ' . $this->sanitizeError($e->getMessage()));
        }
    }

    public function explainTopic(string $topic, string $context = ''): string
    {
        $this->ensureAvailable();

        try {
            return $this->provider->explainTopic($topic, $context);
        } catch (\Exception $e) {
            Log::error('Topic explanation failed', ['error' => $e->getMessage()]);
            throw new RuntimeException('Failed to explain topic: ' . $this->sanitizeError($e->getMessage()));
        }
    }

    public function reviewCode(string $code, string $language): array
    {
        $this->ensureAvailable();

        try {
            return $this->provider->reviewCode($code, $language);
        } catch (\Exception $e) {
            Log::error('Code review failed', ['error' => $e->getMessage()]);
            throw new RuntimeException('Failed to review code: ' . $this->sanitizeError($e->getMessage()));
        }
    }

    public function generateProject(array $skillData): array
    {
        $this->ensureAvailable();

        try {
            return $this->provider->generateProject($skillData);
        } catch (\Exception $e) {
            Log::error('Project generation failed', ['error' => $e->getMessage()]);
            throw new RuntimeException('Failed to generate project: ' . $this->sanitizeError($e->getMessage()));
        }
    }

    public function analyzeWeaknesses(array $progressData): array
    {
        $this->ensureAvailable();

        try {
            return $this->provider->analyzeWeaknesses($progressData);
        } catch (\Exception $e) {
            Log::error('Weakness analysis failed', ['error' => $e->getMessage()]);
            throw new RuntimeException('Failed to analyze weaknesses: ' . $this->sanitizeError($e->getMessage()));
        }
    }

    public function generateMotivation(array $userContext): string
    {
        $this->ensureAvailable();

        try {
            return $this->provider->generateMotivation($userContext);
        } catch (\Exception $e) {
            return "Keep going! Every step forward is progress. You're doing great!";
        }
    }

    public function isAvailable(): bool
    {
        return $this->provider->isAvailable();
    }

    public function getProviderName(): string
    {
        return $this->provider->getProviderName();
    }

    public function chat(array $messages, array $options = []): array
    {
        $this->ensureAvailable();
        return $this->provider->chat($messages, $options);
    }

    private function ensureAvailable(): void
    {
        if (!$this->provider->isAvailable()) {
            throw new RuntimeException('AI provider is not configured. Please set up your API key in settings.');
        }
    }

    private function sanitizeError(string $message): string
    {
        // Never expose API keys or sensitive data in error messages
        return preg_replace('/sk-[a-zA-Z0-9-_]+/', '[API_KEY]', $message);
    }
}
