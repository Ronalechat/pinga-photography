export const SHOP_CART_STORAGE_KEY = 'pinga_shop_cart_v1'

export function clearStoredShopCart() {
  if (typeof window === 'undefined') return
  window.localStorage.removeItem(SHOP_CART_STORAGE_KEY)
}
