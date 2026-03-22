'use client'
import Container from '@/components/layout/Container/Container'
import PageHeader from '@/components/sections/PageHeader/PageHeader'
import Typography from '@/components/ui/Typography/Typography'

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main>
      <Container>
        <PageHeader title="Something went wrong" />
        <Typography variant="body">
          <button onClick={reset}>Try again</button>
        </Typography>
      </Container>
    </main>
  )
}
