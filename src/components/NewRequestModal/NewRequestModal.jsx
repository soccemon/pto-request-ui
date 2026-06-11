/**
 * NewRequestModal.jsx
 *
 * Three-step modal form for submitting a new PTO request.
 *
 * Step 1 — Details: leave type selector, date range picker, reason textarea.
 *           Full client-side validation runs before the user can advance:
 *             • Start date must be today or later (HTML min attr + JS check).
 *             • End date must be on or after start date.
 *             • Reason is required (backend schema enforces this too).
 *             • Requested weekday count must not exceed the employee's remaining balance.
 *
 * Step 2 — Review: read-only summary of what the user entered.
 *
 * Step 3 — Confirmation: shown after a successful POST /requests.
 *
 * Props:
 *   userId      {number}   - ID of the employee submitting the request
 *   onClose     {function} - Dismiss the modal (cancel or post-confirmation close)
 *   onSubmitted {function} - Called after a successful submission so the parent
 *                            can refresh the requests table and balance card
 */
import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import styles from './NewRequestModal.module.css'

const STEPS = ['Details', 'Review', 'Done']
const LEAVE_TYPES = ['Vacation', 'Sick', 'Personal']

/** Today's date as YYYY-MM-DD — used as the `min` value on the start date picker. */
const TODAY = new Date().toISOString().split('T')[0]

/**
 * Count working weekdays (Mon–Fri) between two date strings, inclusive.
 * The backend does the same calculation for num_days; this mirrors it
 * so the UI can show an accurate count before submission and validate
 * against the employee's remaining balance.
 *
 * @param {string} start - YYYY-MM-DD
 * @param {string} end   - YYYY-MM-DD
 * @returns {number} Number of weekdays in the range
 */
function countWeekdays(start, end) {
  if (!start || !end) return 0
  let count = 0
  const cur = new Date(start)
  const last = new Date(end)
  while (cur <= last) {
    const day = cur.getDay()
    if (day !== 0 && day !== 6) count++ // 0 = Sunday, 6 = Saturday
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

export default function NewRequestModal({ userId, onClose, onSubmitted }) {
  const [step, setStep] = useState(0)

  /** Form field values for the Details step. */
  const [form, setForm] = useState({ type: 'Vacation', start_date: '', end_date: '', reason: '' })

  /** Per-field validation error messages, keyed by field name. */
  const [errors, setErrors] = useState({})

  /**
   * The employee's current PTO balance, fetched on mount.
   * Used in validate() to catch over-limit requests before submission.
   */
  const [balance, setBalance] = useState(null)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  /** Fetch balance once when the modal opens so we can validate day counts. */
  useEffect(() => {
    api.getBalance(userId).then(setBalance).catch(() => null)
  }, [userId])

  /**
   * Update a single form field and clear its validation error.
   * Special case: if the start date changes and the current end date would
   * become invalid (earlier than the new start), clear end_date so the user
   * must pick a new one.
   *
   * @param {string} field - Key in the form state object
   * @param {string} val   - New value for that field
   */
  function update(field, val) {
    setForm(f => {
      const next = { ...f, [field]: val }
      if (field === 'start_date' && next.end_date && next.end_date < val) {
        next.end_date = ''
      }
      return next
    })
    // Clear the error for this field as soon as the user starts correcting it.
    setErrors(e => ({ ...e, [field]: undefined }))
  }

  /**
   * Run all validation rules against the current form state.
   * Returns an object whose keys are field names and values are error strings.
   * An empty object means the form is valid.
   *
   * Rules:
   *   start_date — required; must not be in the past
   *   end_date   — required; must be >= start_date
   *   reason     — required (non-empty after trimming whitespace)
   *   days       — computed weekday count must not exceed pto_remaining
   */
  function validate() {
    const errs = {}

    if (!form.start_date) {
      errs.start_date = 'Start date is required.'
    } else if (form.start_date < TODAY) {
      errs.start_date = 'Start date cannot be in the past.'
    }

    if (!form.end_date) {
      errs.end_date = 'End date is required.'
    } else if (form.end_date < form.start_date) {
      errs.end_date = 'End date must be on or after start date.'
    }

    if (!form.reason.trim()) {
      errs.reason = 'Reason is required.'
    }

    // Only check balance if both dates are valid — no point running this if
    // the dates themselves already have errors.
    if (!errs.start_date && !errs.end_date && balance != null) {
      const days = countWeekdays(form.start_date, form.end_date)
      if (days > balance.pto_remaining) {
        errs.days = `You only have ${balance.pto_remaining} day${balance.pto_remaining === 1 ? '' : 's'} remaining — this request needs ${days}.`
      }
    }

    return errs
  }

  /**
   * Triggered by the "Review →" button on step 1.
   * Runs validation; if there are errors, display them and stay on step 1.
   * If the form is valid, advance to the review step.
   */
  function handleNext() {
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    setErrors({})
    setStep(1)
  }

  /**
   * Triggered by "Submit Request" on step 2 (the review screen).
   * POSTs to /requests. On success, notifies the parent to refresh its data
   * and advances to the confirmation step. On failure, shows an error banner.
   */
  async function handleSubmit() {
    setSubmitting(true)
    setSubmitError(null)
    try {
      await api.createRequest({ ...form, user_id: userId })
      setStep(2)
      onSubmitted() // tell the parent to refresh balance + requests table
    } catch (e) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  /** Live weekday count shown as a hint beneath the date pickers. */
  const requestedDays = countWeekdays(form.start_date, form.end_date)

  return (
    // Clicking the semi-transparent overlay closes the modal (steps 1 & 2 only).
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && step < 2 && onClose()}>
      <div className={styles.modal}>

        {/* Modal header: title + close button */}
        <div className={styles.modalHead}>
          <span className={styles.modalTitle}>
            {step === 2 ? 'Request Submitted' : 'New PTO Request'}
          </span>
          {step < 2 && (
            <button className={styles.closeBtn} onClick={onClose}>&times;</button>
          )}
        </div>

        {/* Step indicator bar — highlights the current step, shows a checkmark for completed steps */}
        <div className={styles.steps}>
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`${styles.step} ${i === step ? styles.active : ''} ${i < step ? styles.done : ''}`}
            >
              {i < step ? '✓ ' : ''}{s}
            </div>
          ))}
        </div>

        <div className={styles.body}>

          {/* ── Step 1: Details form ── */}
          {step === 0 && (
            <>
              {/* Leave type dropdown */}
              <div className={styles.field}>
                <label className={styles.label}>Leave Type</label>
                <select value={form.type} onChange={e => update('type', e.target.value)}>
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>

              {/* Date range — start and end pickers side by side */}
              <div className={`${styles.field} ${styles.dateRow}`}>
                <div>
                  <label className={styles.label}>Start Date</label>
                  {/* min={TODAY} prevents selecting past dates at the browser level */}
                  <input
                    type="date"
                    value={form.start_date}
                    min={TODAY}
                    className={errors.start_date ? styles.inputError : ''}
                    onChange={e => update('start_date', e.target.value)}
                  />
                  {errors.start_date && <span className={styles.fieldError}>{errors.start_date}</span>}
                </div>
                <div>
                  <label className={styles.label}>End Date</label>
                  {/* min is set to start_date so end can never precede start */}
                  <input
                    type="date"
                    value={form.end_date}
                    min={form.start_date || TODAY}
                    className={errors.end_date ? styles.inputError : ''}
                    onChange={e => update('end_date', e.target.value)}
                  />
                  {errors.end_date && <span className={styles.fieldError}>{errors.end_date}</span>}
                </div>
              </div>

              {/* Over-balance error appears here (spans both date columns) */}
              {errors.days && <div className="error-banner">{errors.days}</div>}

              {/* Live day count hint — only shown when both dates are valid */}
              {form.start_date && form.end_date && !errors.start_date && !errors.end_date && (
                <div className={styles.dayCount}>
                  {requestedDays} weekday{requestedDays !== 1 ? 's' : ''} selected
                  {balance != null && (
                    <span className={styles.balanceHint}> · {balance.pto_remaining} remaining</span>
                  )}
                </div>
              )}

              {/* Reason textarea — required by the backend */}
              <div className={styles.field}>
                <label className={styles.label}>
                  Reason <span className={styles.required}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the reason for your leave"
                  value={form.reason}
                  className={errors.reason ? styles.inputError : ''}
                  onChange={e => update('reason', e.target.value)}
                />
                {errors.reason && <span className={styles.fieldError}>{errors.reason}</span>}
              </div>
            </>
          )}

          {/* ── Step 2: Review summary ── */}
          {step === 1 && (
            <>
              {/* Error from the POST request (e.g. server rejected the payload) */}
              {submitError && <div className="error-banner">{submitError}</div>}
              <div className={styles.reviewBox}>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewKey}>Leave Type</span>
                  <span className={styles.reviewVal}>{form.type}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewKey}>Start Date</span>
                  <span className={styles.reviewVal}>{form.start_date}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewKey}>End Date</span>
                  <span className={styles.reviewVal}>{form.end_date}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewKey}>Weekdays</span>
                  <span className={styles.reviewVal}>{requestedDays}</span>
                </div>
                <div className={styles.reviewRow}>
                  <span className={styles.reviewKey}>Reason</span>
                  <span className={styles.reviewVal}>{form.reason}</span>
                </div>
              </div>
            </>
          )}

          {/* ── Step 3: Confirmation ── */}
          {step === 2 && (
            <>
              <div className={styles.confirmIcon}>🎉</div>
              <div className={styles.confirmText}>Your request has been submitted!</div>
              <div className={styles.confirmSub}>Your manager will review it shortly.</div>
            </>
          )}
        </div>

        {/* Modal footer: context-sensitive action buttons for each step */}
        <div className={styles.footer}>
          {step === 0 && (
            <>
              <button className={styles.btnSecondary} onClick={onClose}>Cancel</button>
              {/* handleNext validates before advancing — button is always enabled so errors are visible */}
              <button className={styles.btnPrimary} onClick={handleNext}>
                Review →
              </button>
            </>
          )}
          {step === 1 && (
            <>
              <button className={styles.btnSecondary} onClick={() => setStep(0)}>Back</button>
              <button className={styles.btnPrimary} onClick={handleSubmit} disabled={submitting}>
                {submitting && <span className="spinner-inline" />}
                Submit Request
              </button>
            </>
          )}
          {step === 2 && (
            <button className={styles.btnPrimary} onClick={onClose}>Close</button>
          )}
        </div>
      </div>
    </div>
  )
}
