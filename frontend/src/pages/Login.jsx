// ─────────────────────────────────────────────────────────────────────────────
// src/pages/Login.jsx  —  The login page.
//
// WHAT THIS PAGE DOES:
//   1. Checks if the user arrived from /signup (via navigation state).
//      If so, shows "Account created! Please log in."
//   2. Shows email + password form.
//   3. On submit: calls POST /api/auth/login.
//   4. On success: saves the JWT token in localStorage, goes to /inventory.
//   5. On failure: shows the error from the server.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { apiFetch } from '../api';

function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const navigate  = useNavigate();

  // useLocation gives us access to the navigation state passed by Signup.
  // When Signup navigates here with { state: { accountCreated: true } },
  // we can read that flag and show a friendly message.
  const location  = useLocation();
  const accountCreated = location.state?.accountCreated;

  // handleSubmit runs when the user clicks "Log in".
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Call the login API endpoint.
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Save the JWT token in localStorage.
      // The apiFetch() helper reads it from here for every subsequent request.
      localStorage.setItem('token', data.token);

      // Navigate to the inventory page.
      navigate('/inventory');

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-layout">
        {/* Left hero column for SaaS look */}
        <div className="auth-hero">
          <div className="badge-pill">
            <span className="badge-dot"></span> Club Store Management
          </div>
          <h1 className="hero-title">
            Smart <span className="highlight-text">Inventory</span> for Your Club Store
          </h1>
          <p className="hero-subtitle">
            Real-time stock tracking, instant alerts, and effortless store catalog management in one place.
          </p>
        </div>

        {/* Right card column with existing form */}
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-brand-icon">📦</span>
            <span className="auth-brand-name">Club Store</span>
          </div>

          <h2>Welcome back</h2>
          <p className="auth-subtitle">Log in to manage your inventory.</p>
          <div className="auth-divider"></div>

          {/* Show "Account created" message if coming from signup */}
          {accountCreated && (
            <div className="message message-success">
              🎉 Account created! Please log in with your new credentials.
            </div>
          )}

          {/* Show error message if login failed */}
          {error && <div className="message message-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="login-email">Email address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="login-password">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              id="login-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <p className="auth-link">
            Don&apos;t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
