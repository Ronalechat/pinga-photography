import type { Metadata } from 'next'
import Container from '@/components/layout/Container/Container'
import PageHeader from '@/components/sections/PageHeader/PageHeader'
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

export default function ShopAdminPage() {
  return (
    <main>
      <Container>
        <PageHeader title="Shop Admin" />

        <section className={styles.root}>
          <AdminShopDashboard />
        </section>
      </Container>
    </main>
  )
}
