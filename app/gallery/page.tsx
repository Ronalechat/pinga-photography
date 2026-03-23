import { notFound } from 'next/navigation'
import { getStoryblokApi, getVersion } from '@/utils/storyblok'
import { StoryblokLiveEditing } from '@storyblok/react/rsc'
import Container from '@/components/layout/Container/Container'
import PageHeader from '@/components/sections/PageHeader/PageHeader'
import KineticGridBlok from '@/components/bloks/KineticGridBlok'
import type { SbBlokData } from '@storyblok/react/rsc'

export const revalidate = 60

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const version = await getVersion()
  const sb = getStoryblokApi()

  try {
    const { data } = await sb.get('cdn/stories/gallery', { version })
    const gridBlok = (data.story.content.body as SbBlokData[])?.find(
      (b) => b.component === 'kinetic_grid'
    )
    return (
      <main>
        <Container>
          <PageHeader title="Gallery" />
          {gridBlok && (
            <KineticGridBlok blok={gridBlok as any} defaultCategory={category} />
          )}
        </Container>
        <StoryblokLiveEditing story={data.story} />
      </main>
    )
  } catch {
    notFound()
  }
}
