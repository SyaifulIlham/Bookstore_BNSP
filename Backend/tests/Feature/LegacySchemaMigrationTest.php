<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class LegacySchemaMigrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('users', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('email');
            $table->string('password');
            $table->string('role');
        });
        Schema::create('transactions', function (Blueprint $table): void {
            $table->id();
            $table->string('order_number');
            $table->unsignedBigInteger('customer_id');
            $table->unsignedBigInteger('book_id');
            $table->decimal('total_amount', 10, 2);
        });
        Schema::create('books', function (Blueprint $table): void {
            $table->id();
            $table->decimal('price', 10, 2);
        });
        DB::table('users')->insert([
            'name' => 'Seed User',
            'email' => 'seed@example.com',
            'password' => 'legacy-password',
            'role' => 'customer',
        ]);
        DB::table('transactions')->insert([
            'order_number' => 'ORD-OLD',
            'customer_id' => 1,
            'book_id' => 1,
            'total_amount' => 50000,
        ]);
        DB::table('books')->insert(['id' => 1, 'price' => 25000]);
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('books');
        Schema::dropIfExists('authors');
        Schema::dropIfExists('genres');
        Schema::dropIfExists('contact_messages');
        Schema::dropIfExists('sessions');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_migration_adds_purchase_quantity_and_hashes_legacy_passwords(): void
    {
        $baseMigration = require database_path('migrations/0001_01_01_000000_create_users_table.php');
        $baseMigration->up();

        $migration = require database_path('migrations/2026_11_13_080000_add_quantity_and_hash_legacy_passwords.php');
        $migration->up();
        $featureMigration = require database_path('migrations/2026_11_15_214000_create_bookstore_feature_tables.php');
        $featureMigration->up();
        $deliveryMigration = require database_path('migrations/2026_11_16_000000_add_delivery_details_to_transactions.php');
        $deliveryMigration->up();

        $user = DB::table('users')->first();

        $this->assertTrue(Hash::check('legacy-password', $user->password));
        $this->assertTrue(Schema::hasColumn('transactions', 'quantity'));
        $this->assertTrue(Schema::hasColumn('transactions', 'delivery_address'));
        $this->assertTrue(Schema::hasColumn('transactions', 'status'));
        $this->assertTrue(Schema::hasColumn('users', 'updated_at'));
        $this->assertTrue(Schema::hasTable('authors'));
        $this->assertTrue(Schema::hasTable('genres'));
        $this->assertTrue(Schema::hasTable('contact_messages'));
        $this->assertSame(1, DB::table('transactions')->count());
        $this->assertSame(2, (int) DB::table('transactions')->value('quantity'));
        $this->assertSame('menunggu', DB::table('transactions')->value('status'));
    }
}
