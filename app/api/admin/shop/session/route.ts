import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthSetupStatus, getAdminCsrfToken, getAdminSession } from '@/lib/shop/adminAuth'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const setup = getAdminAuthSetupStatus()

  if (!setup.ready) {
    return NextResponse.json({
      authenticated: false,
      setupRequired: true,
      missing: setup.missing,
    }, { status: 501 })
  }

  const session = getAdminSession(req)

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({
    authenticated: true,
    username: session.username,
    csrfToken: getAdminCsrfToken(req),
  })
}
