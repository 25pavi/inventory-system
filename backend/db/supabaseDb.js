// ─────────────────────────────────────────────────────────────────────────────
// db/supabaseDb.js  —  Supabase database logic.
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  THIS FILE IS THE ACTIVE DATABASE LAYER IN THE supabase-version BRANCH. ║
// ║                                                                          ║
// ║  The Google Sheets code in sheetsDb.js is commented out in that branch. ║
// ║                                                                          ║
// ║  To switch BACK to Google Sheets:                                        ║
// ║    1. In db/index.js, change require('./supabaseDb') to                  ║
// ║       require('./sheetsDb')                                              ║
// ║    2. Uncomment sheetsDb.js and comment out this file.                   ║
// ╚══════════════════════════════════════════════════════════════════════════╝
//
// HOW SUPABASE WORKS AS A DATABASE:
//   Supabase is a hosted PostgreSQL database with a JavaScript SDK.
//   We use the "service role key" which gives full access — it lives only
//   on the backend and is NEVER sent to the frontend.
//   Tables: "users" (id, email, password_hash) and "products" (all product fields).
// ─────────────────────────────────────────────────────────────────────────────

const { createClient } = require('@supabase/supabase-js');

// Create the Supabase client using the project URL and service role key from .env.
// The service role key has full access — keep it only on the backend, NEVER the frontend.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

// findUserByEmail — looks up a user by their email address in the "users" table.
// We lowercase the email before querying so comparisons are case-insensitive.
// Returns the user row object { id, email, password_hash } or null if not found.
async function findUserByEmail(email) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single(); // .single() returns one object instead of an array

  if (error) return null; // no matching user found
  return data;
}

// createUser — inserts a new user row into the "users" table.
// email: already lowercased by the route
// hashedPassword: bcrypt hash of the user's password (stored as password_hash)
async function createUser(email, hashedPassword) {
  const { data, error } = await supabase
    .from('users')
    .insert([{ email: email.toLowerCase(), password_hash: hashedPassword }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

// getProducts — returns all rows from the "products" table, newest first.
// Supabase returns numbers as actual numbers (unlike Google Sheets where
// everything comes back as strings), so no manual type conversion is needed.
async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('date_added', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

// addProduct — inserts a new product row into the "products" table.
// date_added is set here in the backend (same pattern as sheetsDb.js).
async function addProduct(productData) {
  const { name, sku, category, quantity, price, low_stock_threshold } = productData;
  const date_added = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  const { data, error } = await supabase
    .from('products')
    .insert([{ name, sku, category, quantity, price, low_stock_threshold, date_added }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// updateProduct — updates an existing product row matched by its id.
// Only updates the editable fields — id and date_added stay unchanged.
async function updateProduct(id, productData) {
  const { name, sku, category, quantity, price, low_stock_threshold } = productData;

  const { data, error } = await supabase
    .from('products')
    .update({ name, sku, category, quantity, price, low_stock_threshold })
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// deleteProduct — deletes the product row with the matching id.
async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) throw new Error(error.message);
}

module.exports = {
  findUserByEmail,
  createUser,
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
};
