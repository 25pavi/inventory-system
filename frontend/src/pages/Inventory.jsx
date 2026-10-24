// ─────────────────────────────────────────────────────────────────────────────
// src/pages/Inventory.jsx  —  The main inventory management page.
//
// WHAT THIS PAGE DOES:
//   1. Checks if the user is logged in (token in localStorage).
//      If not → redirect to /login immediately.
//   2. Fetches all products from the backend on first load.
//   3. Manages search, category filter, and low-stock filter state.
//      Filtering happens client-side (no extra API calls needed).
//   4. Opens the ProductForm modal for adding or editing a product.
//   5. Handles add, edit, and delete operations by calling the backend.
//
// This page is the "brain" — it owns all the data and passes it down
// to SearchFilterBar, ProductTable, and ProductForm as props.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { apiFetch }            from '../api';

import SearchFilterBar from '../components/SearchFilterBar';
import ProductTable    from '../components/ProductTable';
import ProductForm     from '../components/ProductForm';

function Inventory() {
  // ── State ─────────────────────────────────────────────────────────────────
  const [products, setProducts]           = useState([]);         // all products from the API
  const [searchTerm, setSearchTerm]       = useState('');         // text typed in search box
  const [categoryFilter, setCategoryFilter] = useState('all');   // selected category
  const [lowStockOnly, setLowStockOnly]   = useState(false);      // low-stock checkbox

  const [isModalOpen, setIsModalOpen]     = useState(false);      // is the popup form open?
  const [editingProduct, setEditingProduct] = useState(null);     // null = add mode, object = edit mode

  const [fetchLoading, setFetchLoading]   = useState(true);       // loading state for initial fetch
  const [fetchError, setFetchError]       = useState('');         // error from fetching products
  const [formError, setFormError]         = useState('');         // error inside the modal form
  const [formLoading, setFormLoading]     = useState(false);      // loading state for save button

  const navigate = useNavigate();

  // ── Auth guard ─────────────────────────────────────────────────────────────
  // On first render, check if there is a token. If not, redirect to login.
  // This runs once when the component mounts (empty dependency array []).
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // ── Fetch products ─────────────────────────────────────────────────────────
  // loadProducts fetches the full product list from the backend.
  // We call it on mount and after any add/edit/delete operation.
  async function loadProducts() {
    setFetchLoading(true);
    setFetchError('');
    try {
      const data = await apiFetch('/api/products');
      setProducts(data);
    } catch (err) {
      // If the token is expired, the server returns 401.
      if (err.message.includes('token') || err.message.includes('log in')) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setFetchError(err.message);
      }
    } finally {
      setFetchLoading(false);
    }
  }

  // Run loadProducts once when the component first renders.
  useEffect(() => {
    loadProducts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Logout ─────────────────────────────────────────────────────────────────
  function handleLogout() {
    localStorage.removeItem('token'); // clear the saved token
    navigate('/login');
  }

  // ── Filter logic (client-side) ─────────────────────────────────────────────
  // We filter the full products array each render — no extra API calls.
  const filteredProducts = products.filter((product) => {
    // Search: check if name or SKU contains the search term (case-insensitive).
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      !term ||
      product.name.toLowerCase().includes(term) ||
      product.sku.toLowerCase().includes(term);

    // Category filter: 'all' means no filter applied.
    const matchesCategory =
      categoryFilter === 'all' || product.category === categoryFilter;

    // Low stock filter: only show products where quantity <= low_stock_threshold.
    const matchesLowStock =
      !lowStockOnly || product.quantity <= product.low_stock_threshold;

    // A product must pass ALL three checks to be shown.
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // ── Modal helpers ─────────────────────────────────────────────────────────
  // Open modal in "add" mode.
  function openAddModal() {
    setEditingProduct(null); // null = no product = add mode
    setFormError('');
    setIsModalOpen(true);
  }

  // Open modal in "edit" mode for a specific product.
  function openEditModal(product) {
    setEditingProduct(product);
    setFormError('');
    setIsModalOpen(true);
  }

  // Close the modal and clear any error.
  function closeModal() {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormError('');
  }

  // ── Save (add or edit) ────────────────────────────────────────────────────
  // Called by ProductForm when the user submits.
  async function handleSave(formData) {
    setFormLoading(true);
    setFormError('');

    try {
      if (editingProduct) {
        // Edit mode: call PUT /api/products/:id
        await apiFetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        // Add mode: call POST /api/products
        await apiFetch('/api/products', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
      }

      // Close the modal and refresh the product list.
      closeModal();
      loadProducts();

    } catch (err) {
      // Show the error inside the modal (e.g., "SKU already exists").
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  // Called by ProductTable when the user confirms deletion.
  async function handleDelete(id) {
    try {
      await apiFetch(`/api/products/${id}`, { method: 'DELETE' });
      // Refresh the list after deletion.
      loadProducts();
    } catch (err) {
      alert(`Could not delete product: ${err.message}`);
    }
  }

  // Calculations for display-only stats
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.quantity <= p.low_stock_threshold).length;
  const categoriesCount = new Set(products.map((p) => p.category)).size;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="inventory-page">
      {/* Top navbar with branding on left and logout on right */}
      <header className="inventory-nav">
        <div className="nav-brand">
          <span className="brand-icon">📦</span>
          <span className="brand-name">Club Store</span>
        </div>
        <button className="logout-btn" onClick={handleLogout}>
          Log out
        </button>
      </header>

      {/* Hero-style page header with pill badge */}
      <div className="inventory-hero">
        <div className="badge-pill">
          <span className="badge-dot"></span> Live Store Dashboard
        </div>
        <h1 className="page-hero-title">
          Club Store <span className="highlight-text">Inventory</span>
        </h1>
        <p className="page-hero-subtitle">
          Monitor real-time stock levels, manage items, and restock low-threshold inventory.
        </p>
      </div>

      {/* Display-only stat cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Total Products</span>
          <span className="stat-value">{totalProducts}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Low Stock Items</span>
          <span className={`stat-value ${lowStockCount > 0 ? 'stat-warning' : ''}`}>
            {lowStockCount}
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Categories in Use</span>
          <span className="stat-value">{categoriesCount}</span>
        </div>
      </div>

      {/* Toolbar card: search, category filter, low-stock checkbox, and Add button. */}
      <div className="toolbar-card">
        <SearchFilterBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          lowStockOnly={lowStockOnly}
          onLowStockChange={setLowStockOnly}
        />
        <button
          id="add-product-btn"
          className="btn btn-primary add-product-btn"
          onClick={openAddModal}
        >
          + Add product
        </button>
      </div>

      {/* Loading and error states for the product list */}
      {fetchLoading && (
        <p className="message message-loading">Loading products…</p>
      )}
      {fetchError && (
        <div className="message message-error">{fetchError}</div>
      )}

      {/* The product table — only shown when not loading */}
      {!fetchLoading && (
        <ProductTable
          products={filteredProducts}
          onEdit={openEditModal}
          onDelete={handleDelete}
        />
      )}

      {/* The modal popup — only rendered when isModalOpen is true */}
      {isModalOpen && (
        <ProductForm
          editingProduct={editingProduct}
          onSave={handleSave}
          onClose={closeModal}
          error={formError}
          loading={formLoading}
        />
      )}
    </div>
  );
}

export default Inventory;
