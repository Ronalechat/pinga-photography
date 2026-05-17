import type { ShippingDestination, ShippingOption } from '@/lib/shop/shipping'
import type { CartLine, SelectedShopOption } from '@/lib/shop/types'
import { supabaseRequest } from '@/lib/shop/supabaseRest'

export interface PendingOrderInput {
  stripeSessionId: string
  lines: CartLine[]
  destination: ShippingDestination
  shippingOption: ShippingOption
  subtotalCents: number
  totalCents: number
  currency: string
}

export interface StripeCompletedSession {
  id: string
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
  stripe_session_id: string
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
  stripeSessionId,
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
      stripe_session_id: stripeSessionId,
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

  return order
}

export async function createCheckoutReservations(
  stripeSessionId: string,
  lines: CartLine[]
) {
  const expiresAt = getReservationExpiry()

  for (const line of lines) {
    await supabaseRequest('/rest/v1/rpc/shop_create_reservation', {
      method: 'POST',
      body: {
        p_product_id: line.productId,
        p_option_signature: optionSignature(line.selectedOptions),
        p_quantity: line.quantity,
        p_stripe_session_id: stripeSessionId,
        p_expires_at: expiresAt,
      },
    })
  }
}

export async function markPendingOrderCancelled(stripeSessionId: string) {
  await supabaseRequest(
    `/rest/v1/shop_orders?stripe_session_id=eq.${encodeURIComponent(stripeSessionId)}`,
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

export async function markOrderPaid(session: StripeCompletedSession) {
  const customer = session.customer_details

  await supabaseRequest(
    `/rest/v1/shop_orders?stripe_session_id=eq.${encodeURIComponent(session.id)}`,
    {
      method: 'PATCH',
      body: {
        status: 'paid',
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

  await supabaseRequest('/rest/v1/rpc/shop_convert_reservations', {
    method: 'POST',
    body: {
      p_stripe_session_id: session.id,
    },
  })
}
