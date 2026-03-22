/**
 * SiteFooter.stories.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Storybook stories for the SiteFooter component.
 *
 * SETUP
 * Add to .storybook/preview.ts:
 *   import '../src/styles/tokens.css'
 *
 * The usePathname hook from next/navigation needs mocking in Storybook.
 * Add to .storybook/preview.ts:
 *   import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime'
 * Or use the nextjs-storybook-addon which handles this automatically.
 */

import type { Meta, StoryObj } from '@storybook/react'
import { apiPlugin, storyblokInit } from '@storyblok/react'
import SiteFooter from './SiteFooter'

storyblokInit({ use: [apiPlugin] })

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta: Meta<typeof SiteFooter> = {
  title:     'Pinga / Layout / SiteFooter',
  component:  SiteFooter,
  tags:      ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Site-wide footer. Two-column grid shared across both the main row and the bar
so left and right column edges are structurally consistent across the rule.

**Layout rule**
- Left column → left-aligned (name, copyright)
- Right column → right-aligned (links, location)

**Optical alignment**
The name uses \`text-box: trim-both cap alphabetic\` / \`leading-trim\` to crop
the font's built-in ascender space. The element box top sits at cap height,
aligning the display-size name with the top of the smaller links beside it
without negative margins.

**External link arrow**
- Desktop: leads (left of text) — right-aligned column, arrow protrudes left
- Mobile: trails (right of text) — left-aligned column, arrow protrudes right
- Controlled by CSS \`order\` — no conditional rendering

**Enquire link**
- On \`/\`: scrolls to \`#enquire\` smoothly
- Other pages: navigates to \`/#enquire\`
        `.trim(),
      },
    },
  },
  decorators: [
    Story => (
      <div style={{ background: '#16161D', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
        <div style={{
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          fontSize: 9,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'rgba(242,242,252,0.08)',
        }}>
          — page content above —
        </div>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof SiteFooter>

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Default — full content as it appears on the live site.
 */
export const Default: Story = {
  args: {
    name:         'Pinga Matereke',
    instagramUrl: 'https://instagram.com/pinga.matereke',
    location:     'Sydney, AU',
    year:         2025,
  },
}

/**
 * Via Storyblok blok — mirrors exactly what the CMS delivers.
 */
export const FromStoryblok: Story = {
  name: 'From Storyblok blok',
  args: {
    blok: {
      _uid:          'site-footer-01',
      component:     'site_footer',
      name:          'Pinga Matereke',
      instagram_url: 'https://instagram.com/pinga.matereke',
      location:      'Sydney, AU',
      year:          2025,
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Driven entirely by a Storyblok blok object. The component automatically applies `storyblokEditable` when a blok is provided.',
      },
    },
  },
}

/**
 * Mobile viewport — single column, left-aligned, arrow trails.
 */
export const Mobile: Story = {
  name: 'Mobile (375px)',
  args: { ...Default.args },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Below 768px the grid collapses to a single left-aligned column. The external link arrow moves from leading to trailing position so the text left edges remain flush.',
      },
    },
  },
}

/**
 * Long name — tests layout with a longer photographer name.
 */
export const LongName: Story = {
  name: 'Long name',
  args: {
    ...Default.args,
    name: 'Alexandra Konstantinidis',
  },
  parameters: {
    docs: {
      description: {
        story: 'Verifies the two-column layout holds with a longer name. The `1fr auto` grid ensures the right column always sizes to its content.',
      },
    },
  },
}

/**
 * Current year auto — year prop omitted, defaults to current year.
 */
export const AutoYear: Story = {
  name: 'Auto year',
  args: {
    name:         'Pinga Matereke',
    instagramUrl: 'https://instagram.com/pinga.matereke',
    location:     'Sydney, AU',
    // year omitted — defaults to new Date().getFullYear()
  },
  parameters: {
    docs: {
      description: {
        story: 'When `year` is omitted the component falls back to `new Date().getFullYear()` so the copyright never goes stale.',
      },
    },
  },
}
