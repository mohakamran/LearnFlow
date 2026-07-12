<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('progress', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('user_id');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->uuidMorphs('progressable'); // lesson, topic, skill, project
            $table->enum('status', ['started', 'in_progress', 'completed'])->default('started');
            $table->integer('percentage')->default(0);
            $table->integer('time_spent_minutes')->default(0);
            $table->integer('xp_earned')->default(0);
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'progressable_id', 'progressable_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('progress');
    }
};
