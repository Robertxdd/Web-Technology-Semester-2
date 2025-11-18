<?php

namespace App\Http\Middleware;

use Closure;

class AdminMiddleware
{
    public function handle($request, Closure $next)
    {
        $user = session('user');

        if (!$user || $user->role !== 'admin') {
            return response('Forbidden', 403);
        }

        return $next($request);
    }
}
