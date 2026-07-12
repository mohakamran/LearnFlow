<?php

namespace App\Services\AI\Contracts;

interface AIProviderInterface
{
    public function chat(array $messages, array $options = []): array;

    public function generateRoadmap(array $userGoals): array;

    public function generateQuiz(array $topicData): array;

    public function generateLessonContent(array $lessonData): array;

    public function generateDailyPlan(array $context): array;

    public function explainTopic(string $topic, string $context = ''): string;

    public function reviewCode(string $code, string $language): array;

    public function generateProject(array $skillData): array;

    public function analyzeWeaknesses(array $progressData): array;

    public function generateMotivation(array $userContext): string;

    public function isAvailable(): bool;

    public function getProviderName(): string;
}
