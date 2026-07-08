import type { ProductMediaImage } from '@/lib/media/types'

export type ShopProductMode = 'enquiry' | 'cart_checkout' | 'manual_quote' | 'sold_out'
export type StockMode = 'unlimited' | 'limited' | 'one_of_one' | 'enquiry_goal'
export type StockAvailabilitySource = 'storyblok' | 'supabase'
export type ShippingProfile =
  | 'shirt'
  | 'unframed_print'
  | 'framed_print'
  | 'oversized'
  | 'pickup_only'
  | 'manual_quote'

export interface ShopOptionValue {
  key: string
  label: string
  priceDeltaCents?: number
}

export interface ShopOptionGroup {
  key: string
  label: string
  values: ShopOptionValue[]
}

export interface SelectedShopOption {
  groupKey: string
  groupLabel: string
  valueKey: string
  valueLabel: string
  priceDeltaCents: number
}

export interface ShopStockAvailability {
  productId: string
  source: StockAvailabilitySource
  stockMode: StockMode
  stockQuantity?: number
  soldQuantity: number
  reservedQuantity: number
  availableQuantity?: number
  soldOut: boolean
}

export interface ShopProductConfig {
  productId: string
  title: string
  subtitle?: string
  description?: string
  images: ProductMediaImage[]
  mode: ShopProductMode
  priceCents: number
  currency: string
  stockMode: StockMode
  stockQuantity?: number
  liveStock?: ShopStockAvailability
  showStock?: boolean
  shippingProfile?: ShippingProfile
  shippingNote?: string
  weightGrams?: number
  packageLengthMm?: number
  packageWidthMm?: number
  packageHeightMm?: number
  canCombineShipping?: boolean
  requiresManualShippingQuote?: boolean
  pickupAvailable?: boolean
  optionGroups: ShopOptionGroup[]
  ctaLabel?: string
}

export interface CartLine {
  lineId: string
  productId: string
  title: string
  image?: string
  unitPriceCents: number
  currency: string
  quantity: number
  selectedOptions: SelectedShopOption[]
  shippingProfile?: ShippingProfile
  requiresManualShippingQuote?: boolean
  pickupAvailable?: boolean
  canCombineShipping?: boolean
  weightGrams?: number
  packageLengthMm?: number
  packageWidthMm?: number
  packageHeightMm?: number
}
