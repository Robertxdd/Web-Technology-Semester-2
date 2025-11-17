<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $req) {
        return User::create([
            'name' => $req->name,
            'email' => $req->email,
            'password' => Hash::make($req->password)
        ]);
    }

    public function login(Request $req) {
    $user = User::where('email', $req->email)->first();
    
    if (!$user || !Hash::check($req->password, $user->password)) {
        return back()->withErrors(['error' => 'Invalid credentials']);
    }
    
    session(['user' => $user]);
    
    // Redirect to your frontend
    return redirect('http://localhost:3000'); // Or whatever your frontend URL is
    }
}
