/**
 * main.jsx — Application entry point
 *
 * Mounts the React tree into the #root div defined in index.html.
 *
 * BrowserRouter enables client-side routing via the History API so the app
 * can navigate between pages (/, /dashboard) without full page reloads.
 *
 * React.StrictMode renders every component twice in development to surface
 * side-effects and deprecated patterns early — has no effect in production.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
