<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table): void {
                if (! Schema::hasColumn('users', 'created_at')) {
                    $table->timestamp('created_at')->nullable();
                }

                if (! Schema::hasColumn('users', 'updated_at')) {
                    $table->timestamp('updated_at')->nullable();
                }
            });
        }

        if (! Schema::hasTable('authors')) {
            Schema::create('authors', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->string('photo')->nullable();
                $table->text('bio')->nullable();
            });
        }

        if (! Schema::hasTable('genres')) {
            Schema::create('genres', function (Blueprint $table): void {
                $table->id();
                $table->string('name');
                $table->text('description')->nullable();
            });
        }

        if (! Schema::hasTable('books')) {
            Schema::create('books', function (Blueprint $table): void {
                $table->id();
                $table->string('title');
                $table->text('description')->nullable();
                $table->decimal('price', 10, 2);
                $table->unsignedInteger('stock')->default(0);
                $table->string('cover_photo')->nullable();
                $table->foreignId('genre_id')->constrained()->restrictOnDelete();
                $table->foreignId('author_id')->constrained()->restrictOnDelete();
            });
        }

        if (! Schema::hasTable('transactions')) {
            Schema::create('transactions', function (Blueprint $table): void {
                $table->id();
                $table->string('order_number', 50)->unique();
                $table->unsignedBigInteger('customer_id')->index();
                $table->foreignId('book_id')->constrained()->restrictOnDelete();
                $table->unsignedInteger('quantity')->default(1);
                $table->decimal('total_amount', 10, 2);
            });
        }

        if (! Schema::hasTable('contact_messages')) {
            Schema::create('contact_messages', function (Blueprint $table): void {
                $table->id();
                $table->unsignedBigInteger('user_id')->nullable()->index();
                $table->string('name');
                $table->string('email');
                $table->string('subject');
                $table->text('message');
                $table->string('status', 20)->default('new')->index();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
    }
};
