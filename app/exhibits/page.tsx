import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { StoryblokLiveEditing } from '@storyblok/react/rsc'
import type { SbBlokData } from '@storyblok/react/rsc'
import { getStoryblokApi, getVersion } from '@/utils/storyblok'
import Container from '@/components/layout/Container/Container'
import PageHeader from '@/components/sections/PageHeader/PageHeader'
import KineticGridBlok, { type KineticGridBlokShape } from '@/components/bloks/KineticGridBlok'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Exhibits — P!nga | Paul Pinga Matereke',
  description:
    'Explore photography exhibits by Sydney artist Paul Pinga Matereke.',
}

export default async function ExhibitsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>
}) {
  const { category } = await searchParams
  const version = await getVersion()
  const sb = getStoryblokApi()
  let data

  try {
    const res = await sb.get('cdn/stories/exhibits', { version })
    data = res.data
  } catch {
    notFound()
  }

  const gridBlok = (data.story.content.body as SbBlokData[])?.find(
    (b) => b.component === 'kinetic_grid'
  )

  return (
    <main>
      <Container>
        <PageHeader title="Exhibits" />
        {gridBlok && (
          <KineticGridBlok
            blok={gridBlok as KineticGridBlokShape}
            defaultCategory={category}
            includeAllFilter={false}
          />
        )}
      </Container>
      <StoryblokLiveEditing story={data.story} />
    </main>
  )
}
