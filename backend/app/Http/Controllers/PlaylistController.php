<?php

namespace App\Http\Controllers;

use App\Models\Playlist;
use Illuminate\Http\Request;

class PlaylistController extends Controller
{
    // Obtener todas las playlists con sus canciones
    public function index()
    {
        return Playlist::with('songs')->get();
    }

    // Crear una playlist
    public function store(Request $request)
    {
        $playlist = Playlist::create([
            'name' => $request->name
        ]);

        return response()->json($playlist, 201);
    }

    // Borrar una playlist
    public function destroy($id)
    {
        Playlist::findOrFail($id)->delete();

        return response()->json(["message" => "Playlist deleted"]);
    }

    // Añadir canción a la playlist
    public function addSong(Request $request, $playlistId)
    {
        $playlist = Playlist::findOrFail($playlistId);

        $playlist->songs()->attach($request->song_id);

        return response()->json([
            "message" => "Song added to playlist",
            "playlist" => $playlist->load('songs')
        ]);
    }

    // Quitar canción de la playlist
    public function removeSong(Request $request, $playlistId)
    {
        $playlist = Playlist::findOrFail($playlistId);

        $playlist->songs()->detach($request->song_id);

        return response()->json([
            "message" => "Song removed from playlist",
            "playlist" => $playlist->load('songs')
        ]);
    }
}