'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import { COLOR } from '@tokens'
import Typography from '@/components/ui/Typography/Typography'
import { analytics } from '@/lib/analytics'
import utilStyles from '@/styles/utility.module.css'
import styles from './ScrollHero.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SlideConfig {
  /** Category label shown bottom-left (tablet+) or referenced in counter */
  label: string
  /** Subtitle shown centre-screen below the title */
  subtitle: string
  /** Real image URL for the slide background */
  src?: string
  /** Responsive srcset — lets the browser pick the width matching viewport × DPR */
  srcSet?: string
  /** sizes attribute paired with srcSet */
  sizes?: string
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

  // Slides 1+ mount their <img> only after the first slide has decoded, so the
  // full-priority bandwidth goes to the image the visitor actually sees first.
  // No first image to wait for → nothing to defer.
  const [restReady, setRestReady] = useState(() => !slides[0]?.src)

  const outerRef    = useRef<HTMLDivElement>(null)
  const stageRef    = useRef<HTMLDivElement>(null)
  const firstImgRef = useRef<HTMLImageElement | null>(null)
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
  // Last observed scroll direction (1 = down, -1 = up) — snapping is
  // direction-aware so it never yanks the page against the user's gesture.
  const scrollDirRef = useRef(1)
  const lastScrollYRef = useRef(0)
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

    // Slide opacities + pointer events. Only the dominant slide (the one more
    // than half visible) receives clicks — mid-crossfade both slides used to be
    // clickable and the DOM-later one silently won, sending clicks to the
    // wrong category.
    const dominant = inT && t > 0.5 ? nxt : cur
    slideRefs.current.forEach((slide, i) => {
      if (!slide) return
      let op = 0
      if (i === cur)             op = inT ? 1 - t : 1
      else if (i === nxt && inT) op = t
      slide.style.opacity       = String(op)
      slide.style.pointerEvents = i === dominant ? 'auto' : 'none'
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

  // ── First-slide reveal ────────────────────────────────────────────────────
  // Waits for the first slide's <img> to load and decode before revealing it.
  // Without this, the loading screen disappears but the hero image is still
  // downloading — the user sees a dark stage, then a sudden snap-in.
  // Watching the rendered <img> (not a detached Image()) means the wait matches
  // whichever srcset candidate the browser actually chose, and the reveal also
  // unlocks the deferred slides 1+ so they download after — never alongside —
  // the image the visitor is looking at.
  // Falls back to revealing after 3s so slow connections don't stall forever.
  useEffect(() => {
    const el  = slideRefs.current[0]
    const src = slides[0]?.src
    if (!el) return

    if (!src) {
      el.style.opacity = '1'
      return
    }

    let cancelled = false
    const reveal = () => {
      if (cancelled) return
      window.dispatchEvent(new CustomEvent('preloader:ready'))
      el.style.transition = 'opacity 0.4s ease'
      el.style.opacity = '1'
      setRestReady(true)
      setTimeout(() => { if (!cancelled) el.style.transition = '' }, 450)
    }

    const fallback = setTimeout(reveal, 3000)
    const settle = () => {
      const img = firstImgRef.current
      const decoded = img ? img.decode() : Promise.resolve()
      decoded
        .catch(() => {}) // decode() can reject on already-painted images — reveal anyway
        .then(() => new Promise<void>(resolve => {
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        }))
        .then(() => { clearTimeout(fallback); reveal() })
    }

    const img = firstImgRef.current
    if (!img || img.complete) {
      settle()
    } else {
      img.addEventListener('load',  settle, { once: true })
      img.addEventListener('error', settle, { once: true })
    }

    return () => {
      cancelled = true
      clearTimeout(fallback)
      img?.removeEventListener('load',  settle)
      img?.removeEventListener('error', settle)
    }
  }, [slides])

  useEffect(() => {
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

    // After scrolling settles mid-crossfade, resolve to a slide — but always in
    // the direction the user was scrolling. Snapping to the *nearest* slide used
    // to yank the page backwards against the gesture (the "bounce"): pause less
    // than halfway through a transition and it pulled you back to the slide you
    // were leaving. Now a downward scroll commits forward once you're 20% in
    // (and vice versa scrolling up), so the page only ever continues the motion
    // the user started. Fires only when inT is true — stable "slide fully
    // shown" positions do nothing.
    const snapToSlide = () => {
      const s = snapStateRef.current
      const cache = layoutCache.current
      if (!s || !cache || !s.inT) return
      const forward = Math.min(s.cur + 1, count - 1)
      const targetSlide = scrollDirRef.current > 0
        ? (s.t > 0.2 ? forward : s.cur)
        : (s.t < 0.8 ? s.cur : forward)
      const targetNorm  = targetSlide / (count - 1 + resolvedTransition * 2)
      const targetY     = cache.outerTop + targetNorm * cache.scrollable
      window.scrollTo({ top: targetY, behavior: 'smooth' })
    }

    // Scroll events spin up the loop; idle timeout shuts it down and snaps.
    // The 400ms snap delay outlasts trackpad momentum lulls — the old 200ms
    // timer fired mid-gesture and fought the user's scroll.
    const onScroll = () => {
      const y = window.scrollY
      if (y !== lastScrollYRef.current) {
        scrollDirRef.current = y > lastScrollYRef.current ? 1 : -1
        lastScrollYRef.current = y
      }
      start()
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(stop, 150)
      if (snapTimerRef.current) clearTimeout(snapTimerRef.current)
      snapTimerRef.current = setTimeout(snapToSlide, 400)
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
    <div
      ref={outerRef}
      role="region"
      aria-label="Featured work"
      aria-roledescription="carousel"
      style={{ height: `calc(${resolvedMultiplier} * 100svh)`, position: 'relative' }}
    >

      <div ref={stageRef} className={styles.stage}>

        {/* ── Slides ── */}
        {slides.map((slide, i) => (
          <div
            key={slide.label}
            ref={el => { slideRefs.current[i] = el }}
            className={styles.slide}
            aria-label={slide.alt ?? slide.label}
            tabIndex={slide.href ? 0 : undefined}
            role={slide.href ? 'link' : undefined}
            onClick={slide.href ? () => {
              analytics.track('Hero Slide Clicked', { href: slide.href!, slideIndex: i })
              router.push(slide.href!)
            } : undefined}
            onKeyDown={slide.href ? (e: React.KeyboardEvent) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                analytics.track('Hero Slide Clicked', { href: slide.href!, slideIndex: i })
                router.push(slide.href!)
              }
            } : undefined}
            style={{
              opacity: 0,
              cursor:  slide.href ? 'pointer' : undefined,
              ...(slide.src ? {} : { background: slide.background ?? COLOR.bgPrimary }),
            }}
          >
            {/* Real <img> (not CSS background) so the preload scanner sees it and
                srcset serves each device its native resolution. Slides 1+ mount
                only after the first slide has decoded (restReady). */}
            {slide.src && (i === 0 || restReady) && (
              <img
                ref={i === 0 ? firstImgRef : undefined}
                src={slide.src}
                srcSet={slide.srcSet}
                sizes={slide.srcSet ? slide.sizes : undefined}
                alt=""
                aria-hidden="true"
                className={utilStyles.imgCover}
                fetchPriority={i === 0 ? 'high' : undefined}
                decoding="async"
                draggable={false}
                onContextMenu={(e) => e.preventDefault()}
              />
            )}
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
        <div className={styles.dots} role="tablist" aria-label="Slide navigation">
          {slides.map((slide, i) => (
            <div
              key={slide.label}
              ref={el => { dotRefs.current[i] = el }}
              className={styles.dot}
              role="tab"
              aria-label={slide.label}
              aria-selected={i === 0}
              tabIndex={0}
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
          <Typography variant="meta" className={styles.hintText} color="rgba(255,255,255,0.4)">
            Scroll
          </Typography>
        </div>

      </div>
    </div>
  )
}
