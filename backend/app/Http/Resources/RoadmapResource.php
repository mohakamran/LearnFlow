<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RoadmapResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'goal' => $this->goal,
            'experience_level' => $this->experience_level,
            'daily_hours' => $this->daily_hours,
            'preferred_language' => $this->preferred_language,
            'learning_style' => $this->learning_style,
            'status' => $this->status,
            'deadline' => $this->deadline?->toDateString(),
            'estimated_completion' => $this->estimated_completion?->toDateString(),
            'progress_percentage' => $this->progress_percentage,
            'total_topics' => $this->total_topics,
            'completed_topics' => $this->completed_topics,
            'total_lessons' => $this->total_lessons,
            'completed_lessons' => $this->completed_lessons,
            'created_at' => $this->created_at->toISOString(),
            'skills' => $this->whenLoaded('skills', fn() => $this->skills->map(fn($skill) => [
                'id' => $skill->id,
                'name' => $skill->name,
                'description' => $skill->description,
                'order' => $skill->order,
                'status' => $skill->status,
                'progress_percentage' => $skill->progress_percentage,
                'topics' => $skill->relationLoaded('topics') ? $skill->topics->map(fn($topic) => [
                    'id' => $topic->id,
                    'name' => $topic->name,
                    'description' => $topic->description,
                    'learning_objectives' => $topic->learning_objectives,
                    'order' => $topic->order,
                    'status' => $topic->status,
                    'estimated_minutes' => $topic->estimated_minutes,
                    'difficulty' => $topic->difficulty,
                    'xp_reward' => $topic->xp_reward,
                    'completed_lessons' => $topic->completed_lessons,
                    'total_lessons' => $topic->total_lessons,
                    'completed_at' => $topic->completed_at?->toISOString(),
                    'is_review_due' => $topic->is_review_due,
                    'next_review_at' => $topic->next_review_at?->toISOString(),
                    'lessons' => $topic->relationLoaded('lessons') ? $topic->lessons->map(fn($lesson) => [
                        'id' => $lesson->id,
                        'title' => $lesson->title,
                        'description' => $lesson->description,
                        'type' => $lesson->type,
                        'order' => $lesson->order,
                        'status' => $lesson->status,
                        'estimated_minutes' => $lesson->estimated_minutes,
                        'xp_reward' => $lesson->xp_reward,
                        'completed_at' => $lesson->completed_at?->toISOString(),
                        'resources' => $lesson->relationLoaded('learningResources') ? $lesson->getRelation('learningResources')->map(fn($r) => [
                            'id' => $r->id,
                            'title' => $r->title,
                            'url' => $r->url,
                            'type' => $r->type,
                            'source' => $r->source,
                            'description' => $r->description,
                            'is_free' => $r->is_free,
                            'duration_minutes' => $r->duration_minutes,
                            'is_required' => $r->is_required,
                        ])->toArray() : [],
                    ])->toArray() : [],
                ])->toArray() : [],
            ])->toArray()),
            'projects' => $this->whenLoaded('projects', fn() => $this->projects->map(fn($project) => [
                'id' => $project->id,
                'title' => $project->title,
                'description' => $project->description,
                'difficulty' => $project->difficulty,
                'status' => $project->status,
                'estimated_hours' => $project->estimated_hours,
                'xp_reward' => $project->xp_reward,
            ])->toArray()),
        ];
    }
}
