import { NextRequest, NextResponse } from 'next/server'
import { getAdminAuthError } from '@/lib/shop/adminAuth'
import type {
  AdminSummaryPageInfo,
  EnquirySummaryRow,
  InventorySummaryRow,
  OrderSummaryRow,
  ReservationSummaryRow,
} from '@/lib/shop/adminSummary'
import { isAdminEnquiryStatus, isAdminOrderStatus, isAdminStockMode } from '@/lib/shop/adminMutations'
import { getAdminDataSetupStatus } from '@/lib/shop/setupStatus'
import { supabaseRequest } from '@/lib/shop/supabaseRest'

export const runtime = 'nodejs'

type AdminReservationStatus = 'active' | 'converted' | 'released' | 'expired'
type ReservationStatusFilter = AdminReservationStatus | 'all'

interface SummaryPageOptions {
  limit: number
  offset: number
}

const DEFAULT_LIMIT = 10
const INVENTORY_DEFAULT_LIMIT = 20
const RESERVATION_DEFAULT_LIMIT = 20
const MAX_LIMIT = 50

function isAdminReservationStatus(value: unknown): value is AdminReservationStatus {
  return (
    value === 'active' ||
    value === 'converted' ||
    value === 'released' ||
    value === 'expired'
  )
}

function parsePageNumber(params: URLSearchParams, key: string, fallback: number) {
  const value = params.get(key)
  if (!value) return fallback

  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0) return fallback

  return parsed
}

function parseLimit(params: URLSearchParams, key: string, fallback: number) {
  return Math.max(1, Math.min(parsePageNumber(params, key, fallback), MAX_LIMIT))
}

function getPageOptions(params: URLSearchParams, scope: string, fallbackLimit = DEFAULT_LIMIT) {
  return {
    limit: parseLimit(params, `${scope}Limit`, fallbackLimit),
    offset: parsePageNumber(params, `${scope}Offset`, 0),
  }
}

function getFilter<T extends string>(
  params: URLSearchParams,
  key: string,
  isValid: (value: unknown) => value is T
) {
  const value = params.get(key)
  if (!value || value === 'all') return null

  return isValid(value) ? value : null
}

function getReservationStatusFilter(params: URLSearchParams): ReservationStatusFilter {
  const value = params.get('reservationStatus')

  if (value === 'all') return 'all'
  if (isAdminReservationStatus(value)) return value

  return 'active'
}

function pageInfo<T>(items: T[], options: SummaryPageOptions): AdminSummaryPageInfo {
  return {
    ...options,
    hasMore: items.length === options.limit,
  }
}

function appendPage(path: string, options: SummaryPageOptions) {
  return `${path}&limit=${options.limit}&offset=${options.offset}`
}

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

  const params = req.nextUrl.searchParams
  const orderPage = getPageOptions(params, 'orders')
  const enquiryPage = getPageOptions(params, 'enquiries')
  const inventoryPage = getPageOptions(params, 'inventory', INVENTORY_DEFAULT_LIMIT)
  const reservationPage = getPageOptions(params, 'reservations', RESERVATION_DEFAULT_LIMIT)
  const orderStatus = getFilter(params, 'orderStatus', isAdminOrderStatus)
  const enquiryStatus = getFilter(params, 'enquiryStatus', isAdminEnquiryStatus)
  const inventoryMode = getFilter(params, 'inventoryMode', isAdminStockMode)
  const reservationStatus = getReservationStatusFilter(params)
  const orderStatusQuery = orderStatus ? `&status=eq.${encodeURIComponent(orderStatus)}` : ''
  const enquiryStatusQuery = enquiryStatus ? `&status=eq.${encodeURIComponent(enquiryStatus)}` : ''
  const inventoryModeQuery = inventoryMode ? `&stock_mode=eq.${encodeURIComponent(inventoryMode)}` : ''
  const reservationStatusQuery = reservationStatus === 'all'
    ? ''
    : `&status=eq.${encodeURIComponent(reservationStatus)}`

  const [orders, enquiries, inventory, reservations] = await Promise.all([
    supabaseRequest<OrderSummaryRow[]>(
      appendPage(`/rest/v1/shop_orders?select=id,status,customer_name,customer_email,customer_phone,subtotal_cents,shipping_cents,total_cents,currency,shipping_option_label,shipping_address,created_at,shop_order_items(id,product_id,title,quantity,unit_amount_cents,currency,selected_options,option_signature)&order=created_at.desc${orderStatusQuery}`, orderPage)
    ),
    supabaseRequest<EnquirySummaryRow[]>(
      appendPage(`/rest/v1/shop_enquiries?select=id,status,product_id,product_title,customer_name,customer_email,customer_phone,quantity,selected_options,created_at&order=created_at.desc${enquiryStatusQuery}`, enquiryPage)
    ),
    supabaseRequest<InventorySummaryRow[]>(
      appendPage(`/rest/v1/shop_inventory?select=product_id,stock_mode,stock_quantity,sold_quantity,updated_at&order=updated_at.desc${inventoryModeQuery}`, inventoryPage)
    ),
    supabaseRequest<ReservationSummaryRow[]>(
      appendPage(`/rest/v1/shop_reservations?select=id,product_id,option_signature,quantity,status,stripe_session_id,expires_at,created_at${reservationStatusQuery}&order=expires_at.asc`, reservationPage)
    ),
  ])

  return NextResponse.json({
    orders,
    enquiries,
    inventory,
    reservations,
    pagination: {
      orders: pageInfo(orders, orderPage),
      enquiries: pageInfo(enquiries, enquiryPage),
      inventory: pageInfo(inventory, inventoryPage),
      reservations: pageInfo(reservations, reservationPage),
    },
  })
}
