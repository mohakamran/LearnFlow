<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LearningResource extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'lesson_id',
        'title',
        'url',
        'type',
        'source',
        'description',
        'is_free',
        'duration_minutes',
        'order',
        'is_required',
    ];

    protected function casts(): array
    {
        return [
            'is_free' => 'boolean',
            'is_required' => 'boolean',
        ];
    }

    public function lesson(): BelongsTo
    {
        return $this->belongsTo(Lesson::class);
    }
}
