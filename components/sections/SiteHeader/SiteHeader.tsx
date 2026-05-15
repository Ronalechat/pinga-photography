/**
 * SiteHeader.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Site-wide fixed header — name left, nav right, colour-reactive text.
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
 * Desktop/mobile: single row — name left, four nav links right.
 *
 * ACTIVE STATE
 * Uses Next.js usePathname to apply aria-current="page" to the active link.
 * The CSS module dims the active link slightly so the current page is
 * indicated without adding any extra visual element.
 *
 * ENQUIRE SCROLL INTERCEPT
 * On the landing page (/) the Enquire link scrolls to #enquire smoothly
 * rather than navigating. On other pages it navigates to /enquiry.
 *
 * STORYBLOK
 * The nav links are hardcoded because they are global information architecture,
 * not editable page content. If the nav grows substantially, replace NAV_LINKS
 * with a Storyblok datasource fetch.
 */

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { analytics } from '@/lib/analytics'
import styles from './SiteHeader.module.css'

// ─── Nav config ───────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { label: 'Gallery', href: '/gallery' },
  { label: 'Shop', href: '/shop' },
  { label: 'Enquire', href: '/enquiry', scrollId: 'enquire' },
] as const

// ─── Props ───────────────────────────────────────────────────────────────────

export interface SiteHeaderProps {
  /** Photographer name shown as the home link. @default 'P!nga' */
  name?: string
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SiteHeader({ name = 'P!nga' }: SiteHeaderProps) {
  const pathname = usePathname()

  useEffect(() => {
    // Snapshot env(safe-area-inset-top) once on mount into a static CSS var.
    // Prevents Chrome iOS from re-triggering layout on the header each time
    // the address bar transitions (which can update env() mid-scroll).
    const el = document.createElement('div')
    el.style.cssText = 'position:fixed;top:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none'
    document.body.appendChild(el)
    const inset = el.getBoundingClientRect().height
    document.body.removeChild(el)
    document.documentElement.style.setProperty('--header-sat', `${inset}px`)

    return () => {
      document.documentElement.style.removeProperty('--header-sat')
    }
  }, [])

  /**
   * Nav click handler for all links.
   * Tracks the click, then handles enquire scroll intercept on homepage.
   */
  const handleNavClick = useCallback((item: typeof NAV_LINKS[number]) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    const scrolled = 'scrollId' in item && pathname === '/'
    analytics.track('Header Nav Clicked', { label: item.label, destination: item.href, scrolled })
    if (scrolled) {
      e.preventDefault()
      document.getElementById(item.scrollId)?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [pathname])

  return (
    <header className={styles.root}>
      {/*
       * .cluster re-enables pointer events for the actual header controls;
       * the transparent root lets clicks on empty header space pass through.
       */}
      <div className={styles.cluster}>

        {/* Name — links to home */}
        <Link
          href="/"
          className={styles.name}
          aria-label={`${name} — home`}
          onClick={() => analytics.track('Header Nav Clicked', { label: 'Home', destination: '/', scrolled: false })}
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
                onClick={handleNavClick(item)}
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
