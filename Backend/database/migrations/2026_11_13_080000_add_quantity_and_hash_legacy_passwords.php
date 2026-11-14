<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $addedQuantity = false;
        if (Schema::hasTable('transactions') && ! Schema::hasColumn('transactions', 'quantity')) {
            Schema::table('transactions', function (Blueprint $table): void {
                $table->unsignedInteger('quantity')->default(1);
            });
            $addedQuantity = true;
        }

        if ($addedQuantity && Schema::hasTable('books')) {
            $transactions = DB::table('transactions')
                ->join('books', 'transactions.book_id', '=', 'books.id')
                ->select([
                    'transactions.id',
                    'transactions.total_amount',
                    'books.price',
                ])
                ->cursor();

            foreach ($transactions as $transaction) {
                $totalInCents = (int) round((float) $transaction->total_amount * 100);
                $priceInCents = (int) round((float) $transaction->price * 100);

                if ($priceInCents > 0 && $totalInCents % $priceInCents === 0) {
                    DB::table('transactions')
                        ->where('id', $transaction->id)
                        ->update(['quantity' => intdiv($totalInCents, $priceInCents)]);
                }
            }
        }

        if (Schema::hasTable('users') && Schema::hasColumn('users', 'password')) {
            foreach (DB::table('users')->select(['id', 'password'])->cursor() as $user) {
                if (password_get_info($user->password)['algoName'] === 'unknown') {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['password' => Hash::make($user->password)]);
                }
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('transactions') && Schema::hasColumn('transactions', 'quantity')) {
            Schema::table('transactions', function (Blueprint $table): void {
                $table->dropColumn('quantity');
            });
        }
    }
};
