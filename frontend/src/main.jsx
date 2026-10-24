// ─────────────────────────────────────────────────────────────────────────────
// src/main.jsx  —  The very first file that runs in the browser.
//
// It finds the <div id="root"> in public/index.html and tells React to
// render our App component inside it. You normally never need to touch this file.
// ─────────────────────────────────────────────────────────────────────────────

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // import global styles so they apply to the whole app
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
