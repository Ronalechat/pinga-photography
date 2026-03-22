'use client'

import { usePathname } from 'next/navigation'
import { storyblokEditable, type SbBlokData } from '@storyblok/react/rsc'
import EnquiryForm from '@/components/sections/EnquiryForm/EnquiryForm'

export default function EnquiryFormBlok({ blok }: { blok: SbBlokData }) {
  const pathname = usePathname()
  const initialRevealed = pathname === '/enquiry'

  return (
    <section {...storyblokEditable(blok)}>
      <EnquiryForm initialRevealed={initialRevealed} />
    </section>
  )
}
