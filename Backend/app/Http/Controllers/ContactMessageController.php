<?php

namespace App\Http\Controllers;

use App\Models\ContactMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ContactMessageController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:5000'],
        ]);

        $message = ContactMessage::query()->create([
            ...$validated,
            'user_id' => $request->user()?->getAuthIdentifier(),
        ]);

        return response()->json([
            'message' => 'Pesan berhasil dikirim ke admin.',
            'id' => $message->id,
        ], 201);
    }

    public function index(): JsonResponse
    {
        return response()->json(
            ContactMessage::query()
                ->with('sender:id,name,email')
                ->orderByDesc('id')
                ->get(),
        );
    }
}
