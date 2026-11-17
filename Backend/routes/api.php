<?php

use App\Http\Controllers\AdminUserController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\AuthorController;
use App\Http\Controllers\BookController;
use App\Http\Controllers\ContactMessageController;
use App\Http\Controllers\GenreController;
use App\Http\Controllers\TransactionController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/books', [BookController::class, 'index']);
Route::get('/books/{book}', [BookController::class, 'show']);
Route::post('/contact-messages', [ContactMessageController::class, 'store'])->middleware('throttle:5,1');

Route::prefix('auth')->group(function (): void {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:10,1');
    Route::post('/register', [AuthController::class, 'register']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('/me', fn (Request $request) => $request->user());
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function (): void {
    Route::apiResource('books', BookController::class)->except(['show']);
    Route::apiResource('authors', AuthorController::class);
    Route::apiResource('genres', GenreController::class);
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::get('/contact-messages', [ContactMessageController::class, 'index']);
    Route::get('/transactions', [TransactionController::class, 'index']);
    Route::patch('/transactions/{transaction}/status', [TransactionController::class, 'updateStatus']);
});

Route::middleware(['auth:sanctum', 'customer'])->prefix('customer')->group(function (): void {
    Route::get('/transactions', [TransactionController::class, 'mine']);
    Route::post('/transactions', [TransactionController::class, 'store']);
    Route::post('/transactions/checkout', [TransactionController::class, 'checkout']);
    Route::get('/transactions/{transaction}', [TransactionController::class, 'show']);
});
