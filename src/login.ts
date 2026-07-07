export const loginHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AgentWatch — Sign In</title>
    <link rel="icon" type="image/svg+xml" href="/favicon.svg">
    <meta name="theme-color" content="#080A12">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
    <style>
        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
        :root {
            --bg: #080A12; --surface: #0D1117; --surface-2: #111820;
            --border: rgba(255,255,255,0.07); --border-hover: rgba(255,255,255,0.14);
            --text: #E6EDF3; --text-dim: #8B949E; --text-muted: #484F58;
            --blue: #58A6FF; --purple: #BC8CFF; --green: #3FB950;
            --red: #F85149; --cyan: #39D2C0;
        }
        body {
            background: var(--bg); color: var(--text);
            font-family: 'Inter', system-ui, sans-serif;
            min-height: 100vh; display: flex; align-items: center; justify-content: center;
            overflow: hidden;
        }
        .login-container {
            width: 100%; max-width: 800px; padding: 20px; position: relative; z-index: 1;
        }
        .login-split {
            display: flex; flex-direction: column; md:flex-direction: row; gap: 0;
            background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
            position: relative; overflow: hidden;
        }
        @media (min-width: 768px) {
            .login-split { flex-direction: row; }
            .login-split > div { flex: 1; }
        }
        .login-split::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
            background: linear-gradient(90deg, transparent, var(--blue), var(--purple), transparent);
            z-index: 2;
        }
        .login-section { padding: 40px 32px; display: flex; flex-direction: column; justify-content: center; }
        .signup-section { background: rgba(255,255,255,0.02); border-left: 1px solid var(--border); }
        @media (max-width: 767px) {
            .signup-section { border-left: none; border-top: 1px solid var(--border); }
        }
        
        .logo { text-align: left; margin-bottom: 24px; }
        .logo-icon {
            width: 48px; height: 48px; margin-bottom: 16px;
            background: rgba(88,166,255,0.08); border: 1px solid rgba(88,166,255,0.15);
            border-radius: 12px; display: flex; align-items: center; justify-content: center;
        }
        .logo h1 { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 4px; }
        .logo p { font-size: 13px; color: var(--text-muted); }
        
        .form-group { margin-bottom: 20px; }
        .form-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-dim); margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.05em; }
        .form-input {
            width: 100%; padding: 12px 14px; border-radius: 8px; font-size: 14px;
            font-family: 'JetBrains Mono', monospace; outline: none; transition: all 0.2s;
            background: rgba(255,255,255,0.04); border: 1px solid var(--border); color: var(--text);
        }
        .form-input:focus { border-color: var(--blue); box-shadow: 0 0 0 3px rgba(88,166,255,0.1); }
        .form-input::placeholder { color: var(--text-muted); }
        
        .btn-primary {
            width: 100%; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600;
            border: none; cursor: pointer; transition: all 0.2s;
            background: var(--blue); color: #000; text-align: center; display: inline-block; text-decoration: none;
        }
        .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
        .btn-primary:active { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        
        .btn-secondary {
            width: 100%; padding: 12px; border-radius: 8px; font-size: 14px; font-weight: 600;
            border: 1px solid var(--border); cursor: pointer; transition: all 0.2s;
            background: transparent; color: var(--text); text-align: center; display: inline-block; text-decoration: none;
        }
        .btn-secondary:hover { background: rgba(255,255,255,0.05); }
        
        .error-msg {
            font-size: 13px; color: var(--red); margin-top: 12px; text-align: center;
            display: none;
        }
        .error-msg.visible { display: block; }
        
        .footer-links {
            text-align: center; margin-top: 24px; font-size: 12px; color: var(--text-muted);
        }
        .footer-links a { color: var(--text-dim); text-decoration: none; transition: color 0.2s; }
        .footer-links a:hover { color: var(--text); }
        .footer-links span { margin: 0 8px; opacity: 0.3; }

        /* Background effects */
        .bg-glow {
            position: fixed; width: 400px; height: 400px; border-radius: 50%;
            filter: blur(120px); pointer-events: none; opacity: 0.08;
        }
        .bg-glow-1 { background: var(--blue); top: -10%; left: -10%; }
        .bg-glow-2 { background: var(--purple); bottom: -10%; right: -10%; }

        /* Key visibility toggle */
        .input-wrapper { position: relative; }
        .input-wrapper .toggle-vis {
            position: absolute; right: 12px; top: 50%; transform: translateY(-50%);
            background: none; border: none; color: var(--text-muted); cursor: pointer;
            padding: 4px; font-size: 14px; line-height: 1;
        }
        .input-wrapper .toggle-vis:hover { color: var(--text-dim); }

        /* Loading spinner */
        .spinner {
            display: inline-block; width: 16px; height: 16px; border: 2px solid transparent;
            border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite;
            vertical-align: middle; margin-right: 6px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Success state */
        .success-icon {
            width: 64px; height: 64px; margin: 0 auto 20px; border-radius: 50%;
            background: rgba(63,185,80,0.1); border: 2px solid rgba(63,185,80,0.3);
            display: flex; align-items: center; justify-content: center;
            animation: scaleIn 0.3s ease-out;
        }
        @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
            *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
        
        .signup-feature-list { list-style: none; margin: 20px 0; padding: 0; }
        .signup-feature-list li { font-size: 13px; color: var(--text-dim); margin-bottom: 10px; display: flex; align-items: center; gap: 8px; }
        .signup-feature-list li svg { color: var(--blue); }
    </style>
</head>
<body>
    <div class="bg-glow bg-glow-1"></div>
    <div class="bg-glow bg-glow-2"></div>

    <div class="login-container">
        <div class="login-split">
            <!-- Left Side: Sign In -->
            <div class="login-section">
                <div class="logo">
                    <div class="logo-icon">
                        <div style="width:48px;height:48px;border-radius:14px;display:flex;align-items:center;justify-content:center;background:rgba(96,165,250,0.08);border:1px solid rgba(96,165,250,0.2);">
                            <svg width="28" height="28" viewBox="0 0 100 100" fill="white">
                                <path d="M50 12 L64 40 L36 40 Z"/>
                                <path d="M15 48 L48 48 L50 52 L52 48 L85 48 L85 60 L74 60 L86 84 L70 84 L58 60 L42 60 L30 84 L14 84 L26 60 L15 60 Z"/>
                            </svg>
                        </div>
                    </div>
                    <h1>Agent<span style="color:var(--blue);">Watch</span></h1>
                    <p>Sign in to your control plane</p>
                </div>

                <form id="authForm" onsubmit="return handleAuth(event)">
                    <div class="form-group">
                        <label class="form-label" for="email">Email</label>
                        <input type="email" id="email" class="form-input" placeholder="you@company.com" required autocomplete="email">
                    </div>
                    <div class="form-group">
                        <label class="form-label" for="password">Password</label>
                        <div class="input-wrapper">
                            <input type="password" id="password" class="form-input" placeholder="••••••••" required autocomplete="current-password">
                            <button type="button" class="toggle-vis" onclick="toggleKeyVisibility()" aria-label="Toggle visibility">
                                <span id="eyeIcon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></span>
                            </button>
                        </div>
                    </div>
                    <button type="submit" id="submitBtn" class="btn-primary">Sign In</button>
                    <div id="errorMsg" class="error-msg">Invalid email or password</div>
                    <div class="footer-links" style="margin-top: 16px;">
                        <a href="#" id="toggleModeBtn" onclick="toggleAuthMode(event)">Need an account? Sign up</a>
                    </div>
                </form>
            </div>
            
            <!-- Right Side: Features -->
            <div class="login-section signup-section">
                <h2 style="font-size: 18px; font-weight: 600; margin-bottom: 12px;">Welcome to AgentWatch</h2>
                <p style="font-size: 14px; color: var(--text-dim); line-height: 1.5; margin-bottom: 16px;">
                    Secure your LLM agents with zero latency.
                </p>
                
                <ul class="signup-feature-list">
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg> Open Source Proxy</li>
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg> Session Budget Enforcement</li>
                    <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg> Real-time Loop Detection</li>
                </ul>
                
                <a href="/demo" class="btn-secondary">View Demo</a>
            </div>
        </div>

        <div class="footer-links">
            <a href="/">Home</a>
            <span>·</span>
            <a href="/docs">Docs</a>
        </div>
    </div>

    <script>
    // Default to signup mode if coming from "Get API Key" link
    const urlParams = new URLSearchParams(window.location.search);
    let isSignup = urlParams.get('mode') === 'signup' || window.location.pathname === '/signup';

    function toggleAuthMode(e) {
        e.preventDefault();
        isSignup = !isSignup;
        const btn = document.getElementById('submitBtn');
        const toggleBtn = document.getElementById('toggleModeBtn');
        const title = document.querySelector('.logo p');
        const errorEl = document.getElementById('errorMsg');
        
        errorEl.classList.remove('visible');
        
        if (isSignup) {
            btn.textContent = 'Create Account';
            toggleBtn.textContent = 'Already have an account? Sign in';
            title.textContent = 'Create your tenant namespace';
        } else {
            btn.textContent = 'Sign In';
            toggleBtn.textContent = 'Need an account? Sign up';
            title.textContent = 'Sign in to your control plane';
        }
    }

    const eyeSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>';
    const eyeOffSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>';

    function toggleKeyVisibility() {
        const input = document.getElementById('password');
        const icon = document.getElementById('eyeIcon');
        if (input.type === 'password') {
            input.type = 'text';
            icon.innerHTML = eyeOffSvg;
        } else {
            input.type = 'password';
            icon.innerHTML = eyeSvg;
        }
    }

    async function handleAuth(e) {
        e.preventDefault();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        if (!email || !password) return false;

        const btn = document.getElementById('submitBtn');
        const errorEl = document.getElementById('errorMsg');
        const origText = btn.textContent;

        btn.innerHTML = '<span class="spinner"></span> ' + (isSignup ? 'Creating...' : 'Authenticating...');
        btn.disabled = true;
        errorEl.classList.remove('visible');

        try {
            const endpoint = isSignup ? '/v1/auth/signup' : '/v1/auth/login';
            const resp = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            if (!resp.ok) {
                const errData = await resp.json().catch(() => ({}));
                const errMsg = errData.error?.message || errData.error;
                errorEl.textContent = errMsg || (isSignup ? 'Failed to create account.' : 'Invalid email or password.');
                errorEl.classList.add('visible');
                btn.textContent = origText;
                btn.disabled = false;
                return false;
            }

            const data = await resp.json();
            
            // Store key and redirect based on action
            localStorage.setItem('agentwatch_key', data.rawToken);
            if (isSignup) {
                // New user — go to onboarding (first time only)
                // Use fragment (#) instead of query param (?) to avoid server-side logging
                window.location.href = '/onboarding#key=' + encodeURIComponent(data.rawToken);
            } else {
                // Existing user — go straight to dashboard
                window.location.href = '/v1/dashboard';
            }

        } catch (err) {
            errorEl.textContent = 'Network error. Check your connection.';
            errorEl.classList.add('visible');
            btn.textContent = origText;
            btn.disabled = false;
        }
        return false;
    }

    // Set initial UI state based on mode
    if (isSignup) {
        document.getElementById('submitBtn').textContent = 'Create Account';
        document.getElementById('toggleModeBtn').textContent = 'Already have an account? Sign in';
        document.querySelector('.logo p').textContent = 'Create your tenant namespace';
    }

    // Focus the input on load
    document.getElementById('email').focus();
    </script>
</body>
</html>`;
