import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthError } from '@/lib/shop/adminAuth'
import type {
  EnquirySummaryRow,
  InventorySummaryRow,
  OrderSummaryRow,
  ReservationSummaryRow,
} from '@/lib/shop/adminSummary'
import { getAdminDataSetupStatus } from '@/lib/shop/setupStatus'
import { supabaseRequest } from '@/lib/shop/supabaseRest'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
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

  const [orders, enquiries, inventory, reservations] = await Promise.all([
    supabaseRequest<OrderSummaryRow[]>(
      '/rest/v1/shop_orders?select=id,status,customer_name,customer_email,customer_phone,subtotal_cents,shipping_cents,total_cents,currency,shipping_option_label,shipping_address,created_at,shop_order_items(id,product_id,title,quantity,unit_amount_cents,currency,selected_options,option_signature)&order=created_at.desc&limit=10'
    ),
    supabaseRequest<EnquirySummaryRow[]>(
      '/rest/v1/shop_enquiries?select=id,status,product_id,product_title,customer_name,customer_email,customer_phone,quantity,selected_options,created_at&order=created_at.desc&limit=10'
    ),
    supabaseRequest<InventorySummaryRow[]>(
      '/rest/v1/shop_inventory?select=product_id,stock_mode,stock_quantity,sold_quantity,updated_at&order=updated_at.desc&limit=20'
    ),
    supabaseRequest<ReservationSummaryRow[]>(
      '/rest/v1/shop_reservations?select=id,product_id,option_signature,quantity,status,stripe_session_id,expires_at,created_at&status=eq.active&order=expires_at.asc&limit=20'
    ),
  ])

  return NextResponse.json({
    orders,
    enquiries,
    inventory,
    reservations,
  })
}
