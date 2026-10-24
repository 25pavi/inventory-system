// ─────────────────────────────────────────────────────────────────────────────
// src/components/ProductTable.jsx  —  Renders the list of products as a table.
//
// WHAT THIS COMPONENT DOES:
//   - Receives the filtered list of products from Inventory.jsx.
//   - Shows them in an HTML table with columns for each field.
//   - Adds a "Low stock" badge on rows where quantity <= low_stock_threshold.
//   - Has Edit and Delete buttons per row.
//   - Shows a confirm dialog before deleting (window.confirm is built-in).
//   - Shows a friendly empty state if there are no products to display.
//
// PROPS:
//   products:   array of product objects to display
//   onEdit:     function to call with a product when the user clicks Edit
//   onDelete:   function to call with a product's id when delete is confirmed
// ─────────────────────────────────────────────────────────────────────────────

function ProductTable({ products, onEdit, onDelete }) {
  // isLowStock — returns true if a product's quantity is at or below its threshold.
  // We keep this as a simple helper function right here in the component.
  // Note: quantity and low_stock_threshold are already numbers (converted in the backend).
  function isLowStock(product) {
    return product.quantity <= product.low_stock_threshold;
  }

  // handleDeleteClick — shows a confirmation dialog before calling onDelete.
  function handleDeleteClick(product) {
    // window.confirm() shows a built-in browser dialog with OK / Cancel.
    // It returns true if the user clicked OK, false if they clicked Cancel.
    const confirmed = window.confirm(
      `Are you sure you want to delete "${product.name}"? This cannot be undone.`
    );
    if (confirmed) {
      onDelete(product.id);
    }
  }

  // If there are no products to show, display a friendly message.
  if (products.length === 0) {
    return (
      <div className="empty-state">
        <p>No products found.</p>
        <p>Try adjusting your search or filters, or add a new product.</p>
      </div>
    );
  }

  return (
    // table-wrapper allows horizontal scrolling on small screens.
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Low Stock At</th>
            <th>Date Added</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Render one <tr> (table row) for each product */}
          {products.map((product) => (
            <tr key={product.id}>
              <td>
                {product.name}
                {/* Show badge if quantity is at or below the low stock threshold */}
                {isLowStock(product) && (
                  <span className="badge-low-stock">Low stock</span>
                )}
              </td>
              <td>{product.sku}</td>
              <td>{product.category}</td>
              <td>{product.quantity}</td>
              {/* Format price in Indian Rupees with the ₹ symbol */}
              <td>₹{Number(product.price).toFixed(2)}</td>
              <td>{product.low_stock_threshold}</td>
              <td>{product.date_added}</td>
              <td>
                <div className="action-buttons">
                  <button
                    className="btn btn-secondary"
                    onClick={() => onEdit(product)}
                    id={`edit-btn-${product.id}`}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={() => handleDeleteClick(product)}
                    id={`delete-btn-${product.id}`}
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ProductTable;
