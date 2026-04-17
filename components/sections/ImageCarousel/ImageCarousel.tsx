'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { COLOR, FONT, FONT_SIZE, LETTER_SPACING, SPACE, DURATION } from '@tokens'
import { analytics } from '@/lib/analytics'
import styles from './ImageCarousel.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlideConfig {
  /**
   * Real image URL. When provided, renders a full-bleed <img>.
   * e.g. src: '/images/street-01.jpg'
   */
  src?: string
  /** Alt text for accessibility */
  alt?: string
  /**
   * Placeholder background colour — shown when src is not provided.
   * Remove once real images are in.
   */
  placeholderColor?: string
  /** Placeholder label text — shown on colour blocks only */
  label?: string
}

export interface ImageCarouselProps {
  slides: SlideConfig[]
  /**
   * Height of the carousel. Accepts any valid CSS height value.
   * When omitted, CSS handles the default: 100vh on desktop, 3:2 aspect ratio on mobile.
   */
  height?: string
}

// ─── CarouselViewer ───────────────────────────────────────────────────────────

function CarouselViewer({
  slides,
  current,
  onPrev,
  onNext,
}: {
  slides: SlideConfig[]
  current: number
  onPrev: () => void
  onNext: () => void
}) {
  // Touch swipe
  const touchStart = useRef({ x: 0, y: 0 })

  return (
    <div
      className={styles.viewer}
      style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
      onTouchStart={e => {
        touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchStart.current.x
        const dy = e.changedTouches[0].clientY - touchStart.current.y
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
          dx < 0 ? onNext() : onPrev()
        }
      }}
    >
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={i === current ? styles.slide : styles.slideHidden}
          style={{
            position: 'absolute',
            inset: 0,
            opacity: i === current ? 1 : 0,
            transition: `opacity ${DURATION.slow} ease`,
          }}
        >
          {slide.src ? (
            <img
              src={slide.src}
              alt={slide.alt ?? ''}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              onContextMenu={(e) => e.preventDefault()}
              draggable={false}
            />
          ) : (
            // Placeholder — remove once real images are in
            <div style={{
              width: '100%', height: '100%',
              background: slide.placeholderColor ?? COLOR.bgSurface,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {slide.label && (
                <span style={{
                  fontFamily: FONT.serif,
                  fontSize: FONT_SIZE.small,
                  letterSpacing: LETTER_SPACING.widest,
                  textTransform: 'uppercase',
                  color: 'rgba(242,242,252,0.15)',
                }}>
                  {slide.label}
                </span>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Click zones — left half prev, right half next */}
      <div
        onClick={onPrev}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', zIndex: 10, cursor: 'w-resize' }}
      />
      <div
        onClick={onNext}
        style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', zIndex: 10, cursor: 'e-resize' }}
      />
    </div>
  )
}

// ─── CarouselControls ─────────────────────────────────────────────────────────

function CarouselControls({
  current,
  total,
  onPrev,
  onNext,
}: {
  current: number
  total: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div style={{
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: SPACE.md,
      padding: `${SPACE.md} 22px 14px`,
      borderTop: `0.5px solid ${COLOR.borderDivider}`,
    }}>
      {/* Prev — ghost button, no border */}
      <GhostBtn onClick={onPrev} aria-label="Previous image">
        <Triangle dir="prev" />
      </GhostBtn>

      {/* Hairline separator */}
      <div style={{
        width: 0.5, height: 10,
        background: 'rgba(242,242,252,0.1)',
        flexShrink: 0,
      }} />

      {/* Next — ghost button, no border */}
      <GhostBtn onClick={onNext} aria-label="Next image">
        <Triangle dir="next" />
      </GhostBtn>

      {/* Counter — immediately right of arrows */}
      <div style={{
        fontFamily: FONT.serif,
        fontSize: FONT_SIZE.small,
        letterSpacing: LETTER_SPACING.wider,
        color: 'rgba(242,242,252,0.25)',
        whiteSpace: 'nowrap',
      }}>
        <span style={{ color: 'rgba(242,242,252,0.7)' }}>
          {String(current + 1).padStart(2, '0')}
        </span>
        <span style={{ margin: '0 4px', color: 'rgba(242,242,252,0.12)' }}>/</span>
        <span>{String(total).padStart(2, '0')}</span>
      </div>
    </div>
  )
}

// ─── Ghost button — no border, no background, no outline ─────────────────────
//
// Resting/hover/active opacity is handled entirely by CSS pseudo-classes in
// ImageCarousel.module.css. Previously this used useState for hovered/pressed,
// which triggered a React re-render on every mousemove. CSS :hover/:active is
// free — it runs in the compositor without touching the JS thread.

function GhostBtn({
  onClick,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      onClick={onClick}
      className={styles.ghostBtn}
      style={{
        // All browser defaults explicitly cleared
        appearance: 'none',
        WebkitAppearance: 'none',
        background: 'none',
        border: 'none',
        outline: 'none',
        boxShadow: 'none',
        padding: 0,
        margin: 0,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </button>
  )
}

// ─── Triangle ────────────────────────────────────────────────────────────────
//
// Pure CSS border-trick triangle. Lives in a child div of GhostBtn so its
// own border-* values (which create the triangle) are fully isolated from
// the button element's border.

function Triangle({ dir }: { dir: 'prev' | 'next' }) {
  const base: React.CSSProperties = {
    width: 0, height: 0,
    borderTop: '4px solid transparent',
    borderBottom: '4px solid transparent',
  }

  return (
    <div style={dir === 'prev'
      ? { ...base, borderRight: `6px solid ${COLOR.textPrimary}`, borderLeft: 'none' }
      : { ...base, borderLeft: `6px solid ${COLOR.textPrimary}`, borderRight: 'none' }
    } />
  )
}

// ─── CarouselContainer ────────────────────────────────────────────────────────

export default function ImageCarousel({ slides, height }: ImageCarouselProps) {
  const [current, setCurrent] = useState(0)
  const count = slides.length

  const goTo = useCallback((i: number) => {
    setCurrent(((i % count) + count) % count)
  }, [count])

  const prev = useCallback(() => { analytics.track('Carousel Navigated', { direction: 'prev' }); goTo(current - 1) }, [current, goTo])
  const next = useCallback(() => { analytics.track('Carousel Navigated', { direction: 'next' }); goTo(current + 1) }, [current, goTo])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft')  prev()
      if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [prev, next])

  return (
    <div
      className={styles.root}
      style={{
        background: COLOR.bgPrimary,
        ...(height !== undefined && { height }),
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <CarouselViewer
        slides={slides}
        current={current}
        onPrev={prev}
        onNext={next}
      />
      <CarouselControls
        current={current}
        total={count}
        onPrev={prev}
        onNext={next}
      />
    </div>
  )
}
