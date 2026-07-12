<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('skills', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('roadmap_id');
            $table->foreign('roadmap_id')->references('id')->on('roadmaps')->onDelete('cascade');
            $table->string('name');
            $table->text('description')->nullable();
            $table->integer('order')->default(0);
            $table->enum('status', ['locked', 'in_progress', 'completed'])->default('locked');
            $table->integer('total_topics')->default(0);
            $table->integer('completed_topics')->default(0);
            $table->decimal('progress_percentage', 5, 2)->default(0);
            $table->json('prerequisites')->nullable(); // Array of skill IDs
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('skills');
    }
};
