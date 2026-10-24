// ─────────────────────────────────────────────────────────────────────────────
// middleware/authMiddleware.js  —  Protects routes that require login.
//
// What this file does:
//   When a user logs in, the backend gives them a JWT (JSON Web Token).
//   For every protected request (like getting products), the frontend sends
//   that token in the "Authorization" header.
//   This middleware checks: Is the token present? Is it valid? Not expired?
//   If yes → attach the user info to req.user and let the request through.
//   If no  → reply with a 401 Unauthorized error right away.
// ─────────────────────────────────────────────────────────────────────────────

const jwt = require('jsonwebtoken');

// verifyToken is a middleware function.
// Middleware functions always take (req, res, next) as arguments.
// Calling next() means "this check passed, go to the next handler".
function verifyToken(req, res, next) {
  // The Authorization header looks like:  Bearer eyJhbGci...
  // We split on a space and take the second part (the actual token).
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  // If there is no token at all, stop here and return 401 (Unauthorized).
  if (!token) {
    return res.status(401).json({ error: 'No token provided. Please log in.' });
  }

  // jwt.verify() checks two things:
  //   1. Was this token signed with our JWT_SECRET? (i.e., is it genuine?)
  //   2. Has it expired?
  // If either check fails it throws an error, which we catch below.
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded payload (userId, email) to the request object
    // so any route handler that comes after can use req.user.
    req.user = decoded;

    // Token is valid — pass control to the next function in the chain.
    next();
  } catch (err) {
    // The token was tampered with or has expired.
    return res.status(401).json({ error: 'Invalid or expired token. Please log in again.' });
  }
}

module.exports = verifyToken;
