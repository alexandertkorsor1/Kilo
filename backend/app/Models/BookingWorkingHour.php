<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingWorkingHour extends Model
{
    protected $table = 'booking_working_hours';

    protected $fillable = [
        'weekday',
        'is_open',
        'opens_at',
        'closes_at',
    ];

    protected function casts(): array
    {
        return [
            'weekday' => 'integer',
            'is_open' => 'boolean',
        ];
    }
}

