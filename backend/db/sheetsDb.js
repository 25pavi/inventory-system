// ─────────────────────────────────────────────────────────────────────────────
// db/sheetsDb.js  —  Google Sheets database logic.
//
// ╔══════════════════════════════════════════════════════════════════════════╗
// ║  THIS FILE IS DISABLED IN THE supabase-version BRANCH.                  ║
// ║                                                                          ║
// ║  The active database layer is supabaseDb.js.                             ║
// ║                                                                          ║
// ║  To switch BACK to Google Sheets:                                        ║
// ║    1. In db/index.js, change:                                            ║
// ║         require('./supabaseDb')  →  require('./sheetsDb')                ║
// ║    2. Uncomment the code below (remove the /* and */ delimiters).        ║
// ║    3. Make sure your .env has the Google Sheets variables:               ║
// ║         GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY║
// ╚══════════════════════════════════════════════════════════════════════════╝
// ─────────────────────────────────────────────────────────────────────────────

/*

// ─────────────────────────────────────────────────────────────────────────────
// db/sheetsDb.js  —  All Google Sheets database logic lives here.
//
// HOW GOOGLE SHEETS WORKS AS A DATABASE:
//   We use the Google Sheets API (via the 'googleapis' npm package) and a
//   "service account" (a robot Google account with permission to edit the sheet).
//   The spreadsheet has two tabs (sheets):
//     • "Users"    — columns: id | email | password_hash
//     • "Products" — columns: id | name | sku | category | quantity | price |
//                             low_stock_threshold | date_added
//   Row 1 in each tab is the header row. Data starts at row 2.
//
// IMPORTANT NOTE ABOUT TYPES:
//   Google Sheets stores everything as text (strings).
//   So "50" (a string) comes back instead of 50 (a number).
//   We convert quantity, price, and low_stock_threshold to numbers wherever needed.
// ─────────────────────────────────────────────────────────────────────────────

const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');

// ── Set up the Google Sheets client ──────────────────────────────────────────
// We authenticate using a service account. The credentials come from .env.
// The private key may have literal "\n" characters (escaped newlines) when
// stored in .env — we replace them with real newline characters here.
function getAuthClient() {
  return new google.auth.JWT(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    null,
    process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    ['https://www.googleapis.com/auth/spreadsheets'] // permission scope
  );
}

// A helper that returns a ready-to-use Google Sheets API object.
function getSheetsClient() {
  const auth = getAuthClient();
  return google.sheets({ version: 'v4', auth });
}

// The spreadsheet ID from .env (found in the Google Sheets URL).
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

// ── Helper: fetch all rows from a tab ────────────────────────────────────────
// sheetName: the tab name, e.g. "Users" or "Products"
// Returns an array of row arrays, e.g. [["id","email","password_hash"], ["abc","a@b.com","$2b..."]]
async function getAllRows(sheetName) {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName, // reads the entire tab
  });
  // If the sheet is empty, return an empty array to avoid errors.
  return response.data.values || [];
}

// ── Helper: get the numeric sheetId for a tab by name ────────────────────────
// Google Sheets API requires a numeric sheetId (not the tab name) when
// deleting rows. This function looks it up from the spreadsheet metadata.
// sheetName: the tab name, e.g. "Products"
// Returns the numeric sheetId, e.g. 0 or 1234567890
async function getSheetIdByName(sheetName) {
  const sheets = getSheetsClient();
  const response = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets(properties(sheetId,title))',
  });
  const sheet = response.data.sheets.find(
    (s) => s.properties.title === sheetName
  );
  if (!sheet) {
    throw new Error(`Sheet tab named "${sheetName}" not found in the spreadsheet.`);
  }
  return sheet.properties.sheetId;
}

// ─────────────────────────────────────────────────────────────────────────────
// USERS
// ─────────────────────────────────────────────────────────────────────────────

// findUserByEmail — looks for a user row that matches the given email.
// Returns the user object { id, email, password_hash } or null if not found.
async function findUserByEmail(email) {
  const rows = await getAllRows('Users');

  // Row 0 is the header row ["id", "email", "password_hash"] — skip it.
  // We search from row index 1 onwards.
  for (let i = 1; i < rows.length; i++) {
    const [id, rowEmail, password_hash] = rows[i];
    // Compare lowercased emails so "User@Test.com" matches "user@test.com".
    if (rowEmail && rowEmail.toLowerCase() === email.toLowerCase()) {
      return { id, email: rowEmail, password_hash };
    }
  }

  // No matching row found.
  return null;
}

// createUser — appends a new row to the Users sheet.
// email: the user's email (already lowercased by the route)
// hashedPassword: the bcrypt hash of their password
async function createUser(email, hashedPassword) {
  const sheets = getSheetsClient();
  const id = uuidv4(); // generate a unique ID

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Users',
    valueInputOption: 'RAW', // store values as plain text, no formula parsing
    requestBody: {
      values: [[id, email, hashedPassword]],
    },
  });

  return { id, email };
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTS
// ─────────────────────────────────────────────────────────────────────────────

// rowToProduct — converts a raw row array into a nice product object.
// Also converts numeric fields from strings (Sheets returns everything as text).
function rowToProduct(row) {
  const [id, name, sku, category, quantity, price, low_stock_threshold, date_added] = row;
  return {
    id,
    name,
    sku,
    category,
    quantity:            Number(quantity),            // "50" → 50
    price:               Number(price),               // "80.5" → 80.5
    low_stock_threshold: Number(low_stock_threshold), // "10" → 10
    date_added,
  };
}

// getProducts — returns all products as an array of product objects.
async function getProducts() {
  const rows = await getAllRows('Products');

  // Row 0 is the header row — skip it.
  // Map each remaining row into a product object using rowToProduct.
  return rows.slice(1).map(rowToProduct);
}

// addProduct — appends a new product row to the Products sheet.
// productData: { name, sku, category, quantity, price, low_stock_threshold }
// Returns the newly created product object.
async function addProduct(productData) {
  const sheets = getSheetsClient();
  const id         = uuidv4();
  const date_added = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

  const { name, sku, category, quantity, price, low_stock_threshold } = productData;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Products',
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, name, sku, category, quantity, price, low_stock_threshold, date_added]],
    },
  });

  return { id, name, sku, category, quantity, price, low_stock_threshold, date_added };
}

// updateProduct — finds the row with the matching id and overwrites it.
// id: the UUID of the product to update
// productData: { name, sku, category, quantity, price, low_stock_threshold }
async function updateProduct(id, productData) {
  const rows = await getAllRows('Products');

  // Find which row index has our product id (column A = index 0).
  // We add 1 because Sheets rows are 1-indexed (row 1 = header).
  let rowIndex = -1;
  let existingDateAdded = '';

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      rowIndex = i + 1; // +1 to convert from 0-indexed array to 1-indexed Sheets row
      existingDateAdded = rows[i][7]; // preserve the original date_added
      break;
    }
  }

  if (rowIndex === -1) {
    throw new Error('Product not found.');
  }

  const sheets = getSheetsClient();
  const { name, sku, category, quantity, price, low_stock_threshold } = productData;

  // Update the entire row (columns A through H) at the found row index.
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `Products!A${rowIndex}:H${rowIndex}`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[id, name, sku, category, quantity, price, low_stock_threshold, existingDateAdded]],
    },
  });

  return { id, name, sku, category, quantity, price, low_stock_threshold, date_added: existingDateAdded };
}

// deleteProduct — finds the row with the matching id and deletes it entirely.
// id: the UUID of the product to delete
//
// WHY WE NEED THE NUMERIC sheetId:
//   Deleting a row in Google Sheets requires a "batchUpdate" request with
//   a numeric sheetId (like 0 or 1234567890), NOT the tab name string.
//   We look it up using getSheetIdByName() before deleting.
async function deleteProduct(id) {
  const rows = await getAllRows('Products');

  // Find the 0-indexed array position of the row with this id.
  let rowArrayIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === id) {
      rowArrayIndex = i;
      break;
    }
  }

  if (rowArrayIndex === -1) {
    throw new Error('Product not found.');
  }

  // Look up the numeric sheetId for the "Products" tab.
  const sheetId = await getSheetIdByName('Products');

  const sheets = getSheetsClient();

  // batchUpdate lets us send structural changes to the spreadsheet.
  // "deleteDimension" removes a range of rows or columns.
  // startIndex is 0-based inclusive, endIndex is 0-based exclusive.
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId:    sheetId,
              dimension:  'ROWS',
              startIndex: rowArrayIndex,     // the row to delete (0-based)
              endIndex:   rowArrayIndex + 1, // one row only
            },
          },
        },
      ],
    },
  });
}

module.exports = {
  findUserByEmail,
  createUser,
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
};

*/
