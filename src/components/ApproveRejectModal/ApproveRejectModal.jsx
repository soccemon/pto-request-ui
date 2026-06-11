/**
 * ApproveRejectModal.jsx
 *
 * Compact confirmation modal used by the Manager Dashboard when acting on a
 * pending PTO request. It handles both Approve and Reject actions — the `action`
 * prop switches the UI copy, button colour, and comment requirement.
 *
 * Approve: comment is optional. The manager can silently approve or leave a note.
 * Reject:  comment is required. The employee must always receive a reason.
 *
 * After a successful PATCH, the modal calls onDone() which tells the parent to
 * close the modal and reload the requests table.
 *
 * Props:
 *   request  {object}   - The PTO request being acted on
 *   action   {string}   - 'approve' or 'reject'
 *   users    {array}    - Full user list, used to resolve the employee's name
 *   onClose  {function} - Close without taking action
 *   onDone   {function} - Called after a successful approve or reject
 */
import { useState } from 'react'
import { api } from '../../services/api'
import styles from './ApproveRejectModal.module.css'

export default function ApproveRejectModal({ request, action, users, onClose, onDone }) {
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /** True when this modal is in reject mode — affects copy, styling, and validation. */
  const isReject = action === 'reject'

  /** Resolve the employee's display name from the users list. */
  const emp = users?.find(u => String(u.id) === String(request.user_id))

  /**
   * Send the approve or reject PATCH request to the backend.
   * Guards against submitting a rejection without a comment (the backend also
   * enforces this, but we prevent the call entirely on the client side).
   *
   * On success, calls onDone() which closes the modal and triggers a data reload.
   * On failure, shows the server's error message inside the modal.
   */
  async function handleSubmit() {
    // Reject requires a non-empty comment — bail early if missing.
    if (isReject && !comment.trim()) return

    setLoading(true)
    setError(null)
    try {
      if (isReject) {
        await api.rejectRequest(request.id, comment)
      } else {
        await api.approveRequest(request.id, comment)
      }
      onDone()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    // Clicking the backdrop (overlay) closes the modal without taking action.
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* Modal header: title changes based on action */}
        <div className={styles.head}>
          <span className={styles.title}>
            {isReject ? 'Reject Request' : 'Approve Request'}
          </span>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <div className={styles.body}>
          {/* Compact summary of the request so the manager can confirm they're acting on the right one */}
          <div className={styles.info}>
            <strong>{emp?.name || `User #${request.user_id}`}</strong>
            {' — '}{request.type}
            {' · '}{request.start_date} → {request.end_date}
            {request.num_days ? ` (${request.num_days} days)` : ''}
          </div>

          {/* API error displayed inline so the manager doesn't lose their comment text */}
          {error && <div className="error-banner">{error}</div>}

          <label className={styles.label}>
            Comment {isReject && <span className={styles.required}>* required</span>}
          </label>
          <textarea
            rows={3}
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={isReject ? 'Provide a reason for rejection...' : 'Optional comment...'}
          />
        </div>

        <div className={styles.footer}>
          <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
          <button
            className={isReject ? styles.btnReject : styles.btnApprove}
            onClick={handleSubmit}
            // Disable while loading, or if rejecting without a comment.
            disabled={loading || (isReject && !comment.trim())}
          >
            {loading && <span className="spinner-inline" />}
            {isReject ? 'Reject' : 'Approve'}
          </button>
        </div>
      </div>
    </div>
  )
}
