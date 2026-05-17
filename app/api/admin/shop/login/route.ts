import { NextRequest, NextResponse } from 'next/server'
import {
  createAdminCsrfToken,
  createAdminSessionCookie,
  setAdminSessionCookie,
  verifyAdminPinLogin,
} from '@/lib/shop/adminAuth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as unknown

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Login could not be verified.' }, { status: 400 })
  }

  const result = await verifyAdminPinLogin({
    username: 'username' in body ? body.username : '',
    pin: 'pin' in body ? body.pin : '',
    setupSecret: 'setupSecret' in body ? body.setupSecret : '',
  })

  if (!result.ok || !result.username) {
    return NextResponse.json({
      error: result.error ?? 'Login could not be verified.',
      setupRequired: result.setupRequired,
      locked: result.locked,
    }, {
      status: result.locked ? 429 : result.setupRequired ? 403 : 401,
    })
  }

  const sessionCookie = createAdminSessionCookie(result.username)
  const response = NextResponse.json({
    ok: true,
    username: result.username,
    csrfToken: createAdminCsrfToken(sessionCookie),
  })

  setAdminSessionCookie(response, result.username, sessionCookie)

  return response
}
