import { getStoryblokApi, getVersion } from '@/utils/storyblok'
import { StoryblokServerStory, StoryblokLiveEditing } from '@storyblok/react/rsc'
import { notFound } from 'next/navigation'

export const revalidate = 60

export default async function Home() {
  const version = await getVersion()
  const sb = getStoryblokApi()

  let data
  try {
    const res = await sb.get('cdn/stories/home', { version })
    data = res.data
  } catch (err: unknown) {
    if ((err as { status?: number }).status === 404) notFound()
    throw err
  }

  return (
    <>
      <StoryblokServerStory story={data.story} />
      <StoryblokLiveEditing story={data.story} />
    </>
  )
}
