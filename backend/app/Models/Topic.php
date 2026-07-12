<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Topic extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'skill_id',
        'name',
        'description',
        'learning_objectives',
        'order',
        'status',
        'estimated_minutes',
        'difficulty',
        'xp_reward',
        'completed_lessons',
        'total_lessons',
        'completed_at',
        'is_review_due',
        'next_review_at',
        'review_count',
    ];

    protected function casts(): array
    {
        return [
            'completed_at' => 'datetime',
            'next_review_at' => 'datetime',
            'is_review_due' => 'boolean',
            'difficulty' => 'float',
        ];
    }

    public function skill(): BelongsTo
    {
        return $this->belongsTo(Skill::class);
    }

    public function lessons(): HasMany
    {
        return $this->hasMany(Lesson::class)->orderBy('order');
    }
}
