<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    public function index()
    {
        return response()->json([
            "totalSongs"    => DB::table('songs')->count(),
            "totalDuration" => DB::table('songs')->sum('duration'),
            "favoriteSongs" => DB::table('songs')->where('favorite', true)->count(),
        ]);
    }
}