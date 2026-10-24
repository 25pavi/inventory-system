// ─────────────────────────────────────────────────────────────────────────────
// server.js  —  The main entry point for the backend.
//
// What this file does:
//   1. Loads environment variables from the .env file.
//   2. Creates an Express app (think of Express as a tool that handles web requests).
//   3. Tells the app to allow requests from our frontend (CORS).
//   4. Tells the app to understand JSON data sent in request bodies.
//   5. Connects our route files so the app knows what to do for each URL.
//   6. Starts listening for incoming requests on a port.
// ─────────────────────────────────────────────────────────────────────────────

// Load environment variables from .env into process.env
require('dotenv').config();

const express = require('express');
const cors    = require('cors');

// Import our route files
const authRoutes    = require('./routes/auth');
const productRoutes = require('./routes/products');

// Create the Express application
const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────
// Middleware runs on EVERY request before it reaches a route handler.

// Allow requests from our frontend URL (set in .env as ALLOWED_ORIGIN).
// Without this, the browser blocks requests from a different domain.
app.use(cors({
  origin: process.env.ALLOWED_ORIGIN,
}));

// Tell Express to automatically parse incoming JSON request bodies.
// Without this, req.body would be undefined when the client sends JSON.
app.use(express.json());

// ── Health check route ────────────────────────────────────────────────────────
// A simple route that returns "OK" so we can verify the server is running.
// Render also uses this to check that the service is healthy.
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Inventory backend is running.' });
});

// ── API Routes ────────────────────────────────────────────────────────────────
// Mount our route handlers. Any request starting with these paths
// will be forwarded to the matching route file.
app.use('/api/auth',     authRoutes);     // handles /api/auth/signup and /api/auth/login
app.use('/api/products', productRoutes);  // handles /api/products CRUD

// ── Start the server ──────────────────────────────────────────────────────────
// process.env.PORT is set by Render in production.
// We fall back to 5000 for local development.
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`✅ Server is running on port ${PORT}`);
});
