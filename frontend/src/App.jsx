// ─────────────────────────────────────────────────────────────────────────────
// src/App.jsx  —  The root component. Sets up all the page routes.
//
// We use React Router to show different pages for different URLs:
//   /            → redirects to /inventory (or /login if not logged in)
//   /login       → Login page
//   /signup      → Signup page
//   /inventory   → Inventory page (protected — redirects to /login if no token)
//
// React Router works by reading the current URL and rendering the matching
// component, all without a full page reload.
// ─────────────────────────────────────────────────────────────────────────────

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login     from './pages/Login';
import Signup    from './pages/Signup';
import Inventory from './pages/Inventory';

function App() {
  return (
    // BrowserRouter listens to URL changes and provides routing context.
    <BrowserRouter>
      <Routes>
        {/* Root path: redirect to /inventory. */}
        {/* The Inventory page will then redirect to /login if needed. */}
        <Route path="/" element={<Navigate to="/inventory" replace />} />

        {/* Public pages — anyone can visit these */}
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected page — Inventory.jsx handles the redirect if not logged in */}
        <Route path="/inventory" element={<Inventory />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
