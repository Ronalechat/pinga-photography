import type { SbBlokData } from '@storyblok/react/rsc'
import { getStoryblokApi, getVersion } from '@/utils/storyblok'
import {
  applyLiveStockAvailability,
  mapShopProductBlok,
  type ShopProductBlokShape,
} from '@/lib/shop/storyblokProduct'
import type { ShopProductConfig } from '@/lib/shop/types'

interface ShopStoryContent {
  body?: SbBlokData[]
}

interface ShopStoryResponse {
  data?: {
    story?: {
      content?: ShopStoryContent
    }
  }
}

export async function getShopCatalog() {
  const version = await getVersion()
  const sb = getStoryblokApi()
  const response = await sb.get('cdn/stories/shop', { version }) as ShopStoryResponse
  const body = response.data?.story?.content?.body ?? []

  const products = body
    .filter((blok): blok is ShopProductBlokShape => blok.component === 'shop_product')
    .map(mapShopProductBlok)

  return applyLiveStockAvailability(products)
}

export function getProductMap(products: ShopProductConfig[]) {
  return new Map(products.map((product) => [product.productId, product]))
}
