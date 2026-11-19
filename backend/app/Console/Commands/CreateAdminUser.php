<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

#[Signature('app:create-admin-user')]
#[Description('Create the first active administrator account')]
class CreateAdminUser extends Command
{
    public function handle(): int
    {
        if (User::query()->where('role', 'admin')->exists()) {
            $this->error('An administrator account already exists.');
            return self::FAILURE;
        }

        do {
            $name = trim($this->ask('Administrator name') ?? '');

            if ($name === '' || strlen($name) > 255) {
                $this->error('Name is required and must not exceed 255 characters.');
                $name = null;
            }
        } while ($name === null);

        do {
            $email = strtolower(trim($this->ask('Administrator email') ?? ''));

            if (
                !filter_var($email, FILTER_VALIDATE_EMAIL) ||
                strlen($email) > 254 ||
                User::query()->where('email', $email)->exists()
            ) {
                $this->error('Enter a valid, unused email address.');
                $email = null;
            }
        } while ($email === null);

        do {
            $password = $this->secret(
                'Administrator password (minimum 12 characters)'
            );

            if ($password === null || strlen($password) < 12) {
                $this->error('Password must contain at least 12 characters.');
                $password = null;
                continue;
            }

            $confirmation = $this->secret('Confirm administrator password');

            if ($password !== $confirmation) {
                $this->error('Passwords do not match.');
                $password = null;
            }
        } while ($password === null);

        $created = DB::transaction(function () use ($name, $email, $password): bool {

            // Serialize administrator creation on PostgreSQL.
            if (DB::getDriverName() === 'pgsql') {
                DB::select('SELECT pg_advisory_xact_lock(73421, 1)');
            }

            // Recheck after acquiring the lock.
            if (User::query()->where('role', 'admin')->exists()) {
                return false;
            }

            $admin = new User();

            $admin->forceFill([
                'name' => $name,
                'email' => $email,
                'password' => $password,
                'role' => 'admin',
                'is_active' => true,
            ]);

            $admin->save();

            return true;
        });

        if (!$created) {
            $this->error('An administrator account already exists.');
            return self::FAILURE;
        }

        $this->info('Administrator account created successfully.');
        $this->line('Email: ' . $email);
        $this->line('Role: admin');
        $this->line('Status: active');

        return self::SUCCESS;
    }
}

