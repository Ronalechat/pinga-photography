/**
 * AboutPreview.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react'
import { apiPlugin, storyblokInit } from '@storyblok/react'
import AboutPreview from './AboutPreview'

storyblokInit({ use: [apiPlugin] })

const PLACEHOLDER_PHOTO = {
  filename: 'https://placehold.co/800x1067/252535/B3B3BA?text=Portrait',
  alt: 'Paul Matereke',
}

const meta: Meta<typeof AboutPreview> = {
  title:     'P!nga / Sections / AboutPreview',
  component:  AboutPreview,
  tags:      ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Landing page "about" teaser. Portrait split into 3 vertical tiles — each
wipes in from a different edge (KineticGrid language). Text assembles alongside.
Triggered by IntersectionObserver at 15% visibility.

**Storyblok:** \`about_preview\` — fields: eyebrow, heading, body, photo.

**Sits inside Container on the landing page.**
        `.trim(),
      },
    },
  },
  decorators: [
    Story => (
      <div style={{ background: '#16161D', minHeight: '100vh', padding: '0 40px' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof AboutPreview>

export const Default: Story = {
  args: {
    blok: {
      _uid:      'about-preview-01',
      component: 'about_preview',
      eyebrow:   'The photographer',
      heading:   'Paul Matereke',
      body:      `Paul is a Sydney-based photographer working across street, portraiture, and documentary. His work is rooted in observation — a patience for the unrepeatable moment.\n\nHe has exhibited internationally and shoots privately for clients who want the same unguarded, unhurried eye that defines his personal work.`,
      photo:     PLACEHOLDER_PHOTO,
    },
  },
}

export const NoPhoto: Story = {
  name: 'No photo (fallback)',
  args: {
    blok: {
      ...Default.args!.blok!,
      _uid:  'about-preview-02',
      photo: { filename: '', alt: '' },
    },
  },
}

export const Mobile: Story = {
  name: 'Mobile (375px)',
  args: { ...Default.args },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
