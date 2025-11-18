<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

// Serve the frontend file
Route::get('/index.html', function () {
    return response()->file(public_path('index.html'));
})->name('app');

// Login page (Blade)
Route::get('/login', function () {
    return view('login');
})->name('login');

// Handle login
Route::post('/login', [AuthController::class, 'login']);

// Default redirect
Route::get('/', function () {
    return redirect('/login');
});
