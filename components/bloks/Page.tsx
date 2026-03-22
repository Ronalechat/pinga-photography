import { StoryblokServerComponent, storyblokEditable } from '@storyblok/react/rsc'
import type { SbBlokData } from '@storyblok/react/rsc'

type PageBlok = SbBlokData & {
  body: SbBlokData[]
}

export default function Page({ blok }: { blok: PageBlok }) {
  return (
    <main {...storyblokEditable(blok)}>
      {blok.body?.map((nestedBlok) => (
        <StoryblokServerComponent blok={nestedBlok} key={nestedBlok._uid} />
      ))}
    </main>
  )
}
