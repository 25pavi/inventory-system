// ─────────────────────────────────────────────────────────────────────────────
// src/components/ProductForm.jsx  —  The modal popup form for add / edit.
//
// WHAT THIS COMPONENT DOES:
//   - Shows a modal (popup) with a form to add a new product OR edit an existing one.
//   - If editingProduct is provided (not null), the form pre-fills with its values.
//   - On submit, calls onSave(formData) — the parent handles the API call.
//   - Closes when the user clicks Cancel, the × button, or the dark backdrop.
//   - Shows an error message if the parent passes one back.
//
// PROPS:
//   editingProduct: the product object to edit, or null if adding a new product
//   onSave:         function to call with the form data when the user submits
//   onClose:        function to call when the modal should close
//   error:          error message string to display (e.g. "SKU already exists")
//   loading:        boolean — true while the save request is in progress
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

// The 6 fixed category options — must match the backend validation list.
const CATEGORIES = [
  'Groceries & Staples',
  'Fresh Produce & Dairy',
  'Snacks & Beverages',
  'Personal Care',
  'Home & Kitchen',
  'Other',
];

function ProductForm({ editingProduct, onSave, onClose, error, loading }) {
  // Form field state — one useState for each form field.
  const [name,              setName]              = useState('');
  const [sku,               setSku]               = useState('');
  const [category,          setCategory]          = useState(CATEGORIES[0]);
  const [quantity,          setQuantity]          = useState('');
  const [price,             setPrice]             = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');

  // useEffect runs after the component renders.
  // When editingProduct changes (e.g., user clicks Edit on a different product),
  // we populate the form fields with that product's current values.
  useEffect(() => {
    if (editingProduct) {
      // Editing an existing product — pre-fill with its data.
      setName(editingProduct.name);
      setSku(editingProduct.sku);
      setCategory(editingProduct.category);
      setQuantity(editingProduct.quantity);
      setPrice(editingProduct.price);
      setLowStockThreshold(editingProduct.low_stock_threshold);
    } else {
      // Adding a new product — reset all fields to empty.
      setName('');
      setSku('');
      setCategory(CATEGORIES[0]);
      setQuantity('');
      setPrice('');
      setLowStockThreshold('');
    }
  }, [editingProduct]); // the effect runs again whenever editingProduct changes

  // handleSubmit — gathers form values and passes them to the parent via onSave.
  function handleSubmit(e) {
    e.preventDefault(); // prevent full page reload

    // Build the product data object to send to the parent.
    onSave({
      name,
      sku,
      category,
      quantity:            Number(quantity),
      price:               Number(price),
      low_stock_threshold: Number(lowStockThreshold),
    });
  }

  return (
    // Clicking the backdrop (dark background) closes the modal.
    <div className="modal-backdrop" onClick={onClose}>
      {/*
        stopPropagation prevents clicks inside the modal box from
        also triggering the backdrop's onClick and closing the modal.
      */}
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{editingProduct ? 'Edit product' : 'Add product'}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close form"
          >
            ×
          </button>
        </div>

        {/* Show error message if the save failed (e.g. duplicate SKU) */}
        {error && <div className="message message-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* Product Name */}
          <div className="form-group">
            <label htmlFor="form-name">Product name</label>
            <input
              id="form-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Basmati Rice 5kg"
              required
            />
          </div>

          {/* SKU */}
          <div className="form-group">
            <label htmlFor="form-sku">SKU</label>
            <input
              id="form-sku"
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="e.g. GRC001"
              required
            />
          </div>

          {/* Category dropdown */}
          <div className="form-group">
            <label htmlFor="form-category">Category</label>
            <select
              id="form-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity, Price, Low Stock Threshold — two columns on wider screens */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="form-quantity">Quantity</label>
              <input
                id="form-quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="form-price">Price (₹)</label>
              <input
                id="form-price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="form-threshold">Low stock threshold</label>
            <input
              id="form-threshold"
              type="number"
              min="0"
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(e.target.value)}
              placeholder="e.g. 10 — badge shows when quantity is at or below this"
              required
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              id="form-submit-btn"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving…' : editingProduct ? 'Save changes' : 'Add product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;
