import { NextRequest, NextResponse } from 'next/server'
import type { CheckoutValidationInput } from '@/lib/shop/cartValidation'
import { revalidateCheckoutInput } from '@/lib/shop/checkoutRevalidation'
import {
  attachStripeSessionToPendingOrder,
  createCheckoutReservations,
  createPendingOrder,
  markPendingOrderCancelled,
  markPendingOrderCancelledById,
  releaseCheckoutReservations,
} from '@/lib/shop/orderPersistence'
import { getCheckoutSetupStatus } from '@/lib/shop/setupStatus'
import {
  createStripeCheckoutSession,
  expireStripeCheckoutSession,
  StripeCheckoutError,
} from '@/lib/shop/stripeCheckout'
import { getShippingProfileReadModel } from '@/lib/shop/shipping'

export const runtime = 'nodejs'

function getLineCount(lines: CheckoutValidationInput['lines']) {
  return Array.isArray(lines) ? lines.length : 0
}

function getBaseUrl(req: NextRequest) {
  return process.env.NEXT_PUBLIC_SITE_URL || req.nextUrl.origin
}

export async function POST(req: NextRequest) {
  let body: CheckoutValidationInput

  try {
    const parsed = await req.json() as unknown
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    body = parsed as CheckoutValidationInput
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  let checkout

  try {
    const shippingProfiles = await getShippingProfileReadModel()
    checkout = await revalidateCheckoutInput(body, { shippingRules: shippingProfiles.rules })
  } catch {
    return NextResponse.json({
      error: 'Current shop products could not be verified. Please try again.',
    }, { status: 502 })
  }

  const validation = checkout.validation

  if (!checkout.ok) {
    return NextResponse.json({
      error: 'Cart could not be checked out',
      errors: checkout.errors,
    }, { status: 400 })
  }

  if (validation.selectedShippingOption?.kind === 'manual_quote') {
    return NextResponse.json({
      error: 'This cart needs a manual shipping quote before checkout.',
      shippingQuote: validation.shippingQuote,
    }, { status: 409 })
  }

  if (!validation.selectedShippingOption) {
    return NextResponse.json({
      error: 'Choose a shipping option before checkout.',
    }, { status: 400 })
  }

  const setup = getCheckoutSetupStatus()

  if (!setup.ready) {
    return NextResponse.json({
      error: 'Shop checkout is not connected yet.',
      setupRequired: true,
      missing: setup.missing,
      summary: {
        lineCount: getLineCount(body.lines),
        itemCount: validation.lines.reduce((total, line) => total + line.quantity, 0),
        subtotalCents: validation.subtotalCents,
        shippingCents: validation.selectedShippingOption?.amountCents ?? 0,
        totalCents: validation.totalCents,
        currency: validation.currency,
        requiresStockReservation: checkout.requiresStockReservation,
      },
    }, { status: 501 })
  }

  const baseUrl = getBaseUrl(req)

  let order: Awaited<ReturnType<typeof createPendingOrder>>

  try {
    order = await createPendingOrder({
      lines: validation.lines,
      destination: validation.destination,
      shippingOption: validation.selectedShippingOption,
      subtotalCents: validation.subtotalCents,
      totalCents: validation.totalCents ?? validation.subtotalCents,
      currency: validation.currency,
    })
  } catch (error) {
    return NextResponse.json({
      error: error instanceof Error
        ? error.message
        : 'Order could not be prepared before checkout.',
    }, { status: 409 })
  }

  try {
    const session = await createStripeCheckoutSession({
      lines: validation.lines,
      shippingOption: validation.selectedShippingOption,
      orderId: order.id,
      successUrl: `${baseUrl}/shop/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/shop/checkout/cancel`,
    })

    try {
      await attachStripeSessionToPendingOrder(order.id, session.id)

      if (checkout.reservationLines.length > 0) {
        await createCheckoutReservations(session.id, checkout.reservationLines)
      }
    } catch (error) {
      await releaseCheckoutReservations(session.id).catch(() => undefined)
      await markPendingOrderCancelled(session.id).catch(() => undefined)
      await markPendingOrderCancelledById(order.id).catch(() => undefined)
      await expireStripeCheckoutSession(session.id).catch(() => undefined)

      return NextResponse.json({
        error: error instanceof Error
          ? error.message
          : 'Order could not be reserved before checkout.',
      }, { status: 409 })
    }

    return NextResponse.json(session)
  } catch (error) {
    await markPendingOrderCancelledById(order.id).catch(() => undefined)

    if (error instanceof StripeCheckoutError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    return NextResponse.json({
      error: 'Stripe Checkout could not be created.',
    }, { status: 502 })
  }
}
