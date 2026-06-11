/**
 * RequestsTable.jsx
 *
 * Shared table component used by both the Employee and Manager dashboards.
 * It adapts its columns, filters, and action buttons based on the `isManagerView` prop.
 *
 * Employee view  — columns: Type, Start, End, Days, Reason, Status, Manager Comment
 * Manager view   — adds: Employee name column, Status & Employee filter dropdowns,
 *                  and Approve / Reject action buttons on pending rows.
 *
 * Sorting: rows are always sorted newest-first by start date (via useMemo so
 * the sort only runs when `requests` changes, not on every render).
 *
 * Filtering (manager view only): applied on top of the sorted list using
 * another useMemo that re-runs when the sort output or either filter value changes.
 *
 * Props:
 *   requests      {array}    - Array of PTO request objects from the API
 *   loading       {boolean}  - Show a spinner instead of the table while fetching
 *   isManagerView {boolean}  - Switch between employee and manager column sets
 *   users         {array}    - Full user list, used to look up employee names by user_id
 *   onApprove     {function} - Called with the request object when Approve is clicked
 *   onReject      {function} - Called with the request object when Reject is clicked
 */
import { useMemo, useState } from 'react'
import StatusBadge from '../StatusBadge/StatusBadge'
import styles from './RequestsTable.module.css'

/**
 * Format an ISO date string (YYYY-MM-DD) into a readable label like "Jun 11, 2026".
 * Returns an em-dash if the value is falsy.
 *
 * @param {string|null} d - ISO date string
 * @returns {string} Formatted date or '—'
 */
function fmt(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function RequestsTable({
  requests,
  loading,
  isManagerView = false,
  users = [],
  onApprove,
  onReject,
}) {
  // Filter state — only relevant in manager view, ignored in employee view.
  const [statusFilter, setStatusFilter] = useState('All')
  const [employeeFilter, setEmployeeFilter] = useState('All')

  /**
   * Sort a copy of the requests array by start_date descending (most recent first).
   * useMemo avoids re-sorting on every render when only unrelated state changes.
   */
  const sorted = useMemo(() => {
    if (!requests) return []
    return [...requests].sort((a, b) => new Date(b.start_date) - new Date(a.start_date))
  }, [requests])

  /**
   * Apply the active status and employee filters to the sorted list.
   * Both filters are ANDed together — a row must pass both to be shown.
   * When a filter is 'All' it matches every row.
   */
  const filtered = useMemo(() => {
    return sorted.filter(r => {
      const matchStatus = statusFilter === 'All' || r.status?.toLowerCase() === statusFilter.toLowerCase()
      const matchEmp = employeeFilter === 'All' || String(r.user_id) === String(employeeFilter)
      return matchStatus && matchEmp
    })
  }, [sorted, statusFilter, employeeFilter])

  return (
    <div className={styles.wrap}>
      {/* Table header: title on the left, filter dropdowns on the right (manager only) */}
      <div className={styles.header}>
        <span className={styles.title}>
          {isManagerView ? 'All Requests' : 'My Requests'}
        </span>

        {isManagerView && (
          <div className={styles.filters}>
            {/* Filter by request status */}
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option>All</option>
              <option>Pending</option>
              <option>Approved</option>
              <option>Rejected</option>
            </select>

            {/* Filter by individual employee */}
            <select value={employeeFilter} onChange={e => setEmployeeFilter(e.target.value)}>
              <option value="All">All Employees</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className={styles.tableWrap}>
        {/* Show spinner while the parent page is still fetching data */}
        {loading ? (
          <span className="spinner" />
        ) : (
          <table>
            <thead>
              <tr>
                {/* Employee name column is only shown in the manager view */}
                {isManagerView && <th>Employee</th>}
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Manager Comment</th>
                {/* Actions column (Approve / Reject) is only shown in the manager view */}
                {isManagerView && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={isManagerView ? 9 : 7} className={styles.empty}>
                    No requests found.
                  </td>
                </tr>
              ) : (
                filtered.map(r => {
                  // Look up the employee's display name from the users list.
                  const emp = users.find(u => String(u.id) === String(r.user_id))

                  return (
                    <tr key={r.id}>
                      {isManagerView && <td>{emp?.name || r.user_id}</td>}
                      <td style={{ textTransform: 'capitalize' }}>{r.type}</td>
                      <td>{fmt(r.start_date)}</td>
                      <td>{fmt(r.end_date)}</td>
                      {/* num_days is calculated server-side (weekdays only) */}
                      <td>{r.num_days ?? '—'}</td>
                      {/* Long reasons are clipped with ellipsis; full text shown as tooltip */}
                      <td className={styles.comment} title={r.reason}>{r.reason || '—'}</td>
                      <td><StatusBadge status={r.status} /></td>
                      <td className={styles.comment} title={r.manager_comment}>
                        {r.manager_comment || '—'}
                      </td>

                      {/* Approve / Reject buttons are only shown for Pending requests in manager view */}
                      {isManagerView && (
                        <td>
                          {r.status?.toLowerCase() === 'pending' && (
                            <>
                              <button
                                className={`${styles.actionBtn} ${styles.approveBtn}`}
                                onClick={() => onApprove(r)}
                              >
                                Approve
                              </button>
                              <button
                                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                onClick={() => onReject(r)}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
