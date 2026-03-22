/**
 * tokens.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all design tokens.
 *
 * EDITING COLOURS
 * Only edit values here. Both the React components (which import this file
 * directly) and the plain HTML files (which use tokens.css) should stay
 * in sync. If you update a value here, mirror it in tokens.css.
 *
 * ADDING NEW TOKENS
 * 1. Add the value here with a clear name and comment
 * 2. Add the matching CSS variable to tokens.css
 * 3. Never hardcode hex values in components — always reference a token
 */

// ─── Palette (raw values — prefer semantic tokens in components) ──────────────

export const PALETTE = {
  /** Near-black with a cool navy undertone — the darkest value */
  inkBlack:      '#16161D',
  /** Deep blue-purple — elevated surfaces, nav, cards */
  indigoDark:    '#3A3A6E',
  /** Mid blue-purple — interactive accent, CTAs, active states */
  indigoMid:     '#3C3C91',
  /** Silver-grey with a cool blue undertone — borders, muted labels */
  coolGrey:      '#B3B3BA',
  /** Near-white with a slight lavender cast — light backgrounds, primary text on dark */
  lavenderWhite: '#F2F2FC',
} as const

// ─── Semantic tokens — USE THESE in components ────────────────────────────────

export const COLOR = {

  // ── Backgrounds ────────────────────────────────────────────────────────────
  /** Primary page background — hero, gallery, form sections */
  bgPrimary:    PALETTE.inkBlack,
  /** Elevated surface — nav, modals, cards on dark bg */
  bgSurface:    PALETTE.indigoDark,
  /** Light section background — about page, contact page */
  bgLight:      PALETTE.lavenderWhite,
  /** Subtle input/field background */
  bgInput:      'rgba(242,242,252,0.05)',
  /** Input background on focus */
  bgInputFocus: 'rgba(242,242,252,0.08)',

  // ── Interactive ─────────────────────────────────────────────────────────────
  /** Primary accent — progress bars, focus rings */
  accent:       PALETTE.indigoMid,
  /** Accent hover */
  accentHover:  PALETTE.indigoDark,

  // ── Text ───────────────────────────────────────────────────────────────────
  /** Primary text on dark backgrounds — ~14:1 contrast on bgPrimary */
  textPrimary:  PALETTE.lavenderWhite,
  /** Primary text on light backgrounds */
  textDark:     PALETTE.inkBlack,
  /** Secondary / muted text — 4.6:1 on dark, passes WCAG AA */
  textMuted:    PALETTE.coolGrey,

  // ── Borders & dividers ──────────────────────────────────────────────────────
  borderInput:   'rgba(179,179,186,0.35)',
  borderDivider: 'rgba(242,242,252,0.08)',
  borderHover:   PALETTE.lavenderWhite,
  borderNeutral: PALETTE.coolGrey,

  // ── States ──────────────────────────────────────────────────────────────────
  /** Selected fill — #F2F2FC on #16161D = ~14:1 contrast */
  selectedBg:   PALETTE.lavenderWhite,
  selectedText: PALETTE.inkBlack,
  error:        '#e05a5a',

  // ── Alpha text ──────────────────────────────────────────────────────────────
  /** Body copy — muted high */
  textMutedHigh: 'rgba(179,179,186,0.75)',
  /** Eyebrow, label, navLink — muted mid */
  textMutedMid:  'rgba(179,179,186,0.65)',
  /** Small / dim text — muted low */
  textMutedLow:  'rgba(179,179,186,0.45)',
  /** Ghost button resting, interactive resting */
  textGhost:     'rgba(242,242,252,0.60)',

  // ── Alpha borders ────────────────────────────────────────────────────────────
  /** Sweep button border at rest */
  borderSweep:   'rgba(242,242,252,0.35)',
  /** Toggle option border at rest */
  borderToggle:  'rgba(255,255,255,0.18)',
  /** Toggle option resting text */
  textToggle:    'rgba(179,179,186,0.50)',

} as const

// ─── Typography ───────────────────────────────────────────────────────────────
//
// Jean-Luc comes in two weights — Bold and Thin.
// Use the weight that suits the context:
//   font-weight: 700  →  JeanLuc Bold  (headings, nav, CTAs, impactful labels)
//   font-weight: 100  →  JeanLuc Thin  (large display text, subtle titles)
//
// In CSS: font-family: var(--font-sans); font-weight: 700;
// In React inline styles: { fontFamily: FONT.sansSerif, fontWeight: 700 }

export const FONT = {
  /**
   * Jean-Luc — display/title/UI font.
   * Bold (700) for headings, nav, CTAs.
   * Thin (100) for large display text.
   * Falls back to system sans-serif if not loaded.
   */
  sansSerif: "'Jean-Luc', system-ui, -apple-system, sans-serif",
  /**
   * Georgia — editorial/body font.
   * Used for body copy, captions, metadata, form fields.
   */
  serif:     "Georgia, 'Times New Roman', serif",
} as const

export const FONT_WEIGHT = {
  thin:   100,
  normal: 400,
  bold:   700,
} as const

export const FONT_SIZE = {
  eyebrow:   '9px',
  caption:   '10px',
  small:     '11px',
  body:      '13px',
  bodyLg:    '16px',
  headingMd: '28px',
  heading:   '22px',
  headingLg: '36px',
  display:   '56px',
} as const

export const LETTER_SPACING = {
  tight:   '-0.01em',
  normal:  '0em',
  wide:    '0.08em',
  wider:   '0.14em',
  widest:  '0.3em',
} as const

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const SPACE = {
  xs:   '4px',
  sm:   '8px',
  md:   '12px',
  lg:   '16px',
  xl:   '24px',
  xxl:  '32px',
  xxxl: '48px',
} as const

// ─── Motion ───────────────────────────────────────────────────────────────────

export const EASING = {
  standard:  'cubic-bezier(0.4, 0, 0.2, 1)',
  cinematic: 'cubic-bezier(0.76, 0, 0.24, 1)',
  spring:    'cubic-bezier(0.22, 1, 0.36, 1)',
  exit:      'cubic-bezier(0.76, 0, 0.24, 1)',
} as const

export const DURATION = {
  fast:     '180ms',
  standard: '280ms',
  slow:     '420ms',
  reveal:   '850ms',
} as const

// ─── Border radius ────────────────────────────────────────────────────────────

export const RADIUS = {
  sm:   '2px',
  md:   '3px',
  pill: '20px',
  full: '50%',
} as const

// ─── Breakpoints ──────────────────────────────────────────────────────────────

export const BREAKPOINT = {
  mobile:  0,
  tablet:  768,
  desktop: 1024,
} as const
