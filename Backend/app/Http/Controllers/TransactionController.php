<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class TransactionController extends Controller
{
    public function index(): JsonResponse
    {
        $transactions = Transaction::query()
            ->with(['customer', 'book'])
            ->orderByDesc('id')
            ->get();

        return response()->json($transactions);
    }

    public function mine(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $transactions = $user->transactions()
            ->with(['book.author', 'book.genre'])
            ->orderByDesc('id')
            ->get();

        return response()->json($transactions);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'book_id' => ['required', 'integer', 'exists:books,id'],
            'quantity' => ['required', 'integer', 'min:1'],
            'delivery_address' => ['required', 'string', 'max:2000'],
            'customer_id' => ['prohibited'],
            'total_amount' => ['prohibited'],
        ]);

        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $transaction = DB::transaction(function () use ($validated, $user): Transaction {
            $book = Book::query()->lockForUpdate()->findOrFail($validated['book_id']);
            $quantity = $validated['quantity'];

            if ($book->stock < $quantity) {
                throw ValidationException::withMessages([
                    'quantity' => 'Stok buku tidak mencukupi.',
                ]);
            }

            $book->decrement('stock', $quantity);

            return $user->transactions()->create([
                'order_number' => 'ORD-'.Str::upper((string) Str::uuid()),
                'book_id' => $book->id,
                'quantity' => $quantity,
                'total_amount' => $this->calculateTotalAmount($book, $quantity),
                'delivery_address' => $validated['delivery_address'],
                'status' => 'menunggu',
            ])->load(['customer', 'book']);
        });

        return response()->json($transaction, 201);
    }

    public function checkout(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.book_id' => ['required', 'integer', 'distinct', 'exists:books,id'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
            'delivery_address' => ['required', 'string', 'max:2000'],
            'customer_id' => ['prohibited'],
            'total_amount' => ['prohibited'],
        ]);

        $user = $request->user();
        abort_unless($user instanceof User, 401);

        $transactions = DB::transaction(function () use ($validated, $user): array {
            $orderNumber = 'ORD-'.Str::upper((string) Str::uuid());
            $bookIds = collect($validated['items'])
                ->pluck('book_id')
                ->sort()
                ->values();
            $books = Book::query()
                ->whereIn('id', $bookIds)
                ->orderBy('id')
                ->lockForUpdate()
                ->get()
                ->keyBy('id');

            $transactions = [];
            foreach ($validated['items'] as $index => $item) {
                $book = $books->get($item['book_id']);
                $quantity = $item['quantity'];

                if ($book === null || $book->stock < $quantity) {
                    throw ValidationException::withMessages([
                        "items.{$index}.quantity" => 'Stok buku tidak mencukupi.',
                    ]);
                }

                $book->decrement('stock', $quantity);
                $transactions[] = $user->transactions()->create([
                    'order_number' => $orderNumber,
                    'book_id' => $book->id,
                    'quantity' => $quantity,
                    'total_amount' => $this->calculateTotalAmount($book, $quantity),
                    'delivery_address' => $validated['delivery_address'],
                    'status' => 'menunggu',
                ]);
            }

            return Transaction::query()
                ->with(['customer', 'book.author', 'book.genre'])
                ->whereIn('id', collect($transactions)->pluck('id'))
                ->orderBy('id')
                ->get()
                ->all();
        });

        return response()->json($transactions, 201);
    }

    public function updateStatus(Request $request, Transaction $transaction): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(['diproses', 'selesai'])],
        ]);

        DB::transaction(function () use ($transaction, $validated): void {
            $orderTransactions = Transaction::query()
                ->where('order_number', $transaction->order_number)
                ->lockForUpdate()
                ->get();
            $allowedNextStatus = [
                'menunggu' => 'diproses',
                'diproses' => 'selesai',
            ];

            if ($orderTransactions->contains(
                fn (Transaction $orderTransaction): bool => ($allowedNextStatus[$orderTransaction->status] ?? null) !== $validated['status'],
            )) {
                throw ValidationException::withMessages([
                    'status' => 'Status pesanan hanya dapat diubah secara berurutan dari menunggu ke diproses, lalu selesai.',
                ]);
            }

            Transaction::query()
                ->where('order_number', $transaction->order_number)
                ->update(['status' => $validated['status']]);
        });

        $transaction->refresh();
        return response()->json($transaction->load(['customer', 'book']));
    }

    public function show(Request $request, Transaction $transaction): JsonResponse
    {
        $this->ensureCustomerOwnsTransaction($request, $transaction);

        return response()->json($transaction->load(['customer', 'book']));
    }

    public function update(Request $request, Transaction $transaction): JsonResponse
    {
        $this->ensureCustomerOwnsTransaction($request, $transaction);

        $validated = $request->validate([
            'order_number' => [
                'sometimes',
                'required',
                'string',
                'max:50',
                Rule::unique('transactions', 'order_number')->ignore($transaction->id),
            ],
            'book_id' => ['sometimes', 'required', 'integer', 'exists:books,id'],
            'quantity' => ['sometimes', 'required', 'integer', 'min:1', 'max:1000000'],
            'customer_id' => ['prohibited'],
            'total_amount' => ['prohibited'],
        ]);

        if (array_key_exists('book_id', $validated) || array_key_exists('quantity', $validated)) {
            $book = array_key_exists('book_id', $validated)
                ? Book::query()->findOrFail($validated['book_id'])
                : $transaction->book;
            $quantity = $validated['quantity'] ?? $transaction->quantity;
            $validated['total_amount'] = $this->calculateTotalAmount($book, $quantity);
        }

        $transaction->update($validated);

        return response()->json($transaction->load(['customer', 'book']));
    }

    public function destroy(Transaction $transaction): JsonResponse
    {
        $transaction->delete();

        return response()->json(null, 204);
    }

    private function ensureCustomerOwnsTransaction(Request $request, Transaction $transaction): void
    {
        $user = $request->user();
        abort_unless(
            $user !== null && (string) $transaction->customer_id === (string) $user->getAuthIdentifier(),
            404,
        );
    }

    private function calculateTotalAmount(Book $book, int $quantity): string
    {
        $priceInCents = (int) round((float) $book->price * 100);

        if ($priceInCents < 0 || ($priceInCents > 0 && $quantity > intdiv(9_999_999_999, $priceInCents))) {
            throw ValidationException::withMessages([
                'quantity' => 'Jumlah buku menghasilkan total transaksi yang melebihi batas.',
            ]);
        }

        $totalInCents = $priceInCents * $quantity;

        return intdiv($totalInCents, 100).'.'.str_pad((string) ($totalInCents % 100), 2, '0', STR_PAD_LEFT);
    }
}
