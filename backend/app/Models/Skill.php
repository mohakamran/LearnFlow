<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Skill extends Model
{
    use HasFactory, HasUuids;

    protected $fillable = [
        'roadmap_id',
        'name',
        'description',
        'order',
        'status',
        'total_topics',
        'completed_topics',
        'progress_percentage',
        'prerequisites',
    ];

    protected function casts(): array
    {
        return [
            'prerequisites' => 'array',
            'progress_percentage' => 'float',
        ];
    }

    public function roadmap(): BelongsTo
    {
        return $this->belongsTo(Roadmap::class);
    }

    public function topics(): HasMany
    {
        return $this->hasMany(Topic::class)->orderBy('order');
    }
}
