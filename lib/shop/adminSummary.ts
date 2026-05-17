export interface OrderSummaryRow {
  id: string
  status: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  subtotal_cents: number
  shipping_cents: number
  total_cents: number
  currency: string
  shipping_option_label: string | null
  shipping_address: unknown
  created_at: string
  shop_order_items?: OrderItemSummaryRow[]
}

export interface OrderItemSummaryRow {
  id: string
  product_id: string
  title: string
  quantity: number
  unit_amount_cents: number
  currency: string
  selected_options: unknown
  option_signature: string
}

export interface EnquirySummaryRow {
  id: string
  status: string
  product_id: string | null
  product_title: string | null
  customer_name: string
  customer_email: string
  customer_phone: string | null
  quantity: number
  selected_options: unknown
  message: string | null
  created_at: string
}

export interface InventorySummaryRow {
  product_id: string
  stock_mode: string
  stock_quantity: number | null
  sold_quantity: number
  updated_at: string
}

export interface ReservationSummaryRow {
  id: string
  product_id: string
  option_signature: string
  quantity: number
  status: string
  stripe_session_id: string | null
  expires_at: string
  created_at: string
}

export interface AdminSummaryPageInfo {
  limit: number
  offset: number
  hasMore: boolean
}

export interface AdminSummaryPagination {
  orders: AdminSummaryPageInfo
  enquiries: AdminSummaryPageInfo
  inventory: AdminSummaryPageInfo
  reservations: AdminSummaryPageInfo
}

export interface ShopAdminSummary {
  orders: OrderSummaryRow[]
  enquiries: EnquirySummaryRow[]
  inventory: InventorySummaryRow[]
  reservations: ReservationSummaryRow[]
  pagination?: AdminSummaryPagination
}
