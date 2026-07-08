import Link from 'next/link'
import type { Metadata } from 'next'
import Container from '@/components/layout/Container/Container'
import PageHeader from '@/components/sections/PageHeader/PageHeader'
import Typography from '@/components/ui/Typography/Typography'
import ClearShopCartOnSuccess from './ClearShopCartOnSuccess'
import styles from '../checkoutResult.module.css'

export const metadata: Metadata = {
  title: 'Order Received - P!nga',
  robots: {
    index: false,
    follow: false,
  },
}

export default function ShopCheckoutSuccessPage() {
  return (
    <main>
      <ClearShopCartOnSuccess />
      <Container>
        <PageHeader title="Order Received" />

        <section className={styles.root} aria-labelledby="checkout-success-title">
          <div className={styles.copy}>
            <Typography variant="eyebrow" as="p" id="checkout-success-title">
              Thank you
            </Typography>
            <Typography variant="bodyLarge" as="p" color="var(--color-text-muted-high)">
              Stripe has received your payment. Paul will confirm the order,
              shipping details, and fulfilment timing by email.
            </Typography>
          </div>

          <div className={styles.actions}>
            <Link href="/shop" className={styles.actionLink}>
              <Typography variant="eyebrow" as="span">
                Back to shop
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
