<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('topics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('skill_id');
            $table->foreign('skill_id')->references('id')->on('skills')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->text('learning_objectives')->nullable();
            $table->integer('order')->default(0);
            $table->enum('status', ['locked', 'in_progress', 'completed'])->default('locked');
            $table->integer('estimated_minutes')->default(30);
            $table->decimal('difficulty', 3, 1)->default(1.0); // 1-5
            $table->integer('xp_reward')->default(50);
            $table->integer('completed_lessons')->default(0);
            $table->integer('total_lessons')->default(0);
            $table->timestamp('completed_at')->nullable();
            $table->boolean('is_review_due')->default(false);
            $table->timestamp('next_review_at')->nullable();
            $table->integer('review_count')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('topics');
    }
};
