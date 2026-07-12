<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('lessons', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('topic_id');
            $table->foreign('topic_id')->references('id')->on('topics')->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->longText('content')->nullable(); // AI-generated content
            $table->enum('type', ['lesson', 'quiz', 'project', 'assignment', 'review'])->default('lesson');
            $table->integer('order')->default(0);
            $table->enum('status', ['locked', 'available', 'in_progress', 'completed'])->default('locked');
            $table->integer('estimated_minutes')->default(20);
            $table->integer('xp_reward')->default(25);
            $table->timestamp('completed_at')->nullable();
            $table->json('resources')->nullable(); // URLs, videos, articles
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('lessons');
    }
};
