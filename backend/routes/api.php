<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;


Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::get('/songs', [SongController::class, 'index']);
Route::post('/songs', [SongController::class, 'store']);
Route::get('/songs/{id}', [SongController::class, 'show']);
Route::put('/songs/{id}', [SongController::class, 'update']);
Route::delete('/songs/{id}', [SongController::class, 'destroy']);