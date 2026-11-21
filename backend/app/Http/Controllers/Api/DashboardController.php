<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inquiry;
use App\Models\Photo;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function index(): JsonResponse
    {
        $recentInquiries = Inquiry::query()
            ->orderByDesc('created_at')
            ->limit(5)
            ->get([
                'id',
                'name',
                'email',
                'subject',
                'message',
                'created_at',
            ]);

        return response()->json([
            'statistics' => [
                'total_photographs' => Photo::count(),
                'published_photographs' => Photo::where('is_published', true)->count(),
                'total_inquiries' => Inquiry::count(),
                'inquiries_last_seven_days' => Inquiry::where(
                    'created_at',
                    '>=',
                    now()->subDays(7)
                )->count(),
            ],
            'recent_inquiries' => $recentInquiries,
        ]);
    }
}

