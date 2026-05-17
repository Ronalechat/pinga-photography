import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthError } from '@/lib/shop/adminAuth'
import { isAdminOrderStatus, updateOrderStatus } from '@/lib/shop/adminMutations'
import { getAdminDataSetupStatus } from '@/lib/shop/setupStatus'

export const runtime = 'nodejs'

interface RouteContext {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const authError = getAdminAuthError(req)
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
  const status = body && typeof body === 'object' && 'status' in body
    ? body.status
    : undefined

  if (!isAdminOrderStatus(status)) {
    return NextResponse.json({ error: 'Order status is invalid.' }, { status: 400 })
  }

  const { id } = await context.params
  await updateOrderStatus(id, status)

  return NextResponse.json({ ok: true })
}
