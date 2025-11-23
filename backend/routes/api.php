<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\SongController;
use App\Http\Controllers\StatsController;
use App\Http\Controllers\PlaylistController;

// Songs
Route::get('/songs', [SongController::class, 'index']);
Route::post('/songs', [SongController::class, 'store']);
Route::put('/songs/{id}', [SongController::class, 'update']);
Route::delete('/songs/{id}', [SongController::class, 'destroy']);
Route::put('/songs/{id}/favorite', [SongController::class, 'toggleFavorite']);

// Stats
Route::get('/stats', [StatsController::class, 'index']);

// Playlists
Route::get('/playlists', [PlaylistController::class, 'index']);
Route::post('/playlists', [PlaylistController::class, 'store']);
Route::get('/playlists/{id}', [PlaylistController::class, 'show']);     // REQUIRED
Route::delete('/playlists/{id}', [PlaylistController::class, 'destroy']);

Route::post('/playlists/{id}/add-song', [PlaylistController::class, 'addSong']);
Route::post('/playlists/{id}/remove-song', [PlaylistController::class, 'removeSong']);
