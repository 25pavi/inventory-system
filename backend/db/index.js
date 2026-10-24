// ─────────────────────────────────────────────────────────────────────────────
// db/index.js  —  The single database "switch".
//
// All route files import their database functions from THIS file only.
// To swap databases, change only the require() line below — routes never change.
//
//   sheets-version branch  → require('./sheetsDb')
//   supabase-version branch → require('./supabaseDb')
// ─────────────────────────────────────────────────────────────────────────────

// Currently using Google Sheets as the database.
module.exports = require('./sheetsDb');
