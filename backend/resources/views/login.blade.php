<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - {{ config('app.name', 'Laravel') }}</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Instrument Sans', sans-serif;
            background: #FDFDFC;
            color: #1b1b18;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1.5rem;
        }
        .login-container {
            background: white;
            border: 1px solid #e3e3e0;
            border-radius: 0.5rem;
            padding: 2rem;
            width: 100%;
            max-width: 400px;
            box-shadow: 0px 0px 1px 0px rgba(0,0,0,0.03), 0px 1px 2px 0px rgba(0,0,0,0.06);
        }
        h1 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }
        .subtitle {
            color: #706f6c;
            margin-bottom: 1.5rem;
            font-size: 0.875rem;
        }
        .form-group {
            margin-bottom: 1.25rem;
        }
        label {
            display: block;
            font-weight: 500;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
        }
        input[type="email"],
        input[type="password"] {
            width: 100%;
            padding: 0.625rem 0.75rem;
            border: 1px solid #e3e3e0;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            transition: border-color 0.15s;
        }
        input:focus {
            outline: none;
            border-color: #f53003;
        }
        .error {
            color: #f53003;
            font-size: 0.813rem;
            margin-top: 0.25rem;
        }
        .alert {
            padding: 0.75rem;
            border-radius: 0.25rem;
            margin-bottom: 1rem;
            font-size: 0.875rem;
        }
        .alert-error {
            background: #fff2f2;
            color: #f53003;
            border: 1px solid #f53003;
        }
        .remember-group {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1.25rem;
        }
        .remember-group input[type="checkbox"] {
            width: auto;
        }
        .btn {
            width: 100%;
            padding: 0.625rem 1.25rem;
            background: #1b1b18;
            color: white;
            border: 1px solid #1b1b18;
            border-radius: 0.25rem;
            font-size: 0.875rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s;
        }
        .btn:hover {
            background: black;
        }
        .links {
            margin-top: 1rem;
            text-align: center;
            font-size: 0.875rem;
        }
        .links a {
            color: #f53003;
            text-decoration: none;
        }
        .links a:hover {
            text-decoration: underline;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <h1>Welcome back</h1>
        <p class="subtitle">Log in to your account</p>

        @if ($errors->any())
            <div class="alert alert-error">
                {{ $errors->first() }}
            </div>
        @endif

        <form method="POST" action="{{ route('login') }}">
            @csrf

            <div class="form-group">
                <label for="email">Email</label>
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    value="{{ old('email') }}" 
                    required 
                    autofocus
                >
            </div>

            <div class="form-group">
                <label for="password">Password</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    required
                >
            </div>

            <div class="remember-group">
                <input 
                    type="checkbox" 
                    id="remember" 
                    name="remember"
                >
                <label for="remember" style="margin: 0; font-weight: 400;">Remember me</label>
            </div>

            <button type="submit" class="btn">Log in</button>
        </form>
    </div>
</body>
</html>
