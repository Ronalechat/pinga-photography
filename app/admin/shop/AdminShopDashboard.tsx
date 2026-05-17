'use client'

import { useMemo, useState } from 'react'
import PingaButton from '@/components/ui/Button/PingaButton'
import Typography from '@/components/ui/Typography/Typography'
import type { ShopAdminSummary } from '@/lib/shop/adminSummary'
import { formatMoney } from '@/lib/shop/money'
import styles from './AdminShopDashboard.module.css'

type DashboardStatus = 'idle' | 'loading' | 'ready' | 'setup' | 'unauthorised' | 'error'
type MutationStatus = 'idle' | 'saving'

interface DashboardResponse extends Partial<ShopAdminSummary> {
  error?: string
  setupRequired?: boolean
  missing?: string[]
}

const ADMIN_TOKEN_STORAGE_KEY = 'pinga_shop_admin_token'

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-AU', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function getErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback
  const response = data as DashboardResponse
  return response.error || fallback
}

function getSelectedOptionsLabel(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return ''

  return value
    .map((option) => {
      if (!option || typeof option !== 'object') return ''
      const maybeOption = option as { groupLabel?: unknown; valueLabel?: unknown }
      const groupLabel = typeof maybeOption.groupLabel === 'string' ? maybeOption.groupLabel : ''
      const valueLabel = typeof maybeOption.valueLabel === 'string' ? maybeOption.valueLabel : ''

      if (!groupLabel && !valueLabel) return ''
      return groupLabel ? `${groupLabel}: ${valueLabel}` : valueLabel
    })
    .filter(Boolean)
    .join(' / ')
}

function getShippingAddressLabel(value: unknown) {
  if (!value || typeof value !== 'object') return ''

  const candidate = value as {
    address?: {
      line1?: unknown
      line2?: unknown
      city?: unknown
      state?: unknown
      postal_code?: unknown
      country?: unknown
    } | null
    name?: unknown
  }
  const address = candidate.address

  if (!address) return ''

  return [
    typeof address.line1 === 'string' ? address.line1 : '',
    typeof address.line2 === 'string' ? address.line2 : '',
    typeof address.city === 'string' ? address.city : '',
    typeof address.state === 'string' ? address.state : '',
    typeof address.postal_code === 'string' ? address.postal_code : '',
    typeof address.country === 'string' ? address.country : '',
  ].filter(Boolean).join(', ')
}

function formatReservationExpiry(value: string) {
  const expiresAt = new Date(value)
  const minutes = Math.ceil((expiresAt.getTime() - Date.now()) / 60000)

  if (minutes <= 0) return 'Expired'
  if (minutes === 1) return '1 min left'
  if (minutes < 60) return `${minutes} mins left`

  return formatDate(value)
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className={styles.empty}>
      <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
        {label}
      </Typography>
    </div>
  )
}

export default function AdminShopDashboard() {
  const [token, setToken] = useState(() => {
    if (typeof window === 'undefined') return ''
    return window.sessionStorage.getItem(ADMIN_TOKEN_STORAGE_KEY) ?? ''
  })
  const [summary, setSummary] = useState<ShopAdminSummary | null>(null)
  const [status, setStatus] = useState<DashboardStatus>('idle')
  const [mutationStatus, setMutationStatus] = useState<MutationStatus>('idle')
  const [message, setMessage] = useState('')
  const [inventoryProductId, setInventoryProductId] = useState('')
  const [inventoryMode, setInventoryMode] = useState('limited')
  const [inventoryQuantity, setInventoryQuantity] = useState('')

  const metrics = useMemo(() => {
    const paidOrders = summary?.orders.filter((order) => order.status === 'paid') ?? []
    const totalRevenue = paidOrders.reduce((total, order) => total + order.total_cents, 0)
    const currency = paidOrders[0]?.currency ?? 'AUD'
    const activeInventory = summary?.inventory.filter((item) => (
      item.stock_quantity === null || item.sold_quantity < item.stock_quantity
    )).length ?? 0
    const pendingOrders = summary?.orders.filter((order) => order.status === 'pending').length ?? 0
    const activeReservations = summary?.reservations.length ?? 0

    return {
      orderCount: summary?.orders.length ?? 0,
      enquiryCount: summary?.enquiries.length ?? 0,
      activeInventory,
      pendingOrders,
      activeReservations,
      totalRevenue,
      currency,
    }
  }, [summary])

  async function handleLoadSummary() {
    setStatus('loading')
    setMessage('')

    try {
      const res = await fetch('/api/admin/shop/summary', {
        headers: {
          'x-shop-admin-token': token,
        },
      })
      const data = await res.json().catch(() => null) as unknown

      if (!res.ok) {
        const nextStatus: DashboardStatus = res.status === 401
          ? 'unauthorised'
          : data && typeof data === 'object' && (data as DashboardResponse).setupRequired
            ? 'setup'
            : 'error'

        setStatus(nextStatus)
        setMessage(getErrorMessage(data, 'Shop admin data could not be loaded.'))
        return
      }

      const response = data as ShopAdminSummary
      setSummary(response)
      setStatus('ready')
      window.sessionStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, token)
    } catch {
      setStatus('error')
      setMessage('Shop admin data could not be loaded.')
    }
  }

  async function handleMutation(path: string, body: unknown) {
    setMutationStatus('saving')
    setMessage('')

    try {
      const res = await fetch(path, {
        method: path.endsWith('/inventory') || path.endsWith('/release-expired') ? 'POST' : 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-shop-admin-token': token,
        },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => null) as unknown

      if (!res.ok) {
        setMessage(getErrorMessage(data, 'Shop admin update failed.'))
        setStatus(data && typeof data === 'object' && (data as DashboardResponse).setupRequired
          ? 'setup'
          : 'error')
        return
      }

      await handleLoadSummary()
    } catch {
      setStatus('error')
      setMessage('Shop admin update failed.')
    } finally {
      setMutationStatus('idle')
    }
  }

  function updateOrder(orderId: string, nextStatus: string) {
    return handleMutation(`/api/admin/shop/orders/${orderId}`, { status: nextStatus })
  }

  function updateEnquiry(enquiryId: string, nextStatus: string) {
    return handleMutation(`/api/admin/shop/enquiries/${enquiryId}`, { status: nextStatus })
  }

  function upsertInventoryRow() {
    return handleMutation('/api/admin/shop/inventory', {
      productId: inventoryProductId,
      stockMode: inventoryMode,
      stockQuantity: inventoryQuantity ? Number(inventoryQuantity) : null,
    })
  }

  function releaseExpiredReservationRows() {
    return handleMutation('/api/admin/shop/reservations/release-expired', {})
  }

  return (
    <section className={styles.root} aria-labelledby="shop-admin-dashboard">
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <Typography variant="eyebrow" as="h2" id="shop-admin-dashboard">
            Dashboard
          </Typography>
          <Typography variant="body" as="p" color="var(--color-text-muted-high)">
            Load live shop data with the admin token. Nothing is fetched until the
            token is submitted.
          </Typography>
        </div>

        <div className={styles.auth}>
          <label className={styles.tokenField}>
            <Typography variant="caption" as="span">
              Admin token
            </Typography>
            <input
              type="password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              className={styles.input}
              autoComplete="off"
            />
          </label>
          <PingaButton
            variant="ghost"
            type="button"
            disabled={status === 'loading' || !token}
            onClick={handleLoadSummary}
          >
            {status === 'loading' ? 'Loading...' : 'Load data'}
          </PingaButton>
        </div>
      </div>

      {message && (
        <Typography
          variant="caption"
          as="p"
          role="status"
          className={status === 'setup' ? styles.notice : styles.error}
        >
          {message}
        </Typography>
      )}

      {status === 'loading' && (
        <div className={styles.skeletonGrid} aria-hidden="true">
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
          <div className={styles.skeleton} />
        </div>
      )}

      {summary && status === 'ready' && (
        <>
          <div className={styles.metrics}>
            <div className={styles.metric}>
              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                Orders
              </Typography>
              <Typography variant="headingMedium" as="p">
                {metrics.orderCount}
              </Typography>
            </div>
            <div className={styles.metric}>
              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                Enquiries
              </Typography>
              <Typography variant="headingMedium" as="p">
                {metrics.enquiryCount}
              </Typography>
            </div>
            <div className={styles.metric}>
              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                Paid total
              </Typography>
              <Typography variant="headingMedium" as="p">
                {formatMoney(metrics.totalRevenue, metrics.currency)}
              </Typography>
            </div>
            <div className={styles.metric}>
              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                Active stock
              </Typography>
              <Typography variant="headingMedium" as="p">
                {metrics.activeInventory}
              </Typography>
            </div>
            <div className={styles.metric}>
              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                Pending
              </Typography>
              <Typography variant="headingMedium" as="p">
                {metrics.pendingOrders}
              </Typography>
            </div>
            <div className={styles.metric}>
              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                Held stock
              </Typography>
              <Typography variant="headingMedium" as="p">
                {metrics.activeReservations}
              </Typography>
            </div>
          </div>

          <div className={styles.tables}>
            <section className={styles.tableSection} aria-labelledby="admin-orders">
              <Typography variant="eyebrow" as="h3" id="admin-orders">
                Recent orders
              </Typography>
              {summary.orders.length === 0 ? (
                <EmptyState label="No orders yet." />
              ) : (
                <div className={styles.rows}>
                  {summary.orders.map((order) => (
                    <div key={order.id} className={styles.record}>
                      <div className={styles.recordTopline}>
                        <div>
                          <Typography variant="body" as="p">
                            {order.customer_name || order.customer_email || 'Awaiting Stripe details'}
                          </Typography>
                          <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                            {order.status} / {formatDate(order.created_at)}
                          </Typography>
                        </div>
                        <Typography variant="body" as="p">
                          {formatMoney(order.total_cents, order.currency)}
                        </Typography>
                      </div>

                      <div className={styles.detailGrid}>
                        <div>
                          <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                            Contact
                          </Typography>
                          <Typography variant="caption" as="p">
                            {order.customer_email ?? 'No email yet'}
                          </Typography>
                          {order.customer_phone && (
                            <Typography variant="caption" as="p">
                              {order.customer_phone}
                            </Typography>
                          )}
                        </div>
                        <div>
                          <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                            Shipping
                          </Typography>
                          <Typography variant="caption" as="p">
                            {order.shipping_option_label ?? 'Not selected'} / {formatMoney(order.shipping_cents, order.currency)}
                          </Typography>
                          {getShippingAddressLabel(order.shipping_address) && (
                            <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                              {getShippingAddressLabel(order.shipping_address)}
                            </Typography>
                          )}
                        </div>
                      </div>

                      {order.shop_order_items && order.shop_order_items.length > 0 && (
                        <div className={styles.recordItems}>
                          {order.shop_order_items.map((item) => (
                            <div key={item.id} className={styles.recordItem}>
                              <Typography variant="caption" as="p">
                                {item.quantity} x {item.title}
                              </Typography>
                              <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                                {getSelectedOptionsLabel(item.selected_options) || item.product_id}
                              </Typography>
                              <Typography variant="caption" as="p">
                                {formatMoney(item.unit_amount_cents, item.currency)}
                              </Typography>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.textAction}
                          disabled={mutationStatus === 'saving'}
                          onClick={() => updateOrder(order.id, 'fulfilled')}
                        >
                          <Typography variant="caption" as="span">
                            Fulfil
                          </Typography>
                        </button>
                        <button
                          type="button"
                          className={styles.textAction}
                          disabled={mutationStatus === 'saving'}
                          onClick={() => updateOrder(order.id, 'refunded')}
                        >
                          <Typography variant="caption" as="span">
                            Refunded
                          </Typography>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.tableSection} aria-labelledby="admin-enquiries">
              <Typography variant="eyebrow" as="h3" id="admin-enquiries">
                Recent enquiries
              </Typography>
              {summary.enquiries.length === 0 ? (
                <EmptyState label="No enquiries yet." />
              ) : (
                <div className={styles.rows}>
                  {summary.enquiries.map((enquiry) => (
                    <div key={enquiry.id} className={styles.record}>
                      <div className={styles.recordTopline}>
                        <div>
                          <Typography variant="body" as="p">
                            {enquiry.product_title ?? 'Product enquiry'}
                          </Typography>
                          <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                            {enquiry.status} / {formatDate(enquiry.created_at)}
                          </Typography>
                        </div>
                        <Typography variant="body" as="p">
                          Qty {enquiry.quantity}
                        </Typography>
                      </div>
                      <div className={styles.detailGrid}>
                        <div>
                          <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                            Contact
                          </Typography>
                          <Typography variant="caption" as="p">
                            {enquiry.customer_name} / {enquiry.customer_email}
                          </Typography>
                          {enquiry.customer_phone && (
                            <Typography variant="caption" as="p">
                              {enquiry.customer_phone}
                            </Typography>
                          )}
                        </div>
                        <div>
                          <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                            Selection
                          </Typography>
                          <Typography variant="caption" as="p">
                            {getSelectedOptionsLabel(enquiry.selected_options) || enquiry.product_id || 'No options'}
                          </Typography>
                        </div>
                      </div>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.textAction}
                          disabled={mutationStatus === 'saving'}
                          onClick={() => updateEnquiry(enquiry.id, 'contacted')}
                        >
                          <Typography variant="caption" as="span">
                            Contacted
                          </Typography>
                        </button>
                        <button
                          type="button"
                          className={styles.textAction}
                          disabled={mutationStatus === 'saving'}
                          onClick={() => updateEnquiry(enquiry.id, 'closed')}
                        >
                          <Typography variant="caption" as="span">
                            Closed
                          </Typography>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.tableSection} aria-labelledby="admin-reservations">
              <div className={styles.sectionHeader}>
                <Typography variant="eyebrow" as="h3" id="admin-reservations">
                  Active reservations
                </Typography>
                <button
                  type="button"
                  className={styles.textAction}
                  disabled={mutationStatus === 'saving'}
                  onClick={releaseExpiredReservationRows}
                >
                  <Typography variant="caption" as="span">
                    Release expired
                  </Typography>
                </button>
              </div>
              {summary.reservations.length === 0 ? (
                <EmptyState label="No held stock right now." />
              ) : (
                <div className={styles.rows}>
                  {summary.reservations.map((reservation) => (
                    <div key={reservation.id} className={styles.row}>
                      <Typography variant="body" as="p">
                        {reservation.product_id}
                      </Typography>
                      <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                        {reservation.option_signature || 'Default'}
                      </Typography>
                      <Typography variant="body" as="p">
                        Qty {reservation.quantity}
                      </Typography>
                      <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                        {formatReservationExpiry(reservation.expires_at)}
                      </Typography>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.tableSection} aria-labelledby="admin-inventory">
              <div className={styles.sectionHeader}>
                <Typography variant="eyebrow" as="h3" id="admin-inventory">
                  Inventory
                </Typography>
                <div className={styles.inventoryForm}>
                  <label className={styles.compactField}>
                    <Typography variant="caption" as="span">
                      Product ID
                    </Typography>
                    <input
                      value={inventoryProductId}
                      onChange={(event) => setInventoryProductId(event.target.value)}
                      className={styles.input}
                    />
                  </label>
                  <label className={styles.compactField}>
                    <Typography variant="caption" as="span">
                      Mode
                    </Typography>
                    <select
                      value={inventoryMode}
                      onChange={(event) => setInventoryMode(event.target.value)}
                      className={styles.input}
                    >
                      <option value="limited">Limited</option>
                      <option value="one_of_one">One of one</option>
                      <option value="unlimited">Unlimited</option>
                      <option value="enquiry_goal">Enquiry goal</option>
                    </select>
                  </label>
                  <label className={styles.compactField}>
                    <Typography variant="caption" as="span">
                      Stock
                    </Typography>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={inventoryQuantity}
                      onChange={(event) => setInventoryQuantity(event.target.value)}
                      className={styles.input}
                    />
                  </label>
                  <button
                    type="button"
                    className={styles.textAction}
                    disabled={mutationStatus === 'saving' || !inventoryProductId}
                    onClick={upsertInventoryRow}
                  >
                    <Typography variant="caption" as="span">
                      Save stock
                    </Typography>
                  </button>
                </div>
              </div>
              {summary.inventory.length === 0 ? (
                <EmptyState label="No inventory rows yet." />
              ) : (
                <div className={styles.rows}>
                  {summary.inventory.map((item) => (
                    <div key={item.product_id} className={styles.row}>
                      <Typography variant="body" as="p">
                        {item.product_id}
                      </Typography>
                      <Typography variant="caption" as="p" color="var(--color-text-muted-mid)">
                        {item.stock_mode}
                      </Typography>
                      <Typography variant="body" as="p">
                        {item.stock_quantity === null
                          ? `${item.sold_quantity} sold`
                          : `${Math.max(0, item.stock_quantity - item.sold_quantity)} left`}
                      </Typography>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className={styles.textAction}
                          disabled={mutationStatus === 'saving'}
                          onClick={() => {
                            setInventoryProductId(item.product_id)
                            setInventoryMode(item.stock_mode)
                            setInventoryQuantity(item.stock_quantity?.toString() ?? '')
                          }}
                        >
                          <Typography variant="caption" as="span">
                            Edit
                          </Typography>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  )
}
