import { storyblokEditable } from '@storyblok/react/rsc'
import type { SbBlokData } from '@storyblok/react/rsc'
import ImageCarousel from '@/components/sections/ImageCarousel/ImageCarousel'

interface SbAsset {
  filename: string
  alt?: string
}

interface ImageCarouselSlideBlok extends SbBlokData {
  image: SbAsset
  alt: string
}

interface ImageCarouselBlokShape extends SbBlokData {
  slides: ImageCarouselSlideBlok[]
  height: string
}

export default function ImageCarouselBlok({ blok }: { blok: ImageCarouselBlokShape }) {
  const slides = blok.slides.map((s) => ({
    src: s.image?.filename || undefined,
    alt: s.alt || s.image?.alt || '',
  }))

  return (
    <section {...storyblokEditable(blok)} className="clip-x">
      <ImageCarousel
        slides={slides}
        height={blok.height || undefined}
      />
    </section>
  )
}
