/**
 * AboutPreview.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Landing page "about" teaser — Option 1.
 * Portrait split into 3 tiled columns, each wipes in from a different edge.
 * Text assembles alongside. Sits inside Container on the landing page.
 *
 * Stack: Next.js · CSS Modules · Storyblok
 *
 * STORYBLOK CONTENT TYPE: about_preview
 *   eyebrow  Text   e.g. "The photographer"
 *   heading  Text   e.g. "Paul Matereke"
 *   body     Textarea  Bio — blank lines become paragraphs
 *   photo    Asset  Portrait — recommended 3:4 ratio
 *
 * REVEAL
 * IntersectionObserver fires once at 15% visibility.
 * Tiles get per-column stagger via inline transition-delay.
 * Text elements use CSS module delay classes.
 * prefers-reduced-motion: elements jump to revealed state instantly.
 *
 * TILE EASING
 * cubic-bezier(0.76, 0, 0.24, 1) — matches KineticGrid column wipes.
 *
 * TYPOGRAPHY
 * Uses Typography component for eyebrow, heading, body.
 * No hardcoded font values in this component.
 */

'use client'

import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { storyblokEditable, type SbBlokData } from '@storyblok/react'
import Typography from '@/components/ui/Typography/Typography'
import { EASING } from '@/tokens'
import styles from './AboutPreview.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AboutPreviewBlok extends SbBlokData {
  eyebrow: string
  heading: string
  body:    string
  photo:   { filename: string; alt?: string }
}

// ─── Tile config ──────────────────────────────────────────────────────────────

// Stagger: centre tile leads (0ms), left and right follow
const TILE_STAGGER_MS  = [60, 0, 120] as const
const TILE_DURATION_MS = 850

// ─── Component ───────────────────────────────────────────────────────────────

export default function AboutPreview({ blok }: { blok: AboutPreviewBlok }) {
  const rootRef    = useRef<HTMLDivElement>(null)
  const tilesRef   = useRef<(HTMLDivElement | null)[]>([])
  const eyebrowRef = useRef<HTMLSpanElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const bodyRef    = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const reveal = () => {
      // Reveal tiles with per-column stagger
      tilesRef.current.forEach((tile, i) => {
        if (!tile) return
        tile.style.transition =
          `clip-path ${TILE_DURATION_MS}ms ${EASING.cinematic} ${TILE_STAGGER_MS[i]}ms`
        tile.classList.add(styles.tileRevealed)
      })
      // Text elements — CSS module handles delays via modifier classes
      eyebrowRef.current?.classList.add(styles.textItemRevealed)
      headingRef.current?.classList.add(styles.textItemRevealed)
      bodyRef.current?.classList.add(styles.textItemRevealed)
    }

    // Respect reduced motion — reveal instantly
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      reveal()
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          reveal()
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )

    observer.observe(root)
    return () => observer.disconnect()
  }, [])

  const paragraphs = blok.body
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean)

  return (
    <div
      ref={rootRef}
      className={styles.root}
      {...storyblokEditable(blok)}
    >
      {/* ── Tiled portrait ── */}
      <div className={styles.tiles}>
        {[0, 1, 2].map(col => (
          <div
            key={col}
            className={styles.tile}
            ref={el => { tilesRef.current[col] = el }}
          >
            {blok.photo?.filename && (
              <Image
                src={blok.photo.filename}
                alt={blok.photo.alt ?? blok.heading}
                fill
                sizes="(max-width: 767px) 33vw, 17vw"
                className={styles.tileImage}
                priority
                onContextMenu={(e) => e.preventDefault()}
                draggable={false}
              />
            )}
          </div>
        ))}
      </div>

      {/* ── Text ── */}
      <div className={styles.text}>
        <Typography
          variant="eyebrow"
          as="span"
          ref={eyebrowRef}
          className={`${styles.textItem}`}
        >
          {blok.eyebrow}
        </Typography>

        <Typography
          variant="headingMedium"
          as="h2"
          ref={headingRef}
          className={`${styles.textItem} ${styles.delay1}`}
        >
          {blok.heading}
        </Typography>

        <div
          ref={bodyRef}
          className={`${styles.textItem} ${styles.delay2}`}
        >
          {paragraphs.map((p, i) => (
            <Typography
              key={i}
              variant="body"
              as="p"
              style={i > 0 ? { marginTop: '1em' } : undefined}
            >
              {p}
            </Typography>
          ))}
        </div>
      </div>
    </div>
  )
}
