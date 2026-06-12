# PTO Request System — React Frontend

React + Vite SPA for managing employee PTO requests. Two roles (employee / manager) with separate dashboards. The backend is a separate FastAPI repo (`pto-request-api`) that must be running.

## Development

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build → dist/
```

The backend (`pto-request-api`) must be running at `http://localhost:8000` before the frontend is usable.

## Proxy

`vite.config.js` proxies `/auth`, `/users`, and `/requests` to `http://localhost:8000`. `src/config.js` exports `API_URL = ''` so all fetch calls use the same origin. No CORS configuration is needed in development.

## Backend API

| Method | Path | Notes |
|--------|------|-------|
| POST | /auth/login | Body: `{ email }`. Returns full user object. |
| GET | /users | All users. |
| GET | /users/{id}/balance | Returns `{ pto_balance, pto_used, pto_remaining }`. |
| GET | /requests | Optional query params: `?status=`, `?user_id=`. |
| GET | /requests/user/{user_id} | All requests for one employee. |
| POST | /requests | Body: `{ user_id, type, start_date, end_date, reason }`. |
| PATCH | /requests/{id}/approve | Body: `{ manager_comment? }`. Comment optional. |
| PATCH | /requests/{id}/reject | Body: `{ manager_comment }`. Comment required. |

Schema gotchas:
- Leave type field is `type`, not `leave_type`.
- Do not send `days` or `num_days` on create — the server calculates weekdays.
- Approve/reject comment field is `manager_comment`, not `comment`.
- Response uses `num_days` for the weekday count.

## Source structure

```
src/
  config.js                        # API_URL constant (empty string = same origin)
  main.jsx                         # React entry point, BrowserRouter
  App.jsx                          # Auth state, dark mode, routing, server wakeup
  index.css                        # Global CSS custom properties (light/dark themes)
  services/
    api.js                         # All fetch calls — no component imports fetch directly
  components/
    Navbar/                        # Logo, user info, dark mode toggle, logout
    BalanceCard/                   # PTO balance summary with progress bar
    RequestsTable/                 # Shared table used in both employee and manager views
    NewRequestModal/               # 3-step PTO request form with client-side validation
    ApproveRejectModal/            # Manager approve/reject confirmation modal
    StatusBadge/                   # Coloured status pill (Pending / Approved / Rejected)
  pages/
    Login/                         # User dropdown + login form
    EmployeeDashboard/             # Balance card + request history + new-request button
    ManagerDashboard/              # Summary counts + full request table + action modals
```

## Authentication

Email-only (no password). Flow:
1. `GET /users` on login page load → populate dropdown.
2. User selects name → role shown as pill.
3. `POST /auth/login { email }` → backend returns full user object.
4. User stored in `localStorage.user` and lifted into React state in `App.jsx`.
5. Logout clears both.

Roles are stored in the user object. `App.jsx` routes to `EmployeeDashboard` or `ManagerDashboard` based on `user.role`.

## Server wakeup screen

On initial page load, `App.jsx` polls `GET /users` before rendering anything. While the backend is unreachable or returning non-2xx, a full-screen loading overlay is shown ("Waking up the server…"). Once the backend responds with 200, `serverReady` is set and the normal app tree mounts.

Retry logic: 8s abort timeout per attempt, 4s delay between retries. Checking `res.ok` (not just absence of a network error) is necessary because Vite's proxy returns HTTP 500 — not a fetch rejection — when the upstream target is down.

## Theming

Dark mode is toggled via the Navbar. Preference persists in `localStorage.darkMode`. The `data-theme` attribute on `<html>` switches between light and dark CSS custom property sets in `index.css`. No runtime style injection — all theme values are CSS variables.

## Responsive design

Mobile-friendly down to ~375px. Key breakpoints:

- **≤640px** — `RequestsTable` switches from a scrollable table to a stacked card layout. `::before` pseudo-elements (keyed off `data-label` on `<td>`) render column labels.
- **≤600px** — `.page` wrapper padding reduced.
- **≤500px** — Manager summary cards shrink so all three fit in one row.
- **≤480px** — Navbar compresses (role label hidden). `NewRequestModal` and `ApproveRejectModal` render as bottom sheets (`max-height: 92vh`, rounded top corners). Date fields and footer buttons stack to single column.

## Form validation (NewRequestModal)

Validated before advancing from step 1 (Details) to step 2 (Review):
- Start date required; cannot be in the past (`min={TODAY}` on the input).
- End date required; `min` is set to start date so it cannot precede it.
- Reason required (backend enforces this too).
- Requested weekday count must not exceed `pto_remaining` (balance fetched on modal open).
