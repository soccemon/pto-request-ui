/**
 * BalanceCard.jsx
 *
 * Displays a summary of an employee's PTO balance for the current year:
 *   - Total days allocated
 *   - Days already used (approved requests)
 *   - Days remaining
 *   - A visual progress bar showing used / total as a percentage
 *
 * The component fetches its own data so the parent (EmployeeDashboard) doesn't
 * need to know anything about the balance API shape.
 *
 * Props:
 *   userId     {number}  - The employee whose balance to fetch
 *   refreshKey {number}  - Incrementing this value re-triggers the useEffect,
 *                          allowing the parent to force a refresh after a new
 *                          PTO request is submitted.
 */
import { useEffect, useState } from 'react'
import { api } from '../../services/api'
import styles from './BalanceCard.module.css'

export default function BalanceCard({ userId, refreshKey }) {
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Fetch the balance whenever userId or refreshKey changes.
   * refreshKey is bumped by the parent after a successful request submission
   * so the card automatically reflects the updated totals.
   */
  useEffect(() => {
    setLoading(true)
    api.getBalance(userId)
      .then(setBalance)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [userId, refreshKey])

  // Show a spinner inside the card outline while waiting for the API.
  if (loading) return <div className={styles.card}><span className="spinner" /></div>

  // Show a non-destructive error inside the card if the fetch failed.
  if (error) return <div className={styles.card}><div className="error-banner">{error}</div></div>

  if (!balance) return null

  /**
   * Calculate what percentage of the annual allocation has been used.
   * Guard against division by zero when pto_balance is 0.
   */
  const pct = balance.pto_balance > 0
    ? Math.round((balance.pto_used / balance.pto_balance) * 100)
    : 0

  return (
    <div className={styles.card}>
      <div className={styles.title}>PTO Balance</div>

      {/* Three stat counters: total, used, remaining */}
      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>{balance.pto_balance}</span>
          <span className={styles.statLabel}>Total Days</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${styles.yellow}`}>{balance.pto_used}</span>
          <span className={styles.statLabel}>Used</span>
        </div>
        <div className={styles.divider} />
        <div className={styles.stat}>
          <span className={`${styles.statValue} ${styles.green}`}>{balance.pto_remaining}</span>
          <span className={styles.statLabel}>Remaining</span>
        </div>
      </div>

      {/* Progress bar: green fill width is driven by the calculated percentage */}
      <div className={styles.barWrap}>
        <div className={styles.bar} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.barLabel}>{pct}% of annual balance used</div>
    </div>
  )
}
