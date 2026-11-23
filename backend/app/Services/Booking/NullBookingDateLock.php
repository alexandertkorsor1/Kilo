<?php

namespace App\Services\Booking;

use App\Contracts\BookingDateLock;

class NullBookingDateLock implements BookingDateLock
{
    public function lockSchedulingChanges(): void
    {
        // No advisory lock is needed for isolated SQLite tests.
    }

    public function lock(string $date): void
    {
        // No advisory lock is needed for isolated SQLite tests.
    }
}
