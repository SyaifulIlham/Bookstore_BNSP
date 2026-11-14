<?php

namespace Tests\Feature;

use App\Models\Author;
use App\Models\Book;
use App\Models\Genre;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BookApiTest extends TestCase
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
    }

    protected function tearDown(): void
    {
        Schema::dropIfExists('books');
        Schema::dropIfExists('genres');
        Schema::dropIfExists('authors');
        Schema::dropIfExists('users');

        parent::tearDown();
    }

    public function test_catalog_returns_database_books_with_author_and_genre(): void
    {
        $author = Author::query()->create(['name' => 'Andrea Hirata']);
        $genre = Genre::query()->create(['name' => 'Fiction']);
        Book::query()->create([
            'title' => 'Laskar Pelangi',
            'description' => 'Kisah persahabatan di Belitung.',
            'price' => 75000,
            'stock' => 40,
            'cover_photo' => 'laskar_pelangi.jpg',
            'genre_id' => $genre->id,
            'author_id' => $author->id,
        ]);

        $this->getJson('/api/books')
            ->assertOk()
            ->assertJsonPath('0.title', 'Laskar Pelangi')
            ->assertJsonPath('0.cover_photo', 'laskar_pelangi.jpg')
            ->assertJsonPath('0.author.name', 'Andrea Hirata')
            ->assertJsonPath('0.genre.name', 'Fiction');
    }

    public function test_catalog_can_return_a_book_by_id(): void
    {
        $author = Author::query()->create(['name' => 'Andrea Hirata']);
        $genre = Genre::query()->create(['name' => 'Fiction']);
        $book = Book::query()->create([
            'title' => 'Laskar Pelangi',
            'description' => 'Kisah persahabatan di Belitung.',
            'price' => 75000,
            'stock' => 40,
            'cover_photo' => 'laskar_pelangi.jpg',
            'genre_id' => $genre->id,
            'author_id' => $author->id,
        ]);

        $this->getJson("/api/books/{$book->id}")
            ->assertOk()
            ->assertJsonPath('id', $book->id)
            ->assertJsonPath('title', 'Laskar Pelangi');
    }

    public function test_admin_can_upload_and_replace_a_book_cover(): void
    {
        Storage::fake('public');
        $coverContents = base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADUlEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC',
        );
        $author = Author::query()->create(['name' => 'Andrea Hirata']);
        $genre = Genre::query()->create(['name' => 'Fiction']);
        $admin = User::query()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => 'password',
        ]);
        $admin->role = 'admin';
        $admin->save();
        Sanctum::actingAs($admin);

        $created = $this->post('/api/admin/books', [
            'title' => 'Laskar Pelangi',
            'description' => 'Kisah persahabatan.',
            'price' => 75000,
            'stock' => 4,
            'genre_id' => $genre->id,
            'author_id' => $author->id,
            'cover_photo_file' => UploadedFile::fake()->createWithContent('cover.png', $coverContents),
        ])->assertCreated();

        $firstCover = $created->json('cover_photo');
        $this->assertStringContainsString('/storage/books/', $firstCover);
        $this->assertCount(1, Storage::disk('public')->allFiles('books'));

        $updated = $this->post("/api/admin/books/{$created->json('id')}", [
            '_method' => 'PUT',
            'title' => 'Laskar Pelangi',
            'description' => 'Kisah persahabatan.',
            'price' => 75000,
            'stock' => 4,
            'genre_id' => $genre->id,
            'author_id' => $author->id,
            'cover_photo_file' => UploadedFile::fake()->createWithContent('cover-baru.png', $coverContents),
        ])->assertOk();

        $this->assertCount(1, Storage::disk('public')->allFiles('books'));
        $this->assertNotSame($firstCover, $updated->json('cover_photo'));
    }
}
