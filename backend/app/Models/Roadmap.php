<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

class Roadmap extends Model
{
    use HasFactory, HasUuids, SoftDeletes;

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'goal',
        'experience_level',
        'daily_hours',
        'preferred_language',
        'learning_style',
        'deadline',
        'status',
        'total_topics',
        'completed_topics',
        'total_lessons',
        'completed_lessons',
        'progress_percentage',
        'estimated_completion',
        'ai_metadata',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'estimated_completion' => 'date',
            'ai_metadata' => 'array',
            'progress_percentage' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function skills(): HasMany
    {
        return $this->hasMany(Skill::class)->orderBy('order');
    }

    public function topics(): HasManyThrough
    {
        return $this->hasManyThrough(Topic::class, Skill::class);
    }

    public function dailyTasks(): HasMany
    {
        return $this->hasMany(DailyTask::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function recalculateProgress(): void
    {
        $totalLessons = 0;
        $completedLessons = 0;

        foreach ($this->skills as $skill) {
            foreach ($skill->topics as $topic) {
                $lessons = $topic->lessons()->count();
                $completed = $topic->lessons()->whereNotNull('completed_at')->count();
                $totalLessons += $lessons;
                $completedLessons += $completed;

                $topic->update([
                    'total_lessons' => $lessons,
                    'completed_lessons' => $completed,
                ]);
            }
        }

        $percentage = $totalLessons > 0 ? round(($completedLessons / $totalLessons) * 100, 2) : 0;

        $this->update([
            'total_lessons' => $totalLessons,
            'completed_lessons' => $completedLessons,
            'progress_percentage' => $percentage,
            'status' => $percentage >= 100 ? 'completed' : 'active',
        ]);
    }
}
