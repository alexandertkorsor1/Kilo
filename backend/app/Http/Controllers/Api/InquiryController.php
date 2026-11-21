<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
    /**
     * Public contact form submission.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:1', 'max:120'],
            'email' => ['required', 'string', 'email', 'max:254'],
            'subject' => ['required', 'string', 'min:1', 'max:200'],
            'message' => ['required', 'string', 'min:1', 'max:5000'],
        ]);

        $inquiry = Inquiry::create($validated);
        $inquiry->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Your inquiry has been submitted successfully.',
            'data' => [
                'id' => $inquiry->id,
                'created_at' => $inquiry->created_at,
            ],
        ], 201);
    }

    /**
     * List, search and filter inquiries.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:new,in_progress,responded,closed'],
            'is_read' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $query = Inquiry::query();

        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('name', 'ilike', "%{$search}%")
                    ->orWhere('email', 'ilike', "%{$search}%")
                    ->orWhere('subject', 'ilike', "%{$search}%")
                    ->orWhere('message', 'ilike', "%{$search}%");
            });
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['is_read'])) {
            $query->where('is_read', $filters['is_read']);
        }

        $inquiries = $query
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return response()->json($inquiries);
    }

    /**
     * View one complete inquiry.
     */
    public function show(Inquiry $inquiry): JsonResponse
    {
        return response()->json([
            'data' => $inquiry,
        ]);
    }

    /**
     * Update inquiry status or read state.
     */
    public function update(Request $request, Inquiry $inquiry): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'sometimes',
                'required',
                'in:new,in_progress,responded,closed',
            ],
            'is_read' => [
                'sometimes',
                'required',
                'boolean',
            ],
        ]);

        if (empty($validated)) {
            return response()->json([
                'message' => 'Provide a status or read-state change.',
            ], 422);
        }

        $inquiry->fill($validated);
        $inquiry->updated_at = now();
        $inquiry->save();

        return response()->json([
            'success' => true,
            'message' => 'Inquiry updated successfully.',
            'data' => $inquiry->fresh(),
        ]);
    }

    /**
     * Delete an inquiry.
     */
    public function destroy(Inquiry $inquiry): JsonResponse
    {
        $inquiry->delete();

        return response()->json([
            'success' => true,
            'message' => 'Inquiry deleted successfully.',
        ]);
    }
}

