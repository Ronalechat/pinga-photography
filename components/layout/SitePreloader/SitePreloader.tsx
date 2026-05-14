'use client'
import { useEffect, useState } from 'react'
import Typography from '@/components/ui/Typography/Typography'
import styles from './SitePreloader.module.css'

export default function SitePreloader() {
  const [dismissed, setDismissed] = useState(false)
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const dismiss = () => {
      setDismissed(true)
      // Skip animation entirely under reduced motion — go straight to fade
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setFading(true)
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
        className={`${styles.iris}${dismissed ? ` ${styles.irisActive}` : ''}`}
        onAnimationEnd={() => setFading(true)}
        aria-hidden="true"
      />
    </div>
  )
}
