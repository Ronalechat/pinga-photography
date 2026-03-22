/**
 * PingaToggle
 * ─────────────────────────────────────────────────────────────────────────────
 * Inline group of toggle buttons. One visual variant: state-driven sweep fill.
 * The sweep fires on selection change, not on hover.
 *
 * MODES
 *   multiSelect: false (default) — single select. One option active at a time.
 *     Clicking the active option does nothing (prevents unnecessary re-render).
 *     `selected` is a string; `onChange` is called with a string.
 *
 *   multiSelect: true — multi select. Multiple options active simultaneously.
 *     Clicking an active option deselects it.
 *     `selected` is a string[]; `onChange` is called with a string[].
 *
 * CURRENT USAGE
 *   KineticGrid.tsx  — single select, category filter (multiSelect: false)
 *   EnquiryForm.tsx  — multi  select, occasion picker (multiSelect: true)
 *
 * See PingaToggle.module.css for animation details and colour values.
 */

import styles from './PingaToggle.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PingaToggleProps {
  options:      string[]
  selected:     string | string[]
  onChange:     (value: string | string[]) => void
  multiSelect?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PingaToggle({
  options,
  selected,
  onChange,
  multiSelect = false,
}: PingaToggleProps) {
  function isSelected(option: string): boolean {
    return Array.isArray(selected)
      ? selected.includes(option)
      : selected === option
  }

  function handleClick(option: string) {
    if (multiSelect) {
      const current = Array.isArray(selected) ? selected : [selected]
      const next = current.includes(option)
        ? current.filter((s) => s !== option)   // deselect
        : [...current, option]                  // select
      onChange(next)
    } else {
      // Single select — clicking active option is a no-op
      if (option !== selected) onChange(option)
    }
  }

  return (
    <div className={styles.group} role="group">
      {options.map((option) => {
        const active = isSelected(option)
        return (
          <button
            key={option}
            type="button"
            onClick={() => handleClick(option)}
            className={[styles.option, active ? styles.selected : ''].filter(Boolean).join(' ')}
            aria-pressed={active}
          >
            <span className={styles.label}>{option}</span>
          </button>
        )
      })}
    </div>
  )
}
