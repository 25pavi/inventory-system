// ─────────────────────────────────────────────────────────────────────────────
// routes/auth.js  —  Handles user signup and login.
//
// Routes defined here:
//   POST /api/auth/signup  — create a new account
//   POST /api/auth/login   — log in and receive a JWT token
// ─────────────────────────────────────────────────────────────────────────────

const express = require('express');
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');

// Import database functions from the DB layer (db/index.js).
// Routes never call Sheets or Supabase directly — only these functions.
const { findUserByEmail, createUser } = require('../db');

const router = express.Router();

// ── POST /api/auth/signup ─────────────────────────────────────────────────────
// Creates a new user account.
// Expects a JSON body: { "email": "...", "password": "..." }
router.post('/signup', async (req, res) => {
  try {
    let { email, password } = req.body;

    // ── Validate inputs ──────────────────────────────────────────────────────

    // Both fields must be present.
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Password must not be empty (no minimum length, but cannot be blank).
    if (password.trim() === '') {
      return res.status(400).json({ error: 'Password cannot be empty.' });
    }

    // Normalize the email to lowercase before saving.
    // This prevents "User@Test.com" and "user@test.com" from being two different accounts.
    email = email.toLowerCase().trim();

    // ── Check for duplicate email ────────────────────────────────────────────
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // ── Hash the password ────────────────────────────────────────────────────
    // bcrypt.hash() transforms the plain-text password into a secure hash.
    // The second argument (10) is the "salt rounds" — how many times to scramble it.
    // We NEVER store the plain-text password.
    const hashedPassword = await bcrypt.hash(password, 10);

    // ── Save to database ─────────────────────────────────────────────────────
    await createUser(email, hashedPassword);

    // ── Respond ──────────────────────────────────────────────────────────────
    // Return 201 Created with a friendly message.
    // The frontend will redirect to /login and show this message.
    return res.status(201).json({ message: 'Account created! Please log in.' });

  } catch (err) {
    console.error('Signup error:', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
// Logs in an existing user and returns a JWT token.
// Expects a JSON body: { "email": "...", "password": "..." }
router.post('/login', async (req, res) => {
  try {
    let { email, password } = req.body;

    // ── Validate inputs ──────────────────────────────────────────────────────
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Normalize email to lowercase before comparing.
    email = email.toLowerCase().trim();

    // ── Find the user ────────────────────────────────────────────────────────
    const user = await findUserByEmail(email);

    // Use a generic message so attackers can't tell which part was wrong.
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ── Compare passwords ────────────────────────────────────────────────────
    // bcrypt.compare() hashes the entered password the same way and checks
    // if the result matches the stored hash. Returns true or false.
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // ── Create and sign a JWT token ──────────────────────────────────────────
    // The payload (first argument) is data we want to embed inside the token.
    // jwt.sign() uses our secret key to create a tamper-proof token.
    // expiresIn: '5d' means the token expires after 5 days.
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '5d' }
    );

    // Return the token to the frontend. The frontend will store it and
    // send it back with every future request as: Authorization: Bearer <token>
    return res.status(200).json({ token });

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
