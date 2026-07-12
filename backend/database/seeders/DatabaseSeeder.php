<?php

namespace Database\Seeders;

use App\Models\Achievement;
use App\Models\Plan;
use App\Models\Profile;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $freePlan = Plan::create([
            'name' => 'Free',
            'slug' => 'free',
            'description' => 'Get started with LearnFlow AI',
            'price_monthly' => 0,
            'price_yearly' => 0,
            'features' => ['1 Active Roadmap', '50 AI Requests / month', 'Basic Progress Tracking', 'Quiz Generation'],
            'ai_requests_per_month' => 50,
            'is_active' => true,
            'is_default' => true,
        ]);

        Plan::create([
            'name' => 'Pro',
            'slug' => 'pro',
            'description' => 'Unlock the full power of AI learning',
            'price_monthly' => 19.99,
            'price_yearly' => 199.99,
            'features' => ['1 Active Roadmap', '500 AI Requests / month', 'Advanced Analytics', 'Code Review', 'Project Reviews', 'Priority Support'],
            'ai_requests_per_month' => 500,
            'is_active' => true,
            'is_default' => false,
        ]);

        $admin = User::create([
            'id' => Str::uuid(),
            'name' => 'Admin',
            'email' => 'admin@learnflow.ai',
            'password' => Hash::make('password'),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);
        Profile::create(['user_id' => $admin->id]);
        Subscription::create(['user_id' => $admin->id, 'plan_id' => $freePlan->id, 'status' => 'active', 'billing_cycle' => 'monthly', 'starts_at' => now()]);

        $demo = User::create([
            'id' => Str::uuid(),
            'name' => 'Demo User',
            'email' => 'demo@learnflow.ai',
            'password' => Hash::make('password'),
            'role' => 'user',
            'email_verified_at' => now(),
        ]);
        Profile::create(['user_id' => $demo->id, 'xp_points' => 350, 'level' => 3, 'streak_days' => 7, 'total_lessons_completed' => 12]);
        Subscription::create(['user_id' => $demo->id, 'plan_id' => $freePlan->id, 'status' => 'trial', 'billing_cycle' => 'monthly', 'starts_at' => now(), 'trial_ends_at' => now()->addDays(14)]);

        $achievements = [
            ['name' => 'First Steps', 'slug' => 'first-steps', 'icon' => '🎯', 'category' => 'completion', 'xp_reward' => 50, 'description' => 'Complete your first lesson', 'criteria' => ['lessons_completed' => 1]],
            ['name' => 'On a Roll', 'slug' => 'on-a-roll', 'icon' => '🔥', 'category' => 'streak', 'xp_reward' => 100, 'description' => 'Maintain a 7-day streak', 'criteria' => ['streak_days' => 7]],
            ['name' => 'Quiz Master', 'slug' => 'quiz-master', 'icon' => '🧠', 'category' => 'quiz', 'xp_reward' => 150, 'description' => 'Pass 10 quizzes', 'criteria' => ['quizzes_passed' => 10]],
            ['name' => 'Builder', 'slug' => 'builder', 'icon' => '🏗️', 'category' => 'project', 'xp_reward' => 300, 'description' => 'Complete your first project', 'criteria' => ['projects_completed' => 1]],
            ['name' => 'Speed Learner', 'slug' => 'speed-learner', 'icon' => '⚡', 'category' => 'speed', 'xp_reward' => 200, 'description' => 'Complete 5 lessons in one day', 'criteria' => ['lessons_per_day' => 5]],
            ['name' => 'Century Club', 'slug' => 'century-club', 'icon' => '💯', 'category' => 'completion', 'xp_reward' => 500, 'description' => 'Complete 100 lessons', 'criteria' => ['lessons_completed' => 100]],
            ['name' => 'Road Warrior', 'slug' => 'road-warrior', 'icon' => '🗺️', 'category' => 'completion', 'xp_reward' => 1000, 'description' => 'Complete an entire roadmap', 'criteria' => ['roadmaps_completed' => 1]],
        ];
        foreach ($achievements as $achievement) {
            Achievement::create($achievement);
        }
    }
}
