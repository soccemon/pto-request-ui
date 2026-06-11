/**
 * config.js
 *
 * Central place for environment-level constants.
 *
 * API_URL is consumed by src/services/api.js to prefix every fetch call.
 * During development the Vite dev server proxies /auth, /users, and /requests
 * back to this address, so the browser never makes a cross-origin request and
 * CORS is never an issue. In production you would point this at your deployed
 * backend URL (or keep it empty if the frontend and API are co-hosted).
 */
export const API_URL = ''
