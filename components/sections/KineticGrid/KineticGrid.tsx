'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import { COLOR, DURATION, EASING } from '@tokens'
import PingaToggle from '@/components/ui/ToggleButton/PingaToggle'
import Typography from '@/components/ui/Typography/Typography'
import Lightbox from '@/components/ui/Lightbox/Lightbox'
import { analytics } from '@/lib/analytics'
import utilStyles from '@/styles/utility.module.css'
import styles from './KineticGrid.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PhotoConfig {
  cat: string
  /**
   * Aspect ratio as [width, height].
   * Drives placeholder sizing. With real <img> tags this is unused —
   * the card height becomes the image's natural height automatically.
   */
  ratio: [number, number]
  num: string
  /**
   * Image source. When provided, renders a real <img> instead of a placeholder.
   * e.g. src: '/images/street-01.jpg'
   */
  src?: string
  /** Responsive srcset — lets the browser pick the width matching layout × DPR */
  srcSet?: string
  /** sizes attribute paired with srcSet */
  sizes?: string
  /** High-res URL for the lightbox — swapped in after the cached grid image shows */
  srcHigh?: string
}

export interface KineticGridProps {
  categories: Record<string, PhotoConfig[]>
  /** How many items per category to show in the "All" view. @default 4 */
  allPreviewCount?: number
  /** Background colour per category for placeholders */
  categoryColors?: Record<string, string>
  /** Section eyebrow label @default "Selected Work" */
  eyebrow?: string
  /** Pre-select a category filter on mount (e.g. from ?category= query param) */
  defaultCategory?: string
  /** Include the synthetic "All" filter. Disable for exhibit-style category sets. @default true */
  includeAllFilter?: boolean
  /** When true, hides filter tabs and shows all photos without the allPreviewCount cap. Uncategorised photos appear last. */
  showAllPhotos?: boolean
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULT_COLORS: Record<string, string> = {
  'Street':         '#1e3a5f',
  'Portraits':      '#5c2d1e',
  'Engagements':    '#1a4a32',
  'New Beginnings': '#4a3a10',
  'Exhibition':     '#1a2a5c',
}

const UNCATEGORISED = 'Uncategorised'

const DIRS    = ['left', 'top', 'right'] as const
const STAGGER = [60, 0, 120]

function ratioPct([w, h]: [number, number]): string {
  return `${((h / w) * 100).toFixed(2)}%`
}

function ratioLabel([w, h]: [number, number]): string {
  return `${w}:${h}`
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function Card({ item, colIndex, color, onClick, cardIndex }: {
  item: PhotoConfig
  colIndex: number
  color: string
  onClick: () => void
  cardIndex: number
}) {
  const isEager = cardIndex < 3
  return (
    <div
      className={styles.card}
      data-dir={DIRS[colIndex]}
      data-col={colIndex}
      data-reveal="pending"
      onClick={(e) => { e.preventDefault(); onClick() }}
      style={{
        background:  color,
        opacity:     0,
        transform:   DIRS[colIndex] === 'left' ? 'translateX(-14px)'
                   : DIRS[colIndex] === 'top'  ? 'translateY(-14px)'
                                               : 'translateX(14px)',
        willChange: 'opacity, transform',
      }}
    >
      {/* Real image — skeleton fades out as image fades in */}
      {item.src ? (
        <>
          <div className={styles.skeleton} aria-hidden="true" />
          <img
            src={item.src}
            srcSet={item.srcSet}
            sizes={item.srcSet ? item.sizes : undefined}
            alt={`${item.cat} ${item.num}`}
            className={utilStyles.imgBlock}
            loading={isEager ? 'eager' : 'lazy'}
            fetchPriority={cardIndex === 0 ? 'high' : undefined}
            decoding={isEager ? 'sync' : 'async'}
            style={{ opacity: 0, transition: `opacity ${DURATION.standard} ease` }}
            onLoad={(e) => {
              e.currentTarget.style.opacity = '1'
              const skeleton = e.currentTarget.previousElementSibling as HTMLElement | null
              if (skeleton) skeleton.style.opacity = '0'
            }}
            ref={(el) => {
              if (el?.complete) {
                el.style.opacity = '1'
                const skeleton = el.previousElementSibling as HTMLElement | null
                if (skeleton) skeleton.style.opacity = '0'
              }
            }}
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
        </>
      ) : (
        <div style={{ paddingTop: ratioPct(item.ratio) }} />
      )}

      {/* Placeholder labels (removed once real images are wired in) */}
      {!item.src && (
        <div className={styles.placeholderContent}>
          <Typography variant="eyebrow">{item.cat}</Typography>
          <Typography variant="eyebrow" color="rgba(179,179,186,0.25)">{ratioLabel(item.ratio)}</Typography>
          <Typography variant="eyebrow" color="rgba(179,179,186,0.18)">{item.num}</Typography>
        </div>
      )}

      {/* Hover meta bar — resting state and hover reveal both in KineticGrid.module.css */}
      <div className={styles.cardMeta}>
        <Typography variant="meta" color={COLOR.textPrimary}>
          {item.cat === UNCATEGORISED ? '' : item.cat}
        </Typography>
      </div>
    </div>
  )
}

// ─── KineticGrid ──────────────────────────────────────────────────────────────

export default function KineticGrid({
  categories,
  categoryColors  = DEFAULT_COLORS,
  eyebrow         = 'Selected Work',
  defaultCategory,
  includeAllFilter = true,
  showAllPhotos   = false,
}: KineticGridProps) {
  const catNames = Object.keys(categories)
  const [lightbox, setLightbox] = useState<{ list: PhotoConfig[]; index: number } | null>(null)
  const shellRef = useRef<HTMLDivElement>(null)

  // Named categories only — Uncategorised is never shown as a filter tab
  const namedCats = catNames.filter(k => k !== UNCATEGORISED)
  const fallbackCategory = includeAllFilter ? 'all' : namedCats[0] ?? UNCATEGORISED
  const [activeFilter, setActiveFilter] = useState(defaultCategory ?? fallbackCategory)
  const filterOptions = includeAllFilter ? ['all', ...namedCats] : namedCats

  // Full flat list: named categories first, uncategorised appended.
  // allPreviewCount documents the intended Gallery "All" cap at the prop level,
  // but the existing Gallery behaviour remains unchanged for now.
  const allPhotosFlat: PhotoConfig[] = [
    ...namedCats.flatMap(cat => categories[cat] ?? []),
    ...(categories[UNCATEGORISED] ?? []),
  ]

  const activeList = showAllPhotos
    ? allPhotosFlat
    : activeFilter === 'all'
    ? allPhotosFlat
    : (categories[activeFilter] ?? [])

  // Cache the prefers-reduced-motion value — querying matchMedia per frame (or per scroll
  // event) creates a new MQL object each time. One cached ref + a change listener is enough.
  const reducedMotionRef = useRef(false)
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionRef.current = mql.matches
    const onChange = (e: MediaQueryListEvent) => { reducedMotionRef.current = e.matches }
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Scroll-based reveal — uses getBoundingClientRect so it works in any scroll context.
  // Transition uses opacity + transform (compositor-only) rather than clip-path (repaint per frame).
  //
  // Image-load guard: if the card contains an <img> that hasn't finished downloading,
  // the reveal is deferred until the image settles (load or error). This ensures the
  // animation always reveals a photo, never a placeholder-coloured box.
  // A 3-second timeout fires the reveal unconditionally so a card is never stuck
  // invisible on a very slow or failing connection.
  const checkReveals = useCallback(() => {
    const shell = shellRef.current
    if (!shell) return
    const reducedMotion = reducedMotionRef.current

    // Early-exit: if the shell itself is fully offscreen, no card can be visible.
    const shellRect = shell.getBoundingClientRect()
    if (shellRect.bottom < 0 || shellRect.top > window.innerHeight) return

    const doReveal = (card: HTMLElement) => {
      const col = parseInt(card.dataset.col ?? '0')
      if (reducedMotion) {
        card.style.opacity    = '1'
        card.style.transform  = 'translate(0, 0)'
        card.style.willChange = 'auto'
      } else {
        const delay = `${STAGGER[col] ?? 0}ms`
        card.style.transition = `opacity ${DURATION.reveal} ${EASING.cinematic} ${delay}, transform ${DURATION.reveal} ${EASING.cinematic} ${delay}`
        card.style.opacity    = '1'
        card.style.transform  = 'translate(0, 0)'
        card.addEventListener('transitionend', () => { card.style.willChange = 'auto' }, { once: true })
      }
      card.dataset.reveal = 'done'
    }

    shell.querySelectorAll<HTMLElement>('[data-reveal="pending"]').forEach(card => {
      const rect = card.getBoundingClientRect()
      if (!(rect.bottom > 0 && rect.top < window.innerHeight - 40)) return

      const img = card.querySelector('img')

      if (!img || img.complete) {
        // No image (placeholder card) or image already settled — reveal immediately
        doReveal(card)
      } else {
        // Image still downloading — park the card so scroll events skip it,
        // then reveal the moment it settles or after 3 seconds, whichever comes first
        card.dataset.reveal = 'waiting'
        const fallback = setTimeout(() => { if (card.dataset.reveal === 'waiting') doReveal(card) }, 3000)
        const onSettled = () => { clearTimeout(fallback); doReveal(card) }
        img.addEventListener('load',  onSettled, { once: true })
        img.addEventListener('error', onSettled, { once: true })
      }
    })
  }, [])

  useEffect(() => {
    const shell = shellRef.current
    if (!shell) return

    let rafId = 0
    let rafPending = false
    let isVisible = true
    rafId = requestAnimationFrame(checkReveals)

    // Gate the scroll listener with rAF — collapses N scroll events per frame
    // into a single checkReveals call, matching the ScrollHero pattern.
    // IntersectionObserver suspends the rAF gate when the grid is fully offscreen,
    // so zero work is done during other-page scrolling.
    const onScroll = () => {
      if (rafPending || !isVisible) return
      rafPending = true
      rafId = requestAnimationFrame(() => { checkReveals(); rafPending = false })
    }

    let observer: IntersectionObserver | null = null
    if (typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        ([entry]) => { isVisible = entry.isIntersecting },
        { rootMargin: '200px 0px' },
      )
      observer.observe(shell)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { cancelAnimationFrame(rafId); observer?.disconnect(); window.removeEventListener('scroll', onScroll) }
  }, [activeFilter, checkReveals])

  useEffect(() => {
    document.body.style.overflow = lightbox ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightbox])

  const [colCount, setColCount] = useState(3)

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)')
    const tablet = window.matchMedia('(max-width: 1023px)')
    const update = () => {
      if (mobile.matches)        setColCount(1)
      else if (tablet.matches)   setColCount(2)
      else                       setColCount(3)
    }
    update()
    mobile.addEventListener('change', update)
    tablet.addEventListener('change', update)
    return () => {
      mobile.removeEventListener('change', update)
      tablet.removeEventListener('change', update)
    }
  }, [])

  const cols: PhotoConfig[][] = Array.from({ length: colCount }, () => [])
  activeList.forEach((item, i) => cols[i % colCount].push(item))

  return (
    <div ref={shellRef} className={styles.shell}>
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header}>
          <Typography variant="eyebrow" style={{ opacity: 0.6, whiteSpace: 'nowrap' }}>{eyebrow}</Typography>
          <div className={styles.divider} />
          <Typography variant="eyebrow" style={{ opacity: 0.4 }}>
            {activeList.length} image{activeList.length !== 1 ? 's' : ''}
          </Typography>
        </div>

        {/* Filters — hidden when showAllPhotos */}
        {!showAllPhotos && (
          <div className={styles.filters}>
            <PingaToggle
              options={filterOptions}
              selected={activeFilter}
              onChange={(v) => {
                analytics.track('Gallery Filter Changed', { filter: v })
                setActiveFilter(v as string)
              }}
              variant="primary"
            />
          </div>
        )}

        {/* Grid */}
        <div
          className={styles.grid}
          style={{ '--grid-cols': colCount } as React.CSSProperties}
        >
          {cols.map((col, colIdx) => (
            <div key={colIdx} className={styles.column}>
              {col.map((item, rowIdx) => (
                <Card
                  key={`${item.cat}-${item.num}`}
                  item={item}
                  colIndex={colIdx % 3}
                  color={categoryColors[item.cat] ?? COLOR.bgSurface}
                  cardIndex={rowIdx * colCount + colIdx}
                  onClick={() => {
                    analytics.track('Lightbox Opened', { category: item.cat, imageNum: item.num })
                    setLightbox({ list: activeList, index: rowIdx * colCount + colIdx })
                  }}
                />
              ))}
            </div>
          ))}
        </div>

      </div>

      {lightbox && createPortal(
        <Lightbox
          list={lightbox.list}
          index={lightbox.index}
          colors={categoryColors}
          onClose={() => setLightbox(null)}
          onNavigate={dir => {
            const len  = lightbox.list.length
            const next = dir === 'next' ? (lightbox.index + 1) % len : (lightbox.index - 1 + len) % len
            setLightbox({ ...lightbox, index: next })
          }}
          onJump={i => setLightbox({ ...lightbox, index: i })}
        />,
        document.body,
      )}
    </div>
  )
}
