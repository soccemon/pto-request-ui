/**
 * Navbar.jsx
 *
 * Persistent top navigation bar rendered on every authenticated page.
 *
 * Displays:
 *   - App name / logo on the left
 *   - Logged-in user's name and role on the right
 *   - Dark-mode toggle button (sun/moon icon)
 *   - Logout button
 *
 * Props:
 *   user         {object} - The currently logged-in user ({ name, role, … })
 *   darkMode     {boolean} - Whether dark mode is currently active
 *   onToggleDark {function} - Callback to flip the dark mode state in App
 *   onLogout     {function} - Callback that clears user state in App
 *
 * The Navbar does not manage its own auth state — it delegates both logout
 * and dark-mode concerns upward to App so state stays in one place.
 */
import { useNavigate } from 'react-router-dom'
import styles from './Navbar.module.css'

export default function Navbar({ user, darkMode, onToggleDark, onLogout }) {
  const navigate = useNavigate()

  /**
   * Clears the authenticated session and redirects to the login page.
   * Calls the onLogout prop (which removes user from localStorage and React
   * state in App), then navigates to / so the login page is shown.
   */
  function handleLogout() {
    onLogout()
    navigate('/')
  }

  return (
    <nav className={styles.nav}>
      {/* Brand name — acts as a visual anchor, not a navigation link */}
      <span className={styles.logo}>TimeOff</span>

      {/* Show who is logged in and their role (employee / manager) */}
      <div className={styles.userInfo}>
        <span className={styles.userName}>{user.name}</span>
        <span className={styles.userRole}>{user.role}</span>
      </div>

      {/* Toggle between light and dark themes — state lives in App */}
      <button className={styles.iconBtn} onClick={onToggleDark} title="Toggle dark mode">
        {darkMode ? '☀️' : '🌙'}
      </button>

      {/* Logout — clears session and redirects to / */}
      <button className={styles.logoutBtn} onClick={handleLogout}>
        Logout
      </button>
    </nav>
  )
}
