# PTO Request System — React Frontend

## Project overview

React + Vite SPA for managing employee PTO requests. Two roles (employee / manager) see different dashboards after login. The backend is a separate FastAPI repo (`pto-request-api`) that must be running locally.

## Backend

- Repo: `pto-request-api` (sibling directory)
- Runs at: `http://localhost:8000`
- Start it before using the frontend

### API endpoints

| Method | Path | Purpose |
|--------|------|---------|
| POST | /auth/login | Email-only login, returns user object |
| GET | /users | All users |
| GET | /users/{id} | Single user |
| GET | /users/{id}/balance | PTO balance (pto_balance, pto_used, pto_remaining) |
| GET | /requests | All requests (optional: ?status=, ?user_id=) |
| GET | /requests/user/{user_id} | All requests for one employee |
| POST | /requests | Create request — body: { user_id, type, start_date, end_date, reason } |
| PATCH | /requests/{id}/approve | Approve — body: { manager_comment? } |
| PATCH | /requests/{id}/reject | Reject — body: { manager_comment } (required) |

Key schema notes:
- Leave type field is `type` (not `leave_type`)
- Do NOT send `days` or `num_days` when creating a request — the server calculates it
- Approve/reject comment field is `manager_comment` (not `comment`)
- Response uses `num_days` for the weekday count

## Development

```bash
npm install
npm run dev        # starts at http://localhost:5173
npm run build      # production build to dist/
```

## Proxy

`vite.config.js` proxies `/auth`, `/users`, and `/requests` to `http://localhost:8000` so the browser never makes a cross-origin request (avoids CORS issues in development). `src/config.js` exports `API_URL = ''` (empty string = same origin).

## Roles

- **employee** — sees their own balance and request history; can submit new requests
- **manager** — sees all employees' requests; can approve or reject pending ones

Roles are stored in the user object in localStorage after login. `App.jsx` routes to either `EmployeeDashboard` or `ManagerDashboard` based on `user.role`.

## Authentication

Email-only (no password). Login flow:
1. `GET /users` on login page load → populate dropdown
2. User selects name → role shown as pill
3. `POST /auth/login { email }` → backend returns full user object
4. User stored in `localStorage.user` and React state in `App.jsx`
5. Logout removes from both

## Source structure

```
src/
  config.js                        # API_URL constant
  main.jsx                         # React entry point
  App.jsx                          # Routes, auth state, dark mode
  index.css                        # Global CSS custom properties (light/dark themes)
  services/
    api.js                         # All fetch calls in one place
  components/
    Navbar/                        # Top nav bar (logo, user info, dark toggle, logout)
    BalanceCard/                   # PTO balance summary with progress bar
    RequestsTable/                 # Shared table (employee + manager views)
    NewRequestModal/               # 3-step PTO request form with validation
    ApproveRejectModal/            # Manager approve/reject confirmation modal
    StatusBadge/                   # Coloured status pill (Pending/Approved/Rejected)
  pages/
    Login/                         # User selection + login form
    EmployeeDashboard/             # Balance card + requests table + new request button
    ManagerDashboard/              # Summary counts + full request table + action modals
```

## Theming

Dark mode is toggled via the Navbar button. The preference persists in `localStorage.darkMode`. The `data-theme` attribute on `<html>` switches between light and dark CSS custom property sets defined in `index.css`.

## Responsive design

The UI is mobile-friendly down to ~375px viewport width. Key breakpoints:

- **≤640px** — `RequestsTable` switches from a scrollable table to a stacked card layout. Each row becomes a bordered card; CSS `::before` pseudo-elements (populated via `data-label` attributes on `<td>`) render column labels on the left. The empty-state cell suppresses its label.
- **≤500px** — Manager dashboard summary cards reduce their `min-width` so all three (Pending / Approved / Rejected) fit in one row.
- **≤480px** — Navbar compresses (role label hidden, tighter padding). BalanceCard vertical dividers hidden when stats wrap. `NewRequestModal` and `ApproveRejectModal` slide up as bottom sheets (full-width, rounded top corners, `max-height: 92vh`); date fields stack to a single column; footer buttons stack full-width.
- **≤600px** — `.page` wrapper padding reduces from `28px 24px` to `16px 12px`.

## Form validation (NewRequestModal)

Before advancing from step 1 (Details) to step 2 (Review):
- Start date required; cannot be in the past (`min={TODAY}` on the picker)
- End date required; `min` is set to start date so it can never precede it
- Reason required (backend also enforces this)
- Requested weekday count must not exceed `pto_remaining` (balance fetched on modal open)
