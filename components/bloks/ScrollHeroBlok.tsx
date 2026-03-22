import { storyblokEditable } from '@storyblok/react/rsc'
import type { SbBlokData } from '@storyblok/react/rsc'
import ScrollHero from '@/components/sections/ScrollHero/ScrollHero'

interface SbAsset {
  filename: string
  alt?: string
}

interface ScrollHeroSlideBlok extends SbBlokData {
  label: string
  subtitle: string
  image?: SbAsset
  /** Fallback CSS value (colour or gradient) when no image is uploaded */
  background?: string
}

interface ScrollHeroBlokShape extends SbBlokData {
  slides: ScrollHeroSlideBlok[]
}

function toSlug(label: string): string {
  return label.toLowerCase().replace(/\s+/g, '-')
}

export default function ScrollHeroBlok({ blok }: { blok: ScrollHeroBlokShape }) {
  const slides = blok.slides.map((s) => ({
    label:      s.label,
    subtitle:   s.subtitle,
    src:        s.image?.filename || undefined,
    alt:        s.image?.alt || s.label,
    background: s.background || undefined,
    href:       `/gallery?category=${toSlug(s.label)}`,
  }))

  return (
    <section {...storyblokEditable(blok)}>
      <ScrollHero
        slides={slides}
      />
    </section>
  )
}
