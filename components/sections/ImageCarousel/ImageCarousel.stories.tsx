import type { Meta, StoryObj } from '@storybook/react'
import ImageCarousel from './ImageCarousel'

const meta = {
  title: 'Sections/ImageCarousel',
  component: ImageCarousel,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ImageCarousel>

export default meta
type Story = StoryObj<typeof meta>

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Coloured placeholder slides at default height (100vh) */
export const Placeholders: Story = {
  args: {
    slides: [
      { placeholderColor: '#1e3a5f', label: 'Street 01' },
      { placeholderColor: '#5c2d1e', label: 'Portrait 01' },
      { placeholderColor: '#1a4a32', label: 'Engagement 01' },
      { placeholderColor: '#4a3a10', label: 'Exhibition 01' },
    ],
  },
}

/** Taller viewport — useful when the carousel is the only element on the page */
export const TallViewport: Story = {
  args: {
    height: '80vh',
    slides: [
      { placeholderColor: '#1e3a5f', label: 'Street 01' },
      { placeholderColor: '#5c2d1e', label: 'Portrait 01' },
      { placeholderColor: '#1a4a32', label: 'Engagement 01' },
    ],
  },
}

/** Panel-sized — 360px fixed height, suitable for embedding in a layout */
export const Short: Story = {
  args: {
    height: '360px',
    slides: [
      { placeholderColor: '#1e3a5f', label: 'Street 01' },
      { placeholderColor: '#5c2d1e', label: 'Portrait 01' },
      { placeholderColor: '#1a4a32', label: 'Engagement 01' },
    ],
  },
}

/** Edge case: only 1 slide — prev/next arrows are present but wrap to the same slide */
export const SingleSlide: Story = {
  args: {
    slides: [
      { placeholderColor: '#3A3A6E', label: 'Solo image' },
    ],
  },
}
