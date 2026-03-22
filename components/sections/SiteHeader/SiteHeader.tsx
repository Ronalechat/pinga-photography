/**
 * SiteHeader.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Site-wide fixed header — stacked-left cluster with colour-reactive text.
 *
 * Stack: Next.js App Router · CSS Modules · Storyblok
 *
 * COLOUR REACTIVITY
 * All text uses `mix-blend-mode: difference` in the CSS module.
 * White text inverts pixel-by-pixel against whatever is behind it —
 * stays white on dark backgrounds, inverts to dark on light ones.
 *
 * REQUIRED: any full-bleed section the header floats over (ScrollHero,
 * gallery, etc.) must have `isolation: isolate` on its wrapper element.
 * Without it the blend composites against the document root instead of
 * the element behind the header.
 *
 * LAYOUT
 * Desktop: stacked — name above, links below (Option D).
 * Mobile:  single row — name left, links right.
 *
 * ACTIVE STATE
 * Uses Next.js usePathname to apply aria-current="page" to the active link.
 * The CSS module dims the active link slightly so the current page is
 * indicated without adding any extra visual element.
 *
 * ENQUIRE SCROLL INTERCEPT
 * On the landing page (/) the Enquire link scrolls to #enquire smoothly
 * rather than navigating. On other pages it navigates to /#enquire.
 *
 * STORYBLOK
 * The nav links are hardcoded since this is a two-link site. If the nav
 * grows, replace NAV_LINKS with a Storyblok datasource fetch.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback } from 'react'
import styles from './SiteHeader.module.css'

// ─── Nav config ───────────────────────────────────────────────────────────────
// With only two links, hardcoding is simpler than a CMS datasource.
// Extend this array if the nav grows.

const NAV_LINKS = [
  { label: 'Gallery', href: '/gallery' },
  { label: 'Enquire', href: '/#enquire', scrollId: 'enquire' },
] as const

// ─── Props ───────────────────────────────────────────────────────────────────

export interface SiteHeaderProps {
  /** Photographer name shown as the home link. @default 'Pinga' */
  name?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SiteHeader({ name = 'Pinga' }: SiteHeaderProps) {
  const pathname = usePathname()

  /**
   * Enquire scroll intercept.
   * On / scroll to #enquire. On other pages navigate to /#enquire.
   */
  const handleEnquire = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    if (pathname === '/') {
      e.preventDefault()
      document.getElementById('enquire')?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [pathname])

  return (
    <header className={styles.root}>
      {/*
       * .cluster is inline-flex so pointer-events only covers the actual
       * text area — clicks on empty header space pass through to the content.
       *
       * On mobile .cluster becomes full-width flex-row via the CSS module
       * breakpoint — no JS or conditional rendering needed.
       */}
      <div className={styles.cluster}>

        {/* Name — links to home */}
        <Link
          href="/"
          className={styles.name}
          aria-label={`${name} — home`}
        >
          {name}
        </Link>

        {/* Nav links */}
        <nav className={styles.nav} aria-label="Main navigation">
          {NAV_LINKS.map((item, i) => (
            <span key={item.href} style={{ display: 'contents' }}>
              {/* Separator dot between links */}
              {i > 0 && <span className={styles.sep} aria-hidden="true" />}

              <Link
                href={item.href}
                className={styles.link}
                aria-current={pathname === item.href ? 'page' : undefined}
                onClick={'scrollId' in item ? handleEnquire : undefined}
              >
                {item.label}
              </Link>
            </span>
          ))}
        </nav>

      </div>
    </header>
  )
}
