import { NextRequest, NextResponse } from 'next/server'
import { calculateShippingQuote } from '@/lib/shop/shipping'
import { sanitizeCartLines, sanitizeDestination } from '@/lib/shop/cartValidation'

export const runtime = 'nodejs'

interface ShippingQuoteBody {
  lines?: unknown
  destination?: {
    country?: unknown
    postcode?: unknown
  }
}

export async function POST(req: NextRequest) {
  let body: ShippingQuoteBody

  try {
    const parsed = await req.json() as unknown
    if (!parsed || typeof parsed !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    body = parsed as ShippingQuoteBody
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const lines = sanitizeCartLines(body.lines)
  const destination = sanitizeDestination(body.destination)

  if (lines.length === 0) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  return NextResponse.json(calculateShippingQuote(lines, destination))
}
