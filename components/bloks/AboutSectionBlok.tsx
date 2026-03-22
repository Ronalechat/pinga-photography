import type { SbBlokData } from '@storyblok/react/rsc'
import AboutSection, { type AboutSectionBlok } from '@/components/sections/AboutSection/AboutSection'

export default function AboutSectionBlok({ blok }: { blok: AboutSectionBlok }) {
  return <AboutSection blok={blok} />
}
