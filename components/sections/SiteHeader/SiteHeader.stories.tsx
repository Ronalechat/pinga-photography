/**
 * SiteHeader.stories.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Storybook stories for the SiteHeader component.
 *
 * SETUP
 * next/navigation is mocked via a webpack alias in .storybook/main.ts:
 *   'next/navigation' → .storybook/mocks/next-navigation.ts
 * usePathname defaults to '/'. Individual stories override it via beforeEach.
 *
 * BLEND MODE IN STORYBOOK
 * mix-blend-mode: difference requires `isolation: isolate` on the backdrop.
 * Each story wraps the header in a hero simulation div that has this set.
 * The blend will not work without this — the decorator below handles it.
 *
 * BACKGROUNDS
 * Stories use a custom background parameter to test colour reactivity.
 * The Storybook backgrounds addon backgrounds are bypassed in favour of
 * inline backgrounds on the decorator so isolation: isolate is guaranteed.
 */

import React from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import SiteHeader from './SiteHeader'

// next/navigation is aliased to .storybook/mocks/next-navigation in webpack.
// Import usePathname here so GalleryActive can override it via beforeEach.
import { usePathname } from 'next/navigation'

// ─── Decorator factory ────────────────────────────────────────────────────────
// Creates a full-viewport backdrop with isolation: isolate.
// mix-blend-mode only composites correctly when the stacking context
// is isolated to the immediate backdrop — not the document root.

function withBackdrop(background: string, label?: string) {
  return (Story: React.ComponentType) => (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      background,
      isolation: 'isolate', // ← critical for mix-blend-mode: difference
      overflow: 'hidden',
    }}>
      <Story />
      {label && (
        <div style={{
          position: 'absolute',
          bottom: 32,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: 'Georgia, serif',
          fontSize: 9,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'white',
          mixBlendMode: 'difference',
          opacity: 0.4,
          whiteSpace: 'nowrap',
        }}>
          {label}
        </div>
      )}
    </div>
  )
}

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta: Meta<typeof SiteHeader> = {
  title:     'Pinga / Layout / SiteHeader',
  component:  SiteHeader,
  tags:      ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    // Disable the backgrounds addon — we control background via decorators
    // so isolation: isolate is always present
    backgrounds: { disable: true },
    docs: {
      description: {
        component: `
Fixed site header — stacked-left cluster, colour-reactive text.

**Layout**
- Desktop: name above, Gallery · Enquire below (Option D — stacked left)
- Mobile (≤767px): single row — name left, links right

**Colour reactivity**
Text uses \`mix-blend-mode: difference\` — white text inverts pixel-by-pixel
against whatever is behind it. Works continuously across any background colour
or image without any JavaScript.

**Required**: any full-bleed section the header floats over must have
\`isolation: isolate\` on its wrapper. Without it the blend composites against
the document root and appears to do nothing.

**Active state**
\`aria-current="page"\` is applied via \`usePathname\`. The active link dims
slightly — current page is indicated without extra visual elements.

**Enquire**
- On \`/\`: scrolls to \`#enquire\`
- Other pages: navigates to \`/#enquire\`
        `.trim(),
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof SiteHeader>

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Dark background — default photography site context.
 * Text appears white via mix-blend-mode inversion.
 */
export const OnDark: Story = {
  name: 'On dark background',
  args: { name: 'Pinga' },
  decorators: [withBackdrop('#16161D', 'Dark background — hero / gallery')],
}

/**
 * Light background — tests inversion to dark text.
 */
export const OnLight: Story = {
  name: 'On light background',
  args: { name: 'Pinga' },
  decorators: [withBackdrop('#F2F2FC', 'Light background — text inverts to dark')],
}

/**
 * Warm/colourful background — mid-range inversion test.
 */
export const OnColour: Story = {
  name: 'On colour background',
  args: { name: 'Pinga' },
  decorators: [withBackdrop(
    'linear-gradient(135deg, #8b3a2a 0%, #c4632a 100%)',
    'Colourful background — partial inversion'
  )],
}

/**
 * Split background — demonstrates pixel-by-pixel inversion.
 * Left half dark, right half light. Text spanning the boundary
 * inverts each half of each letter independently.
 */
export const OnSplit: Story = {
  name: 'Split background (pixel-by-pixel)',
  args: { name: 'Pinga' },
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        isolation: 'isolate',
        overflow: 'hidden',
      }}>
        {/* Left half dark */}
        <div style={{ position: 'absolute', inset: '0 50% 0 0', background: '#16161D' }} />
        {/* Right half light */}
        <div style={{ position: 'absolute', inset: '0 0 0 50%', background: '#F2F2FC' }} />
        <Story />
        <div style={{
          position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'Georgia, serif', fontSize: 9, letterSpacing: '0.24em',
          textTransform: 'uppercase', color: 'white', mixBlendMode: 'difference',
          opacity: 0.4, whiteSpace: 'nowrap',
        }}>
          Each letter half inverts independently — no JS, no threshold
        </div>
      </div>
    ),
  ],
}

/**
 * Hero gradient — simulates the scroll hero scenario.
 * Background shifts from dark to warm to light left-to-right,
 * mimicking a hero image the header would float over during scroll.
 */
export const OnHeroGradient: Story = {
  name: 'Over hero gradient',
  args: { name: 'Pinga' },
  decorators: [withBackdrop(
    'linear-gradient(to right, #16161D 0%, #3a3a6e 30%, #c4632a 65%, #F2F2FC 100%)',
    'Simulated hero image — blend tracks continuously'
  )],
}

/**
 * Mobile viewport — single-row layout.
 */
export const Mobile: Story = {
  name: 'Mobile (375px)',
  args: { name: 'Pinga' },
  decorators: [withBackdrop('#16161D', 'Mobile — name left, links right')],
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Below 768px the stacked layout collapses to a single row. Name sits left, Gallery · Enquire sit right. No hamburger needed with only two links.',
      },
    },
  },
}

/**
 * Gallery page — active state on Gallery link.
 * usePathname returns /gallery so Gallery gets aria-current="page".
 */
export const GalleryActive: Story = {
  name: 'Gallery page (active state)',
  args: { name: 'Pinga' },
  decorators: [withBackdrop('#16161D', '/gallery — active link dimmed')],
  beforeEach() {
    // Override the mocked usePathname so the Gallery link gets aria-current="page".
    // next/navigation is aliased to .storybook/mocks/next-navigation in webpack.
    ;(usePathname as ReturnType<typeof fn>).mockReturnValue('/gallery')
  },
  parameters: {
    docs: {
      description: {
        story: 'When pathname is `/gallery`, the Gallery link receives `aria-current="page"` and dims slightly via CSS. No extra visual indicator needed.',
      },
    },
  },
}

/**
 * Custom name — tests with full name rather than nickname.
 */
export const FullName: Story = {
  name: 'Full name variant',
  args: { name: 'Pinga Matereke' },
  decorators: [withBackdrop('#16161D')],
  parameters: {
    docs: {
      description: {
        story: 'The `name` prop accepts any string. Useful if the brand voice shifts between the short "Pinga" and full "Pinga Matereke" at different breakpoints or page types.',
      },
    },
  },
}
