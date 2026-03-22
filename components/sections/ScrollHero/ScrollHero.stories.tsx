import type { Meta, StoryObj } from '@storybook/react'
import ScrollHero from './ScrollHero'

const meta = {
  title: 'Sections/ScrollHero',
  component: ScrollHero,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ScrollHero>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ──────────────────────────────────────────────────────────────────

/** 3 solid-colour placeholder slides with default scrollMultiplier */
export const ColourSlides: Story = {
  args: {
    slides: [
      { label: 'Street',    subtitle: 'Urban geometry and light', background: '#1e3a5f' },
      { label: 'Portraits', subtitle: 'Faces in natural light',   background: '#5c2d1e' },
      { label: 'Landscape', subtitle: 'Wide open spaces',          background: '#1a4a32' },
    ],
  },
}

/** Minimal 2-slide path */
export const TwoSlides: Story = {
  args: {
    slides: [
      { label: 'Film',    subtitle: 'Analogue textures', background: '#2a2a4a' },
      { label: 'Digital', subtitle: 'Pixel-sharp detail', background: '#3a1a2a' },
    ],
  },
}

/** Wide crossfade — transitionZone 0.6 means 60% of each slide's scroll window blends */
export const SlowTransition: Story = {
  args: {
    transitionZone: 0.6,
    slides: [
      { label: 'Dawn',    subtitle: 'First light on stone', background: '#3a2a10' },
      { label: 'Dusk',    subtitle: 'Last light on water',  background: '#102a3a' },
      { label: 'Midnight',subtitle: 'Blue-hour silhouette', background: '#10102a' },
    ],
  },
}

/** 5 slides packed into a tall scroll height */
export const Dense: Story = {
  args: {
    scrollMultiplier: 8,
    slides: [
      { label: 'I',   subtitle: 'Opening frame',  background: '#1e3a5f' },
      { label: 'II',  subtitle: 'Second chapter', background: '#5c2d1e' },
      { label: 'III', subtitle: 'Turning point',  background: '#1a4a32' },
      { label: 'IV',  subtitle: 'Descent',         background: '#4a3a10' },
      { label: 'V',   subtitle: 'Resolution',      background: '#1a2a5c' },
    ],
  },
}
