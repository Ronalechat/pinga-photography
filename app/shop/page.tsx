import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StoryblokLiveEditing } from '@storyblok/react/rsc'
import type { SbBlokData } from '@storyblok/react/rsc'
import { getStoryblokApi, getVersion } from '@/utils/storyblok'
import Container from '@/components/layout/Container/Container'
import PageHeader from '@/components/sections/PageHeader/PageHeader'
import { ShopCartProvider } from '@/components/sections/ShopCart/ShopCartProvider'
import ShopCartSummary from '@/components/sections/ShopCart/ShopCartSummary'
import ProductEnquiryBlok, {
  type ProductEnquiryBlokShape,
} from '@/components/bloks/ProductEnquiryBlok'
import ShopProductBlok, {
  type ShopProductBlokShape,
} from '@/components/bloks/ShopProductBlok'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Shop — P!nga | Prints and Product Enquiries',
  description:
    'Shop limited prints and register interest in product runs by Sydney artist Paul Pinga Matereke.',
}

export default async function ShopPage() {
  const version = await getVersion()
  const sb = getStoryblokApi()
  let data

  try {
    const res = await sb.get('cdn/stories/shop', { version })
    data = res.data
  } catch {
    notFound()
  }

  const body = (data.story.content.body ?? []) as SbBlokData[]

  return (
    <ShopCartProvider>
      <main>
        <Container>
          <PageHeader title="Shop" />
          <ShopCartSummary />
          {body.map((blok) => {
            if (blok.component === 'shop_product') {
              return (
                <ShopProductBlok
                  key={blok._uid}
                  blok={blok as ShopProductBlokShape}
                />
              )
            }

            if (blok.component === 'product_enquiry') {
              return (
                <ProductEnquiryBlok
                  key={blok._uid}
                  blok={blok as ProductEnquiryBlokShape}
                />
              )
            }

            return null
          })}
        </Container>
        <StoryblokLiveEditing story={data.story} />
      </main>
    </ShopCartProvider>
  )
}
