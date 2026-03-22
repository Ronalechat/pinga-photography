import type { SbBlokData } from '@storyblok/react/rsc'
import AboutPreview, { type AboutPreviewBlok } from '@/components/sections/AboutPreview/AboutPreview'

export default function AboutPreviewBlok({ blok }: { blok: AboutPreviewBlok }) {
  return <AboutPreview blok={blok} />
}
