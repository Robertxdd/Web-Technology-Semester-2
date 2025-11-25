<?php

namespace App\Http\Controllers;

use App\Models\Playlist;
use Illuminate\Http\Request;

class PlaylistController extends Controller
{
    public function index()
    {
        return Playlist::with('songs')->get()->map(function($p) {
            return [
                "id"          => $p->id,
                "name"        => $p->name,
                "description" => $p->description,
                "songs"       => $p->songs,  // full song objects
            ];
        });
    }

    public function store(Request $request)
    {
        $playlist = Playlist::create([
            'name'        => $request->name,
            'description' => $request->description ?? null
        ]);

        return response()->json([
            "id"          => $playlist->id,
            "name"        => $playlist->name,
            "description" => $playlist->description,
            "songs"       => [], // correct
        ], 201);
    }

    public function show($id)
    {
        $p = Playlist::with('songs')->findOrFail($id);

        return [
            "id"          => $p->id,
            "name"        => $p->name,
            "description" => $p->description,
            "songs"       => $p->songs, // full objects
        ];
    }

    public function destroy($id)
    {
        Playlist::findOrFail($id)->delete();

        return response()->json(["message" => "Playlist deleted"]);
    }

    public function addSong(Request $request, $playlistId)
    {
        $playlist = Playlist::findOrFail($playlistId);
        $playlist->songs()->attach($request->song_id);
        $playlist->load('songs');

        return [
            "message"  => "Song added",
            "playlist" => [
                "id"          => $playlist->id,
                "name"        => $playlist->name,
                "description" => $playlist->description,
                "songs"       => $playlist->songs, // full objects
            ],
        ];
    }

    public function removeSong(Request $request, $playlistId)
    {
        $playlist = Playlist::findOrFail($playlistId);
        $playlist->songs()->detach($request->song_id);
        $playlist->load('songs');

        return [
            "message"  => "Song removed",
            "playlist" => [
                "id"          => $playlist->id,
                "name"        => $playlist->name,
                "description" => $playlist->description,
                "songs"       => $playlist->songs, // full objects
            ],
        ];
    }
}
