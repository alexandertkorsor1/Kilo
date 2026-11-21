<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BookingSetting;
use App\Services\BookingAvailabilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BookingController extends Controller
{
    /**
     * Public: get available appointment times for a date.
     */
    public function availability(
        Request $request,
        BookingAvailabilityService $availability
    ): JsonResponse {
        $validated = $request->validate([
            'date' => ['required', 'date_format:Y-m-d'],
        ]);

        return response()->json(
            $availability->availableSlots($validated['date'])
        );
    }

    /**
     * Public: submit a booking request.
     */
    public function store(
        Request $request,
        BookingAvailabilityService $availability
    ): JsonResponse {
        $validated = $request->validate([
            'customer_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:254'],
            'phone' => ['required', 'string', 'max:30'],
            'service_type' => ['required', 'string', 'max:80'],
            'session_date' => ['required', 'date_format:Y-m-d'],
            'session_time' => ['required', 'date_format:H:i'],
            'location' => ['required', 'string', 'max:255'],
            'message' => ['nullable', 'string', 'max:3000'],
        ]);

        $booking = DB::transaction(function () use (
            $validated,
            $availability
        ) {
            $this->lockBookingDate($validated['session_date']);

            $settings = BookingSetting::query()->findOrFail(1);

            $availability->assertAvailable(
                $validated['session_date'],
                $validated['session_time'],
                null,
                (int) $settings->default_duration_minutes
            );

            do {
                $reference = 'KILO-' . Str::upper(Str::random(8));
            } while (Booking::where('reference', $reference)->exists());

            return Booking::create([
                ...$validated,
                'reference' => $reference,
                'status' => 'pending',
                'duration_minutes' => $settings->default_duration_minutes,
            ]);
        });

        return response()->json([
            'message' => 'Your booking request has been submitted successfully.',
            'data' => $booking,
        ], 201);
    }

    /**
     * Admin: list bookings.
     */
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'status' => [
                'nullable',
                Rule::in(['pending', 'confirmed', 'rejected', 'cancelled']),
            ],
            'date' => ['nullable', 'date_format:Y-m-d'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Booking::query()->latest();

        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($builder) use ($search) {
                $builder->where('reference', 'ilike', "%{$search}%")
                    ->orWhere('customer_name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('phone', 'ilike', "%{$search}%");
            });
        }

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (!empty($validated['date'])) {
            $query->whereDate('session_date', $validated['date']);
        }

        return response()->json(
            $query->paginate($validated['per_page'] ?? 15)
        );
    }

    /**
     * Admin: view one booking.
     */
    public function show(Booking $booking): JsonResponse
    {
        return response()->json(['data' => $booking]);
    }

    /**
     * Admin: update booking status, schedule, or internal notes.
     */
    public function update(
        Request $request,
        Booking $booking,
        BookingAvailabilityService $availability
    ): JsonResponse {
        $validated = $request->validate([
            'status' => [
                'sometimes',
                'required',
                Rule::in(['pending', 'confirmed', 'rejected', 'cancelled']),
            ],
            'session_date' => [
                'sometimes',
                'required',
                'date_format:Y-m-d',
            ],
            'session_time' => [
                'sometimes',
                'required',
                'date_format:H:i',
            ],
            'admin_notes' => ['sometimes', 'nullable', 'string', 'max:3000'],
        ]);

        $updated = DB::transaction(function () use (
            $validated,
            $booking,
            $availability
        ) {
            $booking = Booking::query()
                ->lockForUpdate()
                ->findOrFail($booking->id);

            $newStatus = $validated['status'] ?? $booking->status;

            $newDate = $validated['session_date']
                ?? $booking->session_date->toDateString();

            $newTime = $validated['session_time']
                ?? substr((string) $booking->session_time, 0, 5);

            $willReserve = in_array(
                $newStatus,
                ['pending', 'confirmed'],
                true
            );

            $scheduleChanged =
                array_key_exists('session_date', $validated) ||
                array_key_exists('session_time', $validated) ||
                (
                    isset($validated['status']) &&
                    $validated['status'] !== $booking->status
                );

            $wasReserved = in_array(
                $booking->status,
                ['pending', 'confirmed'],
                true
            );

            if ($scheduleChanged && ($wasReserved || $willReserve)) {
                $dates = array_unique([
                    $booking->session_date->toDateString(),
                    $newDate,
                ]);

                sort($dates);

                foreach ($dates as $date) {
                    $this->lockBookingDate($date);
                }

                if ($willReserve) {
                    $availability->assertAvailable(
                        $newDate,
                        $newTime,
                        (string) $booking->id,
                        (int) $booking->duration_minutes
                    );
                }
            }

            if (
                isset($validated['status']) &&
                $validated['status'] === 'confirmed'
            ) {
                $validated['confirmed_at'] =
                    $booking->confirmed_at ?? now();
            }

            if (
                isset($validated['status']) &&
                $validated['status'] !== 'confirmed'
            ) {
                $validated['confirmed_at'] = null;
            }

            $booking->update($validated);

            return $booking->fresh();
        });

        return response()->json([
            'message' => 'Booking updated successfully.',
            'data' => $updated,
        ]);
    }

    /**
     * Admin: delete a booking.
     */
    public function destroy(Booking $booking): JsonResponse
    {
        DB::transaction(function () use ($booking) {
            $booking = Booking::query()
                ->lockForUpdate()
                ->findOrFail($booking->id);

            $this->lockBookingDate(
                $booking->session_date->toDateString()
            );

            $booking->delete();
        });

        return response()->json([
            'message' => 'Booking deleted successfully.',
        ]);
    }

    /**
     * Serialize booking operations for a particular business-local date.
     *
     * PostgreSQL transaction-level advisory locks are automatically
     * released when the transaction commits or rolls back.
     */
    private function lockBookingDate(string $date): void
    {
        DB::select(
            'SELECT pg_advisory_xact_lock(183562451, hashtext(?))',
            [$date]
        );
    }
}
