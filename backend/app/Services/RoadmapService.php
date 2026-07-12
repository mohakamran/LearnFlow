<?php

namespace App\Services;

use App\Models\DailyTask;
use App\Models\Lesson;
use App\Models\Notification;
use App\Models\Roadmap;
use App\Models\Skill;
use App\Models\Topic;
use App\Models\User;
use App\Services\AI\AIService;
use Illuminate\Support\Facades\DB;

class RoadmapService
{
    public function __construct(
        private AIService $aiService,
        private ActivityLogService $activityLog
    ) {}

    public function generateForUser(User $user, array $goals): Roadmap
    {
        // Ensure user has no active roadmap
        if ($user->activeRoadmap) {
            throw new \RuntimeException('You already have an active roadmap. Complete or archive it before creating a new one.');
        }

        // Generate roadmap structure via AI
        $aiRoadmap = $this->aiService->generateRoadmap($goals);

        return DB::transaction(function () use ($user, $goals, $aiRoadmap) {
            $estimatedWeeks = $aiRoadmap['estimated_weeks'] ?? 12;
            $estimatedCompletion = now()->addWeeks($estimatedWeeks);

            $roadmap = Roadmap::create([
                'user_id' => $user->id,
                'title' => $aiRoadmap['title'],
                'description' => $aiRoadmap['description'] ?? null,
                'goal' => $goals['goal'],
                'experience_level' => $goals['experience_level'],
                'daily_hours' => $goals['daily_hours'],
                'preferred_language' => $goals['preferred_language'],
                'learning_style' => $goals['learning_style'],
                'deadline' => $goals['deadline'] ?? null,
                'status' => 'active',
                'estimated_completion' => $estimatedCompletion,
                'ai_metadata' => ['generated_at' => now(), 'provider' => $this->aiService->getProviderName()],
            ]);

            $this->createSkillsFromAI($roadmap, $aiRoadmap['skills'] ?? []);

            // Create projects
            foreach ($aiRoadmap['projects'] ?? [] as $projectData) {
                $roadmap->projects()->create([
                    'user_id' => $user->id,
                    'title' => $projectData['title'],
                    'description' => $projectData['description'],
                    'requirements' => $projectData['requirements'] ?? '',
                    'technologies' => $projectData['technologies'] ?? [],
                    'difficulty' => $projectData['difficulty'] ?? 'beginner',
                    'estimated_hours' => $projectData['estimated_hours'] ?? 4,
                    'xp_reward' => $projectData['xp_reward'] ?? 200,
                    'status' => 'pending',
                ]);
            }

            $roadmap->recalculateProgress();
            $this->generateInitialDailyTasks($roadmap, $user);

            $this->activityLog->log($user, 'roadmap_created', 'roadmap', $roadmap->id);

            return $roadmap->load('skills.topics.lessons');
        });
    }

    private function createSkillsFromAI(Roadmap $roadmap, array $skills): void
    {
        foreach ($skills as $order => $skillData) {
            $skill = Skill::create([
                'roadmap_id' => $roadmap->id,
                'name' => $skillData['name'],
                'description' => $skillData['description'] ?? null,
                'order' => $order + 1,
                'status' => $order === 0 ? 'in_progress' : 'locked',
            ]);

            $this->createTopicsFromAI($skill, $skillData['topics'] ?? []);
        }
    }

    private function createTopicsFromAI(Skill $skill, array $topics): void
    {
        foreach ($topics as $order => $topicData) {
            $topic = Topic::create([
                'skill_id' => $skill->id,
                'name' => $topicData['name'],
                'description' => $topicData['description'] ?? null,
                'learning_objectives' => $topicData['learning_objectives'] ?? null,
                'order' => $order + 1,
                'status' => ($skill->order === 1 && $order === 0) ? 'in_progress' : 'locked',
                'estimated_minutes' => $topicData['estimated_minutes'] ?? 60,
                'difficulty' => $topicData['difficulty'] ?? 1.5,
                'xp_reward' => $topicData['xp_reward'] ?? 50,
                'total_lessons' => count($topicData['lessons'] ?? []),
            ]);

            $this->createLessonsFromAI($topic, $topicData['lessons'] ?? []);
        }
    }

    private function createLessonsFromAI(Topic $topic, array $lessons): void
    {
        foreach ($lessons as $order => $lessonData) {
            $lesson = Lesson::create([
                'topic_id' => $topic->id,
                'title' => $lessonData['title'],
                'description' => $lessonData['description'] ?? null,
                'type' => $lessonData['type'] ?? 'lesson',
                'order' => $order + 1,
                'status' => ($topic->status === 'in_progress' && $order === 0) ? 'available' : 'locked',
                'estimated_minutes' => $lessonData['estimated_minutes'] ?? 20,
                'xp_reward' => $lessonData['xp_reward'] ?? 25,
            ]);

            foreach ($lessonData['resources'] ?? [] as $resourceOrder => $resource) {
                $lesson->learningResources()->create([
                    'title' => $resource['title'],
                    'url' => $resource['url'],
                    'type' => $resource['type'] ?? 'article',
                    'source' => $resource['source'] ?? null,
                    'description' => $resource['description'] ?? null,
                    'is_free' => $resource['is_free'] ?? true,
                    'duration_minutes' => $resource['duration_minutes'] ?? null,
                    'order' => $resourceOrder + 1,
                ]);
            }
        }
    }

    public function generateInitialDailyTasks(Roadmap $roadmap, User $user): void
    {
        $today = now()->toDateString();
        $dailyMinutes = $roadmap->daily_hours * 60;

        $availableLessons = Lesson::whereHas('topic.skill', function ($q) use ($roadmap) {
            $q->where('roadmap_id', $roadmap->id);
        })->where('status', 'available')
            ->orderBy('order')
            ->limit(5)
            ->get();

        $minutesScheduled = 0;
        $order = 1;

        foreach ($availableLessons as $lesson) {
            if ($minutesScheduled >= $dailyMinutes) break;

            DailyTask::create([
                'user_id' => $user->id,
                'roadmap_id' => $roadmap->id,
                'lesson_id' => $lesson->id,
                'scheduled_date' => $today,
                'title' => $lesson->title,
                'description' => $lesson->description,
                'type' => $lesson->type,
                'status' => 'pending',
                'estimated_minutes' => $lesson->estimated_minutes,
                'xp_reward' => $lesson->xp_reward,
                'order' => $order++,
            ]);

            $minutesScheduled += $lesson->estimated_minutes;
        }
    }

    public function completeLesson(User $user, Lesson $lesson): array
    {
        return DB::transaction(function () use ($user, $lesson) {
            if ($lesson->isCompleted()) {
                return ['already_completed' => true, 'xp_earned' => 0];
            }

            $lesson->update(['completed_at' => now(), 'status' => 'completed']);

            // Unlock the next lesson in the same topic
            $nextLesson = Lesson::where('topic_id', $lesson->topic_id)
                ->where('order', '>', $lesson->order)
                ->where('status', 'locked')
                ->orderBy('order')
                ->first();

            if ($nextLesson) {
                $nextLesson->update(['status' => 'available']);
                $this->createNotification($user, 'lesson_unlocked', 'Next lesson unlocked!', "'{$nextLesson->title}' is now available.", ['lesson_id' => $nextLesson->id]);
            }

            // Update topic progress
            $topic = $lesson->topic;
            $topic->increment('completed_lessons');
            if ($topic->completed_lessons >= $topic->total_lessons) {
                $topic->update(['status' => 'completed', 'completed_at' => now()]);
                $this->unlockNextTopic($topic);
                $this->scheduleReview($topic);
            }

            // Notify lesson completed
            $this->createNotification($user, 'lesson_completed', 'Lesson completed!', "You finished '{$lesson->title}' and earned {$lesson->xp_reward} XP.", ['lesson_id' => $lesson->id, 'xp' => $lesson->xp_reward]);

            // Award XP
            $profile = $user->profile;
            $profile->increment('xp_points', $lesson->xp_reward);
            $profile->increment('total_lessons_completed');
            $profile->update(['last_activity_date' => today()]);

            // Update streak
            $this->updateStreak($profile);

            // Recalculate level
            $newLevel = $this->calculateLevel($profile->xp_points + $lesson->xp_reward);
            if ($newLevel > $profile->level) {
                $profile->update(['level' => $newLevel]);
                $this->createNotification($user, 'level_up', 'Level up!', "You reached Level {$newLevel}! Keep going!", ['level' => $newLevel]);
            }

            // Update roadmap progress
            $lesson->topic->skill->roadmap->recalculateProgress();

            // Mark daily task as completed
            DailyTask::where('user_id', $user->id)
                ->where('lesson_id', $lesson->id)
                ->where('status', 'pending')
                ->update(['status' => 'completed', 'completed_at' => now()]);

            $this->activityLog->log($user, 'lesson_completed', 'lesson', $lesson->id);

            return [
                'xp_earned' => $lesson->xp_reward,
                'new_level' => $profile->fresh()->level,
                'streak_days' => $profile->fresh()->streak_days,
            ];
        });
    }

    private function unlockNextTopic(Topic $currentTopic): void
    {
        $skill = $currentTopic->skill;

        $nextTopic = Topic::where('skill_id', $skill->id)
            ->where('order', '>', $currentTopic->order)
            ->where('status', 'locked')
            ->orderBy('order')
            ->first();

        if ($nextTopic) {
            $nextTopic->update(['status' => 'in_progress']);
            $nextTopic->lessons()->where('order', 1)->update(['status' => 'available']);
        } else {
            // Skill completed, unlock next skill
            $skill->update(['status' => 'completed']);
            $nextSkill = Skill::where('roadmap_id', $skill->roadmap_id)
                ->where('order', '>', $skill->order)
                ->where('status', 'locked')
                ->orderBy('order')
                ->first();

            if ($nextSkill) {
                $nextSkill->update(['status' => 'in_progress']);
                $firstTopic = $nextSkill->topics()->orderBy('order')->first();
                if ($firstTopic) {
                    $firstTopic->update(['status' => 'in_progress']);
                    $firstTopic->lessons()->where('order', 1)->update(['status' => 'available']);
                }
            }
        }
    }

    private function scheduleReview(Topic $topic): void
    {
        // Spaced repetition: 1 day, 3 days, 7 days, 14 days, 30 days
        $intervals = [1, 3, 7, 14, 30];
        $reviewCount = $topic->review_count;
        $daysUntilReview = $intervals[$reviewCount] ?? 30;

        $topic->update([
            'next_review_at' => now()->addDays($daysUntilReview),
        ]);
    }

    private function updateStreak(mixed $profile): void
    {
        $lastActivity = $profile->last_activity_date;
        $today = today();

        if ($lastActivity === null || $lastActivity->diffInDays($today) > 1) {
            $profile->update(['streak_days' => 1]);
        } elseif ($lastActivity->diffInDays($today) === 1) {
            $profile->increment('streak_days');
        }
    }

    private function calculateLevel(int $xp): int
    {
        if ($xp < 100) return 1;
        return (int) (1 + pow($xp / 100, 1 / 1.5));
    }

    private function createNotification(User $user, string $type, string $title, string $message, array $data = []): void
    {
        try {
            Notification::create([
                'user_id' => $user->id,
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'data' => $data,
            ]);
        } catch (\Exception $e) {
            \Log::warning('Failed to create notification: ' . $e->getMessage());
        }
    }
}
