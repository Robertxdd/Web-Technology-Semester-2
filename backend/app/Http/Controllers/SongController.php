<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Song;

class SongController extends Controller
{
    // Public
    public function index()
    {
        return Song::all();
    }

    // Public
    public function show($id)
    {
        return Song::findOrFail($id);
    }

    // Admin only (middleware handles admin check)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'   => 'required|string|max:255',
            'artist'  => 'required|string|max:255',
            'genre'   => 'nullable|string|max:255',
            'year'    => 'nullable|integer',
            'duration'=> 'required|integer|min:1',
            'url'     => 'required|url'
        ]);

        return Song::create($validated);
    }

    // Admin only
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'title'   => 'sometimes|string|max:255',
            'artist'  => 'sometimes|string|max:255',
            'genre'   => 'sometimes|nullable|string|max:255',
            'year'    => 'sometimes|nullable|integer',
            'duration'=> 'sometimes|integer|min:1',
            'url'     => 'sometimes|url'
        ]);

        $song = Song::findOrFail($id);
        $song->update($validated);

        return $song;
    }


    // Admin only
    public function destroy($id)
    {
        $song = Song::findOrFail($id);
        $song->delete();

        return response()->noContent();
    }

    
    public function toggleFavorite($id)
{
    $song = Song::findOrFail($id);
    $song->favorite = !$song->favorite;
    $song->save();

    return $song;
}

    public function getFavorites()
    {
        return Song::where('favorite', true)->get();
    }
    
}
