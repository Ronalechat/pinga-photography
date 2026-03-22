/**
 * Container.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Centres content within a consistent column with constrained max-width
 * and responsive horizontal padding.
 *
 * Use for pages, sections, and individual components wherever content
 * needs consistent horizontal spacing — not just full pages.
 *
 * Max-width:  1200px
 * Padding:    clamp(24px, 4vw, 40px) — scales from mobile to desktop
 *
 * WRAP THESE:
 *   GalleryHeader, KineticGrid, EnquiryForm, AboutPreview, AboutSection,
 *   any page or section content that sits within the content column.
 *
 * DO NOT WRAP:
 *   ScrollHero   — full viewport width by design
 *   SiteHeader   — fixed, full width
 *   SiteFooter   — full width
 *
 * USAGE
 *   // Full page
 *   <Container>
 *     <GalleryHeader title="Gallery" />
 *     <KineticGrid photos={photos} />
 *   </Container>
 *
 *   // Single section on landing page
 *   <Container as="section">
 *     <AboutPreview blok={blok} />
 *   </Container>
 *
 *   // Semantic override
 *   <Container as="main">
 *     <EnquiryForm />
 *   </Container>
 */

import styles from './Container.module.css'

export interface ContainerProps {
  children:   React.ReactNode
  /** HTML element to render as. Defaults to 'div'. */
  as?:        React.ElementType
  className?: string
}

export default function Container({
  children,
  as: Tag    = 'div',
  className,
}: ContainerProps) {
  return (
    <Tag className={[styles.root, className].filter(Boolean).join(' ')}>
      {children}
    </Tag>
  )
}
