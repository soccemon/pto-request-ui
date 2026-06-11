/**
 * api.js
 *
 * Single source of truth for every HTTP call the frontend makes to the backend.
 * All functions return Promises that resolve to parsed JSON or reject with an
 * Error whose message is safe to display directly to the user.
 *
 * Keeping all fetch logic here means:
 *   - Components never import `fetch` or know the backend URL.
 *   - If an endpoint changes you update one line here, not every component.
 *   - Adding auth headers, logging, or retries only requires editing this file.
 */

import { API_URL } from '../config'

/**
 * Internal helper used by every exported function.
 *
 * Sends a fetch request to `${API_URL}${path}`, merges in a JSON Content-Type
 * header, and handles the response uniformly:
 *   - If the server returns a non-2xx status, parse the error body and throw.
 *   - Otherwise, parse and return the JSON body.
 *
 * @param {string} path    - The API path, e.g. '/users' or '/requests/5/approve'
 * @param {object} options - Standard fetch init options (method, body, headers…)
 * @returns {Promise<any>} Resolved JSON from the response body
 */
async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  if (!res.ok) {
    // Try to pull a human-readable message out of the response body.
    // FastAPI returns { detail: '...' } for validation errors.
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || err.message || `Request failed: ${res.status}`)
  }

  return res.json()
}

/**
 * Exported API surface used by components throughout the app.
 *
 * User endpoints
 *   getUsers()           → GET /users           — all users (used by Login & manager filter)
 *   getUser(id)          → GET /users/:id        — single user profile
 *   getBalance(id)       → GET /users/:id/balance — PTO totals for an employee
 *
 * Auth endpoints
 *   login(email)         → POST /auth/login      — email-only auth, returns full user object
 *
 * Request endpoints
 *   getRequests(params)      → GET /requests[?status=&user_id=]
 *   getRequestsByUser(id)    → GET /requests/user/:id
 *   createRequest(data)      → POST /requests
 *   approveRequest(id, msg)  → PATCH /requests/:id/approve
 *   rejectRequest(id, msg)   → PATCH /requests/:id/reject
 */
export const api = {
  // --- Users ---

  /** Fetch every user in the system. Used to populate the Login dropdown and the manager employee filter. */
  getUsers: () => request('/users'),

  /** Fetch a single user by their numeric ID. */
  getUser: (id) => request(`/users/${id}`),

  /**
   * Fetch PTO balance summary for one employee.
   * Returns { pto_balance, pto_used, pto_remaining }.
   */
  getBalance: (id) => request(`/users/${id}/balance`),

  // --- Auth ---

  /**
   * Authenticate by email address (no password — demo app).
   * The server returns the full user object which is then stored in localStorage.
   *
   * @param {string} email - Email address of the user to log in as
   */
  login: (email) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email }) }),

  // --- PTO Requests ---

  /**
   * Fetch all PTO requests, with optional server-side filters.
   *
   * @param {object} params - Optional query params e.g. { status: 'Pending', user_id: 3 }
   */
  getRequests: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/requests${qs ? `?${qs}` : ''}`)
  },

  /** Fetch all PTO requests belonging to a specific employee. */
  getRequestsByUser: (userId) => request(`/requests/user/${userId}`),

  /**
   * Create a new PTO request.
   * Expected fields: { user_id, type, start_date, end_date, reason }
   * The server calculates num_days (weekdays only) — do not send it.
   *
   * @param {object} data - Request payload matching PTORequestCreate schema
   */
  createRequest: (data) => request('/requests', { method: 'POST', body: JSON.stringify(data) }),

  /**
   * Manager approves a pending request.
   * The comment is optional for approvals.
   *
   * @param {number} id      - ID of the PTO request
   * @param {string} comment - Optional manager note
   */
  approveRequest: (id, comment) =>
    request(`/requests/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ manager_comment: comment }) }),

  /**
   * Manager rejects a pending request.
   * The backend requires a non-empty manager_comment when rejecting.
   *
   * @param {number} id      - ID of the PTO request
   * @param {string} comment - Required rejection reason
   */
  rejectRequest: (id, comment) =>
    request(`/requests/${id}/reject`, { method: 'PATCH', body: JSON.stringify({ manager_comment: comment }) }),
}
