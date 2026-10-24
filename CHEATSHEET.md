# Assessment Cheat Sheet — Inventory Management System

> Keep this open during your assessment. Read it once the night before so it feels natural.

---

## Tech Stack (say this if asked)

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite, plain CSS |
| Backend | Node.js + Express |
| Auth | bcrypt (password hashing) + JWT (tokens) |
| Database A | Google Sheets via googleapis npm package |
| Database B | Supabase (hosted PostgreSQL) |
| Deployment | Frontend → Vercel, Backend → Render |
| Version control | Git + GitHub (2 branches) |

---

## 1. Self-Introduction Template

> Personalize the `[ ]` parts.

"Hi, I'm [Your Name], a [first/second/third] year student at [College Name] studying [Course Name].
For this project I built a full-stack Inventory Management System — similar to what a small store
like D-Mart uses to track their stock. I built the frontend in React, the backend in Node and Express,
and connected it to two different databases — Google Sheets and Supabase — to show how the database
layer can be swapped without touching the rest of the code. Both versions are live and deployed."

---

## 2. Project Introduction

**What it is:**
A web app where store staff can log in, add products, update stock levels, and search or filter the inventory.

**Key features:**
- Signup / Login with password hashing and JWT authentication
- Add, edit, delete products with a popup form
- Search by name or SKU
- Filter by category or show only low-stock items
- Low-stock badge when quantity ≤ threshold
- Prices shown in ₹
- Responsive — works on mobile too

**When was it built?**
"I built this project in the last week specifically for this assessment."

---

## 3. Frontend / UI Points

- Built with **React** using **Vite** as the build tool (fast refresh during development).
- **No UI library** — all CSS is written by hand using CSS variables for the color scheme.
- Color scheme: warm off-white background, deep charcoal text, terracotta accent (`#C8643B`).
- Colors are defined as CSS variables in one place (`index.css`) — change one variable and it updates everywhere.
- The app uses **React Router** for navigation between `/login`, `/signup`, and `/inventory`.
- State is managed with `useState` — no Redux or external state library needed.
- The `apiFetch` helper in `api.js` handles: base URL, JSON headers, and attaching the JWT token automatically.
- The inventory page is **protected** — if there is no token in localStorage, the user is redirected to `/login`.
- `vercel.json` tells Vercel to always serve `index.html` so page refreshes don't give a 404.

---

## 4. GitHub: Repo Structure and Branches

- The repo has **3 branches**:
  - `main` — base code
  - `sheets-version` — uses Google Sheets as the database
  - `supabase-version` — uses Supabase as the database

- **The only difference between branches** is in `backend/db/`:
  - `db/index.js` has one `require()` line that points to either `sheetsDb.js` or `supabaseDb.js`.
  - The routes never change. The frontend never changes.

- This pattern is called a **database abstraction layer** — the routes are decoupled from the database.

**How to show this in the demo:**
> "If I open `db/index.js` on the sheets-version branch, I see it requires `sheetsDb.js`.
> On the supabase-version branch, that one line says `supabaseDb.js`. That's the only change."

---

## 5. Google Sheets Integration

**How it connects:**
1. We created a Google Cloud project and enabled the Google Sheets API.
2. We created a **Service Account** — a robot Google account that our backend uses.
3. We downloaded a JSON key file from Google Cloud Console.
4. We shared the spreadsheet with the service account's email address as **Editor**.
5. In `sheetsDb.js`, we use the `googleapis` npm package with the service account credentials to read and write rows.

**How data is stored:**
- Two tabs (sheets): **Users** (id, email, password_hash) and **Products** (id, name, sku, …).
- Row 1 in each tab is the header row. Data starts at row 2.

**Tricky parts handled:**
- Google Sheets returns everything as **strings** — we convert `quantity`, `price`, and `low_stock_threshold` to numbers.
- Deleting a row requires the **numeric sheetId** (not the tab name) — we look it up with `getSheetIdByName()`.

**How to demo:**
> "I'll add a product here in the app — then open the Google Spreadsheet and you can see the new row appear in the Products tab."

---

## 6. Supabase Integration

**How it connects:**
1. We created a Supabase project (hosted PostgreSQL).
2. We created two tables: `users` and `products` using the Table Editor (no SQL needed).
3. We use the `@supabase/supabase-js` npm package with the **service role key** on the backend.
4. The service role key is stored in `.env` — it is **never sent to the frontend**.

**How it differs from Google Sheets:**
- Supabase returns numbers as actual numbers — no string-to-number conversion needed.
- Queries look like `supabase.from('products').select('*')` — very readable.
- Row deletion is simple: `.delete().eq('id', id)`.

**How to demo:**
> "On the supabase-version branch, I'll add a product — then open the Supabase Table Editor
> and you can see the row appear in the `products` table in real time."

---

## 7. Authentication Flow

Here is the full journey, step by step:

**Signup:**
1. User fills in email + password on `/signup`.
2. Frontend calls `POST /api/auth/signup` with JSON body.
3. Backend checks: is the email already taken? If yes → 409 error.
4. Backend hashes the password with **bcrypt** (10 salt rounds) — the plain password is **never stored**.
5. Backend saves `{ id, email, password_hash }` in the Users sheet/table.
6. Backend returns 201 → frontend redirects to `/login` with a success message.

**Login:**
1. User fills in email + password on `/login`.
2. Frontend calls `POST /api/auth/login`.
3. Backend finds the user by email.
4. Backend calls `bcrypt.compare(enteredPassword, storedHash)` — bcrypt hashes the entered password the same way and checks if they match.
5. If they match, backend signs a **JWT token** with `{ userId, email }` payload, expires in **5 days**.
6. Frontend stores the token in `localStorage`.

**Protected routes:**
1. Frontend sends the token as `Authorization: Bearer <token>` in every request.
2. `authMiddleware.js` runs before every product route.
3. It calls `jwt.verify(token, JWT_SECRET)` — checks signature and expiry.
4. If valid → `req.user` is set, the request continues.
5. If invalid or expired → 401 Unauthorized, no data returned.

---

## 8. Deployment

| What | Where | How |
|---|---|---|
| Backend | Render (free tier) | Root dir: `backend`, Start: `node server.js` |
| Frontend | Vercel (free tier) | Root dir: `frontend`, Framework: Vite |

**Key env vars on Render:**
- `PORT` — set by Render automatically
- `JWT_SECRET`, `GOOGLE_SHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`
- `ALLOWED_ORIGIN` — set to the Vercel frontend URL (CORS)

**Key env var on Vercel:**
- `VITE_API_URL` — set to the Render backend URL

**Live URLs:**
- Frontend: `https://your-app.vercel.app`
- Backend health: `https://your-backend.onrender.com/health`

---

## How a Request Flows (5 steps)

> A great answer to "explain how the app works end to end."

1. **User action** — The user clicks "Add product" and submits the form in the browser.
2. **Frontend API call** — `api.js` builds a `fetch()` request to `POST /api/products` with the product data as JSON and the JWT token in the Authorization header.
3. **Backend middleware** — `authMiddleware.js` checks the JWT token. If valid, the request reaches the route handler.
4. **Route handler** — `routes/products.js` validates the data, checks for duplicate SKU, and calls `addProduct()` from `db/index.js`.
5. **Database write** — `sheetsDb.js` (or `supabaseDb.js`) appends a new row to Google Sheets (or inserts into Supabase). The new product is returned and the frontend updates the list.

---

## 3 Challenges I Faced

**Challenge 1: Google Sheets returns everything as strings**
> "When I fetched products from the Google Sheets API, `quantity` came back as `"50"` (a string)
> instead of `50` (a number). This broke the low-stock comparison. I fixed it by converting
> `quantity`, `price`, and `low_stock_threshold` to numbers using `Number()` in a helper
> function called `rowToProduct()` before sending the data to the frontend."

**Challenge 2: Deleting a row in Google Sheets**
> "To delete a row in Google Sheets you need the numeric `sheetId` — not the tab name.
> I didn't know this at first and was getting an error. I wrote a helper function called
> `getSheetIdByName()` that fetches the spreadsheet metadata and finds the correct numeric ID
> for the 'Products' tab before every delete."

**Challenge 3: Page refresh giving 404 on Vercel**
> "When I deployed the frontend to Vercel and refreshed the `/inventory` page, I got a 404.
> This is because React Router handles URLs client-side — Vercel doesn't know about these routes.
> I fixed it by adding a `vercel.json` file that tells Vercel to serve `index.html` for every
> URL, so React Router can take over and show the right page."
