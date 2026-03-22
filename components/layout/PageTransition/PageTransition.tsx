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
 *   diagonalWipe — #2a2a3a panel sweeps left→right with a diagonal edge,
 *                  then off screen. Covers the page switch moment.
 *
 *   stripReveal  — five vertical strips slide upward with stagger,
 *                  revealing the new page beneath. Shares visual language
 *                  with the KineticGrid column wipes.
 *
 * WIPE COLOUR
 *   #2a2a3a — slightly lifted from the page background. Enough contrast
 *   to register without jarring. Uses no white — no flash-bang effect.
 *
 * APP ROUTER NOTES
 *   usePathname() is the key for AnimatePresence — changing it triggers
 *   the exit/enter cycle. mode="wait" ensures exit completes before enter
 *   begins, giving the overlay time to play.
 *
 *   For diagonalWipe and stripReveal, the overlay is a fixed-position
 *   element that animates independently of AnimatePresence. It plays
 *   on every pathname change, covering the transition moment.
 *
 * SCROLL
 *   App Router scrolls to top on navigation by default. The transition
 *   wrapper does not interfere with this behaviour.
 */

'use client'

import { usePathname } from 'next/navigation'
import { AnimatePresence, motion, useAnimate } from 'framer-motion'
import { useEffect, useRef } from 'react'
import styles from './PageTransition.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TransitionVariant = 'liftSlide' | 'diagonalWipe' | 'stripReveal'

export interface PageTransitionProps {
  children:  React.ReactNode
  variant?:  TransitionVariant
}

// ─── Constants ────────────────────────────────────────────────────────────────

const WIPE_COLOUR  = '#2a2a3a'
const STRIP_COUNT  = 5
const EASING_SHARP = [0.76, 0, 0.24, 1] as const
const EASING_ENTER = [0.22, 1, 0.36, 1] as const

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
      ease: EASING_ENTER,
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

// ─── DiagonalWipe overlay ─────────────────────────────────────────────────────

function DiagonalWipeOverlay({ trigger }: { trigger: number }) {
  const [scope, animate] = useAnimate()

  useEffect(() => {
    if (trigger === 0) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    async function play() {
      // Panel sweeps in from left with diagonal trailing edge
      await animate(
        scope.current,
        { clipPath: 'polygon(0 0, 110% 0, 100% 100%, 0 100%)' },
        { duration: 0.34, ease: EASING_SHARP }
      )
      // Panel sweeps off to the right — reveals new page
      await animate(
        scope.current,
        { clipPath: 'polygon(110% 0, 110% 0, 100% 100%, 110% 100%)' },
        { duration: 0.34, ease: EASING_SHARP }
      )
      // Reset for next transition
      animate(
        scope.current,
        { clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' },
        { duration: 0 }
      )
    }
    play()
  }, [trigger, animate, scope])

  return (
    <div className={styles.overlay}>
      <div
        ref={scope}
        className={styles.diagonalPanel}
        style={{ clipPath: 'polygon(0 0, 0 0, 0 100%, 0 100%)' }}
      />
    </div>
  )
}

// ─── StripReveal overlay ──────────────────────────────────────────────────────

function StripRevealOverlay({ trigger }: { trigger: number }) {
  const stripRefs = useRef<(HTMLDivElement | null)[]>([])
  const [scope, animate] = useAnimate()

  useEffect(() => {
    if (trigger === 0) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    async function play() {
      const strips = stripRefs.current.filter(Boolean) as HTMLDivElement[]

      // Reset all strips to starting position
      strips.forEach(s => { s.style.transform = 'translateY(0)'; s.style.transition = 'none' })
      void scope.current?.offsetHeight

      // Stagger each strip sliding upward
      const staggerMs = 55
      const durationMs = 420

      strips.forEach((s, i) => {
        setTimeout(() => {
          s.style.transition = `transform ${durationMs}ms cubic-bezier(0.76, 0, 0.24, 1)`
          s.style.transform = 'translateY(-101%)'
        }, i * staggerMs)
      })

      // Wait for last strip to complete
      await new Promise(r =>
        setTimeout(r, staggerMs * (STRIP_COUNT - 1) + durationMs + 20)
      )
    }
    play()
  }, [trigger, animate, scope])

  const strips = Array.from({ length: STRIP_COUNT }, (_, i) => i)

  return (
    <div className={styles.overlay} ref={scope}>
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
    prevPathRef.current  = pathname
    overlayTriggerRef.current += 1
  }

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
       * This gives the overlay time to start its sweep before the
       * new page content appears.
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
