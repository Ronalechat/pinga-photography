import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StoryblokLiveEditing } from '@storyblok/react/rsc'
import type { SbBlokData } from '@storyblok/react/rsc'
import { getStoryblokApi, getVersion } from '@/utils/storyblok'
import Container from '@/components/layout/Container/Container'
import PageHeader from '@/components/sections/PageHeader/PageHeader'
import ProductEnquiryBlok, {
  type ProductEnquiryBlokShape,
} from '@/components/bloks/ProductEnquiryBlok'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Shop — P!nga | T-Shirt Enquiries',
  description:
    'Register interest in limited P!nga T-shirt print runs by Sydney artist Paul Pinga Matereke.',
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

  const productBloks = ((data.story.content.body ?? []) as SbBlokData[])
    .filter((b) => b.component === 'product_enquiry')

  return (
    <main>
      <Container>
        <PageHeader title="Shop" />
        {productBloks.map((blok) => (
          <ProductEnquiryBlok
            key={blok._uid}
            blok={blok as ProductEnquiryBlokShape}
          />
        ))}
      </Container>
      <StoryblokLiveEditing story={data.story} />
    </main>
  )
}
