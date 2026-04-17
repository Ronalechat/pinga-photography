/**
 * PageTransition.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Client wrapper for Next.js App Router page transitions using Framer Motion.
 *
 * SETUP
 *   npm install framer-motion
 *
 *   In app/layout.tsx, wrap children:
 *     import PageTransition from '@/components/layout/PageTransition'
 *
 *     export default function RootLayout({ children }) {
 *       return (
 *         <html>
 *           <body>
 *             <SiteHeader />
 *             <PageTransition variant="diagonalWipe">
 *               {children}
 *             </PageTransition>
 *             <SiteFooter />
 *           </body>
 *         </html>
 *       )
 *     }
 *
 * VARIANTS
 *   liftSlide    — fade out left/up, new page lifts in from below.
 *                  Pure Framer Motion variants, no overlay.
 *
 *   diagonalWipe — #2a2a3a panel sweeps off-screen with a diagonal edge,
 *                  revealing the new page beneath.
 *
 *   stripReveal  — five vertical strips slide upward with stagger,
 *                  revealing the new page beneath. Shares visual language
 *                  with the KineticGrid column wipes.
 *
 * WIPE COLOUR
 *   #2a2a3a — slightly lifted from the page background. Enough contrast
 *   to register without jarring. Uses no white — no flash-bang effect.
 *
 * FLASH FIX
 *   The overlay uses useLayoutEffect to cover the screen synchronously
 *   before the browser paints the new page content. useEffect (which fires
 *   after paint) was the source of the "new page flashes in for a few frames"
 *   bug — the panel started too late. useLayoutEffect fires before the paint,
 *   so the screen is already covered when the new route first renders.
 *   useEffect + rAF then animates the panel off.
 *
 * APP ROUTER NOTES
 *   usePathname() is the key for AnimatePresence — changing it triggers
 *   the exit/enter cycle. mode="wait" ensures exit completes before enter
 *   begins.
 *
 * SCROLL
 *   App Router scrolls to top on navigation by default. The transition
 *   wrapper does not interfere with this behaviour.
 */

'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef } from 'react'
import { analytics } from '@/lib/analytics'
import styles from './PageTransition.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransitionVariant = 'liftSlide' | 'diagonalWipe' | 'stripReveal'

export interface PageTransitionProps {
  children:  React.ReactNode
  variant?:  TransitionVariant
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STRIP_COUNT  = 5
const EASING_SHARP = 'cubic-bezier(0.76, 0, 0.24, 1)'

// ─── Framer Motion variants — liftSlide ──────────────────────────────────────

const liftSlideVariants = {
  initial: {
    opacity: 0,
    y: 16,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    x: -20,
    transition: {
      duration: 0.22,
      ease: 'easeIn' as const,
    },
  },
}

// Fade-only variants used for diagonalWipe + stripReveal —
// the overlay handles the visual wipe, page just fades simply.
const overlayPageVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' as const, delay: 0.1 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15, ease: 'easeIn' as const },
  },
}

// ─── DiagonalWipeOverlay ──────────────────────────────────────────────────────

function DiagonalWipeOverlay({ trigger }: { trigger: number }) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Cover the screen synchronously before the browser paints new page content.
  // This runs before paint — no frames where new content is visible unmasked.
  useLayoutEffect(() => {
    if (trigger === 0) return
    const panel = panelRef.current
    if (!panel) return
    panel.style.transition = 'none'
    panel.style.clipPath   = 'polygon(0 0, 110% 0, 100% 100%, 0 100%)'
  }, [trigger])

  // Animate the panel off-screen to reveal the new page.
  // rAF ensures the covered frame has been painted before the transition starts.
  useEffect(() => {
    if (trigger === 0) return
    const panel = panelRef.current
    if (!panel) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) {
      panel.style.transition = 'none'
      panel.style.clipPath   = 'polygon(0 0, 0 0, 0 100%, 0 100%)'
      return
    }

    const rafId = requestAnimationFrame(() => {
      panel.style.transition = `clip-path 0.34s ${EASING_SHARP}`
      panel.style.clipPath   = 'polygon(110% 0, 110% 0, 100% 100%, 110% 100%)'
    })

    const resetId = setTimeout(() => {
      panel.style.transition = 'none'
      panel.style.clipPath   = 'polygon(0 0, 0 0, 0 100%, 0 100%)'
    }, 340 + 50)

    return () => {
      cancelAnimationFrame(rafId)
      clearTimeout(resetId)
    }
  }, [trigger])

  return (
    <div className={styles.overlay}>
      <div
        ref={panelRef}
        className={styles.diagonalPanel}
        style={{ clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
      />
    </div>
  )
}

// ─── StripRevealOverlay ───────────────────────────────────────────────────────

function StripRevealOverlay({ trigger }: { trigger: number }) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const stripRefs  = useRef<(HTMLDivElement | null)[]>([])

  // Reset all strips to covering position synchronously before paint.
  useLayoutEffect(() => {
    if (trigger === 0) return
    const strips = stripRefs.current.filter(Boolean) as HTMLDivElement[]
    strips.forEach(s => {
      s.style.transition = 'none'
      s.style.transform  = 'translateY(0)'
    })
    // Force reflow so reset registers before the transition is applied
    void overlayRef.current?.offsetHeight
  }, [trigger])

  // Animate strips upward to reveal the new page.
  useEffect(() => {
    if (trigger === 0) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const timerIds: ReturnType<typeof setTimeout>[] = []
    const staggerMs  = 55
    const durationMs = 420

    const rafId = requestAnimationFrame(() => {
      const strips = stripRefs.current.filter(Boolean) as HTMLDivElement[]
      strips.forEach((s, i) => {
        timerIds.push(setTimeout(() => {
          s.style.transition = `transform ${durationMs}ms ${EASING_SHARP}`
          s.style.transform  = 'translateY(-101%)'
        }, i * staggerMs))
      })
    })

    return () => {
      cancelAnimationFrame(rafId)
      timerIds.forEach(id => clearTimeout(id))
    }
  }, [trigger])

  const strips = Array.from({ length: STRIP_COUNT }, (_, i) => i)

  return (
    <div className={styles.overlay} ref={overlayRef}>
      {strips.map(i => (
        <div
          key={i}
          ref={el => { stripRefs.current[i] = el }}
          className={styles.strip}
          style={{
            left:      `${(i / STRIP_COUNT) * 100}%`,
            width:     `${(1 / STRIP_COUNT) * 100 + 0.4}%`,
            transform: 'translateY(0)',
          }}
        />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PageTransition({
  children,
  variant = 'liftSlide',
}: PageTransitionProps) {
  const pathname          = usePathname()
  const overlayTriggerRef = useRef(0)
  const prevPathRef       = useRef(pathname)

  // Increment trigger on every route change (overlay transitions only)
  if (pathname !== prevPathRef.current) {
    prevPathRef.current       = pathname
    overlayTriggerRef.current += 1
  }

  // Fire page view on every route change
  useEffect(() => {
    analytics.page()
  }, [pathname])

  const overlayTrigger = overlayTriggerRef.current
  const isLiftSlide    = variant === 'liftSlide'
  const pageVariants   = isLiftSlide ? liftSlideVariants : overlayPageVariants

  return (
    <>
      {/* Overlay — only rendered for wipe transitions */}
      {variant === 'diagonalWipe' && (
        <DiagonalWipeOverlay trigger={overlayTrigger} />
      )}
      {variant === 'stripReveal' && (
        <StripRevealOverlay trigger={overlayTrigger} />
      )}

      {/*
       * AnimatePresence with pathname as key.
       * mode="wait" — exit animation completes before enter begins.
       */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          className={styles.page}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </>
  )
}
