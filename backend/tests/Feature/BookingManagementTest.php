<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class BookingManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(
            Carbon::parse('2026-11-20 08:00:00', 'Asia/Kolkata')
        );

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

    private function createAdmin(): User
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->actingAs($admin, 'web');

        return $admin;
    }

    private function createBooking(
        string $date = '2026-11-23',
        string $time = '10:00:00',
        string $status = 'pending',
        int $duration = 90
    ): Booking {
        return Booking::create([
            'reference' => 'KILO-' . strtoupper(bin2hex(random_bytes(4))),
            'customer_name' => 'Test Customer',
            'email' => 'customer@example.com',
            'phone' => '1234567890',
            'service_type' => 'Portrait',
            'session_date' => $date,
            'session_time' => $time,
            'location' => 'Test Location',
            'status' => $status,
            'duration_minutes' => $duration,
        ]);
    }

    public function test_public_customer_can_submit_a_booking(): void
    {
        $response = $this->postJson('/api/bookings', [
            'customer_name' => 'John Customer',
            'email' => 'john@example.com',
            'phone' => '1234567890',
            'service_type' => 'Portrait',
            'session_date' => '2026-11-23',
            'session_time' => '10:00',
            'location' => 'Monrovia',
            'message' => 'Photography session',
        ]);

        $response->assertCreated()
            ->assertJsonPath('data.customer_name', 'John Customer')
            ->assertJsonPath('data.email', 'john@example.com')
            ->assertJsonPath('data.status', 'pending');

        $reference = $response->json('data.reference');

        $this->assertMatchesRegularExpression(
            '/^KILO-[A-Z0-9]{8}$/',
            $reference
        );

        $this->assertDatabaseHas('bookings', [
            'reference' => $reference,
            'email' => 'john@example.com',
            'status' => 'pending',
            'duration_minutes' => 90,
        ]);
    }

    public function test_public_customer_cannot_submit_an_unavailable_slot(): void
    {
        $this->createBooking();

        $response = $this->postJson('/api/bookings', [
            'customer_name' => 'Another Customer',
            'email' => 'another@example.com',
            'phone' => '1234567890',
            'service_type' => 'Portrait',
            'session_date' => '2026-11-23',
            'session_time' => '10:30',
            'location' => 'Monrovia',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('session_time');
    }

    public function test_admin_can_confirm_a_booking(): void
    {
        $this->createAdmin();

        $booking = $this->createBooking();

        $response = $this->patchJson(
            "/api/admin/bookings/{$booking->id}",
            ['status' => 'confirmed']
        );

        $response->assertOk()
            ->assertJsonPath('data.status', 'confirmed');

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'confirmed',
        ]);

        $this->assertNotNull($booking->fresh()->confirmed_at);
    }

    public function test_admin_can_reschedule_a_booking(): void
    {
        $this->createAdmin();

        $booking = $this->createBooking();

        $response = $this->patchJson(
            "/api/admin/bookings/{$booking->id}",
            [
                'session_date' => '2026-11-24',
                'session_time' => '12:00',
            ]
        );

        $response->assertOk()
            ->assertJsonPath('data.session_date', '2026-11-24');

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'session_date' => '2026-11-24',
            'session_time' => '12:00',
        ]);
    }

    public function test_admin_cannot_reschedule_into_an_occupied_slot(): void
    {
        $this->createAdmin();

        $booking = $this->createBooking(
            '2026-11-23',
            '09:00:00'
        );

        $this->createBooking(
            '2026-11-23',
            '12:00:00'
        );

        $response = $this->patchJson(
            "/api/admin/bookings/{$booking->id}",
            [
                'session_date' => '2026-11-23',
                'session_time' => '12:00',
            ]
        );

        $response->assertUnprocessable()
            ->assertJsonValidationErrors('session_time');

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'session_time' => '09:00:00',
        ]);
    }

    public function test_cancelling_a_booking_releases_its_slot(): void
    {
        $this->createAdmin();

        $booking = $this->createBooking();

        $this->patchJson(
            "/api/admin/bookings/{$booking->id}",
            ['status' => 'cancelled']
        )->assertOk();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'status' => 'cancelled',
        ]);

        $this->getJson(
            '/api/bookings/availability?date=2026-11-23'
        )->assertOk()
            ->assertJsonFragment(['10:00']);
    }

    public function test_admin_can_save_internal_booking_notes(): void
    {
        $this->createAdmin();

        $booking = $this->createBooking();

        $this->patchJson(
            "/api/admin/bookings/{$booking->id}",
            ['admin_notes' => 'Customer requested an outdoor location.']
        )->assertOk();

        $this->assertDatabaseHas('bookings', [
            'id' => $booking->id,
            'admin_notes' => 'Customer requested an outdoor location.',
        ]);
    }

    public function test_admin_can_delete_a_booking(): void
    {
        $this->createAdmin();

        $booking = $this->createBooking();

        $this->deleteJson(
            "/api/admin/bookings/{$booking->id}"
        )->assertOk();

        $this->assertDatabaseMissing('bookings', [
            'id' => $booking->id,
        ]);
    }

    public function test_unauthenticated_user_cannot_access_admin_bookings(): void
    {
        $this->getJson('/api/admin/bookings')
            ->assertUnauthorized();
    }

    public function test_staff_member_cannot_manage_bookings(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'is_active' => true,
        ]);

        $this->actingAs($staff, 'web');

        $this->getJson('/api/admin/bookings')
            ->assertForbidden();
    }
}
