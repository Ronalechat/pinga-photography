'use client'

import { useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FONT } from '@tokens'
import styles from './ScrollHero.module.css'

// ─── Breakpoints ──────────────────────────────────────────────────────────────

export const BREAKPOINTS = {
  mobile:  0,    // 0–767px
  tablet:  768,  // 768–1023px
  desktop: 1024, // 1024px+
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlideConfig {
  /** Category label shown bottom-left (tablet+) or referenced in counter */
  label: string
  /** Subtitle shown centre-screen below the title */
  subtitle: string
  /** Real image URL for the slide background */
  src?: string
  /** Alt text for the slide (used for aria-label) */
  alt?: string
  /** CSS fallback when src is not provided — colour or gradient */
  background?: string
  /** When provided, clicking the slide navigates to this URL */
  href?: string
}

export interface ScrollHeroProps {
  slides: SlideConfig[]
  /**
   * Fraction of each slide's scroll budget used for the crossfade.
   * Auto-calculated from slide count if omitted.
   * Fewer slides = longer crossfade, more slides = snappier.
   */
  transitionZone?: number
  /**
   * Total scroll height expressed as a multiple of viewport height.
   * Auto-calculated from slide count if omitted (~1.8vh per slide + 1vh buffer).
   */
  scrollMultiplier?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v))
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * ScrollHero
 *
 * A scroll-driven hero that pins slides to the viewport while the user scrolls
 * through the component, then crossfades between slides.
 *
 * Architecture: tall outer div (scrollMultiplier × 100vh) in the normal
 * document flow + position:sticky inner stage. Scroll progress is derived from
 * getBoundingClientRect() inside a requestAnimationFrame loop.
 *
 * Scroll detection strategy (hybrid):
 *   1. IntersectionObserver tracks visibility — the rAF loop is suppressed
 *      entirely when the component is off-screen.
 *   2. Scroll event listeners on window, document, and body spin up the rAF
 *      loop on any scroll activity. An idle timeout (150ms) stops the loop
 *      when scrolling ceases, so zero frames are burned while idle.
 *   3. This works regardless of which ancestor the browser has promoted to
 *      scroll container (handles overflow-x on <body>, iframe embeddings
 *      like Storyblok preview, mobile touch, etc.).
 *
 * Important CSS constraints:
 *   - Do NOT set overflow-x:hidden on <html> or <body>. Instead, use
 *     overflow-x:clip on a wrapper div (e.g. the direct child of <body>).
 *     overflow:hidden coerces overflow-y to auto, creating a scroll container
 *     that breaks position:sticky. overflow:clip does not.
 *
 * Mobile:  Progress bar only. Dots hidden. Counter top-right.
 * Tablet:  Dots visible. Counter moves to bottom-right alongside label.
 * Desktop: Full UI. Larger typography. Wider gutters.
 */
export default function ScrollHero({
  slides,
  transitionZone,
  scrollMultiplier,
}: ScrollHeroProps) {
  const count  = slides.length
  const router = useRouter()

  // Auto-calculate from slide count, allow manual override
  // scrollMultiplier: ~0.9vh of scroll per slide + 1vh buffer
  //   3 slides → 3.7, 5 slides → 5.5, 8 slides → 8.2
  // transitionZone: fewer slides = longer crossfade, more = snappier
  //   3 slides → 0.32, 5 slides → 0.25, 8 slides → 0.21
  const resolvedMultiplier  = scrollMultiplier ?? count * 0.9 + 1
  const resolvedTransition  = transitionZone ?? clamp(0.5 / count + 0.15, 0.15, 0.4)

  const outerRef  = useRef<HTMLDivElement>(null)
  const slideRefs = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs   = useRef<(HTMLDivElement | null)[]>([])
  const barRef    = useRef<HTMLDivElement>(null)
  const hintRef   = useRef<HTMLDivElement>(null)
  const numRef    = useRef<HTMLSpanElement>(null)

  const update = useCallback(() => {
    const outer = outerRef.current
    if (!outer) return

    const rect       = outer.getBoundingClientRect()
    const scrolled   = -rect.top
    const scrollable = outer.offsetHeight - window.innerHeight
    const norm       = scrollable > 0 ? clamp(scrolled / scrollable, 0, 1) : 0

    const raw    = norm * (count - 1 + resolvedTransition * 2)
    const cur    = clamp(Math.floor(raw), 0, count - 1)
    const nxt    = clamp(cur + 1, 0, count - 1)
    const frac   = raw - Math.floor(raw)
    const tStart = 1 - resolvedTransition
    const inT    = frac > tStart && cur < count - 1
    const t      = inT ? easeInOut((frac - tStart) / resolvedTransition) : 0

    // Slide opacities
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return
      let op = 0
      if (i === cur)             op = inT ? 1 - t : 1
      else if (i === nxt && inT) op = t
      slide.style.opacity = String(op)
    })

    // Nav dots
    const active = inT && t > 0.5 ? nxt : cur
    dotRefs.current.forEach((dot, i) => {
      if (!dot) return
      dot.style.background = i === active
        ? 'rgba(255,255,255,0.9)'
        : 'rgba(255,255,255,0.22)'
      dot.style.transform = i === active ? 'scale(1.5)' : 'scale(1)'
    })

    if (barRef.current)
      barRef.current.style.width = `${Math.round(norm * 100)}%`

    if (hintRef.current)
      hintRef.current.style.opacity = String(clamp(1 - norm * 6, 0, 1))

    if (numRef.current)
      numRef.current.textContent =
        `${String(active + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`

  }, [count, resolvedTransition])

  useEffect(() => {
    if (slideRefs.current[0]) slideRefs.current[0].style.opacity = '1'

    const outer = outerRef.current
    if (!outer) return

    // ── Scroll-gated rAF loop with idle timeout ─────────────────────────
    //
    // The rAF loop only runs while the user is actively scrolling AND the
    // component is visible. After 150ms of no scroll activity the loop
    // stops, so zero frames are burned while idle.
    //
    // Scroll listeners are attached to window + document + body to catch
    // the event regardless of which element the browser promoted to scroll
    // container (e.g. when overflow-x on body coerces overflow-y to auto).

    let rafId = 0
    let running = false
    let idleTimer: ReturnType<typeof setTimeout> | null = null
    let isIntersecting = true   // hero is visible on mount; IO will set false when off-screen

    const loop = () => {
      update()
      if (running) rafId = requestAnimationFrame(loop)
    }

    const start = () => {
      if (!running && isIntersecting) { running = true; loop() }
    }

    const stop = () => {
      running = false
      cancelAnimationFrame(rafId)
    }

    // Scroll events spin up the loop; idle timeout shuts it down
    const onScroll = () => {
      start()
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(stop, 150)
    }

    // IO gates visibility — don't burn frames when off-screen
    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          isIntersecting = entry.isIntersecting
          if (!isIntersecting) stop()
          else start()   // re-arm the loop when element re-enters viewport
        },
        { rootMargin: '200px 0px' },
      )
      observer.observe(outer)
    } else {
      isIntersecting = true // no IO available = assume visible
    }

    // Listen on every possible scroll container
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('scroll', onScroll, { passive: true })
    document.body?.addEventListener('scroll', onScroll, { passive: true })

    // Single update on mount for initial paint — no loop
    update()

    return () => {
      stop()
      if (idleTimer) clearTimeout(idleTimer)
      observer?.disconnect()
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll)
      document.body?.removeEventListener('scroll', onScroll)
    }
  }, [update])

  return (
    <div ref={outerRef} style={{ height: `${resolvedMultiplier * 100}vh`, position: 'relative' }}>

      <div className={styles.stage}>

        {/* ── Slides ── */}
        {slides.map((slide, i) => (
          <div
            key={slide.label}
            ref={el => { slideRefs.current[i] = el }}
            aria-label={slide.alt ?? slide.label}
            onClick={slide.href ? () => router.push(slide.href!) : undefined}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'column',
              gap: 12,
              opacity: 0,
              cursor: slide.href ? 'pointer' : undefined,
              ...(slide.src
                ? { backgroundImage: `url('${slide.src}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: slide.background ?? '#16161D' }
              ),
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.6) 100%)',
              pointerEvents: 'none',
            }} />

            <span className={styles.title}>{slide.label}</span>
            <span className={styles.subtitle}>{slide.subtitle}</span>
            <span className={styles.label}>{slide.label}</span>
          </div>
        ))}

        {/* ── Counter ── */}
        <span ref={numRef} className={styles.num}>
          01 / {String(count).padStart(2, '0')}
        </span>

        {/* ── Progress bar ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          height: 2, background: 'rgba(255,255,255,0.12)', zIndex: 10,
        }}>
          <div ref={barRef} style={{
            height: '100%',
            background: 'rgba(255,255,255,0.75)',
            width: '0%',
          }} />
        </div>

        {/* ── Nav dots (tablet+ via CSS) ── */}
        <div className={styles.dots}>
          {slides.map((slide, i) => (
            <div
              key={slide.label}
              ref={el => { dotRefs.current[i] = el }}
              style={{
                width: 5, height: 5,
                borderRadius: '50%',
                transition: 'background 0.3s ease, transform 0.3s ease',
                background: i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.22)',
                transform:  i === 0 ? 'scale(1.5)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        {/* ── Scroll hint ── */}
        <div ref={hintRef} style={{
          position: 'absolute',
          bottom: 40,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          zIndex: 10,
          transition: 'opacity 0.4s ease',
        }}>
          <div className={styles.hintLine} />
          <span style={{
            fontFamily: FONT.serif,
            fontSize: 8,
            letterSpacing: '0.22em',
            color: 'rgba(255,255,255,0.4)',
            textTransform: 'uppercase',
          }}>
            Scroll
          </span>
        </div>

      </div>
    </div>
  )
}
