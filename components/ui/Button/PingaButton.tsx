/**
 * PingaButton
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable button with two variants. Always renders as a <button> element.
 * For navigation use plain Next.js <Link> elements — PingaButton is for
 * actions only (form submits, click handlers).
 *
 * VARIANTS
 *   ghost  — no fill, no border. Text colour transitions muted → white on hover.
 *            Underline draws left-to-right beneath the text.
 *            Use for: secondary actions where a true button is required.
 *
 *   sweep  — bordered box. White fill sweeps in from left on hover; text inverts
 *            to near-black as the fill arrives.
 *            Use for: primary submit actions (EnquiryForm "Send enquiry").
 *
 * NO TRIANGLE
 *   The decorative triangle in EnquiryForm's submit button is hand-coded in
 *   that component. It is not a feature of PingaButton and must not be added.
 *
 * CURRENT USAGE
 *   EnquiryForm.tsx — variant="sweep" type="submit"
 *
 * See PingaButton.module.css for animation details and colour values.
 */

import styles from './PingaButton.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PingaButtonProps {
  variant:   'ghost' | 'sweep'
  children:  React.ReactNode
  type?:     'button' | 'submit' | 'reset'
  disabled?: boolean
  onClick?:  React.MouseEventHandler<HTMLButtonElement>
  className?: string
  'aria-label'?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PingaButton({
  variant,
  children,
  type = 'button',
  disabled,
  onClick,
  className,
  'aria-label': ariaLabel,
}: PingaButtonProps) {
  const cls = [styles.root, styles[variant], className].filter(Boolean).join(' ')

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cls}
      aria-label={ariaLabel}
    >
      {variant === 'sweep' ? (
        <span className={styles.sweepText}>{children}</span>
      ) : (
        children
      )}
    </button>
  )
}
