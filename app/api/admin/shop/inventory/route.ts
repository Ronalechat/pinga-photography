import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthError } from '@/lib/shop/adminAuth'
import { upsertInventory, validateInventoryMutation } from '@/lib/shop/adminMutations'
import { getAdminDataSetupStatus } from '@/lib/shop/setupStatus'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const authError = getAdminAuthError(req, { requireCsrf: true })
  if (authError) return authError

  const setup = getAdminDataSetupStatus()
  if (!setup.ready) {
    return NextResponse.json({
      error: 'Shop admin data is not connected yet.',
      setupRequired: true,
      missing: setup.missing,
    }, { status: 501 })
  }

  const body = await req.json().catch(() => null) as unknown
  const input = validateInventoryMutation({
    productId: body && typeof body === 'object' && 'productId' in body ? body.productId : '',
    stockMode: body && typeof body === 'object' && 'stockMode' in body ? body.stockMode : '',
    stockQuantity: body && typeof body === 'object' && 'stockQuantity' in body
      ? body.stockQuantity
      : null,
    notes: body && typeof body === 'object' && 'notes' in body ? body.notes : '',
  })

  if (!input.ok) {
    return NextResponse.json({ error: 'Inventory row is invalid.', errors: input.errors }, { status: 400 })
  }

  await upsertInventory(input)

  return NextResponse.json({ ok: true })
}
