'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { SHOP_CART_STORAGE_KEY } from '@/lib/shop/cartStorage'
import type { CartLine, SelectedShopOption, ShippingProfile } from '@/lib/shop/types'

interface AddToCartInput {
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

interface ShopCartContextValue {
  lines: CartLine[]
  itemCount: number
  subtotalCents: number
  addLine: (line: AddToCartInput) => void
  updateQuantity: (lineId: string, quantity: number) => void
  removeLine: (lineId: string) => void
  clearCart: () => void
}

const ShopCartContext = createContext<ShopCartContextValue | null>(null)

function selectedOptionKey(options: SelectedShopOption[]) {
  return options
    .map((option) => `${option.groupKey}:${option.valueKey}`)
    .sort()
    .join('|')
}

function createLineId(productId: string, options: SelectedShopOption[]) {
  const optionKey = selectedOptionKey(options)
  return optionKey ? `${productId}__${optionKey}` : productId
}

function readStoredCart(): CartLine[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(SHOP_CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isCartLine)
  } catch {
    return []
  }
}

function isCartLine(value: unknown): value is CartLine {
  if (!value || typeof value !== 'object') return false
  const line = value as Partial<CartLine>

  return (
    typeof line.lineId === 'string' &&
    typeof line.productId === 'string' &&
    typeof line.title === 'string' &&
    typeof line.unitPriceCents === 'number' &&
    typeof line.currency === 'string' &&
    typeof line.quantity === 'number' &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    Array.isArray(line.selectedOptions)
  )
}

export function ShopCartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [hydrated, setHydrated] = useState(false)
  const readTimerRef = useRef<number | null>(null)

  useEffect(() => {
    readTimerRef.current = window.setTimeout(() => {
      setLines(readStoredCart())
      setHydrated(true)
      readTimerRef.current = null
    }, 0)

    return () => {
      if (readTimerRef.current !== null) window.clearTimeout(readTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    window.localStorage.setItem(SHOP_CART_STORAGE_KEY, JSON.stringify(lines))
  }, [hydrated, lines])

  const addLine = useCallback((input: AddToCartInput) => {
    const quantity = Math.max(1, Math.floor(input.quantity))
    const lineId = createLineId(input.productId, input.selectedOptions)

    setLines((current) => {
      const existing = current.find((line) => line.lineId === lineId)
      if (existing) {
        return current.map((line) => (
          line.lineId === lineId
            ? { ...line, quantity: line.quantity + quantity }
            : line
        ))
      }

      return [
        ...current,
        {
          lineId,
          ...input,
          quantity,
        },
      ]
    })
  }, [])

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    const nextQuantity = Math.floor(quantity)
    if (nextQuantity < 1) {
      setLines((current) => current.filter((line) => line.lineId !== lineId))
      return
    }

    setLines((current) => current.map((line) => (
      line.lineId === lineId ? { ...line, quantity: nextQuantity } : line
    )))
  }, [])

  const removeLine = useCallback((lineId: string) => {
    setLines((current) => current.filter((line) => line.lineId !== lineId))
  }, [])

  const clearCart = useCallback(() => {
    setLines([])
  }, [])

  const value = useMemo<ShopCartContextValue>(() => {
    const itemCount = lines.reduce((total, line) => total + line.quantity, 0)
    const subtotalCents = lines.reduce((total, line) => (
      total + line.unitPriceCents * line.quantity
    ), 0)

    return {
      lines,
      itemCount,
      subtotalCents,
      addLine,
      updateQuantity,
      removeLine,
      clearCart,
    }
  }, [addLine, clearCart, lines, removeLine, updateQuantity])

  return (
    <ShopCartContext.Provider value={value}>
      {children}
    </ShopCartContext.Provider>
  )
}

export function useShopCart() {
  const context = useContext(ShopCartContext)
  if (!context) {
    throw new Error('useShopCart must be used inside ShopCartProvider')
  }
  return context
}
