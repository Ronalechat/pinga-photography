import { validateCheckoutInput, type CheckoutValidationInput } from '@/lib/shop/cartValidation'
import { getProductMap, getShopCatalog } from '@/lib/shop/catalog'
import type {
  CartLine,
  SelectedShopOption,
  ShopProductConfig,
} from '@/lib/shop/types'

export interface RevalidatedCheckout {
  ok: boolean
  errors: string[]
  validation: ReturnType<typeof validateCheckoutInput>
  requiresStockReservation: boolean
  reservationLines: CartLine[]
}

function findSubmittedOption(
  submitted: SelectedShopOption[],
  groupKey: string
) {
  return submitted.find((option) => option.groupKey === groupKey)
}

function buildAuthoritativeLine(
  submittedLine: CartLine,
  product: ShopProductConfig,
  errors: string[]
): CartLine | null {
  if (product.mode !== 'cart_checkout') {
    errors.push(`${product.title} is not available for checkout.`)
    return null
  }

  const unknownSubmittedOption = submittedLine.selectedOptions.find((option) => (
    !product.optionGroups.some((group) => group.key === option.groupKey)
  ))

  if (unknownSubmittedOption) {
    errors.push(`${product.title} has an option that is no longer available.`)
    return null
  }

  const selectedOptions: SelectedShopOption[] = []

  for (const group of product.optionGroups) {
    const submittedOption = findSubmittedOption(submittedLine.selectedOptions, group.key)
    const selectedValue = group.values.find((value) => value.key === submittedOption?.valueKey)

    if (!selectedValue) {
      errors.push(`${product.title} needs a valid ${group.label} option.`)
      return null
    }

    selectedOptions.push({
      groupKey: group.key,
      groupLabel: group.label,
      valueKey: selectedValue.key,
      valueLabel: selectedValue.label,
      priceDeltaCents: selectedValue.priceDeltaCents ?? 0,
    })
  }

  const finiteStock = product.stockMode === 'limited' || product.stockMode === 'one_of_one'

  if (finiteStock && typeof product.stockQuantity === 'number') {
    if (product.stockQuantity <= 0) {
      errors.push(`${product.title} is sold out.`)
      return null
    }

    if (submittedLine.quantity > product.stockQuantity) {
      errors.push(`${product.title} only has ${product.stockQuantity} available.`)
      return null
    }
  }

  const unitPriceCents = product.priceCents + selectedOptions.reduce((total, option) => (
    total + option.priceDeltaCents
  ), 0)

  return {
    lineId: submittedLine.lineId,
    productId: product.productId,
    title: product.title,
    image: product.images[0]?.src,
    unitPriceCents,
    currency: product.currency,
    quantity: submittedLine.quantity,
    selectedOptions,
    shippingProfile: product.shippingProfile,
    requiresManualShippingQuote: product.requiresManualShippingQuote,
    pickupAvailable: product.pickupAvailable,
    canCombineShipping: product.canCombineShipping,
    weightGrams: product.weightGrams,
    packageLengthMm: product.packageLengthMm,
    packageWidthMm: product.packageWidthMm,
    packageHeightMm: product.packageHeightMm,
  }
}

export async function revalidateCheckoutInput(
  input: CheckoutValidationInput
): Promise<RevalidatedCheckout> {
  const initialValidation = validateCheckoutInput(input)
  const errors = [...initialValidation.errors]
  const products = await getShopCatalog()
  const productMap = getProductMap(products)
  const authoritativeLines: CartLine[] = []
  const reservationLines: CartLine[] = []
  let requiresStockReservation = false

  for (const line of initialValidation.lines) {
    const product = productMap.get(line.productId)

    if (!product) {
      errors.push(`${line.title} is no longer available.`)
      continue
    }

    const authoritativeLine = buildAuthoritativeLine(line, product, errors)
    if (authoritativeLine) {
      authoritativeLines.push(authoritativeLine)

      if (product.stockMode === 'limited' || product.stockMode === 'one_of_one') {
        requiresStockReservation = true
        reservationLines.push(authoritativeLine)
      }
    }
  }

  const validation = validateCheckoutInput({
    lines: authoritativeLines,
    destination: input.destination,
    shippingOptionId: input.shippingOptionId,
  })
  const combinedErrors = errors.length > 0 ? errors : validation.errors

  return {
    ok: errors.length === 0 && validation.ok,
    errors: combinedErrors,
    validation,
    requiresStockReservation,
    reservationLines,
  }
}
