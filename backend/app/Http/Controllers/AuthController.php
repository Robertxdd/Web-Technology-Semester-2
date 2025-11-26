<?php
namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $req)
    {
        $validated = $req->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|unique:users,email',
        'password' => [
            'required',
            'string',
            Password::min(8)
                ->letters()
                ->mixedCase()
                ->numbers()
                ->symbols()
        ],
    ], [
        'email.unique' => 'This email is already registered.',
        'password.min' => 'Password must be at least 8 characters.',
        'password.letters' => 'Password must contain letters.',
        'password.mixed' => 'Password must contain both uppercase and lowercase letters.',
        'password.numbers' => 'Password must contain at least one number.',
        'password.symbols' => 'Password must contain at least one special character (!@#$%^&*).',
    ]);

    User::create([
        'name' => $validated['name'],
        'email' => $validated['email'],
        'password' => Hash::make($validated['password']),
        'role' => 'user',
    ]);
    
    return redirect()->route('login')->with('success', 'Account created! Please log in.');
    }

    public function login(Request $req)
    {
        $user = User::where('email', $req->email)->first();
        
        if (!$user || !Hash::check($req->password, $user->password)) {
            return back()->withErrors(['error' => 'Invalid credentials']);
        }
        
        session(['user' => $user]);
        session(['user_role' => $user->role]);
        return redirect('/index.html');
    }

    public function logout(Request $req)
    {
        $req->session()->forget('user');
        $req->session()->forget('user_role'); 
        $req->session()->invalidate();
        $req->session()->regenerateToken();
        return redirect()->route('login');
    }
}