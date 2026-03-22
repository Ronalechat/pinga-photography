import { notFound } from 'next/navigation'
import { getStoryblokApi, getVersion } from '@/lib/storyblok'
import { StoryblokServerStory, StoryblokLiveEditing } from '@storyblok/react/rsc'

export const revalidate = 60

export async function generateStaticParams() {
  const sb = getStoryblokApi()
  const { data } = await sb.get('cdn/links', { version: 'published' })
  return Object.values(data.links ?? {})
    .filter((link) => !link.is_folder && link.slug && link.slug !== 'home')
    .map((link) => ({ slug: link.slug as string }))
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const version = await getVersion()

  const sb = getStoryblokApi()
  try {
    const { data } = await sb.get(`cdn/stories/${slug}`, { version })
    return (
      <>
        <StoryblokServerStory story={data.story} />
        <StoryblokLiveEditing story={data.story} />
      </>
    )
  } catch {
    notFound()
  }
}
