/**
 * Login.jsx — Login page (route: /)
 *
 * This is the entry point for unauthenticated users. Because this is a demo
 * app (no passwords), login works by:
 *   1. Fetching all users from the backend on page load.
 *   2. Letting the user pick their name from a dropdown.
 *   3. Showing their role (employee / manager) as a pill below the selector.
 *   4. POSTing the selected user's email to /auth/login.
 *   5. Passing the returned user object up to App via onLogin(), which stores
 *      it in React state and localStorage.
 *
 * After a successful login, App redirects to /dashboard automatically because
 * the route for / checks whether a user is already authenticated.
 *
 * Props:
 *   onLogin {function} - Callback that receives the authenticated user object
 *                        and updates App state + localStorage.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../services/api'
import styles from './Login.module.css'

export default function Login({ onLogin }) {
  const navigate = useNavigate()

  /** Full list of users fetched from the backend, shown in the dropdown. */
  const [users, setUsers] = useState([])

  /** The user ID currently selected in the dropdown (stored as a string for select value matching). */
  const [selectedId, setSelectedId] = useState('')

  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loggingIn, setLoggingIn] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Fetch all users when the page first mounts.
   * Automatically pre-selects the first user so the dropdown is never empty.
   * This runs once (empty dependency array).
   */
  useEffect(() => {
    api.getUsers()
      .then(data => {
        setUsers(data)
        if (data.length) setSelectedId(String(data[0].id))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoadingUsers(false))
  }, [])

  /**
   * Derive the full user object for the currently selected dropdown value.
   * Used to display the role pill and to get the email for the login call.
   */
  const selectedUser = users.find(u => String(u.id) === selectedId)

  /**
   * Triggered by the Sign In button.
   * Calls POST /auth/login with the selected user's email.
   * On success, delegates to onLogin() (defined in App) which persists the
   * user and updates React state — App then re-renders and redirects to /dashboard.
   */
  async function handleLogin() {
    if (!selectedUser) return
    setLoggingIn(true)
    setError(null)
    try {
      const user = await api.login(selectedUser.email)
      onLogin(user)       // update App state → triggers redirect
      navigate('/dashboard')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoggingIn(false)
    }
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        {/* Brand icon */}
        <div className={styles.logoIcon}>🌿</div>
        <h1 className={styles.heading}>PTO Request System</h1>
        <p className={styles.sub}>Sign in to manage your time off</p>

        {/* Top-level fetch error (e.g. backend not running) */}
        {error && <div className="error-banner">{error}</div>}

        <div className={styles.fieldGroup}>
          <label className={styles.label}>Select User</label>

          {/* Show a spinner while the user list is loading */}
          {loadingUsers ? (
            <span className="spinner" style={{ margin: '12px auto' }} />
          ) : (
            <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          )}

          {/* Role pill — updates instantly as the user changes the dropdown */}
          {selectedUser && (
            <div className={styles.rolePill}>
              {selectedUser.role === 'manager' ? '👔' : '👤'} {selectedUser.role}
            </div>
          )}
        </div>

        <button
          className={styles.loginBtn}
          onClick={handleLogin}
          disabled={loggingIn || !selectedUser}
        >
          {loggingIn && <span className="spinner-inline" />}
          Sign In
        </button>
      </div>
    </div>
  )
}
