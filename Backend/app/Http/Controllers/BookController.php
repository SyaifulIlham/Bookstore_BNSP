<?php

namespace App\Http\Controllers;

use App\Models\Book;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

class BookController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'q' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        $books = Book::query()
            ->with(['author', 'genre'])
            ->when(filled($validated['q'] ?? null), function ($query) use ($validated): void {
                $search = trim($validated['q']);
                $query->where(function ($query) use ($search): void {
                    $query->where('title', 'like', "%{$search}%")
                        ->orWhereHas('author', fn ($authorQuery) => $authorQuery->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('genre', fn ($genreQuery) => $genreQuery->where('name', 'like', "%{$search}%"));
                });
            })
            ->orderBy('title')
            ->get();

        return response()->json($books);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => ['required', 'numeric', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'cover_photo' => ['nullable', 'string', 'max:255'],
            'cover_photo_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'genre_id' => ['required', 'integer', 'exists:genres,id'],
            'author_id' => ['required', 'integer', 'exists:authors,id'],
        ]);

        unset($validated['cover_photo_file']);
        if ($request->hasFile('cover_photo_file')) {
            $validated['cover_photo'] = $this->storeCover($request);
        }

        $book = Book::query()->create($validated)->load(['author', 'genre']);

        return response()->json($book, 201);
    }

    public function show(Book $book): JsonResponse
    {
        return response()->json($book->load(['author', 'genre']));
    }

    public function update(Request $request, Book $book): JsonResponse
    {
        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'price' => ['sometimes', 'required', 'numeric', 'min:0'],
            'stock' => ['sometimes', 'required', 'integer', 'min:0'],
            'cover_photo' => ['sometimes', 'nullable', 'string', 'max:255'],
            'cover_photo_file' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'genre_id' => ['sometimes', 'required', 'integer', 'exists:genres,id'],
            'author_id' => ['sometimes', 'required', 'integer', 'exists:authors,id'],
        ]);

        unset($validated['cover_photo_file']);
        $previousCover = $book->getRawOriginal('cover_foto') ?? $book->getRawOriginal('cover_photo');
        if ($request->hasFile('cover_photo_file')) {
            $validated['cover_photo'] = $this->storeCover($request);
        }

        $book->update($validated);

        if ($request->hasFile('cover_photo_file') && is_string($previousCover) && str_starts_with($previousCover, 'books/')) {
            Storage::disk('public')->delete($previousCover);
        }

        return response()->json($book->load(['author', 'genre']));
    }

    public function destroy(Book $book): JsonResponse
    {
        if ($book->transactions()->exists()) {
            return response()->json([
                'message' => 'Buku yang sudah memiliki transaksi tidak dapat dihapus.',
            ], 409);
        }

        $book->delete();

        return response()->json(null, 204);
    }

    private function storeCover(Request $request): string
    {
        $path = $request->file('cover_photo_file')?->store('books', 'public');

        if (! is_string($path)) {
            throw new RuntimeException('Sampul buku gagal disimpan.');
        }

        return $path;
    }
}
