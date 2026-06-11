/**
 * App.jsx — Root component
 *
 * Responsibilities:
 *   1. Own the authenticated user in React state so any change (login / logout)
 *      instantly re-renders dependent UI (Navbar visibility, route guards).
 *   2. Own the dark-mode toggle and sync it to localStorage + the <html> element.
 *   3. Define the application's route tree and enforce role-based access.
 *
 * Why user lives here (not in a Context or Zustand store):
 *   The user object is only consumed by a small, shallow tree (Navbar, two
 *   dashboard pages). Lifting it to App is sufficient; a global store would
 *   be over-engineering for this size of app.
 */
import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import EmployeeDashboard from './pages/EmployeeDashboard/EmployeeDashboard'
import ManagerDashboard from './pages/ManagerDashboard/ManagerDashboard'
import Navbar from './components/Navbar/Navbar'

/**
 * ProtectedRoute
 *
 * Wrapper that guards any route requiring authentication.
 * If `user` is null (not logged in), it redirects to the login page.
 * Otherwise it renders its children unchanged.
 *
 * @param {object|null} user     - The currently logged-in user, or null
 * @param {ReactNode}   children - The page component to render if authenticated
 */
function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  /**
   * Initialise user from localStorage so a page refresh doesn't log the user out.
   * Using a lazy initialiser (() => ...) means localStorage is only read once on
   * mount rather than on every render.
   */
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))

  /** Persist dark-mode preference across sessions. */
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')

  /**
   * Keep the <html data-theme> attribute in sync with darkMode state.
   * CSS custom properties in index.css switch their values based on this
   * attribute, giving us a zero-JS theming system.
   */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  /**
   * Called by the Login page after a successful POST /auth/login.
   * Persists the user to localStorage (survives refresh) and sets React state
   * (triggers re-render so the Navbar appears and the route guard lifts).
   *
   * @param {object} u - Full user object returned by the backend
   */
  function handleLogin(u) {
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  /**
   * Called by the Navbar logout button.
   * Clears both localStorage and React state, which causes:
   *   - The Navbar to unmount (conditional on `user` being truthy)
   *   - ProtectedRoute to redirect to /
   */
  function handleLogout() {
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <>
      {/* Only render the Navbar when someone is logged in */}
      {user && (
        <Navbar
          user={user}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
          onLogout={handleLogout}
        />
      )}

      <Routes>
        {/* / — Login page. Redirect to dashboard if already authenticated. */}
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
        />

        {/*
          /dashboard — Role-based split:
            - Managers see the full team request table with approve/reject actions.
            - Employees see their own balance and requests with a new-request button.
          ProtectedRoute redirects unauthenticated visitors back to /.
        */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute user={user}>
              {user?.role === 'manager'
                ? <ManagerDashboard />
                : <EmployeeDashboard />
              }
            </ProtectedRoute>
          }
        />

        {/* Catch-all: any unknown URL goes back to the root. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
