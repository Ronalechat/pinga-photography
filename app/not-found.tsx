import Link from 'next/link'
import Container from '@/components/layout/Container/Container'
import PageHeader from '@/components/sections/PageHeader/PageHeader'
import Typography from '@/components/ui/Typography/Typography'

export default function NotFound() {
  return (
    <main>
      <Container>
        <PageHeader title="Page Not Found" />
        <Typography variant="body">
          The page you&apos;re looking for doesn&apos;t exist.{' '}
          <Link href="/">Return home</Link>
        </Typography>
      </Container>
    </main>
  )
}
