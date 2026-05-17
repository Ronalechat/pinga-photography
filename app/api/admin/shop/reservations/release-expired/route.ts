import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthError } from '@/lib/shop/adminAuth'
import { releaseExpiredReservations } from '@/lib/shop/adminMutations'
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

  const releasedCount = await releaseExpiredReservations()

  return NextResponse.json({ releasedCount })
}
