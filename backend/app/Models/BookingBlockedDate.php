<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingBlockedDate extends Model
{
    protected $table = 'booking_blocked_dates';

    protected $fillable = [
        'blocked_date',
        'reason',
    ];

    protected function casts(): array
    {
        return [
            'blocked_date' => 'date',
        ];
    }
}

