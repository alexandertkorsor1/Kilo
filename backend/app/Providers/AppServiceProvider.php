<?php

namespace App\Providers;

use App\Contracts\BookingDateLock;
use App\Services\Booking\NullBookingDateLock;
use App\Services\Booking\PostgresBookingDateLock;
use Illuminate\Support\ServiceProvider;
use RuntimeException;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(
            BookingDateLock::class,
            function ($app): BookingDateLock {
                $driver = $app['db']->connection()->getDriverName();

                if ($driver === 'pgsql') {
                    return new PostgresBookingDateLock();
                }

                if (
                    $driver === 'sqlite' &&
                    $app->environment('testing')
                ) {
                    return new NullBookingDateLock();
                }

                throw new RuntimeException(
                    "Unsupported database driver for booking locks: {$driver}"
                );
            }
        );
    }

    public function boot(): void
    {
        //
    }
}
