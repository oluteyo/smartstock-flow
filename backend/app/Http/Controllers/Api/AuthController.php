<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organization;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        // Normalize the email BEFORE validating so the unique check is accurate
        $request->merge([
            'email' => Str::lower(trim((string) $request->input('email'))),
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'organization_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = DB::transaction(function () use ($validated) {
            $organizationName = trim($validated['organization_name']);

            // Fallback in case the name produces an empty slug (e.g. non-Latin characters)
            $baseSlug = Str::slug($organizationName) ?: 'organization';

            $organization = Organization::create([
                'name' => $organizationName,
                'slug' => $baseSlug . '-' . Str::lower(Str::random(6)),
                'currency' => 'KES',
                'timezone' => 'Africa/Nairobi',
            ]);

            return User::create([
                'organization_id' => $organization->id,
                'name' => trim($validated['name']),
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
            ]);
        });

        Auth::guard('web')->login($user);

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'message' => 'Registration successful.',
            'user' => $user->load('organization'),
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $credentials = [
            'email' => Str::lower(trim($validated['email'])),
            'password' => $validated['password'],
        ];

        if (!Auth::guard('web')->attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'message' => 'Login successful.',
            'user' => Auth::guard('web')->user()->load('organization'),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user()->load('organization'),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => 'Logout successful.',
        ]);
    }
}