<?php

namespace App\Services\Booking;

use App\Contracts\BookingDateLock;
use Illuminate\Support\Facades\DB;

class PostgresBookingDateLock implements BookingDateLock
{
    public function lock(string $date): void
    {
        DB::select(
            'SELECT pg_advisory_xact_lock(183562451, hashtext(?))',
            [$date]
        );
    }
}
