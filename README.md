# Inventory Management System

A simple club-store inventory web app built for a college project.
Frontend: React (Vite) · Backend: Node.js + Express · Database: Google Sheets **or** Supabase.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Folder Structure](#2-folder-structure)
3. [Google Sheets Setup](#3-google-sheets-setup)
4. [Supabase Setup](#4-supabase-setup)
5. [Run Locally](#5-run-locally)
6. [GitHub & Branches](#6-github--branches)
7. [Deploy to Render (backend) & Vercel (frontend)](#7-deploy-to-render--vercel)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Project Overview

This system lets staff at a small club store manage their stock.
Any team member can create an account, log in, and add/edit/delete products.
The inventory is shared — everyone sees the same list.

**Features:**
- Sign up and log in with email + password
- Add, view, edit and delete products
- Search by name or SKU; filter by category or low stock
- Low-stock badge when quantity ≤ low stock threshold
- Prices shown in ₹

**Tech Stack:**
- Frontend: React 19 (Vite), plain CSS
- Backend: Node.js + Express
- Auth: bcrypt password hashing + JWT (5-day token)
- Database: Google Sheets (sheets-version branch) or Supabase (supabase-version branch)

---

## 2. Folder Structure

```
inventory-system/
├── backend/
│   ├── server.js              ← Express app entry point
│   ├── routes/
│   │   ├── auth.js            ← POST /api/auth/signup and /login
│   │   └── products.js        ← GET/POST/PUT/DELETE /api/products
│   ├── middleware/
│   │   └── authMiddleware.js  ← Checks JWT token on protected routes
│   ├── db/
│   │   ├── index.js           ← The database switch (one require() line)
│   │   ├── sheetsDb.js        ← Google Sheets implementation
│   │   └── supabaseDb.js      ← Supabase implementation
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   └── Inventory.jsx
│   │   ├── components/
│   │   │   ├── ProductForm.jsx
│   │   │   ├── ProductTable.jsx
│   │   │   └── SearchFilterBar.jsx
│   │   ├── api.js             ← fetch() wrapper for all API calls
│   │   ├── App.jsx            ← React Router setup
│   │   ├── main.jsx
│   │   └── index.css          ← All styles + CSS variables
│   ├── vercel.json            ← Makes page refresh work on Vercel
│   └── .env.example
│
├── README.md
└── CHEATSHEET.md
```

---

## 3. Google Sheets Setup

> No Google Cloud account yet? Start from step 1. This takes about 15 minutes.

### Step 1 — Create a Google Account (skip if you already have one)

Go to [https://accounts.google.com/signup](https://accounts.google.com/signup) and create a free account.

### Step 2 — Create the Spreadsheet

1. Go to [https://sheets.google.com](https://sheets.google.com) and click **Blank spreadsheet**.
2. Name it **Inventory DB** (click "Untitled spreadsheet" at the top).
3. **Rename the first tab** (the tab at the bottom, currently called "Sheet1") to **Users**:
   - Right-click the tab → Rename → type `Users` → press Enter.
4. **Add a second tab** called **Products**:
   - Click the **+** button at the bottom left → right-click the new tab → Rename → type `Products`.

5. Click on the **Users** tab and type these headers in row 1 (one per cell):

   | A | B | C |
   |---|---|---|
   | id | email | password_hash |

6. Click on the **Products** tab and type these headers in row 1:

   | A | B | C | D | E | F | G | H |
   |---|---|---|---|---|---|---|---|
   | id | name | sku | category | quantity | price | low_stock_threshold | date_added |

### Step 3 — Note the Spreadsheet ID

Look at the URL of your spreadsheet:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```
Copy the long string between `/d/` and `/edit` — that is your **SPREADSHEET_ID**.

### Step 4 — Create a Google Cloud Project

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com).
2. Log in with the same Google account.
3. Click the project dropdown at the top → **New Project**.
4. Name it **inventory-project** → **Create**.
5. Wait a moment, then select your new project from the dropdown.

### Step 5 — Enable the Google Sheets API

1. In the left menu, go to **APIs & Services → Library**.
2. Search for **Google Sheets API**.
3. Click on it → **Enable**.

### Step 6 — Create a Service Account

A service account is like a robot Google account that your backend uses to access the sheet.

1. Go to **APIs & Services → Credentials**.
2. Click **+ Create Credentials → Service account**.
3. Name it **inventory-backend** → **Create and continue**.
4. Skip the optional steps → **Done**.
5. You will see your service account listed. Click on its **email address** to open it.
6. Go to the **Keys** tab → **Add Key → Create new key → JSON → Create**.
7. A `.json` file will download — keep it safe. Open it in a text editor.

### Step 7 — Share the Spreadsheet with the Service Account

1. In the downloaded JSON file, find the `"client_email"` field. It looks like:
   `inventory-backend@your-project.iam.gserviceaccount.com`
2. Open your Google Spreadsheet.
3. Click **Share** (top right) → paste the service account email → role: **Editor** → **Send**.

### Step 8 — Set .env Values

Create `backend/.env` by copying `backend/.env.example` and filling in:

```
PORT=5000
JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
GOOGLE_SHEET_ID=<your spreadsheet ID from Step 3>
GOOGLE_SERVICE_ACCOUNT_EMAIL=<client_email from the JSON file>
GOOGLE_PRIVATE_KEY="<private_key from the JSON file — keep the quotes>"
ALLOWED_ORIGIN=http://localhost:5173
```

> **Private key tip:** The key in the JSON file looks like `"-----BEGIN RSA PRIVATE KEY-----\nABC...\n-----END RSA PRIVATE KEY-----\n"`.
> Copy it exactly including `-----BEGIN...` and `-----END...` and wrap the whole thing in double quotes in .env.
> On Render, paste the raw value (with real newlines) in the environment variable field — Render handles it correctly.

---

## 4. Supabase Setup

> No SQL editor needed — we use the Table Editor only.

### Step 1 — Create a Supabase Account

Go to [https://supabase.com](https://supabase.com) and sign up with your GitHub account.

### Step 2 — Create a Project

1. Click **New project**.
2. Name it **inventory-db**.
3. Set a database password (save it somewhere safe).
4. Choose the region closest to you → **Create new project**.
5. Wait about a minute for the project to finish setting up.

### Step 3 — Create the `users` Table

1. In the left sidebar, go to **Table Editor**.
2. Click **New table**.
3. Name: `users`
4. Disable **Row Level Security (RLS)** for now (toggle it off).
5. Add these columns (the `id` column already exists as a default):

   | Column name | Type | Default value | Primary key |
   |---|---|---|---|
   | id | uuid | gen_random_uuid() | ✅ Yes |
   | email | text | — | No |
   | password_hash | text | — | No |

6. Click **Save**.

### Step 4 — Create the `products` Table

1. Click **New table**.
2. Name: `products`
3. Disable **Row Level Security (RLS)**.
4. Add these columns:

   | Column name | Type | Default value | Primary key |
   |---|---|---|---|
   | id | uuid | gen_random_uuid() | ✅ Yes |
   | name | text | — | No |
   | sku | text | — | No |
   | category | text | — | No |
   | quantity | int4 | 0 | No |
   | price | float8 | 0 | No |
   | low_stock_threshold | int4 | 0 | No |
   | date_added | text | — | No |

5. Click **Save**.

### Step 5 — Get Your Credentials

1. Go to **Project Settings → API** (left sidebar).
2. Copy the **Project URL** (looks like `https://abcdefgh.supabase.co`).
3. Under **Project API keys**, copy the **service_role** key (click "Reveal").

> ⚠️ Never put the service_role key in the frontend — it gives full database access.

### Step 6 — Set .env Values (Supabase branch)

```
PORT=5000
JWT_SECRET=<same key as before>
SUPABASE_URL=<your project URL>
SUPABASE_SERVICE_ROLE_KEY=<your service_role key>
ALLOWED_ORIGIN=http://localhost:5173
```

---

## 5. Run Locally

### Prerequisites

- Node.js 18+ installed ([https://nodejs.org](https://nodejs.org))
- A `.env` file in `backend/` (see sections 3 or 4 above)
- A `.env` file in `frontend/` (copy `.env.example`, set `VITE_API_URL=http://localhost:5000`)

### Terminal 1 — Start the backend

```bash
cd backend
npm install       # only needed the first time
npm run dev       # starts with nodemon (auto-restarts on file changes)
```

You should see: `✅ Server is running on port 5000`

### Terminal 2 — Start the frontend

```bash
cd frontend
npm install       # only needed the first time
npm run dev       # starts Vite dev server
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 6. GitHub & Branches

> You already have a GitHub account — just follow these steps.

### Step 1 — Create a repository on GitHub

1. Go to [https://github.com/new](https://github.com/new).
2. Name it `inventory-system`. Make it **Private** or **Public** as you prefer.
3. Do **NOT** initialize with a README (we already have one).
4. Click **Create repository**.

### Step 2 — Push the code

Open a terminal in the `inventory-system` folder and run:

```bash
git init
git add .
git commit -m "Initial commit: backend + frontend"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/inventory-system.git
git push -u origin main
```

### Step 3 — Create the sheets-version branch

```bash
git checkout -b sheets-version
git push -u origin sheets-version
```

### Step 4 — Create the supabase-version branch

The only change for the Supabase version is in `backend/db/`:
- `db/index.js` → change the require to `./supabaseDb`
- `db/supabaseDb.js` → uncomment everything
- `db/sheetsDb.js` → comment out all the actual code (keep the file)
- `backend/.env.example` → add `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

```bash
git checkout -b supabase-version
# Make the db/ changes listed above, then:
git add .
git commit -m "Switch database layer to Supabase"
git push -u origin supabase-version
```

---

## 7. Deploy to Render & Vercel

### Backend on Render

1. Go to [https://render.com](https://render.com) and sign up with GitHub.
2. Click **New → Web Service**.
3. Connect your GitHub repo.
4. Settings:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `node server.js`
   - **Branch:** `sheets-version` (or `supabase-version`)
5. Under **Environment Variables**, add all variables from `.env.example` with real values.
   - For `ALLOWED_ORIGIN`, temporarily set `http://localhost:5173` and update it after Vercel gives you a URL.
6. Click **Create Web Service**. Render will build and deploy.
7. Copy the Render URL (e.g., `https://inventory-backend-xyz.onrender.com`).

### Frontend on Vercel

1. Go to [https://vercel.com](https://vercel.com) and sign up with GitHub.
2. Click **Add New → Project** → import your GitHub repo.
3. Settings:
   - **Root directory:** `frontend`
   - **Framework preset:** Vite (Vercel detects this automatically)
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://your-render-url.onrender.com` (from the previous step)
5. Click **Deploy**.
6. Copy the Vercel URL (e.g., `https://inventory-frontend-xyz.vercel.app`).

### Update CORS

Now that you have the Vercel URL:
1. Go to Render → your web service → **Environment**.
2. Update `ALLOWED_ORIGIN` to your Vercel URL (e.g., `https://inventory-frontend-xyz.vercel.app`).
3. Render will restart automatically.

---

## 8. Troubleshooting

**CORS error in browser console ("blocked by CORS policy")**
- Make sure `ALLOWED_ORIGIN` in your Render environment exactly matches your Vercel URL — no trailing slash.
- After changing `ALLOWED_ORIGIN` on Render, wait for the service to redeploy.

**401 Unauthorized on every request**
- The JWT token may be missing or expired. Log out and log in again.
- Check that `JWT_SECRET` is set and is the same value the backend is using.

**Google Sheets: "The caller does not have permission"**
- You forgot to share the spreadsheet with the service account email.
- Go to the spreadsheet → Share → add the service account email as Editor.

**Google Sheets: Private key error**
- On Render, paste the private key raw (with real newlines) in the environment variable field.
- Locally, wrap the key in double quotes in .env.

**Duplicate SKU error**
- The SKU you entered already exists in the inventory. Each product needs a unique SKU.
- Check existing products or change the SKU.

**Render sleeping on free tier**
- Render free services sleep after 15 minutes of inactivity. The first request after sleeping takes 30–60 seconds to respond — this is normal.
- You will see a loading spinner on the frontend while the backend wakes up.

**Page refreshing gives 404 on Vercel**
- Make sure `frontend/vercel.json` is committed and present in your repo.
- The `vercel.json` file tells Vercel to always serve `index.html` so React Router can handle the URL.
