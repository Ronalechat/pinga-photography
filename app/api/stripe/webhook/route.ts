import { NextRequest, NextResponse } from 'next/server'
import {
  markOrderPaid,
  markPendingOrderCancelled,
  releaseCheckoutReservations,
  type StripeCompletedSession,
} from '@/lib/shop/orderPersistence'
import { getWebhookSetupStatus } from '@/lib/shop/setupStatus'
import { sendPaidOrderNotification } from '@/lib/shop/shopNotifications'
import {
  parseStripeWebhookEvent,
  verifyStripeWebhookSignature,
} from '@/lib/shop/stripeWebhook'

export const runtime = 'nodejs'

function isCompletedSession(value: unknown): value is StripeCompletedSession {
  return Boolean(
    value &&
    typeof value === 'object' &&
    'id' in value &&
    typeof value.id === 'string'
  )
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature' }, { status: 400 })
  }

  const setup = getWebhookSetupStatus()

  if (!setup.ready) {
    return NextResponse.json({
      error: 'Stripe webhook handling is not connected yet.',
      setupRequired: true,
      missing: setup.missing,
    }, { status: 501 })
  }

  const rawBody = await req.text()
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret || !verifyStripeWebhookSignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid Stripe signature' }, { status: 400 })
  }

  let event

  try {
    event = parseStripeWebhookEvent(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid Stripe webhook payload' }, { status: 400 })
  }

  if (!event) {
    return NextResponse.json({ error: 'Invalid Stripe webhook payload' }, { status: 400 })
  }

  if (
    event.type !== 'checkout.session.completed' &&
    event.type !== 'checkout.session.expired'
  ) {
    return NextResponse.json({ received: true, ignored: true })
  }

  if (!isCompletedSession(event.data.object)) {
    return NextResponse.json({ error: 'Invalid checkout session payload' }, { status: 400 })
  }

  if (event.type === 'checkout.session.expired') {
    await markPendingOrderCancelled(event.data.object.id)
    await releaseCheckoutReservations(event.data.object.id)
    return NextResponse.json({ received: true })
  }

  await markOrderPaid(event.data.object)
  await sendPaidOrderNotification(event.data.object.id).catch((error: unknown) => {
    console.error('[stripe-webhook] paid order notification failed', error)
  })

  return NextResponse.json({ received: true })
}
