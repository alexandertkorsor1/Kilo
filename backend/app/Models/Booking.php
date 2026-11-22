<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasUuids;

    protected $table = 'bookings';

    protected $fillable = [
        'reference',
        'customer_name',
        'email',
        'phone',
        'service_type',
        'session_date',
        'session_time',
        'location',
        'message',
        'status',
        'admin_notes',
        'confirmed_at',
        'duration_minutes',
    ];

    protected function casts(): array
    {
        return [
            'session_date' => 'date:Y-m-d',
            'confirmed_at' => 'datetime',
            'duration_minutes' => 'integer',
        ];
    }
}

