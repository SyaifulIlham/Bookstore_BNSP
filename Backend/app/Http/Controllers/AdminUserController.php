<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminUserController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(
            User::query()
                ->select(['id', 'name', 'email', 'role', 'created_at'])
                ->orderByDesc('id')
                ->get(),
        );
    }
}
