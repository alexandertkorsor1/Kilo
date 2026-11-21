<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingBlockedDate;
use App\Models\BookingSetting;
use App\Models\BookingWorkingHour;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;
use RuntimeException;

class BookingAvailabilityService
{
    /**
     * Return available appointment start times for a business-local date.
     */
    public function availableSlots(string $date): array
    {
        $settings = BookingSetting::query()->findOrFail(1);

        [$duration, $interval] = $this->validatedSettings($settings);

        $timezone = $settings->timezone;
        $day = CarbonImmutable::parse($date, $timezone);

        if ($day->isBefore(now($timezone)->startOfDay())) {
            return $this->emptyAvailability(
                $date,
                $settings,
                $duration,
                $interval
            );
        }

        $hours = BookingWorkingHour::query()
            ->where('weekday', $day->dayOfWeek)
            ->first();

        if (!$hours || !$hours->is_open) {
            return $this->emptyAvailability(
                $date,
                $settings,
                $duration,
                $interval
            );
        }

        if (!$hours->opens_at || !$hours->closes_at) {
            throw new RuntimeException(
                'Working hours are incorrectly configured.'
            );
        }

        $opensAt = CarbonImmutable::parse(
            "{$date} {$hours->opens_at}",
            $timezone
        );

        $closesAt = CarbonImmutable::parse(
            "{$date} {$hours->closes_at}",
            $timezone
        );

        if (!$closesAt->greaterThan($opensAt)) {
            throw new RuntimeException(
                'Closing time must be later than opening time.'
            );
        }

        if (
            BookingBlockedDate::query()
                ->whereDate('blocked_date', $date)
                ->exists()
        ) {
            return $this->emptyAvailability(
                $date,
                $settings,
                $duration,
                $interval
            );
        }

        $bookings = Booking::query()
            ->whereDate('session_date', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->get();

        $slots = [];

        for (
            $slot = $opensAt;
            $slot->addMinutes($duration)->lessThanOrEqualTo($closesAt);
            $slot = $slot->addMinutes($interval)
        ) {
            if ($slot->lessThanOrEqualTo(now($timezone))) {
                continue;
            }

            $slotEnd = $slot->addMinutes($duration);
            $overlaps = false;

            foreach ($bookings as $booking) {
                $existingStart = CarbonImmutable::parse(
                    "{$date} {$booking->session_time}",
                    $timezone
                );

                $existingEnd = $existingStart->addMinutes(
                    (int) $booking->duration_minutes
                );

                if (
                    $slot->lessThan($existingEnd) &&
                    $slotEnd->greaterThan($existingStart)
                ) {
                    $overlaps = true;
                    break;
                }
            }

            if (!$overlaps) {
                $slots[] = $slot->format('H:i');
            }
        }

        return [
            'date' => $date,
            'timezone' => $timezone,
            'duration_minutes' => $duration,
            'slot_interval_minutes' => $interval,
            'slots' => $slots,
        ];
    }

    /**
     * Reject a requested appointment if it violates scheduling rules.
     */
    public function assertAvailable(
        string $date,
        string $time,
        ?string $excludeBookingId = null,
        ?int $durationMinutes = null
    ): void {
        $settings = BookingSetting::query()->findOrFail(1);

        [$defaultDuration, $interval] =
            $this->validatedSettings($settings);

        $timezone = $settings->timezone;
        $day = CarbonImmutable::parse($date, $timezone);

        if ($day->isBefore(now($timezone)->startOfDay())) {
            $this->reject(
                'session_date',
                'Please choose a future date.'
            );
        }

        $hours = BookingWorkingHour::query()
            ->where('weekday', $day->dayOfWeek)
            ->first();

        if (!$hours || !$hours->is_open) {
            $this->reject(
                'session_date',
                'Bookings are not available on this day.'
            );
        }

        if (!$hours->opens_at || !$hours->closes_at) {
            throw new RuntimeException(
                'Working hours are incorrectly configured.'
            );
        }

        if (
            BookingBlockedDate::query()
                ->whereDate('blocked_date', $date)
                ->exists()
        ) {
            $this->reject(
                'session_date',
                'Bookings are unavailable on this date.'
            );
        }

        $duration = $durationMinutes ?? $defaultDuration;

        if ($duration < 1 || $duration > 720) {
            throw new RuntimeException(
                'The appointment duration is incorrectly configured.'
            );
        }

        $start = CarbonImmutable::parse(
            "{$date} {$time}",
            $timezone
        );

        $opensAt = CarbonImmutable::parse(
            "{$date} {$hours->opens_at}",
            $timezone
        );

        $closesAt = CarbonImmutable::parse(
            "{$date} {$hours->closes_at}",
            $timezone
        );

        if (!$closesAt->greaterThan($opensAt)) {
            throw new RuntimeException(
                'Closing time must be later than opening time.'
            );
        }

        $end = $start->addMinutes($duration);

        if ($start->lessThanOrEqualTo(now($timezone))) {
            $this->reject(
                'session_time',
                'Please choose a future time.'
            );
        }

        if (
            $start->lessThan($opensAt) ||
            $end->greaterThan($closesAt)
        ) {
            $this->reject(
                'session_time',
                'The appointment must fit within working hours.'
            );
        }

        $minutesFromOpening = (int) $opensAt->diffInMinutes(
            $start,
            false
        );

        if (
            $minutesFromOpening < 0 ||
            $minutesFromOpening % $interval !== 0
        ) {
            $this->reject(
                'session_time',
                'Please choose one of the available appointment times.'
            );
        }

        $bookings = Booking::query()
            ->whereDate('session_date', $date)
            ->whereIn('status', ['pending', 'confirmed'])
            ->when(
                $excludeBookingId,
                fn ($query) => $query->where(
                    'id',
                    '!=',
                    $excludeBookingId
                )
            )
            ->get();

        foreach ($bookings as $booking) {
            $existingStart = CarbonImmutable::parse(
                "{$date} {$booking->session_time}",
                $timezone
            );

            $existingEnd = $existingStart->addMinutes(
                (int) $booking->duration_minutes
            );

            if (
                $start->lessThan($existingEnd) &&
                $end->greaterThan($existingStart)
            ) {
                $this->reject(
                    'session_time',
                    'This appointment time is no longer available. Please choose another time.'
                );
            }
        }
    }

    /**
     * Validate scheduling configuration before calculations.
     */
    private function validatedSettings(
        BookingSetting $settings
    ): array {
        $duration = (int) $settings->default_duration_minutes;
        $interval = (int) $settings->slot_interval_minutes;

        if ($duration < 1 || $duration > 720) {
            throw new RuntimeException(
                'Appointment duration must be between 1 and 720 minutes.'
            );
        }

        if ($interval < 1 || $interval > 240) {
            throw new RuntimeException(
                'Appointment interval must be between 1 and 240 minutes.'
            );
        }

        if (!in_array(
            $settings->timezone,
            timezone_identifiers_list(),
            true
        )) {
            throw new RuntimeException(
                'The booking timezone is invalid.'
            );
        }

        return [$duration, $interval];
    }

    /**
     * Return an empty availability response.
     */
    private function emptyAvailability(
        string $date,
        BookingSetting $settings,
        int $duration,
        int $interval
    ): array {
        return [
            'date' => $date,
            'timezone' => $settings->timezone,
            'duration_minutes' => $duration,
            'slot_interval_minutes' => $interval,
            'slots' => [],
        ];
    }

    /**
     * Return a Laravel validation error.
     */
    private function reject(
        string $field,
        string $message
    ): never {
        throw ValidationException::withMessages([
            $field => [$message],
        ]);
    }
}

