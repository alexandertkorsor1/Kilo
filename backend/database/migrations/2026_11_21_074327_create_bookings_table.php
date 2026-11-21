<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('reference', 30)->unique();
            $table->string('customer_name', 120);
            $table->string('email', 254);
            $table->string('phone', 30);
            $table->string('service_type', 80);
            $table->date('session_date');
            $table->time('session_time');
            $table->string('location', 255);
            $table->text('message')->nullable();
            $table->string('status', 20)->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestampTz('confirmed_at')->nullable();
            $table->timestampsTz();

            $table->index(['status', 'session_date']);
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
