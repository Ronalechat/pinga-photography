import { storyblokEditable } from '@storyblok/react/rsc'
import ShopProduct from '@/components/sections/ShopProduct/ShopProduct'
import {
  mapShopProductBlok,
  type ShopProductBlokShape,
} from '@/lib/shop/storyblokProduct'

export type { ShopProductBlokShape } from '@/lib/shop/storyblokProduct'

export default function ShopProductBlok({
  blok,
}: {
  blok: ShopProductBlokShape
}) {
  return (
    <div {...storyblokEditable(blok)}>
      <ShopProduct product={mapShopProductBlok(blok)} />
    </div>
  )
}
