<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Song;

class SongController extends Controller
{
    public function __construct()
    {
        // Protect admin-only routes
        $this->middleware('admin')->only(['store', 'update', 'destroy']);
    }

    // Normal users can access
    public function index()
    {
        return Song::all();
    }

    // Admin only
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'artist' => 'required|string|max:255',
            // Add your other fields here
        ]);

        return Song::create($validated);
    }

    // Normal users can access
    public function show($id)
    {
        return Song::findOrFail($id);
    }

    // Admin only
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'artist' => 'sometimes|string|max:255',
            // Add your other fields here
        ]);

        $song = Song::findOrFail($id);
        $song->update($validated);
        return $song;
    }

    // Admin only
    public function destroy($id)
    {
        Song::destroy($id);
        return response()->noContent();
    }
}