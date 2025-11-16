<?php

namespace App\Http\Controllers;

use App\Models\Song;
use Illuminate\Http\Request;

class SongController extends Controller
{
    public function index() {  // normal user
        return Song::all();
    }

    public function store(Request $req) { // admin user 
        return Song::create($req->all());
    }

    public function show($id) { // normal user
        return Song::findOrFail($id);
    }

    public function update(Request $req, $id) { // admin user  
        $song = Song::findOrFail($id);
        $song->update($req->all());
        return $song;
    }

    public function destroy($id) { // admin user 
        Song::destroy($id);
        return response()->noContent();
    }
}
