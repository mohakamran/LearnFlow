<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Profile extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'user_id',
        'bio',
        'website',
        'github_username',
        'linkedin_url',
        'daily_goal_minutes',
        'experience_level',
        'preferred_language',
        'learning_style',
        'xp_points',
        'level',
        'streak_days',
        'last_activity_date',
        'total_lessons_completed',
        'total_quizzes_passed',
        'total_projects_completed',
    ];

    protected function casts(): array
    {
        return [
            'last_activity_date' => 'date',
            'xp_points' => 'integer',
            'level' => 'integer',
            'streak_days' => 'integer',
            'daily_goal_minutes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function getLevelProgressAttribute(): array
    {
        $xpForCurrentLevel = $this->xpRequiredForLevel($this->level);
        $xpForNextLevel = $this->xpRequiredForLevel($this->level + 1);
        $progress = $this->xp_points - $xpForCurrentLevel;
        $required = $xpForNextLevel - $xpForCurrentLevel;

        return [
            'current' => $progress,
            'required' => $required,
            'percentage' => $required > 0 ? min(100, round(($progress / $required) * 100)) : 100,
        ];
    }

    private function xpRequiredForLevel(int $level): int
    {
        return (int) (100 * pow($level - 1, 1.5));
    }
}
