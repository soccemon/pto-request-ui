# TimeOff — PTO Request System Frontend

React + Vite frontend for a PTO (Paid Time Off) request management system. Employees can view their balance and submit leave requests; managers can approve or reject them.

## Prerequisites

- Node.js 18+
- The backend API running at `http://localhost:8000` (see `pto-request-api` in the parent directory)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Features

### Employee view
- PTO balance card — total / used / remaining days with a visual progress bar
- Request history table — all past and current requests sorted newest-first
- Multi-step new request form:
  - Step 1: Leave type, date range (past dates blocked), reason
  - Step 2: Review summary
  - Step 3: Submission confirmation
- Client-side validation before reaching the review step:
  - Dates must be today or later
  - Requested weekdays must not exceed remaining balance
  - Reason is required

### Manager view
- Summary row — live counts of Pending / Approved / Rejected requests
- Full request table for all employees with filter dropdowns (by status and by employee)
- Approve / Reject buttons on pending rows, each opening a confirmation modal
  - Approval: optional comment
  - Rejection: comment required

### General
- Light / dark mode toggle, persisted in `localStorage`
- Protected routes — unauthenticated visitors are redirected to login
- Loading spinners and user-friendly error messages on every API call
- Responsive layout

## Project structure

```
src/
  config.js                  # API base URL
  main.jsx                   # App entry point
  App.jsx                    # Route tree, auth state, dark mode
  index.css                  # CSS custom properties (light + dark themes)
  services/
    api.js                   # All HTTP calls in one place
  components/
    Navbar/                  # Top navigation bar
    BalanceCard/             # PTO balance summary
    RequestsTable/           # Shared request table (employee + manager)
    NewRequestModal/         # 3-step new request form
    ApproveRejectModal/      # Manager approve/reject modal
    StatusBadge/             # Coloured status pill
  pages/
    Login/                   # Login page
    EmployeeDashboard/       # Employee main view
    ManagerDashboard/        # Manager main view
```

## Tech stack

| Tool | Purpose |
|------|---------|
| React 18 | UI framework |
| React Router v6 | Client-side routing |
| Vite 5 | Dev server and bundler |
| CSS Modules | Scoped, co-located styles |

No external UI component libraries — all styles are custom CSS.

## Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server at localhost:5173 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build locally |

## How authentication works

This is a demo app — there are no passwords. Login works by selecting a user from a dropdown (populated from `GET /users`) and clicking Sign In, which calls `POST /auth/login` with the selected user's email. The returned user object is stored in `localStorage` and React state.

Roles are set in the backend database. Selecting an employee account shows the employee dashboard; selecting a manager account shows the manager dashboard.
