import type { Metadata } from 'next'
import Container from '@/components/layout/Container/Container'
import PageHeader from '@/components/sections/PageHeader/PageHeader'
import EnquiryForm from '@/components/sections/EnquiryForm/EnquiryForm'

export const metadata: Metadata = {
  title: 'Enquire — P!nga | Hire a Sydney Photographer',
  description:
    'Hire P!nga (Pinga Matereke) for street, party, rave, portrait, and event photography in Sydney. Get in touch.',
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
