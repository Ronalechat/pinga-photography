import { supabaseRequest } from '@/lib/shop/supabaseRest'

export type AdminOrderStatus = 'pending' | 'paid' | 'cancelled' | 'fulfilled' | 'refunded'
export type AdminEnquiryStatus = 'new' | 'contacted' | 'closed'
export type AdminStockMode = 'unlimited' | 'limited' | 'one_of_one' | 'enquiry_goal'

export function isAdminOrderStatus(value: unknown): value is AdminOrderStatus {
  return (
    value === 'pending' ||
    value === 'paid' ||
    value === 'cancelled' ||
    value === 'fulfilled' ||
    value === 'refunded'
  )
}

export function isAdminEnquiryStatus(value: unknown): value is AdminEnquiryStatus {
  return value === 'new' || value === 'contacted' || value === 'closed'
}

export function isAdminStockMode(value: unknown): value is AdminStockMode {
  return (
    value === 'unlimited' ||
    value === 'limited' ||
    value === 'one_of_one' ||
    value === 'enquiry_goal'
  )
}

function sanitizeText(value: unknown) {
  return typeof value === 'string' ? value.replace(/<[^>]*>/g, '').trim() : ''
}

function sanitizeInteger(value: unknown) {
  if (value === null || value === '') return null
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) return undefined
  return value
}

export async function updateOrderStatus(orderId: string, status: AdminOrderStatus) {
  await supabaseRequest(`/rest/v1/shop_orders?id=eq.${encodeURIComponent(orderId)}`, {
    method: 'PATCH',
    body: { status },
  })
}

export async function updateEnquiryStatus(enquiryId: string, status: AdminEnquiryStatus) {
  await supabaseRequest(`/rest/v1/shop_enquiries?id=eq.${encodeURIComponent(enquiryId)}`, {
    method: 'PATCH',
    body: { status },
  })
}

export interface InventoryMutationInput {
  productId: unknown
  stockMode: unknown
  stockQuantity: unknown
  notes?: unknown
}

export function validateInventoryMutation(input: InventoryMutationInput) {
  const productId = sanitizeText(input.productId)
  const stockMode = input.stockMode || 'unlimited'
  const stockQuantity = sanitizeInteger(input.stockQuantity)
  const notes = sanitizeText(input.notes)
  const errors: string[] = []

  if (!productId) errors.push('Product ID is required.')
  if (!isAdminStockMode(stockMode)) errors.push('Stock mode is invalid.')
  if (stockQuantity === undefined) errors.push('Stock quantity must be a whole number.')
  if ((stockMode === 'limited' || stockMode === 'one_of_one') && stockQuantity === null) {
    errors.push('Limited products need a stock quantity.')
  }
  if (stockMode === 'one_of_one' && stockQuantity !== 1) {
    errors.push('One-of-one products must have a stock quantity of 1.')
  }

  return {
    ok: errors.length === 0,
    errors,
    productId,
    stockMode: isAdminStockMode(stockMode) ? stockMode : 'unlimited',
    stockQuantity: stockMode === 'unlimited' || stockMode === 'enquiry_goal'
      ? stockQuantity
      : stockQuantity ?? 0,
    notes: notes || null,
  }
}

export async function upsertInventory(input: ReturnType<typeof validateInventoryMutation>) {
  await supabaseRequest('/rest/v1/shop_inventory', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates',
    body: {
      product_id: input.productId,
      stock_mode: input.stockMode,
      stock_quantity: input.stockQuantity,
      notes: input.notes,
    },
  })
}

export async function releaseExpiredReservations() {
  return supabaseRequest<number>('/rest/v1/rpc/shop_release_expired_reservations', {
    method: 'POST',
    body: {},
  })
}
