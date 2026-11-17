<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('transactions')) {
            return;
        }

        Schema::table('transactions', function (Blueprint $table): void {
            if (! Schema::hasColumn('transactions', 'delivery_address')) {
                $table->text('delivery_address')->nullable();
            }

            if (! Schema::hasColumn('transactions', 'status')) {
                $table->string('status', 20)->default('menunggu')->index();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('transactions')) {
            return;
        }

        Schema::table('transactions', function (Blueprint $table): void {
            if (Schema::hasColumn('transactions', 'delivery_address')) {
                $table->dropColumn('delivery_address');
            }

            if (Schema::hasColumn('transactions', 'status')) {
                $table->dropIndex(['status']);
                $table->dropColumn('status');
            }
        });
    }
};
