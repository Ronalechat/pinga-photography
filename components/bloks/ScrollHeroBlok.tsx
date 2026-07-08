import { preload } from 'react-dom'
import { storyblokEditable } from '@storyblok/react/rsc'
import type { SbBlokData } from '@storyblok/react/rsc'
import ScrollHero from '@/components/sections/ScrollHero/ScrollHero'
import { toSlug } from '@/utils/toSlug'
import {
  sbImage,
  sbSrcSet,
  FULL_BLEED_WIDTHS,
  FULL_BLEED_SIZES,
  FULL_BLEED_QUALITY,
} from '@/utils/sbImage'

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

export default function ScrollHeroBlok({ blok }: { blok: ScrollHeroBlokShape }) {
  const slides = blok.slides.map((s) => ({
    label:      s.label,
    subtitle:   s.subtitle,
    src:        sbImage(s.image?.filename, 1920, FULL_BLEED_QUALITY),
    srcSet:     sbSrcSet(s.image?.filename, FULL_BLEED_WIDTHS, FULL_BLEED_QUALITY),
    sizes:      FULL_BLEED_SIZES,
    alt:        s.image?.alt || s.label,
    background: s.background || undefined,
    href:       `/gallery?category=${toSlug(s.label)}`,
  }))

  // Preload the first slide — it's the LCP element and the preloader gates on it.
  // The srcset/sizes here must match the <img> in ScrollHero exactly so the
  // browser reuses the preloaded response instead of fetching twice.
  const first = slides[0]
  if (first?.src) {
    preload(first.src, {
      as: 'image',
      fetchPriority: 'high',
      imageSrcSet: first.srcSet,
      imageSizes: first.srcSet ? FULL_BLEED_SIZES : undefined,
    })
  }

  return (
    <section {...storyblokEditable(blok)}>
      <ScrollHero
        slides={slides}
      />
    </section>
  )
}
