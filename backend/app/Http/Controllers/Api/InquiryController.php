<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InquiryController extends Controller
{
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
}