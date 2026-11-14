<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\Genre;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class CustomerPurchaseApiTest extends TestCase
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
        Schema::create('authors', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->string('foto')->nullable();
            $table->text('bio')->nullable();
        });
        Schema::create('genres', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->text('description')->nullable();
        });
        Schema::create('books', function (Blueprint $table): void {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->decimal('price', 10, 2);
            $table->integer('stock');
            $table->string('cover_foto')->nullable();
            $table->foreignId('genre_id')->constrained();
            $table->foreignId('author_id')->constrained();
        });
        Schema::create('transactions', function (Blueprint $table): void {
            $table->id();
            $table->string('order_number')->unique();
            $table->foreignId('customer_id')->constrained('users');
            $table->foreignId('book_id')->constrained();
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('total_amount', 10, 2);
        });
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('books');
        Schema::dropIfExists('genres');
        Schema::dropIfExists('authors');
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_purchase_decrements_stock_and_records_total(): void
    {
        [$customer, $book, $token] = $this->createCustomerAndBook(4);

        $this->withToken($token)
            ->postJson('/api/customer/transactions', [
                'book_id' => $book->id,
                'quantity' => 2,
            ])
            ->assertCreated()
            ->assertJsonPath('quantity', 2)
            ->assertJsonPath('total_amount', '150000.00')
            ->assertJsonPath('customer_id', $customer->id);

        $this->assertSame(2, $book->fresh()->stock);
        $this->assertDatabaseCount('transactions', 1);
    }

    public function test_purchase_rejects_quantity_above_stock_without_changing_stock(): void
    {
        [, $book, $token] = $this->createCustomerAndBook(1);

        $this->withToken($token)
            ->postJson('/api/customer/transactions', [
                'book_id' => $book->id,
                'quantity' => 2,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('quantity');

        $this->assertSame(1, $book->fresh()->stock);
        $this->assertDatabaseCount('transactions', 0);
    }

    public function test_checkout_creates_all_transactions_and_decrements_each_stock(): void
    {
        [, $book, $token] = $this->createCustomerAndBook(4);
        $secondBook = Book::query()->create([
            'title' => 'Bumi Manusia',
            'description' => 'Sebuah kisah.',
            'price' => 90000,
            'stock' => 3,
            'genre_id' => $book->genre_id,
            'author_id' => $book->author_id,
        ]);

        $this->withToken($token)
            ->postJson('/api/customer/transactions/checkout', [
                'items' => [
                    ['book_id' => $book->id, 'quantity' => 2],
                    ['book_id' => $secondBook->id, 'quantity' => 1],
                ],
            ])
            ->assertCreated()
            ->assertJsonCount(2)
            ->assertJsonPath('0.quantity', 2)
            ->assertJsonPath('1.quantity', 1);

        $this->assertSame(2, $book->fresh()->stock);
        $this->assertSame(2, $secondBook->fresh()->stock);
        $this->assertDatabaseCount('transactions', 2);
    }

    public function test_checkout_is_atomic_when_one_book_has_insufficient_stock(): void
    {
        [, $book, $token] = $this->createCustomerAndBook(4);
        $secondBook = Book::query()->create([
            'title' => 'Bumi Manusia',
            'description' => 'Sebuah kisah.',
            'price' => 90000,
            'stock' => 1,
            'genre_id' => $book->genre_id,
            'author_id' => $book->author_id,
        ]);

        $this->withToken($token)
            ->postJson('/api/customer/transactions/checkout', [
                'items' => [
                    ['book_id' => $book->id, 'quantity' => 2],
                    ['book_id' => $secondBook->id, 'quantity' => 2],
                ],
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('items.1.quantity');

        $this->assertSame(4, $book->fresh()->stock);
        $this->assertSame(1, $secondBook->fresh()->stock);
        $this->assertDatabaseCount('transactions', 0);
    }

    private function createCustomerAndBook(int $stock): array
    {
        $customer = User::query()->create([
            'name' => 'Customer',
            'email' => 'customer@example.com',
            'password' => Hash::make('password123'),
        ]);
        $author = Author::query()->create(['name' => 'Andrea Hirata']);
        $genre = Genre::query()->create(['name' => 'Fiction']);
        $book = Book::query()->create([
            'title' => 'Laskar Pelangi',
            'description' => 'Kisah persahabatan.',
            'price' => 75000,
            'stock' => $stock,
            'genre_id' => $genre->id,
            'author_id' => $author->id,
        ]);

        return [$customer, $book, $customer->createToken('test')->plainTextToken];
    }
}
