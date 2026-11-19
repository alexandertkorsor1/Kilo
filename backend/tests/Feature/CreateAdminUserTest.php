<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class CreateAdminUserTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_creates_an_active_admin_with_a_hashed_password(): void
    {
        $this->artisan('app:create-admin-user')
            ->expectsQuestion('Administrator name', 'Kilo Administrator')
            ->expectsQuestion('Administrator email', 'admin@kilo.test')
            ->expectsQuestion('Administrator password (minimum 12 characters)', 'KiloSecurePass2026!')
            ->expectsQuestion('Confirm administrator password', 'KiloSecurePass2026!')
            ->expectsOutput('Administrator account created successfully.')
            ->assertSuccessful();

        $admin = User::where('email', 'admin@kilo.test')->first();

        $this->assertNotNull($admin);
        $this->assertSame('admin', $admin->role);
        $this->assertTrue((bool) $admin->is_active);
        $this->assertTrue(Hash::check('KiloSecurePass2026!', $admin->password));
    }

    public function test_it_prevents_creation_of_a_second_admin(): void
    {
        $existingAdmin = User::factory()->create([
            'email' => 'existing@kilo.test',
        ]);

        $existingAdmin->forceFill([
            'role' => 'admin',
            'is_active' => true,
        ])->save();

        $this->artisan('app:create-admin-user')
            ->expectsOutput('An administrator account already exists.')
            ->assertFailed();

        $this->assertDatabaseCount('users', 1);
    }
}

