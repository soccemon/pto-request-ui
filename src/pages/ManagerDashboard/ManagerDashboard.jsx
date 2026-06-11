/**
 * ManagerDashboard.jsx — Manager dashboard page (route: /dashboard, role: manager)
 *
 * The main workspace for managers. Shows:
 *   1. A summary row with three stat cards: total Pending, Approved, and Rejected
 *      request counts (calculated client-side from the fetched data).
 *   2. RequestsTable in manager view — shows all employees' requests with
 *      Status and Employee filter dropdowns, plus Approve / Reject action buttons
 *      on pending rows.
 *   3. ApproveRejectModal — opens when the manager clicks Approve or Reject on a row.
 *
 * Data flow:
 *   - On mount, loadData() fetches all requests AND all users in parallel using
 *     Promise.all. Both are needed: requests for the table, users for the employee
 *     name lookup and the employee filter dropdown.
 *   - After the modal completes an action, loadData() is called again so the
 *     table and summary counts immediately reflect the updated status.
 *
 * Modal state:
 *   `modal` is either null (closed) or { request, action } (open).
 *   Using a single state object rather than separate booleans keeps the open/close
 *   logic simple and ensures the modal always has the right request in scope.
 */
import { useEffect, useState } from 'react'
import RequestsTable from '../../components/RequestsTable/RequestsTable'
import ApproveRejectModal from '../../components/ApproveRejectModal/ApproveRejectModal'
import { api } from '../../services/api'
import styles from './ManagerDashboard.module.css'

export default function ManagerDashboard() {
  /** Read the authenticated manager from localStorage (set by App after login). */
  const user = JSON.parse(localStorage.getItem('user'))

  const [requests, setRequests] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Controls the ApproveRejectModal.
   * null  → modal is closed
   * { request: object, action: 'approve'|'reject' } → modal is open
   */
  const [modal, setModal] = useState(null)

  /**
   * Fetch all requests and all users simultaneously.
   * Promise.all means both fetches run in parallel, halving the wait time
   * compared to fetching them sequentially.
   * Called on mount and after every approve/reject action.
   */
  function loadData() {
    setLoading(true)
    Promise.all([api.getRequests(), api.getUsers()])
      .then(([reqs, usrs]) => { setRequests(reqs); setUsers(usrs) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  /** Load data once when the dashboard first mounts. */
  useEffect(() => { loadData() }, [])

  /**
   * Summary counts derived from the fetched requests array.
   * Computed on every render (fast — just three array.filter calls).
   * Displayed as the three stat cards at the top of the page.
   */
  const counts = {
    pending:  requests.filter(r => r.status?.toLowerCase() === 'pending').length,
    approved: requests.filter(r => r.status?.toLowerCase() === 'approved').length,
    rejected: requests.filter(r => r.status?.toLowerCase() === 'rejected').length,
  }

  /**
   * Called by ApproveRejectModal after a successful approve or reject.
   * Closes the modal and reloads all data so the table and counts update.
   */
  function handleDone() {
    setModal(null)
    loadData()
  }

  return (
    <div className="page">
      <div className={styles.header}>
        <div className={styles.title}>Manager Dashboard</div>
        <div className={styles.subtitle}>Review and manage employee time-off requests</div>
      </div>

      {/* Top-level fetch error */}
      {error && <div className="error-banner">{error}</div>}

      {/* Summary stat cards — counts are recalculated from the full (unfiltered) dataset */}
      <div className={styles.summaryRow}>
        <div className={`${styles.summaryCard} ${styles.pending}`}>
          <div className={styles.summaryVal}>{counts.pending}</div>
          <div className={styles.summaryLabel}>Pending</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.approved}`}>
          <div className={styles.summaryVal}>{counts.approved}</div>
          <div className={styles.summaryLabel}>Approved</div>
        </div>
        <div className={`${styles.summaryCard} ${styles.rejected}`}>
          <div className={styles.summaryVal}>{counts.rejected}</div>
          <div className={styles.summaryLabel}>Rejected</div>
        </div>
      </div>

      {/* Full requests table with manager-specific columns and action buttons */}
      <RequestsTable
        requests={requests}
        loading={loading}
        isManagerView={true}
        users={users}
        onApprove={r => setModal({ request: r, action: 'approve' })}
        onReject={r => setModal({ request: r, action: 'reject' })}
      />

      {/* Modal is conditionally rendered — only mounted when an action button is clicked */}
      {modal && (
        <ApproveRejectModal
          request={modal.request}
          action={modal.action}
          users={users}
          onClose={() => setModal(null)}
          onDone={handleDone}
        />
      )}
    </div>
  )
}
