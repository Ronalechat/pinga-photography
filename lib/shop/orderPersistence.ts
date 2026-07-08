import type { ShippingDestination, ShippingOption } from '@/lib/shop/shipping'
import type { CartLine, SelectedShopOption } from '@/lib/shop/types'
import { supabaseRequest } from '@/lib/shop/supabaseRest'

export interface PendingOrderInput {
  lines: CartLine[]
  destination: ShippingDestination
  shippingOption: ShippingOption
  subtotalCents: number
  totalCents: number
  currency: string
}

export interface StripeCompletedSession {
  id: string
  client_reference_id?: string | null
  customer_details?: {
    email?: string | null
    name?: string | null
    phone?: string | null
  } | null
  shipping_details?: unknown
  amount_subtotal?: number | null
  amount_total?: number | null
  currency?: string | null
}

interface ShopOrderRow {
  id: string
  stripe_session_id: string | null
  status: 'pending' | 'paid' | 'cancelled' | 'fulfilled' | 'refunded'
}

interface ReservationRpcLine {
  product_id: string
  option_signature: string
  quantity: number
}

function optionSignature(options: SelectedShopOption[]) {
  return options
    .map((option) => `${option.groupKey}:${option.valueKey}`)
    .sort()
    .join('|')
}

function getReservationExpiry() {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
  return expiresAt.toISOString()
}

export async function createPendingOrder({
  lines,
  destination,
  shippingOption,
  subtotalCents,
  totalCents,
  currency,
}: PendingOrderInput) {
  const orders = await supabaseRequest<ShopOrderRow[]>('/rest/v1/shop_orders', {
    method: 'POST',
    prefer: 'return=representation',
    body: {
      status: 'pending',
      currency,
      subtotal_cents: subtotalCents,
      shipping_cents: shippingOption.amountCents,
      total_cents: totalCents,
      shipping_option_id: shippingOption.id,
      shipping_option_label: shippingOption.label,
      metadata: {
        source: 'pinga_shop',
        destination,
      },
    },
  })
  const order = orders[0]

  if (!order) {
    throw new Error('Pending order could not be created.')
  }

  try {
    await supabaseRequest('/rest/v1/shop_order_items', {
      method: 'POST',
      body: lines.map((line) => ({
        order_id: order.id,
        product_id: line.productId,
        title: line.title,
        quantity: line.quantity,
        unit_amount_cents: line.unitPriceCents,
        currency: line.currency,
        selected_options: line.selectedOptions,
        option_signature: optionSignature(line.selectedOptions),
      })),
    })
  } catch (error) {
    await markPendingOrderCancelledById(order.id).catch(() => undefined)
    throw error
  }

  return order
}

export async function attachStripeSessionToPendingOrder(orderId: string, stripeSessionId: string) {
  const orders = await supabaseRequest<ShopOrderRow[]>(
    `/rest/v1/shop_orders?id=eq.${encodeURIComponent(orderId)}&status=eq.pending`,
    {
      method: 'PATCH',
      prefer: 'return=representation',
      body: {
        stripe_session_id: stripeSessionId,
      },
    }
  )

  if (!orders[0]) {
    throw new Error('Pending order could not be linked to Stripe Checkout.')
  }
}

export async function createCheckoutReservations(
  stripeSessionId: string,
  lines: CartLine[]
) {
  const expiresAt = getReservationExpiry()
  const reservationLines: ReservationRpcLine[] = lines.map((line) => ({
    product_id: line.productId,
    option_signature: optionSignature(line.selectedOptions),
    quantity: line.quantity,
  }))

  try {
    await supabaseRequest('/rest/v1/rpc/shop_create_checkout_reservations', {
      method: 'POST',
      body: {
        p_stripe_session_id: stripeSessionId,
        p_expires_at: expiresAt,
        p_lines: reservationLines,
      },
    })
  } catch (error) {
    await releaseCheckoutReservations(stripeSessionId).catch(() => undefined)
    throw error
  }
}

export async function markPendingOrderCancelled(stripeSessionId: string) {
  await supabaseRequest(
    `/rest/v1/shop_orders?stripe_session_id=eq.${encodeURIComponent(stripeSessionId)}&status=eq.pending`,
    {
      method: 'PATCH',
      body: { status: 'cancelled' },
    }
  )
}

export async function markPendingOrderCancelledById(orderId: string) {
  await supabaseRequest(
    `/rest/v1/shop_orders?id=eq.${encodeURIComponent(orderId)}&status=eq.pending`,
    {
      method: 'PATCH',
      body: { status: 'cancelled' },
    }
  )
}

export async function releaseCheckoutReservations(stripeSessionId: string) {
  await supabaseRequest('/rest/v1/rpc/shop_release_reservations', {
    method: 'POST',
    body: {
      p_stripe_session_id: stripeSessionId,
    },
  })
}

async function getOrderByStripeSessionId(stripeSessionId: string) {
  const orders = await supabaseRequest<ShopOrderRow[]>(
    `/rest/v1/shop_orders?select=id,status,stripe_session_id&stripe_session_id=eq.${encodeURIComponent(stripeSessionId)}&limit=1`
  )

  return orders[0] ?? null
}

async function getOrderById(orderId: string) {
  const orders = await supabaseRequest<ShopOrderRow[]>(
    `/rest/v1/shop_orders?select=id,status,stripe_session_id&id=eq.${encodeURIComponent(orderId)}&limit=1`
  )

  return orders[0] ?? null
}

async function getOrderForPaidSession(session: StripeCompletedSession) {
  const orderBySession = await getOrderByStripeSessionId(session.id)

  if (orderBySession) return orderBySession
  if (!session.client_reference_id) return null

  const orderByReference = await getOrderById(session.client_reference_id)
  if (!orderByReference) return null
  if (orderByReference.stripe_session_id && orderByReference.stripe_session_id !== session.id) {
    return null
  }

  return orderByReference
}

export async function markOrderPaid(session: StripeCompletedSession) {
  const order = await getOrderForPaidSession(session)

  if (!order) {
    throw new Error(`No matching shop order found for Stripe session ${session.id}.`)
  }

  if (order.status === 'paid') {
    return { orderId: order.id, alreadyPaid: true }
  }

  if (order.status !== 'pending') {
    throw new Error(`Stripe session ${session.id} matched a non-pending shop order.`)
  }

  const customer = session.customer_details

  await supabaseRequest('/rest/v1/rpc/shop_convert_reservations', {
    method: 'POST',
    body: {
      p_stripe_session_id: session.id,
    },
  })

  await supabaseRequest(
    `/rest/v1/shop_orders?id=eq.${encodeURIComponent(order.id)}&status=eq.pending`,
    {
      method: 'PATCH',
      body: {
        status: 'paid',
        stripe_session_id: session.id,
        customer_email: customer?.email ?? null,
        customer_name: customer?.name ?? null,
        customer_phone: customer?.phone ?? null,
        currency: session.currency?.toUpperCase() ?? undefined,
        subtotal_cents: session.amount_subtotal ?? undefined,
        total_cents: session.amount_total ?? undefined,
        shipping_address: session.shipping_details ?? null,
      },
    }
  )

  return { orderId: order.id, alreadyPaid: false }
}
