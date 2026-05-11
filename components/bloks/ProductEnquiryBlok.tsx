import { storyblokEditable } from '@storyblok/react/rsc'
import type { SbBlokData } from '@storyblok/react/rsc'
import ProductEnquiry, {
  type ProductImage,
} from '@/components/sections/ProductEnquiry/ProductEnquiry'

interface SbAsset {
  filename: string
  alt?: string
}

export interface ProductEnquiryBlokShape extends SbBlokData {
  product_name?: string
  subtitle?: string
  images?: SbAsset[]
  minimum_order_goal?: number | ''
  cta_label?: string
}

export default function ProductEnquiryBlok({
  blok,
}: {
  blok: ProductEnquiryBlokShape
}) {
  const images: ProductImage[] = (blok.images ?? [])
    .filter((image) => Boolean(image.filename))
    .map((image) => ({
      src: image.filename,
      alt: image.alt,
    }))

  return (
    <div {...storyblokEditable(blok)}>
      <ProductEnquiry
        productName={blok.product_name || 'P!nga T-Shirt'}
        subtitle={blok.subtitle || undefined}
        images={images}
        minimumOrderGoal={blok.minimum_order_goal || undefined}
        ctaLabel={blok.cta_label || undefined}
      />
    </div>
  )
}
