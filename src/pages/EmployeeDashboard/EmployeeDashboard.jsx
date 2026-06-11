/**
 * EmployeeDashboard.jsx — Employee dashboard page (route: /dashboard, role: employee)
 *
 * The main workspace for employees. Shows:
 *   1. A personalised greeting with the employee's first name.
 *   2. BalanceCard — total / used / remaining PTO days with a visual bar.
 *   3. RequestsTable — all of this employee's past and present requests.
 *   4. A "New Request" button that opens the multi-step NewRequestModal.
 *
 * Data flow:
 *   - Requests are fetched from GET /requests/user/:id on mount and whenever
 *     `refreshKey` changes.
 *   - After the modal submits a new request, it calls onSubmitted() which
 *     increments refreshKey. This causes both the requests fetch (via the
 *     useEffect dependency) and the BalanceCard (which also receives refreshKey)
 *     to reload, keeping all displayed data consistent.
 *
 * The user object is read from localStorage (written there by App on login).
 * App guarantees this page is only rendered when a valid user is present.
 */
import { useEffect, useState } from 'react'
import BalanceCard from '../../components/BalanceCard/BalanceCard'
import RequestsTable from '../../components/RequestsTable/RequestsTable'
import NewRequestModal from '../../components/NewRequestModal/NewRequestModal'
import { api } from '../../services/api'
import styles from './EmployeeDashboard.module.css'

export default function EmployeeDashboard() {
  /** Read the authenticated user from localStorage (set by App after login). */
  const user = JSON.parse(localStorage.getItem('user'))

  const [requests, setRequests] = useState([])
  const [loadingRequests, setLoadingRequests] = useState(true)

  /** Controls whether the NewRequestModal is visible. */
  const [showModal, setShowModal] = useState(false)

  /**
   * Incrementing this value triggers a re-fetch of requests and balance data.
   * It's passed as a prop to BalanceCard (so it also re-fetches) and used as a
   * dependency in the useEffect below.
   */
  const [refreshKey, setRefreshKey] = useState(0)

  const [error, setError] = useState(null)

  /**
   * Fetch this employee's PTO requests whenever the component mounts or
   * after a new request is submitted (refreshKey change).
   */
  useEffect(() => {
    setLoadingRequests(true)
    api.getRequestsByUser(user.id)
      .then(setRequests)
      .catch(e => setError(e.message))
      .finally(() => setLoadingRequests(false))
  }, [refreshKey])

  /**
   * Called by NewRequestModal after a successful POST /requests.
   * Bumping refreshKey causes the useEffect above and the BalanceCard's
   * useEffect to re-run, refreshing both displays simultaneously.
   */
  function handleSubmitted() {
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="page">
      {/* Page header: greeting and new request button */}
      <div className={styles.header}>
        <div>
          {/* Use only the first name for a friendly, less formal greeting */}
          <div className={styles.title}>Welcome back, {user.name.split(' ')[0]}</div>
          <div className={styles.subtitle}>Manage and track your time off requests</div>
        </div>
        <button className={styles.newBtn} onClick={() => setShowModal(true)}>
          + New Request
        </button>
      </div>

      {/* Top-level fetch error for the requests table */}
      {error && <div className="error-banner">{error}</div>}

      {/* PTO balance summary — refreshes whenever refreshKey changes */}
      <BalanceCard userId={user.id} refreshKey={refreshKey} />

      {/* Requests table — employee view (no manager filters or action buttons) */}
      <RequestsTable
        requests={requests}
        loading={loadingRequests}
        isManagerView={false}
      />

      {/* New request modal — only mounted when the button has been clicked */}
      {showModal && (
        <NewRequestModal
          userId={user.id}
          onClose={() => setShowModal(false)}
          onSubmitted={handleSubmitted}
        />
      )}
    </div>
  )
}
