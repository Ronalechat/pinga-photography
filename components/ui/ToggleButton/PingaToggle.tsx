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
 * VARIANTS
 *   default — standard resting-state opacity (more subtle).
 *   primary — higher contrast borders and text at rest. The canonical style
 *     used in both KineticGrid and EnquiryForm.
 *
 * LAYOUT / SIZE
 *   wrap    — inline wrapping chips for filters and multi-select fields.
 *   stacked — equal-width stacked rows for product options with longer labels.
 *   compact — denser row height for product option selectors.
 *
 * CURRENT USAGE
 *   KineticGrid.tsx  — single select, category filter (variant="primary")
 *   EnquiryForm.tsx  — multi  select, occasion picker (variant="primary")
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
  variant?:     'default' | 'primary'
  layout?:      'wrap' | 'stacked'
  size?:        'default' | 'compact'
  className?:   string
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PingaToggle({
  options,
  selected,
  onChange,
  multiSelect = false,
  variant = 'default',
  layout = 'wrap',
  size = 'default',
  className,
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
    <div
      className={[
        styles.group,
        variant === 'primary' ? styles.primary : '',
        layout === 'stacked' ? styles.stacked : '',
        size === 'compact' ? styles.compact : '',
        className ?? '',
      ].filter(Boolean).join(' ')}
      role="group"
    >
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
