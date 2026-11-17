<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class AuthApiTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->string('role')->default('customer');
            $table->timestamps();
        });
        Schema::create('personal_access_tokens', function (Blueprint $table): void {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });
        Schema::create('genres', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
        });
        Schema::create('contact_messages', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('name');
            $table->string('email');
            $table->string('subject');
            $table->text('message');
            $table->string('status')->default('new');
            $table->timestamps();
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('genres');
        Schema::dropIfExists('contact_messages');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_registration_creates_a_customer_and_token(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Pelanggan Baru',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated()
            ->assertJsonPath('user.role', 'customer')
            ->assertJsonMissingPath('user.password')
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);

        $this->assertDatabaseHas('users', [
            'email' => 'customer@example.com',
            'role' => 'customer',
        ]);
        $this->assertTrue(Hash::check('password123', User::query()->firstOrFail()->password));
    }

    public function test_login_authenticates_hashed_password(): void
    {
        $admin = User::query()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('admin-password'),
        ]);
        $admin->role = 'admin';
        $admin->save();

        $this->postJson('/api/auth/login', [
            'email' => 'admin@example.com',
            'password' => 'admin-password',
        ])->assertOk()
            ->assertJsonPath('user.role', 'admin')
            ->assertJsonStructure(['token', 'user' => ['id', 'name', 'email', 'role']]);
    }

    public function test_registration_cannot_assign_admin_role(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Pelanggan Baru',
            'email' => 'customer@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'role' => 'admin',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors('role');

        $this->assertDatabaseCount('users', 0);
    }

    public function test_admin_can_create_genres(): void
    {
        $admin = User::query()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('admin-password'),
        ]);
        $admin->role = 'admin';
        $admin->save();
        $token = $admin->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/admin/genres', ['name' => 'Fiction'])
            ->assertCreated()
            ->assertJsonPath('name', 'Fiction');
    }

    public function test_admin_catalog_endpoints_reject_customer_tokens(): void
    {
        $customer = User::query()->create([
            'name' => 'Customer',
            'email' => 'customer@example.com',
            'password' => Hash::make('password123'),
            'role' => 'customer',
        ]);
        $token = $customer->createToken('test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/admin/genres', ['name' => 'Fiction'])
            ->assertForbidden();
    }

    public function test_admin_can_list_users_without_exposing_passwords(): void
    {
        $admin = User::query()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('admin-password'),
        ]);
        $admin->role = 'admin';
        $admin->save();
        User::query()->create([
            'name' => 'Customer',
            'email' => 'customer@example.com',
            'password' => Hash::make('customer-password'),
        ]);

        $this->withToken($admin->createToken('test')->plainTextToken)
            ->getJson('/api/admin/users')
            ->assertOk()
            ->assertJsonCount(2)
            ->assertJsonMissingPath('0.password');
    }

    public function test_contact_form_saves_message_for_admin(): void
    {
        $this->postJson('/api/contact-messages', [
            'name' => 'Pelanggan',
            'email' => 'customer@example.com',
            'subject' => 'Pertanyaan buku',
            'message' => 'Apakah stok masih tersedia?',
        ])->assertCreated()
            ->assertJsonPath('message', 'Pesan berhasil dikirim ke admin.');

        $this->assertDatabaseHas('contact_messages', [
            'email' => 'customer@example.com',
            'subject' => 'Pertanyaan buku',
        ]);

        $admin = User::query()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => Hash::make('admin-password'),
        ]);
        $admin->role = 'admin';
        $admin->save();

        $this->withToken($admin->createToken('test')->plainTextToken)
            ->getJson('/api/admin/contact-messages')
            ->assertOk()
            ->assertJsonPath('0.subject', 'Pertanyaan buku');
    }
}
