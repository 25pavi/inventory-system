// ─────────────────────────────────────────────────────────────────────────────
// src/components/SearchFilterBar.jsx  —  Search and filter controls.
//
// This component shows three controls:
//   1. A text input to search by product name or SKU.
//   2. A dropdown to filter by category.
//   3. A checkbox to show only low-stock items.
//
// It does NOT store data — it just calls the functions passed in from
// the parent (Inventory.jsx) whenever something changes.
// This pattern is called "controlled components".
// ─────────────────────────────────────────────────────────────────────────────

// The same 6 categories used in the form — defined once so they stay in sync.
const CATEGORIES = [
  'Groceries & Staples',
  'Fresh Produce & Dairy',
  'Snacks & Beverages',
  'Personal Care',
  'Home & Kitchen',
  'Other',
];

// Props (short for "properties") are values passed in from the parent component.
// searchTerm:        current text in the search box
// onSearchChange:    function to call when the user types in the search box
// categoryFilter:    current selected category ('all' or a category name)
// onCategoryChange:  function to call when the user picks a category
// lowStockOnly:      whether the low-stock checkbox is checked
// onLowStockChange:  function to call when the checkbox is toggled
function SearchFilterBar({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  lowStockOnly,
  onLowStockChange,
}) {
  return (
    <div className="top-bar">
      {/* Search input — searches by name or SKU */}
      <input
        id="search-input"
        type="text"
        placeholder="Search by name or SKU…"
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      {/* Category dropdown */}
      <select
        id="category-filter"
        value={categoryFilter}
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="all">All categories</option>
        {/* Render each category as a <option> element */}
        {CATEGORIES.map((cat) => (
          <option key={cat} value={cat}>
            {cat}
          </option>
        ))}
      </select>

      {/* Low stock checkbox filter */}
      <label className="low-stock-filter" htmlFor="low-stock-checkbox">
        <input
          id="low-stock-checkbox"
          type="checkbox"
          checked={lowStockOnly}
          onChange={(e) => onLowStockChange(e.target.checked)}
        />
        Low stock only
      </label>

      {/* The "Add product" button lives in the top bar too, but it is rendered
          by the parent (Inventory.jsx) so it can control modal open state. */}
    </div>
  );
}

export default SearchFilterBar;
