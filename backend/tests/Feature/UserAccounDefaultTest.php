<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class UserAccounDefaultTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_users_receive_staff_role_and_active_status_by_default(): void
    {
        $user = User::factory()->create();

        $freshUser = $user->fresh();

        $this->assertSame('staff', $freshUser->role);
        $this->assertTrue((bool) $freshUser->is_active);
    }
}
