'use client'

import { useRef, useEffect } from 'react'
import { COLOR, DURATION, EASING, RADIUS, SPACE } from '@tokens'
import Typography from '@/components/ui/Typography/Typography'
import utilStyles from '@/styles/utility.module.css'
import styles from './Lightbox.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LightboxItem {
  cat: string
  num: string
  ratio: [number, number]
  src?: string
}

export interface LightboxProps {
  list: LightboxItem[]
  index: number
  /** Background colour keyed by category name — used for placeholder cards */
  colors: Record<string, string>
  onClose: () => void
  onNavigate: (dir: 'prev' | 'next') => void
  onJump: (i: number) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ratioLabel([w, h]: [number, number]): string {
  return `${w}:${h}`
}

function thumbWidth([w, h]: [number, number], thumbH = 32): number {
  return Math.round(thumbH * (w / h))
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

export default function Lightbox({
  list,
  index,
  colors,
  onClose,
  onNavigate,
  onJump,
}: LightboxProps) {
  const item      = list[index]
  const color     = colors[item.cat] ?? COLOR.bgSurface
  const thumbsRef = useRef<HTMLDivElement>(null)

  // Keep the active thumbnail visible in the strip without scrolling the page
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

  // Keyboard navigation
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
      className={styles.root}
      onTouchStart={e => { touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }}
      onTouchEnd={e => {
        const dx = e.changedTouches[0].clientX - touchStart.current.x
        const dy = e.changedTouches[0].clientY - touchStart.current.y
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) onNavigate(dx < 0 ? 'next' : 'prev')
      }}
    >
      {/* Top bar */}
      <div className={styles.topBar}>
        <Typography variant="eyebrow">{item.cat}</Typography>
        <Typography variant="small">
          {String(index + 1).padStart(2, '0')} / {String(list.length).padStart(2, '0')}
        </Typography>
        <button
          className={styles.closeBtn}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onClose() }}
        >✕</button>
      </div>

      {/* Image stage */}
      <div className={styles.stage}>
        {item.src ? (
          <img
            src={item.src}
            alt={`${item.cat} ${item.num}`}
            className={utilStyles.imgContain}
          />
        ) : (
          <div className={styles.placeholder} style={{ background: color }}>
            <Typography variant="small">{item.cat}</Typography>
            <Typography variant="eyebrow" color="rgba(179,179,186,0.25)">{ratioLabel(item.ratio)}</Typography>
            <Typography variant="eyebrow" color="rgba(179,179,186,0.12)" style={{ fontSize: '40px' }}>{item.num}</Typography>
          </div>
        )}
      </div>

      {/* Nav buttons */}
      <div className={styles.navBar}>
        {(['prev', 'next'] as const).map(dir => (
          <button
            key={dir}
            className={styles.navBtn}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNavigate(dir) }}
          >
            {dir === 'prev' ? '←' : '→'}
          </button>
        ))}
      </div>

      {/* Thumbnail strip */}
      <div ref={thumbsRef} className={styles.thumbStrip}>
        {list.map((t, i) => (
          <div
            key={t.num + t.cat}
            className={styles.thumb}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onJump(i) }}
            style={{
              width:   thumbWidth(t.ratio),
              background: colors[t.cat] ?? COLOR.bgSurface,
              border:  `0.5px solid ${i === index ? COLOR.borderHover : 'transparent'}`,
              opacity: i === index ? 1 : 0.28,
              transform: i === index ? 'scale(1.1)' : 'scale(1)',
              transition: `opacity ${DURATION.fast} ease, transform ${DURATION.fast} ease`,
            }}
          >
            {t.src
              ? <img src={t.src} alt="" aria-hidden className={utilStyles.imgCover} />
              : <Typography variant="meta">{t.num}</Typography>
            }
          </div>
        ))}
      </div>
    </div>
  )
}
