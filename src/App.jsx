import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login/Login'
import EmployeeDashboard from './pages/EmployeeDashboard/EmployeeDashboard'
import ManagerDashboard from './pages/ManagerDashboard/ManagerDashboard'
import Navbar from './components/Navbar/Navbar'

const PING_INTERVAL_MS = 4000
const PING_TIMEOUT_MS = 8000

async function pingBackend() {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PING_TIMEOUT_MS)
  try {
    const res = await fetch('/users', { signal: controller.signal })
    return res.ok
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

function ServerLoadingScreen() {
  return (
    <div className="server-loading">
      <div className="server-loading__logo">🌿 PTO Request System</div>
      <div className="server-loading__spinner" />
      <p className="server-loading__message">
        Waking up the server, this may take up to a minute on first load…
      </p>
    </div>
  )
}

function ProtectedRoute({ user, children }) {
  if (!user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [serverReady, setServerReady] = useState(false)
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || 'null'))
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('darkMode', darkMode)
  }, [darkMode])

  // Poll the backend until it responds, then show the app.
  useEffect(() => {
    let cancelled = false

    async function poll() {
      while (!cancelled) {
        const ok = await pingBackend()
        if (ok) {
          if (!cancelled) setServerReady(true)
          return
        }
        await new Promise(r => setTimeout(r, PING_INTERVAL_MS))
      }
    }

    poll()
    return () => { cancelled = true }
  }, [])

  if (!serverReady) return <ServerLoadingScreen />

  function handleLogin(u) {
    localStorage.setItem('user', JSON.stringify(u))
    setUser(u)
  }

  function handleLogout() {
    localStorage.removeItem('user')
    setUser(null)
  }

  return (
    <>
      {user && (
        <Navbar
          user={user}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
          onLogout={handleLogout}
        />
      )}

      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />}
        />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
