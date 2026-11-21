
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_settings', function (Blueprint $table) {
            $table->unsignedTinyInteger('id')->primary();
            $table->string('timezone', 64)->default('Asia/Kolkata');
            $table->unsignedSmallInteger('default_duration_minutes')->default(90);
            $table->unsignedSmallInteger('slot_interval_minutes')->default(30);
            $table->timestampsTz();
        });

        Schema::create('booking_working_hours', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('weekday')->unique();
            $table->boolean('is_open')->default(false);
            $table->time('opens_at')->nullable();
            $table->time('closes_at')->nullable();
            $table->timestampsTz();
        });

        Schema::create('booking_blocked_dates', function (Blueprint $table) {
            $table->id();
            $table->date('blocked_date')->unique();
            $table->string('reason', 255)->nullable();
            $table->timestampsTz();
        });

        DB::table('booking_settings')->insert([
            'id' => 1,
            'timezone' => 'Asia/Kolkata',
            'default_duration_minutes' => 90,
            'slot_interval_minutes' => 30,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Carbon weekday convention: Sunday = 0, Saturday = 6.
        // Initial schedule: Monday-Saturday, 09:00-18:00.
        $hours = [];

        for ($day = 0; $day <= 6; $day++) {
            $isOpen = $day !== 0;

            $hours[] = [
                'weekday' => $day,
                'is_open' => $isOpen,
                'opens_at' => $isOpen ? '09:00:00' : null,
                'closes_at' => $isOpen ? '18:00:00' : null,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('booking_working_hours')->insert($hours);
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_blocked_dates');
        Schema::dropIfExists('booking_working_hours');
        Schema::dropIfExists('booking_settings');
    }
};

