<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withHeader('Origin', 'http://localhost:5173');
    }

    public function test_active_admin_can_login_with_correct_credentials(): void
    {
        $password = 'KiloTestPassword2026!';

        User::factory()->create([
            'email' => 'admin@kilo.test',
            'password' => Hash::make($password),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $response = $this->postJson('/api/login', [
            'email' => 'admin@kilo.test',
            'password' => $password,
        ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Login successful.')
            ->assertJsonPath('user.email', 'admin@kilo.test')
            ->assertJsonPath('user.role', 'admin');

        $this->assertAuthenticated('web');
    }

    public function test_login_rejects_an_incorrect_password(): void
    {
        User::factory()->create([
            'email' => 'admin@kilo.test',
            'password' => Hash::make('CorrectPassword2026!'),
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->postJson('/api/login', [
            'email' => 'admin@kilo.test',
            'password' => 'WrongPassword2026!',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors('email');

        $this->assertGuest('web');
    }

    public function test_inactive_admin_cannot_login(): void
    {
        User::factory()->create([
            'email' => 'inactive@kilo.test',
            'password' => Hash::make('KiloTestPassword2026!'),
            'role' => 'admin',
            'is_active' => false,
        ]);

        $this->postJson('/api/login', [
            'email' => 'inactive@kilo.test',
            'password' => 'KiloTestPassword2026!',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors('email');

        $this->assertGuest('web');
    }

    public function test_staff_member_cannot_login(): void
    {
        User::factory()->create([
            'email' => 'staff@kilo.test',
            'password' => Hash::make('KiloTestPassword2026!'),
            'role' => 'staff',
            'is_active' => true,
        ]);

        $this->postJson('/api/login', [
            'email' => 'staff@kilo.test',
            'password' => 'KiloTestPassword2026!',
        ])->assertUnprocessable()
          ->assertJsonValidationErrors('email');

        $this->assertGuest('web');
    }

    public function test_unauthenticated_user_cannot_access_admin_endpoint(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();
    }

    public function test_authenticated_admin_can_access_user_endpoint(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->actingAs($admin, 'web');

        $this->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('user.role', 'admin');
    }

    public function test_authenticated_staff_member_cannot_access_admin_endpoint(): void
    {
        $staff = User::factory()->create([
            'role' => 'staff',
            'is_active' => true,
        ]);

        $this->actingAs($staff, 'web');

        $this->getJson('/api/user')
            ->assertForbidden()
            ->assertJsonPath('message', 'Administrator access required.');
    }

    public function test_authenticated_admin_can_logout(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->actingAs($admin, 'web');

        $this->postJson('/api/logout')
            ->assertOk()
            ->assertJsonPath('message', 'Logout successful.');

        $this->assertGuest('web');
    }

    public function test_deactivated_admin_loses_access_to_protected_routes(): void
    {
        $admin = User::factory()->create([
            'role' => 'admin',
            'is_active' => true,
        ]);

        $this->actingAs($admin, 'web');

        $admin->forceFill([
            'is_active' => false,
        ])->save();

        $this->getJson('/api/user')
            ->assertForbidden()
            ->assertJsonPath(
                'message',
                'Your account has been deactivated.'
            );

        $this->assertGuest('web');
    }
}
