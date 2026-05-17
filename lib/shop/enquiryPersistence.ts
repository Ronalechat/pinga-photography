import { hasSupabaseConfig, supabaseRequest } from '@/lib/shop/supabaseRest'

export interface ShopEnquiryPersistenceInput {
  productId?: string
  productTitle: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  quantity: number
  selectedOptions: Array<{
    groupKey: string
    groupLabel: string
    valueKey: string
    valueLabel: string
    priceDeltaCents: number
  }>
  message?: string
}

export async function persistShopEnquiry(input: ShopEnquiryPersistenceInput) {
  if (!hasSupabaseConfig()) return

  await supabaseRequest('/rest/v1/shop_enquiries', {
    method: 'POST',
    body: {
      product_id: input.productId || null,
      product_title: input.productTitle,
      customer_name: input.customerName,
      customer_email: input.customerEmail,
      customer_phone: input.customerPhone || null,
      quantity: input.quantity,
      selected_options: input.selectedOptions,
      message: input.message || null,
    },
  })
}
