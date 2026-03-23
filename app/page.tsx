import { getStoryblokApi, getVersion } from '@/utils/storyblok'
import { StoryblokServerStory, StoryblokLiveEditing } from '@storyblok/react/rsc'

export const revalidate = 60

export default async function Home() {
  const version = await getVersion()
  const sb = getStoryblokApi()
  const { data } = await sb.get('cdn/stories/home', { version })

  return (
    <>
      <StoryblokServerStory story={data.story} />
      <StoryblokLiveEditing story={data.story} />
    </>
  )
}
