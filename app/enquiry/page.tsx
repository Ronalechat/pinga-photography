import type { Metadata } from 'next'
import Container from '@/components/layout/Container/Container'
import PageHeader from '@/components/sections/PageHeader/PageHeader'
import EnquiryForm from '@/components/sections/EnquiryForm/EnquiryForm'

export const metadata: Metadata = {
  title: 'Enquire — Pinga Matereke',
  description:
    'Get in touch with Paul about street photography, portraits, engagements, and occasions.',
}

export default function EnquiryPage() {
  return (
    <main>
      <Container>
        <PageHeader title="Enquiry" />
        <EnquiryForm initialRevealed={true} />
      </Container>
    </main>
  )
}
