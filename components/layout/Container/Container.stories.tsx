/**
 * Container.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react'
import Container from './Container'

const meta: Meta<typeof Container> = {
  title:     'Pinga / Layout / Container',
  component:  Container,
  tags:      ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Centres content within a consistent column. Use for pages, sections,
and individual components alike.

**Max-width:** 1200px  
**Padding:** \`clamp(24px, 4vw, 40px)\` — no breakpoint needed.

This component handles spacing only. Typography, colour, and vertical
spacing are the responsibility of child components.

**Wrap:** GalleryHeader, KineticGrid, EnquiryForm, AboutPreview, AboutSection, any landing page section.  
**Do not wrap:** ScrollHero, SiteHeader, SiteFooter.
        `.trim(),
      },
    },
  },
  decorators: [
    Story => (
      <div style={{ background: '#16161D', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof Container>

const Placeholder = ({ label }: { label: string }) => (
  <div style={{
    border: '1px dashed rgba(242,242,252,0.1)',
    padding: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }}>
    <span style={{
      fontFamily: 'Georgia, serif',
      fontSize: '9px',
      letterSpacing: '0.24em',
      textTransform: 'uppercase',
      color: 'rgba(179,179,186,0.35)',
    }}>
      {label}
    </span>
  </div>
)

/** Default — full page usage */
export const Default: Story = {
  args: {
    children: <Placeholder label="max-width 1200px · padding clamp(24px, 4vw, 40px)" />,
  },
}

/** Section usage — wraps a landing page section */
export const AsSection: Story = {
  name: 'Landing page section (as="section")',
  args: {
    as:       'section',
    children: <Placeholder label="Landing page section — same container, semantic element" />,
  },
  parameters: {
    docs: {
      description: {
        story: 'Use `as="section"` when wrapping a landmark section on the landing page.',
      },
    },
  },
}

/** Main content area */
export const AsMain: Story = {
  name: 'Page main (as="main")',
  args: {
    as:       'main',
    children: <Placeholder label="Page main content area" />,
  },
}

/** Mobile */
export const Mobile: Story = {
  name: 'Mobile (375px)',
  args: { ...Default.args },
  parameters: {
    viewport: { defaultViewport: 'mobile1' },
    docs: {
      description: {
        story: 'Padding reduces to 24px at 375px via clamp(). No media query needed.',
      },
    },
  },
}
