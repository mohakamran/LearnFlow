<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LessonResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'content' => $this->content,
            'type' => $this->type,
            'order' => $this->order,
            'status' => $this->status,
            'estimated_minutes' => $this->estimated_minutes,
            'xp_reward' => $this->xp_reward,
            'completed_at' => $this->completed_at?->toISOString(),
            'topic' => $this->whenLoaded('topic', fn() => [
                'id' => $this->topic->id,
                'name' => $this->topic->name,
                'description' => $this->topic->description,
                'learning_objectives' => $this->topic->learning_objectives,
                'skill' => $this->topic->relationLoaded('skill') ? [
                    'id' => $this->topic->skill->id,
                    'name' => $this->topic->skill->name,
                    'roadmap' => $this->topic->skill->relationLoaded('roadmap') ? [
                        'id' => $this->topic->skill->roadmap->id,
                        'title' => $this->topic->skill->roadmap->title,
                    ] : null,
                ] : null,
            ]),
            'resources' => $this->whenLoaded('learningResources', fn() => $this->getRelation('learningResources')->map(fn($r) => [
                'id' => $r->id,
                'title' => $r->title,
                'url' => $r->url,
                'type' => $r->type,
                'source' => $r->source,
                'description' => $r->description,
                'is_free' => $r->is_free,
                'duration_minutes' => $r->duration_minutes,
                'is_required' => $r->is_required,
            ])->toArray()),
            'quiz' => $this->whenLoaded('quiz', fn() => $this->quiz ? [
                'id' => $this->quiz->id,
                'title' => $this->quiz->title,
                'passing_score' => $this->quiz->passing_score,
                'time_limit_minutes' => $this->quiz->time_limit_minutes,
                'questions_count' => count($this->quiz->questions),
            ] : null),
        ];
    }
}
