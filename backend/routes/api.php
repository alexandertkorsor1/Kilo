<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\InquiryController;
use App\Http\Controllers\Api\PhotoController;
use App\Http\Controllers\Api\BookingController;

use App\Http\Middleware\EnsureUserIsActive;
use App\Http\Middleware\EnsureAdmin;

// Public portfolio gallery
Route::get('/photos', [PhotoController::class, 'index'])
    ->middleware('throttle:60,1');

Route::get('/photos/{photo}/image', [PhotoController::class, 'servePublicImage'])
    ->middleware('throttle:120,1');

// Public contact form
Route::post('/inquiries', [InquiryController::class, 'store'])
    ->middleware('throttle:5,1');

// Public booking form
// Public booking availability
Route::get('/bookings/availability', [BookingController::class, 'availability'])
    ->middleware('throttle:60,1');

// Public booking submission
// Public booking availability
Route::get('/bookings/availability', [BookingController::class, 'availability'])
    ->middleware('throttle:60,1');

// Public booking submission
Route::post('/bookings', [BookingController::class, 'store'])
    ->middleware('throttle:5,1');
// Public login
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:5,1');

// Protected admin routes
Route::middleware([
    'auth:sanctum',
    EnsureUserIsActive::class,
    EnsureAdmin::class,
])->group(function () {
    Route::get('/admin/dashboard', [DashboardController::class, 'index']);

    // Inquiry management
    Route::get('/admin/inquiries', [InquiryController::class, 'index']);
    Route::get('/admin/inquiries/{inquiry}', [InquiryController::class, 'show']);
    Route::patch('/admin/inquiries/{inquiry}', [InquiryController::class, 'update']);
    Route::delete('/admin/inquiries/{inquiry}', [InquiryController::class, 'destroy']);

    // Booking management
    Route::get('/admin/bookings', [BookingController::class, 'index']);
    Route::get('/admin/bookings/{booking}', [BookingController::class, 'show']);
    Route::patch('/admin/bookings/{booking}', [BookingController::class, 'update']);
    Route::delete('/admin/bookings/{booking}', [BookingController::class, 'destroy']);

    // Photo management
    Route::get('/admin/photos', [PhotoController::class, 'adminIndex']);
    Route::get('/admin/photos/{photo}/image', [PhotoController::class, 'serveAdminImage']);
    Route::post('/admin/photos', [PhotoController::class, 'store']);
    Route::patch('/admin/photos/{photo}', [PhotoController::class, 'update']);
    Route::post('/admin/photos/{photo}/image', [PhotoController::class, 'replaceImage']);
    Route::delete('/admin/photos/{photo}', [PhotoController::class, 'destroy']);

    // Authentication
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
});

