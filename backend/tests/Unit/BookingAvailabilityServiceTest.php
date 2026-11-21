<?php

namespace Tests\Unit;

use App\Models\Booking;
use App\Services\BookingAvailabilityService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class BookingAvailabilityServiceTest extends TestCase
{
    use RefreshDatabase;

    private BookingAvailabilityService $availability;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(
            Carbon::parse('2026-11-20 08:00:00', 'Asia/Kolkata')
        );

        $this->availability = app(BookingAvailabilityService::class);

        DB::table('booking_settings')->updateOrInsert(
            ['id' => 1],
            [
                'timezone' => 'Asia/Kolkata',
                'default_duration_minutes' => 90,
                'slot_interval_minutes' => 30,
            ]
        );

        foreach (range(0, 6) as $weekday) {
            DB::table('booking_working_hours')->updateOrInsert(
                ['weekday' => $weekday],
                [
                    'is_open' => $weekday >= 1 && $weekday <= 6,
                    'opens_at' => '09:00:00',
                    'closes_at' => '18:00:00',
                ]
            );
        }
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    public function test_it_returns_available_slots_for_a_working_day(): void
    {
        $result = $this->availability->availableSlots('2026-11-23');

        $this->assertSame('2026-11-23', $result['date']);
        $this->assertSame('Asia/Kolkata', $result['timezone']);
        $this->assertSame(90, $result['duration_minutes']);
        $this->assertSame(30, $result['slot_interval_minutes']);
        $this->assertCount(16, $result['slots']);
        $this->assertSame('09:00', $result['slots'][0]);
        $this->assertSame('16:30', end($result['slots']));
    }

    public function test_it_returns_no_slots_on_a_closed_day(): void
    {
        $result = $this->availability->availableSlots('2026-11-22');

        $this->assertSame([], $result['slots']);
    }

    public function test_it_returns_no_slots_on_a_blocked_date(): void
    {
        DB::table('booking_blocked_dates')->insert([
            'blocked_date' => '2026-11-23',
            'reason' => 'Private event',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $result = $this->availability->availableSlots('2026-11-23');

        $this->assertSame([], $result['slots']);
    }

    public function test_pending_booking_blocks_overlapping_slots(): void
    {
        $this->createBooking(
            'pending',
            '10:00:00',
            90
        );

        $result = $this->availability->availableSlots('2026-11-23');

        $this->assertNotContains('09:00', $result['slots']);
        $this->assertNotContains('09:30', $result['slots']);
        $this->assertNotContains('10:00', $result['slots']);
        $this->assertNotContains('10:30', $result['slots']);
        $this->assertNotContains('11:00', $result['slots']);

        // The existing booking ends at 11:30.
        // A new appointment may start exactly at 11:30.
        $this->assertContains('11:30', $result['slots']);
    }

    public function test_rejected_booking_does_not_block_a_slot(): void
    {
        $this->createBooking(
            'rejected',
            '10:00:00',
            90
        );

        $result = $this->availability->availableSlots('2026-11-23');

        $this->assertContains('10:00', $result['slots']);
    }

    public function test_it_rejects_an_overlapping_appointment(): void
    {
        $this->createBooking(
            'confirmed',
            '10:00:00',
            90
        );

        $this->expectException(ValidationException::class);

        $this->availability->assertAvailable(
            '2026-11-23',
            '10:30'
        );
    }

    public function test_it_allows_back_to_back_appointments(): void
    {
        $this->createBooking(
            'confirmed',
            '10:00:00',
            90
        );

        $this->availability->assertAvailable(
            '2026-11-23',
            '11:30'
        );

        $this->assertTrue(true);
    }

    
    public function test_longer_existing_booking_uses_its_actual_duration(): void
    {
        $this->createBooking('confirmed', '10:00:00', 120);

        $result = $this->availability->availableSlots('2026-11-23');

        $this->assertNotContains('11:30', $result['slots']);
        $this->assertContains('12:00', $result['slots']);
    }

    public function test_it_allows_an_appointment_ending_exactly_at_closing_time(): void
    {
        $this->availability->assertAvailable(
            '2026-11-23',
            '16:30'
        );

        $this->assertTrue(true);
    }

    public function test_it_rejects_an_appointment_extending_beyond_closing_time(): void
    {
        $this->expectException(ValidationException::class);

        $this->availability->assertAvailable(
            '2026-11-23',
            '17:00'
        );
    }

    public function test_it_rejects_a_time_not_aligned_with_the_slot_interval(): void
    {
        $this->expectException(ValidationException::class);

        $this->availability->assertAvailable(
            '2026-11-23',
            '09:15'
        );
    }

    public function test_it_rejects_a_past_date(): void
    {
        $this->expectException(ValidationException::class);

        $this->availability->assertAvailable(
            '2026-11-19',
            '10:00'
        );
    }

    public function test_it_rejects_a_past_time_on_the_current_date(): void
    {
        Carbon::setTestNow(
            Carbon::parse('2026-11-23 10:00:00', 'Asia/Kolkata')
        );

        $this->expectException(ValidationException::class);

        $this->availability->assertAvailable(
            '2026-11-23',
            '09:30'
        );
    }


    private function createBooking(
        string $status,
        string $time,
        int $duration
    ): Booking {
        return Booking::create([
            'reference' => 'KILO-' . strtoupper(bin2hex(random_bytes(4))),
            'customer_name' => 'Test Customer',
            'email' => 'test@example.com',
            'phone' => '1234567890',
            'service_type' => 'Portrait',
            'session_date' => '2026-11-23',
            'session_time' => $time,
            'location' => 'Test Location',
            'status' => $status,
            'duration_minutes' => $duration,
        ]);
    }
}

