<?php

namespace Tests\Feature;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SharedOrderNumberMigrationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        Schema::create('transactions', function (Blueprint $table): void {
            $table->id();
            $table->string('order_number');
            $table->unique('order_number', 'order_number');
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('transactions');

        parent::tearDown();
    }

    public function test_order_number_can_be_shared_after_migration(): void
    {
        $migration = require database_path('migrations/2026_11_18_000000_allow_shared_order_numbers_for_checkouts.php');
        $migration->up();

        DB::table('transactions')->insert([
            ['order_number' => 'ORD-SHARED'],
            ['order_number' => 'ORD-SHARED'],
        ]);

        $this->assertDatabaseCount('transactions', 2);
    }
}
