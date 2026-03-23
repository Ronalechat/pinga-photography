'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { COLOR, FONT, FONT_SIZE, LETTER_SPACING, SPACE, EASING, DURATION, RADIUS } from '@tokens'
import PingaToggle from '@/components/ui/ToggleButton/PingaToggle'
import styles from './KineticGrid.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PhotoConfig {
  cat: string
  /**
   * Aspect ratio as [width, height].
   * Drives placeholder sizing. With real <img> tags this is unused —
   * the card height becomes the image's natural height automatically.
   */
  ratio: [number, number]
  num: string
  /**
   * Image source. When provided, renders a real <img> instead of a placeholder.
   * e.g. src: '/images/street-01.jpg'
   */
  src?: string
}

export interface KineticGridProps {
  categories: Record<string, PhotoConfig[]>
  /** How many items per category to show in the "All" view. @default 4 */
  allPreviewCount?: number
  /** Background colour per category for placeholders */
  categoryColors?: Record<string, string>
  /** Section eyebrow label @default "Selected Work" */
  eyebrow?: string
  /** Pre-select a category filter on mount (e.g. from ?category= query param) */
  defaultCategory?: string
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_COLORS: Record<string, string> = {
  'Street':         '#1e3a5f',
  'Portraits':      '#5c2d1e',
  'Engagements':    '#1a4a32',
  'New Beginnings': '#4a3a10',
  'Exhibition':     '#1a2a5c',
}

const DIRS    = ['left', 'top', 'right'] as const
const STAGGER = [60, 0, 120]

function ratioPct([w, h]: [number, number]): string {
  return `${((h / w) * 100).toFixed(2)}%`
}

function ratioLabel([w, h]: [number, number]): string {
  return `${w}:${h}`
}

function thumbWidth([w, h]: [number, number], thumbH = 32): number {
  return Math.round(thumbH * (w / h))
}

// ── Style helpers — inline only, no CSS class toggling ────────────────────────
// This pattern avoids iframe sandbox specificity issues and is the correct
// approach for any state that must be visually unambiguous.
// Filter chip buttons are handled by PingaToggle (CSS Modules) — the
// selected-state sweep is state-driven there, not hover-driven, so CSS
// class toggling is appropriate and does not suffer the iframe specificity
// issues that hover-driven rules do.

function getThumbStyles(active: boolean, w: number): React.CSSProperties {
  return {
    flexShrink: 0,
    height: 32,
    width: w,
    borderRadius: RADIUS.sm,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontFamily: FONT.serif,
    fontSize: '7px',
    color: COLOR.textMuted,
    border: `0.5px solid ${active ? COLOR.borderHover : 'transparent'}`,
    opacity: active ? 1 : 0.28,
    transform: active ? 'scale(1.1)' : 'scale(1)',
    transition: `opacity ${DURATION.fast} ease, transform ${DURATION.fast} ease`,
  }
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({ item, colIndex, color, onClick }: {
  item: PhotoConfig
  colIndex: number
  color: string
  onClick: () => void
}) {
  return (
    <div
      data-dir={DIRS[colIndex]}
      data-reveal="pending"
      onClick={(e) => { e.preventDefault(); onClick() }}
      style={{
        width: '100%',
        borderRadius: RADIUS.md,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        background: color,
        opacity: 0,
        transform: DIRS[colIndex] === 'left'  ? 'translateX(-14px)'
                 : DIRS[colIndex] === 'top'   ? 'translateY(-14px)'
                                              : 'translateX(14px)',
        willChange: 'opacity, transform',
      }}
    >
      {/* Real image or aspect ratio sizer */}
      {item.src ? (
        <img
          src={item.src}
          alt={`${item.cat} ${item.num}`}
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      ) : (
        <div style={{ paddingTop: ratioPct(item.ratio) }} />
      )}

      {/* Placeholder label (hidden when real image is present) */}
      {!item.src && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexDirection: 'column',
          gap: SPACE.xs,
        }}>
          <span style={{ fontFamily: FONT.serif, fontSize: FONT_SIZE.eyebrow, letterSpacing: LETTER_SPACING.wider, textTransform: 'uppercase', color: COLOR.textMuted }}>{item.cat}</span>
          <span style={{ fontFamily: FONT.serif, fontSize: '10px', color: 'rgba(179,179,186,0.25)', letterSpacing: LETTER_SPACING.wide }}>{ratioLabel(item.ratio)}</span>
          <span style={{ fontFamily: FONT.serif, fontSize: FONT_SIZE.small, color: 'rgba(179,179,186,0.18)' }}>{item.num}</span>
        </div>
      )}

      {/* Hover meta bar — shown via CSS module (.cardMeta) */}
      <div className={styles.cardMeta} style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: `${SPACE.xl} ${SPACE.md} ${SPACE.md}`,
        background: 'linear-gradient(to top, rgba(0,0,0,0.65) 0%, transparent 100%)',
        opacity: 0, transform: 'translateY(3px)',
        transition: `opacity ${DURATION.standard} ease, transform ${DURATION.standard} ease`,
        zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <span style={{ fontFamily: FONT.serif, fontSize: '8px', letterSpacing: LETTER_SPACING.wider, textTransform: 'uppercase', color: COLOR.textPrimary }}>{item.cat}</span>
        <span style={{ fontFamily: FONT.serif, fontSize: '8px', color: COLOR.textMuted }}>{item.num}</span>
      </div>
    </div>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ list, index, colors, onClose, onNavigate, onJump }: {
  list: PhotoConfig[]
  index: number
  colors: Record<string, string>
  onClose: () => void
  onNavigate: (dir: 'prev' | 'next') => void
  onJump: (i: number) => void
}) {
  const item      = list[index]
  const color     = colors[item.cat] ?? COLOR.bgSurface
  const thumbsRef = useRef<HTMLDivElement>(null)

  // Scroll the thumb strip only — never the page
  useEffect(() => {
    const strip = thumbsRef.current
    if (!strip) return
    const thumbEl = strip.children[index] as HTMLElement | undefined
    if (!thumbEl) return
    const margin     = 20
    const thumbLeft  = thumbEl.offsetLeft
    const thumbRight = thumbLeft + thumbEl.offsetWidth
    if (thumbLeft < strip.scrollLeft + margin) {
      strip.scrollLeft = thumbLeft - margin
    } else if (thumbRight > strip.scrollLeft + strip.clientWidth - margin) {
      strip.scrollLeft = thumbRight - strip.clientWidth + margin
    }
  }, [index])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onNavigate('next')
      if (e.key === 'ArrowLeft')  onNavigate('prev')
      if (e.key === 'Escape')     onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNavigate, onClose])

  const touchStart = useRef({ x: 0, y: 0 })

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: COLOR.bgPrimary, zIndex: 200, display: 'flex', flexDirection: 'column' }}
      onTouchStart={e => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchStart.current.x
        const dy = e.changedTouches[0].clientY - touchStart.current.y
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) onNavigate(dx < 0 ? 'next' : 'prev')
      }}
    >
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.lg} ${SPACE.lg} ${SPACE.md}`, flexShrink: 0, borderBottom: `0.5px solid ${COLOR.borderDivider}` }}>
        <span style={{ fontFamily: FONT.serif, fontSize: FONT_SIZE.eyebrow, letterSpacing: LETTER_SPACING.widest, textTransform: 'uppercase', color: COLOR.textMuted }}>{item.cat}</span>
        <span style={{ fontFamily: FONT.serif, fontSize: FONT_SIZE.small, letterSpacing: LETTER_SPACING.wider, color: COLOR.textMuted }}>
          {String(index + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}
        </span>
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose() }}
          style={{ background: 'none', border: 'none', color: COLOR.textMuted, fontSize: '18px', cursor: 'pointer', padding: `2px ${SPACE.sm}`, lineHeight: 1, fontFamily: FONT.serif }}
        >✕</button>
      </div>

      {/* Image stage */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {item.src ? (
          <img src={item.src} alt={`${item.cat} ${item.num}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: color, borderRadius: RADIUS.md, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: SPACE.sm }}>
            <span style={{ fontFamily: FONT.serif, fontSize: FONT_SIZE.small, letterSpacing: LETTER_SPACING.widest, textTransform: 'uppercase', color: COLOR.textMuted }}>{item.cat}</span>
            <span style={{ fontFamily: FONT.serif, fontSize: '12px', color: 'rgba(179,179,186,0.25)', letterSpacing: LETTER_SPACING.wide }}>{ratioLabel(item.ratio)}</span>
            <span style={{ fontFamily: FONT.serif, fontSize: '40px', color: 'rgba(179,179,186,0.12)' }}>{item.num}</span>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: `${SPACE.md} ${SPACE.md}`, flexShrink: 0 }}>
        {(['prev', 'next'] as const).map(dir => (
          <button key={dir+'dir'}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNavigate(dir) }}
            style={{ width: 40, height: 40, borderRadius: RADIUS.full, background: COLOR.bgInput, border: `0.5px solid ${COLOR.borderInput}`, color: COLOR.textMuted, fontSize: '16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
          >{dir === 'prev' ? '←' : '→'}</button>
        ))}
      </div>

      {/* Thumbnail strip */}
      <div ref={thumbsRef} style={{ display: 'flex', gap: SPACE.xs, padding: `${SPACE.xs} ${SPACE.lg} ${SPACE.lg}`, overflowX: 'auto', flexShrink: 0, scrollbarWidth: 'none' }}>
        {list.map((t, i) => (
          <div key={t.num+t.cat}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onJump(i) }}
            style={{ ...getThumbStyles(i === index, thumbWidth(t.ratio)), background: colors[t.cat] ?? COLOR.bgSurface, overflow: 'hidden', position: 'relative' }}
          >
            {t.src
              ? <img src={t.src} alt="" aria-hidden style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              : t.num
            }
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── KineticGrid ──────────────────────────────────────────────────────────────

export default function KineticGrid({
  categories,
  allPreviewCount = 4,
  categoryColors  = DEFAULT_COLORS,
  eyebrow         = 'Selected Work',
  defaultCategory,
}: KineticGridProps) {
  const catNames = Object.keys(categories)
  const [activeFilter, setActiveFilter] = useState(defaultCategory ?? 'all')
  const [lightbox, setLightbox] = useState<{ list: PhotoConfig[]; index: number } | null>(null)
  const shellRef = useRef<HTMLDivElement>(null)

  const allItems: PhotoConfig[] = []
  for (let i = 0; i < allPreviewCount; i++) {
    catNames.forEach(cat => { if (categories[cat][i]) allItems.push(categories[cat][i]) })
  }

  const activeList = activeFilter === 'all' ? allItems : (categories[activeFilter] ?? [])

  // Scroll-based reveal — uses getBoundingClientRect so it works in any scroll context.
  // Transition uses opacity + transform (compositor-only) rather than clip-path (repaint per frame).
  //
  // Image-load guard: if the card contains an <img> that hasn't finished downloading,
  // the reveal is deferred until the image settles (load or error). This ensures the
  // animation always reveals a photo, never a placeholder-coloured box.
  // A 3-second timeout fires the reveal unconditionally so a card is never stuck
  // invisible on a very slow or failing connection.
  const checkReveals = useCallback(() => {
    const shell = shellRef.current
    if (!shell) return
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const doReveal = (card: HTMLElement) => {
      const col = parseInt(card.dataset.col ?? '0')
      if (reducedMotion) {
        card.style.opacity    = '1'
        card.style.transform  = 'translate(0, 0)'
        card.style.willChange = 'auto'
      } else {
        const delay = `${STAGGER[col] ?? 0}ms`
        card.style.transition = `opacity ${DURATION.reveal} ${EASING.cinematic} ${delay}, transform ${DURATION.reveal} ${EASING.cinematic} ${delay}`
        card.style.opacity    = '1'
        card.style.transform  = 'translate(0, 0)'
        card.addEventListener('transitionend', () => { card.style.willChange = 'auto' }, { once: true })
      }
      card.dataset.reveal = 'done'
    }

    shell.querySelectorAll<HTMLElement>('[data-reveal="pending"]').forEach(card => {
      const rect = card.getBoundingClientRect()
      if (!(rect.bottom > 0 && rect.top < window.innerHeight - 40)) return

      const img = card.querySelector('img')

      if (!img || img.complete) {
        // No image (placeholder card) or image already settled — reveal immediately
        doReveal(card)
      } else {
        // Image still downloading — park the card so scroll events skip it,
        // then reveal the moment it settles or after 3 seconds, whichever comes first
        card.dataset.reveal = 'waiting'
        const fallback = setTimeout(() => { if (card.dataset.reveal === 'waiting') doReveal(card) }, 3000)
        const onSettled = () => { clearTimeout(fallback); doReveal(card) }
        img.addEventListener('load',  onSettled, { once: true })
        img.addEventListener('error', onSettled, { once: true })
      }
    })
  }, [])

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return
    shell.scrollIntoView({ behavior: 'instant' })
    requestAnimationFrame(checkReveals)

    // Gate the scroll listener with rAF — collapses N scroll events per frame
    // into a single checkReveals call, matching the ScrollHero pattern.
    let rafPending = false
    const onScroll = () => {
      if (rafPending) return
      rafPending = true
      requestAnimationFrame(() => { checkReveals(); rafPending = false })
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [activeFilter, checkReveals])

  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  const cols: PhotoConfig[][] = [[], [], []]
  activeList.forEach((item, i) => cols[i % 3].push(item))

  return (
    <div ref={shellRef} style={{ position: 'relative', background: COLOR.bgPrimary }}>
      <div style={{ padding: `${SPACE.xxl} ${SPACE.lg} 80px` }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACE.lg, marginBottom: SPACE.xl }}>
          <span style={{ fontFamily: FONT.serif, fontSize: FONT_SIZE.eyebrow, letterSpacing: LETTER_SPACING.widest, textTransform: 'uppercase', color: COLOR.textMuted, opacity: 0.6, whiteSpace: 'nowrap' }}>{eyebrow}</span>
          <div style={{ flex: 1, height: 0.5, background: COLOR.borderDivider }} />
          <span style={{ fontFamily: FONT.serif, fontSize: FONT_SIZE.eyebrow, letterSpacing: LETTER_SPACING.wider, color: COLOR.textMuted, opacity: 0.4 }}>
            {activeList.length} image{activeList.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Filters */}
        <div style={{ marginBottom: SPACE.xl }}>
          <PingaToggle
            options={['all', ...catNames]}
            selected={activeFilter}
            onChange={(v) => setActiveFilter(v as string)}
          />
        </div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: SPACE.sm, alignItems: 'start' }}>
          {cols.map((col, colIdx) => (
            <div key={colIdx} style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
              {col.map((item, rowIdx) => (
                <Card
                  key={`${item.cat}-${item.num}`}
                  item={item}
                  colIndex={colIdx}
                  color={categoryColors[item.cat] ?? COLOR.bgSurface}
                  onClick={() => setLightbox({ list: activeList, index: rowIdx * 3 + colIdx })}
                />
              ))}
            </div>
          ))}
        </div>

        {/* <p style={{ textAlign: 'center', marginTop: SPACE.xl, fontFamily: FONT.serif, fontSize: '9px', letterSpacing: LETTER_SPACING.widest, textTransform: 'uppercase', color: COLOR.textMuted, opacity: 0.25 }}>↓ scroll to reveal more</p> */}
      </div>

      {lightbox && createPortal(
        <Lightbox
          list={lightbox.list}
          index={lightbox.index}
          colors={categoryColors}
          onClose={() => setLightbox(null)}
          onNavigate={dir => {
            const len  = lightbox.list.length
            const next = dir === 'next' ? (lightbox.index + 1) % len : (lightbox.index - 1 + len) % len
            setLightbox({ ...lightbox, index: next })
          }}
          onJump={i => setLightbox({ ...lightbox, index: i })}
        />,
        document.body,
      )}
    </div>
  )
}
