// ─────────────────────────────────────────────────────────────────────────────
// routes/products.js  —  Handles all product CRUD operations.
//
// ALL routes here are protected — verifyToken runs before every handler.
// If the token is missing or invalid, the middleware returns 401 immediately
// and the handler below never runs.
//
// Routes defined here:
//   GET    /api/products        — get all products
//   POST   /api/products        — add a new product
//   PUT    /api/products/:id    — update an existing product
//   DELETE /api/products/:id    — delete a product
// ─────────────────────────────────────────────────────────────────────────────

const express     = require('express');
const verifyToken = require('../middleware/authMiddleware');
const { getProducts, addProduct, updateProduct, deleteProduct } = require('../db');

const router = express.Router();

// Apply verifyToken to ALL routes in this file.
// router.use() means: run this middleware before every route handler below.
router.use(verifyToken);

// The 6 allowed product categories. Defined once here as a constant
// so we can validate incoming data against this exact list.
const VALID_CATEGORIES = [
  'Groceries & Staples',
  'Fresh Produce & Dairy',
  'Snacks & Beverages',
  'Personal Care',
  'Home & Kitchen',
  'Other',
];

// validateProductFields — checks that all required fields are present and valid.
// Returns an error message string if invalid, or null if everything is fine.
function validateProductFields(body) {
  const { name, sku, category, quantity, price, low_stock_threshold } = body;

  if (!name || !name.trim())
    return 'Product name is required.';
  if (!sku || !sku.trim())
    return 'SKU is required.';
  if (!VALID_CATEGORIES.includes(category))
    return `Category must be one of: ${VALID_CATEGORIES.join(', ')}.`;
  if (quantity === undefined || quantity === null || quantity === '')
    return 'Quantity is required.';
  if (isNaN(Number(quantity)) || Number(quantity) < 0)
    return 'Quantity must be a non-negative number.';
  if (price === undefined || price === null || price === '')
    return 'Price is required.';
  if (isNaN(Number(price)) || Number(price) < 0)
    return 'Price must be a non-negative number.';
  if (low_stock_threshold === undefined || low_stock_threshold === null || low_stock_threshold === '')
    return 'Low stock threshold is required.';
  if (isNaN(Number(low_stock_threshold)) || Number(low_stock_threshold) < 0)
    return 'Low stock threshold must be a non-negative number.';

  return null; // all good
}

// ── GET /api/products ─────────────────────────────────────────────────────────
// Returns the full list of products (shared inventory for all logged-in users).
router.get('/', async (req, res) => {
  try {
    const products = await getProducts();
    return res.status(200).json(products);
  } catch (err) {
    console.error('Get products error:', err.message);
    return res.status(500).json({ error: 'Could not fetch products. Please try again.' });
  }
});

// ── POST /api/products ────────────────────────────────────────────────────────
// Adds a new product to the inventory.
// Expects JSON body with all product fields.
router.post('/', async (req, res) => {
  try {
    // Validate all fields first.
    const validationError = validateProductFields(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { name, sku, category, quantity, price, low_stock_threshold } = req.body;

    // ── Check for duplicate SKU ──────────────────────────────────────────────
    // SKU (Stock Keeping Unit) must be unique across all products.
    // We fetch all products and look for a matching SKU.
    const existing = await getProducts();
    const duplicate = existing.find(
      (p) => p.sku.toLowerCase() === sku.trim().toLowerCase()
    );
    if (duplicate) {
      return res.status(409).json({ error: `A product with SKU "${sku}" already exists.` });
    }

    // Add the product. date_added is set inside addProduct().
    const newProduct = await addProduct({
      name:               name.trim(),
      sku:                sku.trim(),
      category,
      quantity:           Number(quantity),
      price:              Number(price),
      low_stock_threshold: Number(low_stock_threshold),
    });

    return res.status(201).json(newProduct);

  } catch (err) {
    console.error('Add product error:', err.message);
    return res.status(500).json({ error: 'Could not add product. Please try again.' });
  }
});

// ── PUT /api/products/:id ─────────────────────────────────────────────────────
// Updates an existing product by its id.
// :id in the URL is accessed via req.params.id.
router.put('/:id', async (req, res) => {
  try {
    const validationError = validateProductFields(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const { name, sku, category, quantity, price, low_stock_threshold } = req.body;
    const { id } = req.params;

    // ── Check for duplicate SKU (excluding the product being edited) ─────────
    // We exclude the current product (id !== id being edited) so a product
    // can keep its own SKU when other fields change.
    const existing = await getProducts();
    const duplicate = existing.find(
      (p) => p.sku.toLowerCase() === sku.trim().toLowerCase() && p.id !== id
    );
    if (duplicate) {
      return res.status(409).json({ error: `Another product already has SKU "${sku}".` });
    }

    const updated = await updateProduct(id, {
      name:               name.trim(),
      sku:                sku.trim(),
      category,
      quantity:           Number(quantity),
      price:              Number(price),
      low_stock_threshold: Number(low_stock_threshold),
    });

    return res.status(200).json(updated);

  } catch (err) {
    console.error('Update product error:', err.message);
    return res.status(500).json({ error: 'Could not update product. Please try again.' });
  }
});

// ── DELETE /api/products/:id ──────────────────────────────────────────────────
// Deletes a product by its id.
// The frontend always shows a confirm dialog before calling this route.
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await deleteProduct(id);
    return res.status(200).json({ message: 'Product deleted successfully.' });
  } catch (err) {
    console.error('Delete product error:', err.message);
    return res.status(500).json({ error: 'Could not delete product. Please try again.' });
  }
});

module.exports = router;
