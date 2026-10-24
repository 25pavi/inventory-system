// ─────────────────────────────────────────────────────────────────────────────
// src/pages/Signup.jsx  —  The signup / account creation page.
//
// WHAT THIS PAGE DOES:
//   1. Shows a form with email and password fields.
//   2. When submitted, calls POST /api/auth/signup.
//   3. On success, navigates to /login and passes a flag so Login
//      can show the "Account created, please log in" message.
//   4. On failure, shows the error message from the server.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api';

function Signup() {
  // useState holds values that change over time and cause the UI to re-render.
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');    // error message to display
  const [loading, setLoading]   = useState(false); // disables button while waiting

  // useNavigate lets us change the URL programmatically (without clicking a link).
  const navigate = useNavigate();

  // handleSubmit runs when the user clicks "Create account".
  async function handleSubmit(e) {
    e.preventDefault(); // stop the browser from doing a full page refresh

    // Basic client-side check — the server checks again too.
    if (!password.trim()) {
      setError('Password cannot be empty.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Call the signup API endpoint.
      await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      // Success! Navigate to /login and pass a flag (state) so Login
      // knows to show the success message.
      navigate('/login', { state: { accountCreated: true } });

    } catch (err) {
      // The server returned an error — show it to the user.
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
            Get started in seconds. Track stock levels, set low-inventory alerts, and keep products organized.
          </p>
        </div>

        {/* Right card column with existing form */}
        <div className="auth-card">
          <div className="auth-brand">
            <span className="auth-brand-icon">📦</span>
            <span className="auth-brand-name">Club Store</span>
          </div>

          <h2>Create account</h2>
          <p className="auth-subtitle">Sign up to access the inventory.</p>
          <div className="auth-divider"></div>

          {/* Show error message if signup failed */}
          {error && <div className="message message-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="signup-email">Email address</label>
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a password"
                required
              />
            </div>

            <button
              id="signup-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Signup;
