<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $organizationId = $this->organizationId($request);

        $products = Product::query()
            ->where('organization_id', $organizationId)
            ->when(
                $request->has('active'),
                fn ($query) => $query->where('is_active', $request->boolean('active'))
            )
            ->orderBy('name')
            ->paginate(20);

        return response()->json($products);
    }

    public function store(Request $request): JsonResponse
    {
        $organizationId = $this->organizationId($request);

        $validated = $request->validate([
            'sku' => [
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')
                    ->where('organization_id', $organizationId),
            ],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'cost_price' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'selling_price' => ['required', 'numeric', 'min:0', 'decimal:0,2'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $product = Product::create([
            ...$validated,
            'is_active' => $validated['is_active'] ?? true,
            'organization_id' => $organizationId,
        ]);

        return response()->json([
            'message' => 'Product created successfully.',
            'product' => $product,
        ], 201);
    }

    public function show(Request $request, Product $product): JsonResponse
    {
        $this->authorizeOrganization($request, $product);

        return response()->json([
            'product' => $product,
        ]);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $this->authorizeOrganization($request, $product);

        $organizationId = $this->organizationId($request);

        $validated = $request->validate([
            'sku' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                Rule::unique('products', 'sku')
                    ->where('organization_id', $organizationId)
                    ->ignore($product->id),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'cost_price' => ['sometimes', 'required', 'numeric', 'min:0', 'decimal:0,2'],
            'selling_price' => ['sometimes', 'required', 'numeric', 'min:0', 'decimal:0,2'],
            'is_active' => ['sometimes', 'required', 'boolean'],
        ]);

        $product->update($validated);

        return response()->json([
            'message' => 'Product updated successfully.',
            'product' => $product->fresh(),
        ]);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $this->authorizeOrganization($request, $product);

        $product->update([
            'is_active' => false,
        ]);

        return response()->json([
            'message' => 'Product archived successfully.',
        ]);
    }

    private function organizationId(Request $request): int
    {
        $organizationId = $request->user()->organization_id;

        abort_if($organizationId === null, 403, 'Your account is not assigned to an organization.');

        return (int) $organizationId;
    }

    private function authorizeOrganization(Request $request, Product $product): void
    {
        abort_unless(
            (int) $product->organization_id === $this->organizationId($request),
            404,
            'Product not found.'
        );
    }
}