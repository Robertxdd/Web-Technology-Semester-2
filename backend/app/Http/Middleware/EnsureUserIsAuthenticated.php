<?php

namespace App\Http\Middleware;

use Closure;

class EnsureUserIsAuthenticated
{
    public function handle($request, Closure $next)
    {
        $user = session('user');

        if (!$user) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        return $next($request);
    }
}
