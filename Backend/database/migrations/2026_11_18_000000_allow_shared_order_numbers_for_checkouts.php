<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('transactions') || ! Schema::hasColumn('transactions', 'order_number')) {
            return;
        }

        $indexes = Schema::getIndexes('transactions');
        foreach ($indexes as $index) {
            if ($index['unique'] && ! $index['primary'] && $index['columns'] === ['order_number']) {
                Schema::table('transactions', function (Blueprint $table) use ($index): void {
                    $table->dropUnique($index['name']);
                });
            }
        }

        $hasOrderNumberIndex = collect(Schema::getIndexes('transactions'))
            ->contains(fn (array $index): bool => $index['columns'] === ['order_number']);

        if (! $hasOrderNumberIndex) {
            Schema::table('transactions', function (Blueprint $table): void {
                $table->index('order_number');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('transactions') && Schema::hasColumn('transactions', 'order_number')) {
            Schema::table('transactions', function (Blueprint $table): void {
                $table->dropIndex(['order_number']);
                $table->unique('order_number');
            });
        }
    }
};
