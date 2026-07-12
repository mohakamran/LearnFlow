<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Project extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'roadmap_id',
        'skill_id',
        'user_id',
        'title',
        'description',
        'requirements',
        'technologies',
        'difficulty',
        'status',
        'submission_url',
        'github_url',
        'submission_notes',
        'xp_reward',
        'ai_feedback',
        'score',
        'started_at',
        'submitted_at',
        'completed_at',
        'estimated_hours',
    ];

    protected function casts(): array
    {
        return [
            'technologies' => 'array',
            'ai_feedback' => 'array',
            'started_at' => 'datetime',
            'submitted_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function roadmap(): BelongsTo
    {
        return $this->belongsTo(Roadmap::class);
    }

    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
