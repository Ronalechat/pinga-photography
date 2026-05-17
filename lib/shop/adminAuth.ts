import { NextRequest, NextResponse } from 'next/server'

export function getAdminAuthError(req: NextRequest) {
  const token = process.env.SHOP_ADMIN_ACCESS_TOKEN

  if (!token) {
    return NextResponse.json({
      error: 'Shop admin access token is not configured.',
      setupRequired: true,
      missing: ['Shop admin access token'],
    }, { status: 501 })
  }

  if (req.headers.get('x-shop-admin-token') !== token) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  return null
}
