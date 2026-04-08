'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { COLOR } from '@tokens'
import Typography from '@/components/ui/Typography/Typography'
import styles from './ScrollHero.module.css'

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
   * Auto-calculated from slide count if omitted (~0.9vh per slide + 1vh buffer).
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
 * document flow + position:sticky inner stage. Scroll progress is read from
 * window.scrollY against a cached outerTop offset (no getBoundingClientRect
 * in the hot path).
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

  // Viewport size tracked only at breakpoint crossings (not per frame) — safe per CLAUDE.md.
  // Drives a smaller scroll multiplier on mobile/tablet so touch-scroll feels responsive.
  const [viewportSize, setViewportSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)')
    const tablet = window.matchMedia('(max-width: 1023px)')
    const update = () => {
      if (mobile.matches)       setViewportSize('mobile')
      else if (tablet.matches)  setViewportSize('tablet')
      else                      setViewportSize('desktop')
    }
    update()
    mobile.addEventListener('change', update)
    tablet.addEventListener('change', update)
    return () => {
      mobile.removeEventListener('change', update)
      tablet.removeEventListener('change', update)
    }
  }, [])

  // Auto-calculate from slide count, allow manual override.
  // Mobile/tablet use smaller multipliers so fewer pixels of scroll separate slides.
  // scrollMultiplier: ~0.9vh of scroll per slide + 1vh buffer (desktop)
  //   3 slides → 3.7, 5 slides → 5.5, 8 slides → 8.2
  // transitionZone: fewer slides = longer crossfade, more = snappier
  //   3 slides → 0.32, 5 slides → 0.25, 8 slides → 0.21
  const resolvedMultiplier = scrollMultiplier ?? (
    viewportSize === 'mobile' ? count * 0.45 + 0.5 :
    viewportSize === 'tablet' ? count * 0.65 + 0.7 :
    count * 0.9 + 1
  )
  const resolvedTransition = transitionZone ?? clamp(0.5 / count + 0.15, 0.15, 0.4)

  const outerRef    = useRef<HTMLDivElement>(null)
  const stageRef    = useRef<HTMLDivElement>(null)
  const slideRefs   = useRef<(HTMLDivElement | null)[]>([])
  const dotRefs     = useRef<(HTMLDivElement | null)[]>([])
  const barRef      = useRef<HTMLDivElement>(null)
  const hintRef     = useRef<HTMLDivElement>(null)
  const numRef      = useRef<HTMLSpanElement>(null)
  // Cached layout measurements — only valid after mount, invalidated on resize.
  // Reading these in the rAF loop avoids forced reflow from getBoundingClientRect/offsetHeight.
  const layoutCache = useRef<{ outerTop: number; scrollable: number } | null>(null)
  // Snap-to-slide state — updated each frame, read after scroll idle timer fires.
  const snapStateRef = useRef<{ cur: number; t: number; inT: boolean } | null>(null)
  const snapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // willChange promotion — tracks which pair of slides is currently composited
  // so we only set/clear willChange at transition boundaries, not every frame.
  const wcPromotedRef = useRef<{ cur: number; nxt: number } | null>(null)
  const wcTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null)

  const update = useCallback(() => {
    const outer = outerRef.current
    const cache = layoutCache.current
    if (!outer || !cache) return

    const scrolled = window.scrollY - cache.outerTop
    const norm     = cache.scrollable > 0 ? clamp(scrolled / cache.scrollable, 0, 1) : 0

    const raw    = norm * (count - 1 + resolvedTransition * 2)
    const cur    = clamp(Math.floor(raw), 0, count - 1)
    const nxt    = clamp(cur + 1, 0, count - 1)
    const frac   = raw - Math.floor(raw)
    const tStart = 1 - resolvedTransition
    const inT    = frac > tStart && cur < count - 1
    const t      = inT ? easeInOut((frac - tStart) / resolvedTransition) : 0

    // Update snap state so the idle handler knows where to land
    snapStateRef.current = { cur, t, inT }

    // willChange promotion — only the two slides actively crossfading need a
    // compositor layer. Promoting all slides simultaneously costs GPU memory.
    // We set willChange:'opacity' on cur+nxt when a transition begins, then
    // schedule a cleanup after the transition duration so the layers are released.
    if (inT) {
      const promoted = wcPromotedRef.current
      if (!promoted || promoted.cur !== cur || promoted.nxt !== nxt) {
        // Clear any pending cleanup timer from a previous pair
        if (wcTimerRef.current) clearTimeout(wcTimerRef.current)
        // Release previous pair if different slides
        if (promoted) {
          const prevCur = slideRefs.current[promoted.cur]
          const prevNxt = slideRefs.current[promoted.nxt]
          if (prevCur) prevCur.style.willChange = 'auto'
          if (prevNxt) prevNxt.style.willChange = 'auto'
        }
        // Promote the new pair
        const sCur = slideRefs.current[cur]
        const sNxt = slideRefs.current[nxt]
        if (sCur) sCur.style.willChange = 'opacity'
        if (sNxt) sNxt.style.willChange = 'opacity'
        wcPromotedRef.current = { cur, nxt }
        // Schedule layer release after the transition eases out
        wcTimerRef.current = setTimeout(() => {
          if (sCur) sCur.style.willChange = 'auto'
          if (sNxt) sNxt.style.willChange = 'auto'
          wcPromotedRef.current = null
          wcTimerRef.current = null
        }, resolvedTransition * 1000 + 50)
      }
    }

    // Slide opacities + pointer events (only the visible slide receives clicks)
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return
      let op = 0
      if (i === cur)             op = inT ? 1 - t : 1
      else if (i === nxt && inT) op = t
      slide.style.opacity       = String(op)
      slide.style.pointerEvents = op > 0 ? 'auto' : 'none'
    })

    // Nav dots — active dot is larger and brighter
    const active = inT && t > 0.5 ? nxt : cur
    dotRefs.current.forEach((dot, i) => {
      if (!dot) return
      dot.style.background = i === active ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.22)'
      dot.style.transform  = i === active ? 'scale(1.5)' : 'scale(1)'
    })

    if (barRef.current)
      barRef.current.style.transform = `scaleX(${norm})`

    if (hintRef.current)
      hintRef.current.style.opacity = String(clamp(1 - norm * 6, 0, 1))

    if (numRef.current)
      numRef.current.textContent = `${String(active + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}`

  }, [count, resolvedTransition])

  useEffect(() => {
    if (slideRefs.current[0]) slideRefs.current[0].style.opacity = '1'

    const outer = outerRef.current
    if (!outer) return

    // Respect the OS-level "Reduce Motion" preference — skip the rAF loop
    // entirely and show only the first slide statically.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // ── Layout cache — populate once, invalidate on resize ───────────────
    //
    // Reading getBoundingClientRect / offsetHeight inside the rAF loop forces
    // a synchronous layout flush before every style write (layout thrashing).
    // Instead we cache the two values that only change when the DOM or viewport
    // is resized, and in the hot path we only read window.scrollY — a simple
    // property with no layout cost.
    const measureLayout = () => {
      layoutCache.current = {
        outerTop:   outer.getBoundingClientRect().top + window.scrollY,
        scrollable: outer.offsetHeight - window.innerHeight,
      }
    }
    measureLayout()

    const ro = new ResizeObserver(measureLayout)
    ro.observe(outer)
    window.addEventListener('resize', measureLayout)

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

    // After scrolling stops and we're mid-crossfade, snap to the nearer slide.
    // Fires only when inT is true — stable "slide fully shown" positions do nothing.
    const snapToNearest = () => {
      const s = snapStateRef.current
      const cache = layoutCache.current
      if (!s || !cache || !s.inT) return
      const targetSlide = s.t > 0.5 ? Math.min(s.cur + 1, count - 1) : s.cur
      const targetNorm  = targetSlide / (count - 1 + resolvedTransition * 2)
      const targetY     = cache.outerTop + targetNorm * cache.scrollable
      window.scrollTo({ top: targetY, behavior: 'smooth' })
    }

    // Scroll events spin up the loop; idle timeout shuts it down and snaps
    const onScroll = () => {
      start()
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(stop, 150)
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current)
      snapTimerRef.current = setTimeout(snapToNearest, 200)
    }

    // IO gates visibility — don't burn frames when off-screen
    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => {
          isIntersecting = entry.isIntersecting
          // Pause/resume CSS animations (e.g. hint pulse) alongside the rAF loop
          stageRef.current?.classList.toggle(styles.paused, !isIntersecting)
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
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current)
      if (wcTimerRef.current) clearTimeout(wcTimerRef.current)
      // Release all compositor layers on unmount — prevents memory leaks if the
      // component is replaced before the cleanup setTimeout fires.
      slideRefs.current.forEach(s => { if (s) s.style.willChange = 'auto' })
      wcPromotedRef.current = null
      observer?.disconnect()
      ro.disconnect()
      window.removeEventListener('resize', measureLayout)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('scroll', onScroll)
      document.body?.removeEventListener('scroll', onScroll)
    }
  }, [update])

  return (
    <div ref={outerRef} style={{ height: `${resolvedMultiplier * 100}vh`, position: 'relative' }}>

      <div ref={stageRef} className={styles.stage}>

        {/* ── Slides ── */}
        {slides.map((slide, i) => (
          <div
            key={slide.label}
            ref={el => { slideRefs.current[i] = el }}
            className={styles.slide}
            aria-label={slide.alt ?? slide.label}
            onClick={slide.href ? () => router.push(slide.href!) : undefined}
            style={{
              opacity: 0,
              cursor:  slide.href ? 'pointer' : undefined,
              ...(slide.src
                ? { backgroundImage: `url('${slide.src}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
                : { background: slide.background ?? COLOR.bgPrimary }
              ),
            }}
          >
            <div className={styles.slideOverlay} />
            <Typography variant="displaySlide" as="span" className={styles.title}>{slide.label}</Typography>
            <Typography variant="eyebrow" as="span" className={styles.subtitle} color="rgba(255,255,255,0.45)">{slide.subtitle}</Typography>
            <Typography variant="label" as="span" className={styles.label}>{slide.label}</Typography>
          </div>
        ))}

        {/* ── Counter ── */}
        <Typography variant="meta" as="span" ref={numRef} className={styles.num}>
          01 / {String(count).padStart(2, '0')}
        </Typography>

        {/* ── Progress bar ── */}
        <div className={styles.progressTrack}>
          <div ref={barRef} className={styles.progressBar} />
        </div>

        {/* ── Nav dots (tablet+ via CSS) ── */}
        <div className={styles.dots}>
          {slides.map((slide, i) => (
            <div
              key={slide.label}
              ref={el => { dotRefs.current[i] = el }}
              className={styles.dot}
              style={{
                background: i === 0 ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.22)',
                transform:  i === 0 ? 'scale(1.5)' : 'scale(1)',
                transition: 'background 0.3s ease, transform 0.3s ease',
              }}
            />
          ))}
        </div>

        {/* ── Scroll hint ── */}
        <div ref={hintRef} className={styles.hint} style={{ transition: 'opacity 0.4s ease' }}>
          <div className={styles.hintLine} />
          <Typography variant="meta" color="rgba(255,255,255,0.4)">Scroll</Typography>
        </div>

      </div>
    </div>
  )
}
