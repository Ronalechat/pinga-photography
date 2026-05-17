import { storyblokEditable } from '@storyblok/react/rsc'
import ShopProduct from '@/components/sections/ShopProduct/ShopProduct'
import {
  applyLiveStockAvailability,
  mapShopProductBlok,
  type ShopProductBlokShape,
} from '@/lib/shop/storyblokProduct'

export type { ShopProductBlokShape } from '@/lib/shop/storyblokProduct'

export default async function ShopProductBlok({
  blok,
}: {
  blok: ShopProductBlokShape
}) {
  const [product] = await applyLiveStockAvailability([mapShopProductBlok(blok)])

  return (
    <div {...storyblokEditable(blok)}>
      <ShopProduct product={product} />
    </div>
  )
}
