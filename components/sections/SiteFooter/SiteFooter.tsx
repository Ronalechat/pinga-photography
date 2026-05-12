/**
 * SiteFooter.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Site-wide footer — photographer name, nav links, location, copyright.
 *
 * Stack: Next.js · CSS Modules · Storyblok
 *
 * STORYBLOK CONTENT TYPE
 * Create a "site_footer" component (or manage as a global datasource) with:
 *   name          Text    Photographer name, e.g. "P!nga"
 *   instagram_url Text    Full URL, e.g. "https://instagram.com/pinga.matereke"
 *   location      Text    e.g. "Sydney, AU"
 *   year          Number  Copyright year, e.g. 2025
 *
 * ENQUIRE LINK BEHAVIOUR
 * - On the landing page (/): intercepts click and scrollIntoView on #enquire.
 * - On all other pages: navigates to /enquiry (Next.js follows the href).
 * Both cases use href="/enquiry" — the intercept is handled inside the
 * component by comparing pathname to "/".
 *
 * OPTICAL ALIGNMENT
 * The name uses text-box / leading-trim to crop the font's built-in ascender
 * space so the element box sits at cap height. This aligns the name visually
 * with the top of the smaller links beside it — no negative margin needed.
 * See SiteFooter.module.css for the full explanation.
 *
 * EXTERNAL LINK ARROW
 * Leads on desktop (right-aligned column — arrow protrudes left harmlessly).
 * Trails on mobile (left-aligned column — arrow protrudes right harmlessly).
 * Controlled via CSS `order` — no conditional rendering needed.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { storyblokEditable, type SbBlokData } from '@storyblok/react'
import { analytics } from '@/lib/analytics'
import styles from './SiteFooter.module.css'

const SITE_ENV = process.env.NEXT_PUBLIC_SITE_ENV?.toLowerCase()
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL?.toLowerCase()
const IS_STAGING = SITE_ENV === 'staging' || SITE_URL?.includes('staging') === true

// ─── Storyblok blok type ──────────────────────────────────────────────────────

export interface SiteFooterBlok extends SbBlokData {
  name:          string
  instagram_url: string
  location:      string
  year:          number
}

// ─── Props — accepts either a Storyblok blok or plain props ──────────────────

export interface SiteFooterProps {
  blok?: SiteFooterBlok
  /** Fallback when not driven by Storyblok */
  name?:         string
  instagramUrl?: string
  location?:     string
  year?:         number
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SiteFooter({
  blok,
  name         = blok?.name          ?? 'P!nga',
  instagramUrl = blok?.instagram_url ?? 'https://instagram.com/pinga.matereke',
  location     = blok?.location      ?? 'Sydney, AU',
  year         = blok?.year          ?? new Date().getFullYear(),
}: SiteFooterProps) {
  const pathname = usePathname()

  /**
   * Enquire click handler.
   * On the landing page scroll to #enquire smoothly.
   * On other pages let Next.js navigate to /#enquire.
   */
  const handleEnquire = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault()
      document.getElementById('enquire')?.scrollIntoView({ behavior: 'smooth' })
    }
    // Other pages: default link behaviour navigates to /enquiry
  }, [pathname])

  return (
    <footer
      className={styles.root}
      {...(blok ? storyblokEditable(blok) : {})}
    >

      {/* ── Main row: name left · links right ── */}
      <div className={styles.main}>

        <span className={styles.name}>{name}</span>

        <nav className={styles.links} aria-label="Footer navigation">
          <Link href="/gallery" className={styles.link}>
            Gallery
          </Link>

          <Link href="/exhibits" className={styles.link}>
            Exhibits
          </Link>

          <Link href="/shop" className={styles.link}>
            Shop
          </Link>

          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
            aria-label="Instagram (opens in new tab)"
            onClick={() => analytics.track('Instagram Link Clicked')}
          >
            {/*
             * Arrow span — CSS order swaps it:
             *   Desktop (right-aligned): order -1 → leads left of text
             *   Mobile  (left-aligned):  order  1 → trails right of text
             */}
            <span className={styles.arrow} aria-hidden="true">↗</span>
            Instagram
          </a>

          <Link
            href="/enquiry"
            className={styles.link}
            onClick={handleEnquire}
          >
            Enquire
          </Link>
        </nav>

      </div>

      {/* ── Rule ── */}
      <div className={styles.rule} role="separator" />

      {/* ── Bar: copyright + credit left · location right ── */}
      <div className={styles.bar}>
        <div className={styles.barLeft}>
          <span className={styles.copy}>© {year}</span>
          <span className={styles.environment}>Staging</span>
          <span className={styles.credit}>Website designed and assembled by Michael Z Lin</span>
        </div>
        <span className={styles.location}>{location}</span>
      </div>

    </footer>
  )
}
