import Link from 'next/link'
import type { Metadata } from 'next'
import Container from '@/components/layout/Container/Container'
import PageHeader from '@/components/sections/PageHeader/PageHeader'
import Typography from '@/components/ui/Typography/Typography'
import styles from '../checkoutResult.module.css'

export const metadata: Metadata = {
  title: 'Checkout Cancelled - P!nga',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ShopCheckoutCancelPage() {
  return (
    <main>
      <Container>
        <PageHeader title="Checkout Cancelled" />

        <section className={styles.root} aria-labelledby="checkout-cancel-title">
          <div className={styles.copy}>
            <Typography variant="eyebrow" as="p" id="checkout-cancel-title">
              No payment taken
            </Typography>
            <Typography variant="bodyLarge" as="p" color="var(--color-text-muted-high)">
              Your cart should still be saved on this device. You can return to
              the shop, adjust the order, or contact Paul if something needs a
              manual quote.
            </Typography>
          </div>

          <div className={styles.actions}>
            <Link href="/shop" className={styles.actionLink}>
              <Typography variant="eyebrow" as="span">
                Return to cart
              </Typography>
            </Link>
            <Link href="/enquiry" className={styles.actionLink}>
              <Typography variant="eyebrow" as="span">
                Contact Paul
              </Typography>
            </Link>
          </div>
        </section>
      </Container>
    </main>
  )
}
