<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('roadmap_id');
            $table->foreign('roadmap_id')->references('id')->on('roadmaps')->onDelete('cascade');
            $table->uuid('skill_id')->nullable();
            $table->foreign('skill_id')->references('id')->on('skills')->onDelete('set null');
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->string('title');
            $table->text('description');
            $table->text('requirements');
            $table->json('technologies')->nullable();
            $table->enum('difficulty', ['beginner', 'intermediate', 'advanced'])->default('beginner');
            $table->enum('status', ['pending', 'in_progress', 'submitted', 'reviewed', 'completed'])->default('pending');
            $table->string('submission_url')->nullable();
            $table->string('github_url')->nullable();
            $table->text('submission_notes')->nullable();
            $table->integer('xp_reward')->default(200);
            $table->json('ai_feedback')->nullable();
            $table->integer('score')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->integer('estimated_hours')->default(2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('projects');
    }
};
