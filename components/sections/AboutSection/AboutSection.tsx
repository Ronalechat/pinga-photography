/**
 * AboutSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Full "about" page section — Option 2.
 * Name lifts from beneath clip container, photo wipes upward, text fades in.
 * Reserved for a future /about route.
 *
 * Stack: Next.js · CSS Modules · Storyblok
 *
 * STORYBLOK CONTENT TYPE: about_section
 *   forename  Text     e.g. "Paul"  (rendered in full brightness)
 *   surname   Text     e.g. "Matereke"  (rendered muted — decorative)
 *   eyebrow   Text     e.g. "The photographer"
 *   body      Textarea Bio — blank lines become paragraphs
 *   photo     Asset    Portrait — recommended 3:4 ratio
 *
 * JUMP FIX
 * Removing the .revealed class while a CSS transition is active causes
 * the browser to reverse-animate before playing forward — visible jump.
 * Fix: strip transition inline, force reflow, restore transition, add .revealed.
 *
 * TYPOGRAPHY
 * Name uses CSS module .nameLift (displayThin values + transform).
 * Eyebrow and body use Typography component variants.
 */

'use client'

import Image from 'next/image'
import { useEffect, useRef, useCallback } from 'react'
import { storyblokEditable, type SbBlokData } from '@storyblok/react'
import Typography from '@/components/ui/Typography/Typography'
import { EASING } from '@/tokens'
import styles from './AboutSection.module.css'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AboutSectionBlok extends SbBlokData {
  forename: string
  surname:  string
  eyebrow:  string
  body:     string
  photo:    { filename: string; alt?: string }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AboutSection({ blok }: { blok: AboutSectionBlok }) {
  const rootRef    = useRef<HTMLDivElement>(null)
  const nameRef    = useRef<HTMLSpanElement>(null)
  const photoRef   = useRef<HTMLDivElement>(null)
  const eyebrowRef = useRef<HTMLSpanElement>(null)
  const bodyRef    = useRef<HTMLDivElement>(null)

  const reveal = useCallback(() => {
    const name    = nameRef.current
    const photo   = photoRef.current
    const eyebrow = eyebrowRef.current
    const body    = bodyRef.current

    if (!name || !photo || !eyebrow || !body) return

    /*
     * Jump fix:
     * 1. Strip transitions so elements snap instantly to start state
     * 2. Force reflow — browser registers the snapped positions
     * 3. Restore transitions then add .revealed — clean forward animation
     */
    name.style.transition    = 'none'
    eyebrow.style.transition = 'none'
    body.style.transition    = 'none'
    photo.style.transition   = 'none'

    name.classList.remove(styles.revealed)
    photo.classList.remove(styles.revealed)
    eyebrow.classList.remove(styles.revealed)
    body.classList.remove(styles.revealed)

    void rootRef.current?.offsetHeight

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        name.style.transition  = `transform 0.75s ${EASING.spring}`
        photo.style.transition = `clip-path 0.9s ${EASING.cinematic} 0.15s`
        eyebrow.style.transition = ''
        body.style.transition    = ''

        name.classList.add(styles.revealed)
        photo.classList.add(styles.revealed)
        eyebrow.classList.add(styles.revealed)
        body.classList.add(styles.revealed)
      })
    })
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

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
  }, [reveal])

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
      {/* ── Name lift ── */}
      <div className={styles.nameClip}>
        <span ref={nameRef} className={styles.nameLift}>
          {blok.forename}{' '}
          <span className={styles.surname}>{blok.surname}</span>
        </span>
      </div>

      {/* ── Grid: photo + text ── */}
      <div className={styles.grid}>

        <div ref={photoRef} className={styles.photoWrap}>
          {blok.photo?.filename && (
            <Image
              src={blok.photo.filename}
              alt={blok.photo.alt ?? `${blok.forename} ${blok.surname}`}
              fill
              sizes="(max-width: 767px) 100vw, 33vw"
              className={styles.photo}
              priority
            />
          )}
        </div>

        <div className={styles.textCol}>
          <Typography
            variant="eyebrow"
            as="span"
            ref={eyebrowRef}
            className={styles.textItem}
          >
            {blok.eyebrow}
          </Typography>

          <div
            ref={bodyRef}
            className={`${styles.textItem} ${styles.textItemBody}`}
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
    </div>
  )
}
