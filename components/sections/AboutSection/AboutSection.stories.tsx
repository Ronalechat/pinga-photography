/**
 * AboutSection.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react'
import { apiPlugin, storyblokInit } from '@storyblok/react'
import AboutSection from './AboutSection'

storyblokInit({ use: [apiPlugin] })

const PLACEHOLDER_PHOTO = {
  filename: 'https://placehold.co/800x1067/252535/B3B3BA?text=Portrait',
  alt: 'Paul Matereke',
}

const meta: Meta<typeof AboutSection> = {
  title:     'Pinga / Sections / AboutSection',
  component:  AboutSection,
  tags:      ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Full about page section. Name lifts from beneath a clip container,
portrait wipes upward, eyebrow and bio fade in with stagger.

Reserved for a future /about route.

**Jump fix:** transitions are stripped before reset so the browser
can't reverse-animate. Restored via double rAF before .revealed is added.

**Storyblok:** \`about_section\` — fields: forename, surname, eyebrow, body, photo.
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
type Story = StoryObj<typeof AboutSection>

export const Default: Story = {
  args: {
    blok: {
      _uid:      'about-section-01',
      component: 'about_section',
      forename:  'Paul',
      surname:   'Matereke',
      eyebrow:   'The photographer',
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
      _uid:  'about-section-02',
      photo: { filename: '', alt: '' },
    },
  },
}

export const Mobile: Story = {
  name: 'Mobile (375px)',
  args: { ...Default.args },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
