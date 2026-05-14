'use client'
import { useEffect, useState } from 'react'
import Typography from '@/components/ui/Typography/Typography'
import { hasBannerBeenSeen, dismissBanner, optOut } from '@/lib/analytics'
import styles from './ConsentBanner.module.css'

export default function ConsentBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!hasBannerBeenSeen()) setVisible(true)
  }, [])

  if (!visible) return null

  const handleDismiss = () => {
    dismissBanner()
    setVisible(false)
  }

  const handleOptOut = () => {
    optOut()
    setVisible(false)
  }

  return (
    <div className={styles.root} role="region" aria-label="Analytics notice">
      <Typography variant="caption" as="p" className={styles.text}>
        This site uses analytics to understand how visitors interact with it.
      </Typography>
      <div className={styles.actions}>
        <button className={styles.btn} onClick={handleDismiss}>Got it</button>
        <button className={styles.btn} onClick={handleOptOut}>Opt out</button>
      </div>
    </div>
  )
}
