import type { Metadata } from 'next'
import Container from '@/components/layout/Container/Container'
import PageHeader from '@/components/sections/PageHeader/PageHeader'
import Typography from '@/components/ui/Typography/Typography'
import { getAdminDashboardSetupStatus } from '@/lib/shop/setupStatus'
import AdminShopDashboard from './AdminShopDashboard'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Shop Admin — P!nga',
  robots: {
    index: false,
    follow: false,
  },
}

const SHOP_AREAS = [
  {
    title: 'Orders',
    detail: 'Stripe-paid purchases, shipping choices, fulfilment state.',
  },
  {
    title: 'Enquiries',
    detail: 'Shirt runs, manual quotes, and contact follow-up.',
  },
  {
    title: 'Stock',
    detail: 'Limited editions, one-of-one pieces, and available quantity.',
  },
  {
    title: 'Reservations',
    detail: 'Temporary holds while customers complete Stripe Checkout.',
  },
]

const SETUP_STEPS = [
  'Run docs/supabase-shop-schema.sql in Supabase.',
  'Run docs/supabase-admin-auth-migration.sql in Supabase for existing projects.',
  'Add Supabase environment variables in Netlify.',
  'Add admin username, session secret, and setup secret environment variables.',
  'Add Stripe environment variables when checkout is ready.',
  'Test Stripe webhook delivery and paid order persistence.',
]

export default function ShopAdminPage() {
  const setup = getAdminDashboardSetupStatus()

  return (
    <main>
      <Container>
        <PageHeader title="Shop Admin" />

        <section className={styles.root} aria-labelledby="shop-admin-status">
          <div className={styles.intro}>
            <Typography variant="eyebrow" as="p" id="shop-admin-status">
              Setup status
            </Typography>
            <Typography variant="bodyLarge" as="p" color="var(--color-text-muted-high)">
              This page is ready for Paul&apos;s shop dashboard once Supabase and
              admin PIN login are connected. Paid checkout stays disabled until
              Stripe and webhook handling are verified.
            </Typography>
          </div>

          <div className={styles.statusGrid}>
            {setup.items.map((item) => (
              <div key={item.key} className={styles.statusItem}>
                <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                  {item.label}
                </Typography>
                <Typography
                  variant="eyebrow"
                  as="p"
                  className={item.configured ? styles.ready : styles.pending}
                >
                  {item.configured ? 'Ready' : 'Pending'}
                </Typography>
              </div>
            ))}
          </div>

          <div className={styles.areaGrid}>
            {SHOP_AREAS.map((area) => (
              <article key={area.title} className={styles.area}>
                <Typography variant="headingMedium" as="h2">
                  {area.title}
                </Typography>
                <Typography variant="body" as="p" color="var(--color-text-muted-high)">
                  {area.detail}
                </Typography>
              </article>
            ))}
          </div>

          <section className={styles.next} aria-labelledby="shop-admin-next">
            <Typography variant="eyebrow" as="h2" id="shop-admin-next">
              Next wiring
            </Typography>
            <ol className={styles.steps}>
              {SETUP_STEPS.map((step) => (
                <li key={step}>
                  <Typography variant="body" as="span" color="var(--color-text-muted-high)">
                    {step}
                  </Typography>
                </li>
              ))}
            </ol>
          </section>

          <section className={styles.next} aria-labelledby="shop-admin-api">
            <Typography variant="eyebrow" as="h2" id="shop-admin-api">
              Data access
            </Typography>
            <Typography variant="body" as="p" color="var(--color-text-muted-high)">
              The admin summary API is available at `/api/admin/shop/summary`,
              but it only returns order data after a signed admin session cookie
              is created by the login route.
            </Typography>
          </section>

          <AdminShopDashboard />
        </section>
      </Container>
    </main>
  )
}
