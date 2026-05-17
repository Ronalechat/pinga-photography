import type { ShippingOption } from '@/lib/shop/shipping'
import type { CartLine } from '@/lib/shop/types'

export interface StripeCheckoutSessionInput {
  lines: CartLine[]
  shippingOption: ShippingOption
  orderId: string
  successUrl: string
  cancelUrl: string
}

export interface StripeCheckoutSession {
  id: string
  url: string
}

export class StripeCheckoutError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message)
  }
}

function toStripeCurrency(currency: string) {
  return currency.toLowerCase()
}

function toAbsoluteImageUrl(src: string | undefined) {
  if (!src) return undefined
  if (src.startsWith('//')) return `https:${src}`
  if (src.startsWith('https://')) return src
  return undefined
}

function getLineName(line: CartLine) {
  if (line.selectedOptions.length === 0) return line.title
  return `${line.title} - ${line.selectedOptions.map((option) => option.valueLabel).join(' / ')}`
}

function getStripeErrorMessage(data: unknown) {
  if (!data || typeof data !== 'object' || !('error' in data)) return null
  const error = data.error
  if (!error || typeof error !== 'object' || !('message' in error)) return null
  return typeof error.message === 'string' ? error.message : null
}

function appendLineItem(params: URLSearchParams, line: CartLine, index: number) {
  const prefix = `line_items[${index}]`
  params.append(`${prefix}[price_data][currency]`, toStripeCurrency(line.currency))
  params.append(`${prefix}[price_data][unit_amount]`, String(line.unitPriceCents))
  params.append(`${prefix}[price_data][product_data][name]`, getLineName(line))
  params.append(`${prefix}[quantity]`, String(line.quantity))

  const imageUrl = toAbsoluteImageUrl(line.image)
  if (imageUrl) {
    params.append(`${prefix}[price_data][product_data][images][0]`, imageUrl)
  }
}

function appendShippingOption(params: URLSearchParams, shippingOption: ShippingOption) {
  params.append('shipping_options[0][shipping_rate_data][type]', 'fixed_amount')
  params.append(
    'shipping_options[0][shipping_rate_data][fixed_amount][amount]',
    String(shippingOption.amountCents)
  )
  params.append(
    'shipping_options[0][shipping_rate_data][fixed_amount][currency]',
    toStripeCurrency(shippingOption.currency)
  )
  params.append('shipping_options[0][shipping_rate_data][display_name]', shippingOption.label)
}

export async function createStripeCheckoutSession({
  lines,
  shippingOption,
  orderId,
  successUrl,
  cancelUrl,
}: StripeCheckoutSessionInput): Promise<StripeCheckoutSession> {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) {
    throw new StripeCheckoutError('Stripe secret key is not configured.', 500)
  }

  const params = new URLSearchParams()
  params.append('mode', 'payment')
  params.append('success_url', successUrl)
  params.append('cancel_url', cancelUrl)
  params.append('phone_number_collection[enabled]', 'true')
  params.append('shipping_address_collection[allowed_countries][0]', 'AU')
  params.append('client_reference_id', orderId)
  params.append('metadata[source]', 'pinga_shop')
  params.append('metadata[shop_order_id]', orderId)

  lines.forEach((line, index) => appendLineItem(params, line, index))
  appendShippingOption(params, shippingOption)

  const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${stripeSecretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  })
  const data = await response.json().catch(() => null) as unknown

  if (!response.ok) {
    const message = getStripeErrorMessage(data) ?? 'Stripe Checkout could not be created.'

    throw new StripeCheckoutError(message, response.status)
  }

  if (
    !data ||
    typeof data !== 'object' ||
    !('id' in data) ||
    !('url' in data) ||
    typeof data.id !== 'string' ||
    typeof data.url !== 'string'
  ) {
    throw new StripeCheckoutError('Stripe returned an unexpected checkout response.', 502)
  }

  return {
    id: data.id,
    url: data.url,
  }
}

export async function expireStripeCheckoutSession(sessionId: string) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY

  if (!stripeSecretKey) return

  const response = await fetch(
    `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(sessionId)}/expire`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }
  )

  if (!response.ok) {
    const data = await response.json().catch(() => null) as unknown
    const message = getStripeErrorMessage(data) ?? 'Stripe Checkout session could not be expired.'

    throw new StripeCheckoutError(message, response.status)
  }
}
