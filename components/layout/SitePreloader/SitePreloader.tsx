'use client'
import { useEffect, useState } from 'react'
import Typography from '@/components/ui/Typography/Typography'
import styles from './SitePreloader.module.css'

/**
 * Full-screen brand preloader.
 *
 * Timing model: the iris animation starts immediately on mount and runs in
 * parallel with page loading — it is a brand moment, not a progress bar. The
 * preloader fades out once BOTH are true:
 *   1. the page is ready — `preloader:ready` (fired by ScrollHero when the
 *      first hero image has decoded), window `load`, or a 5s safety timeout
 *   2. the iris animation has finished (skipped under reduced motion)
 *
 * Repeat views in the same session skip the preloader entirely — the page
 * behind it is already warm from the HTTP cache, so there is nothing to hide.
 */

const SESSION_KEY = 'pinga:preloader-shown'

export default function SitePreloader() {
  const [dismissed, setDismissed] = useState(false)
  const [animDone, setAnimDone]   = useState(false)
  const [gone, setGone]           = useState(false)

  // Fade out only when the page is ready AND the iris has played out
  const fading = dismissed && animDone

  // Skip on repeat views this session. Must run post-hydration (the server
  // can't read sessionStorage), so it defers a tick; the one-frame flash is
  // invisible — the preloader background matches the page background.
  useEffect(() => {
    let seen = false
    try {
      seen = Boolean(sessionStorage.getItem(SESSION_KEY))
    } catch {
      /* sessionStorage unavailable (private mode) — show the preloader */
    }
    if (!seen) return
    const skip = setTimeout(() => setGone(true), 0)
    return () => clearTimeout(skip)
  }, [])

  useEffect(() => {
    const dismiss = () => {
      setDismissed(true)
      // Skip the iris entirely under reduced motion — go straight to fade
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setAnimDone(true)
      }
    }

    if (document.readyState === 'complete') {
      dismiss()
      return
    }

    const timeout = setTimeout(dismiss, 5000)
    window.addEventListener('preloader:ready', dismiss, { once: true })
    window.addEventListener('load', dismiss, { once: true })

    return () => {
      clearTimeout(timeout)
      window.removeEventListener('preloader:ready', dismiss)
      window.removeEventListener('load', dismiss)
    }
  }, [])

  // Mark the preloader as shown for this session once it starts fading
  useEffect(() => {
    if (!fading) return
    try { sessionStorage.setItem(SESSION_KEY, '1') } catch { /* ignore */ }
  }, [fading])

  if (gone) return null

  return (
    <div
      className={`${styles.root}${fading ? ` ${styles.fading}` : ''}`}
      onTransitionEnd={() => setGone(true)}
      role="status"
      aria-label="Loading"
      aria-hidden={fading}
    >
      <Typography variant="displayThin" as="span" className={styles.wordmark}>
        P!NGA
      </Typography>
      <div
        className={`${styles.iris} ${styles.irisActive}`}
        onAnimationEnd={() => setAnimDone(true)}
        aria-hidden="true"
      />
    </div>
  )
}
