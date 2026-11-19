<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('photos', function (Blueprint $table) {
            $table->uuid('id')->primary();

            $table->string('title', 150);
            $table->string('alt', 255);
            $table->string('category', 50);
            $table->string('orientation', 20);

            $table->string('image_path', 500)->nullable();
            $table->text('external_url')->nullable();

            $table->boolean('is_temporary')->default(false);
            $table->boolean('is_published')->default(false);

            $table->integer('sort_order')->default(0);

            $table->timestampsTz();

            $table->index(['is_published', 'sort_order']);
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('photos');
    }
};
