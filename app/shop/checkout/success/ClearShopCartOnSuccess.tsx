'use client'

import { useEffect } from 'react'
import { clearStoredShopCart } from '@/lib/shop/cartStorage'

export default function ClearShopCartOnSuccess() {
  useEffect(() => {
    clearStoredShopCart()
  }, [])

  return null
}
