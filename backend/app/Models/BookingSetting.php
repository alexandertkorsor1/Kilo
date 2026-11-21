<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookingSetting extends Model
{
    protected $table = 'booking_settings';

    protected $fillable = [
        'timezone',
        'default_duration_minutes',
        'slot_interval_minutes',
    ];

    protected function casts(): array
    {
        return [
            'default_duration_minutes' => 'integer',
            'slot_interval_minutes' => 'integer',
        ];
    }
}

