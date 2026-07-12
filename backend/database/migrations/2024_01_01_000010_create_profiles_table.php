<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('bio')->nullable();
            $table->string('website')->nullable();
            $table->string('github_username')->nullable();
            $table->string('linkedin_url')->nullable();
            $table->integer('daily_goal_minutes')->default(60);
            $table->enum('experience_level', ['beginner', 'intermediate', 'advanced', 'expert'])->default('beginner');
            $table->string('preferred_language')->default('English');
            $table->enum('learning_style', ['visual', 'reading', 'hands_on', 'mixed'])->default('mixed');
            $table->integer('xp_points')->default(0);
            $table->integer('level')->default(1);
            $table->integer('streak_days')->default(0);
            $table->date('last_activity_date')->nullable();
            $table->integer('total_lessons_completed')->default(0);
            $table->integer('total_quizzes_passed')->default(0);
            $table->integer('total_projects_completed')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('profiles');
    }
};
