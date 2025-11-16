<?php

namespace App\Http\Controllers;

use App\Models\Song;
use Illuminate\Http\Request;

class SongController extends Controller
{
    public function index() {
        return Song::all();
    }

    public function store(Request $req) {
        return Song::create($req->all());
    }

    public function show($id) {
        return Song::findOrFail($id);
    }

    public function update(Request $req, $id) {
        $song = Song::findOrFail($id);
        $song->update($req->all());
        return $song;
    }

    public function destroy($id) {
        Song::destroy($id);
        return response()->noContent();
    }
}
