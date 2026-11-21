<?php

namespace App\Contracts;

interface BookingDateLock
{
    public function lock(string $date): void;
}
