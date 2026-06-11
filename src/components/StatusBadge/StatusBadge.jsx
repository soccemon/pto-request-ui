/**
 * StatusBadge.jsx
 *
 * Renders a small coloured pill that communicates the status of a PTO request
 * at a glance. The colour mapping is:
 *   Pending  → yellow
 *   Approved → green
 *   Rejected → red
 *
 * Colours are defined as CSS custom properties in index.css so they
 * automatically adapt to light / dark mode.
 *
 * Props:
 *   status {string} - One of 'Pending', 'Approved', or 'Rejected' (case-insensitive)
 */
import styles from './StatusBadge.module.css'

export default function StatusBadge({ status }) {
  /**
   * Map the status string to a CSS module class.
   * toLowerCase() makes the lookup case-insensitive — 'Pending' and 'pending'
   * both resolve to styles.pending.
   * Falls back to styles.pending if the status is unknown or undefined.
   */
  const cls = styles[status?.toLowerCase()] || styles.pending

  return <span className={`${styles.badge} ${cls}`}>{status}</span>
}
