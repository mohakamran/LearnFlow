<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'avatar_url' => $this->avatar_url,
            'role' => $this->role,
            'timezone' => $this->timezone,
            'locale' => $this->locale,
            'is_active' => $this->is_active,
            'email_verified' => !is_null($this->email_verified_at),
            'two_factor_enabled' => $this->two_factor_enabled,
            'last_login_at' => $this->last_login_at?->toISOString(),
            'created_at' => $this->created_at->toISOString(),
            'profile' => $this->whenLoaded('profile', fn() => [
                'bio' => $this->profile->bio,
                'website' => $this->profile->website,
                'github_username' => $this->profile->github_username,
                'daily_goal_minutes' => $this->profile->daily_goal_minutes,
                'experience_level' => $this->profile->experience_level,
                'preferred_language' => $this->profile->preferred_language,
                'learning_style' => $this->profile->learning_style,
                'xp_points' => $this->profile->xp_points,
                'level' => $this->profile->level,
                'streak_days' => $this->profile->streak_days,
                'level_progress' => $this->profile->level_progress,
                'total_lessons_completed' => $this->profile->total_lessons_completed,
                'total_quizzes_passed' => $this->profile->total_quizzes_passed,
                'total_projects_completed' => $this->profile->total_projects_completed,
                'last_activity_date' => $this->profile->last_activity_date?->toDateString(),
            ]),
            'active_roadmap' => $this->whenLoaded('activeRoadmap', fn() => $this->activeRoadmap ? [
                'id' => $this->activeRoadmap->id,
                'title' => $this->activeRoadmap->title,
                'goal' => $this->activeRoadmap->goal,
                'progress_percentage' => $this->activeRoadmap->progress_percentage,
                'status' => $this->activeRoadmap->status,
            ] : null),
        ];
    }
}
