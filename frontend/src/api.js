// ─────────────────────────────────────────────────────────────────────────────
// src/api.js  —  A simple helper for making HTTP requests to the backend.
//
// WHY THIS EXISTS:
//   Instead of writing the same fetch() code in every component, we have one
//   function that handles the base URL, Content-Type header, and the JWT token.
//   All pages import and call apiFetch() instead of using fetch() directly.
//
// HOW TO USE:
//   import { apiFetch } from '../api';
//
//   // GET request (no body needed)
//   const products = await apiFetch('/api/products');
//
//   // POST request with a JSON body
//   const result = await apiFetch('/api/auth/login', {
//     method: 'POST',
//     body: JSON.stringify({ email, password }),
//   });
// ─────────────────────────────────────────────────────────────────────────────

// The backend URL comes from the .env file (VITE_API_URL).
// Vite makes it available as import.meta.env.VITE_API_URL.
const BASE_URL = import.meta.env.VITE_API_URL;

// apiFetch — wraps the native fetch() with our standard headers and error handling.
// path:    the API path, e.g. '/api/products'
// options: optional fetch options like { method: 'POST', body: '...' }
export async function apiFetch(path, options = {}) {
  // Retrieve the JWT token saved in localStorage after login.
  const token = localStorage.getItem('token');

  // Build the headers object.
  const headers = {
    'Content-Type': 'application/json', // tell the server we're sending JSON
    ...options.headers,                  // allow caller to add extra headers
  };

  // If we have a token, add it as an Authorization header.
  // The server's authMiddleware reads this to verify the user.
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Make the actual HTTP request.
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Parse the JSON response body.
  const data = await response.json();

  // If the server returned an error status (4xx, 5xx), throw an error.
  // This lets us catch errors in the calling component with try/catch.
  if (!response.ok) {
    // Use the error message from the server, or a generic fallback.
    throw new Error(data.error || 'Something went wrong.');
  }

  return data;
}
