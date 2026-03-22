import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import PingaToggle from './PingaToggle'

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: 'Pinga / UI / PingaToggle',
  component: PingaToggle,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{
        background: '#16161D',
        padding: 40,
      }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PingaToggle>

export default meta
type Story = StoryObj<typeof meta>

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  'Street', 'Engagement', 'Pregnancy', 'Birthday', 'Exhibition', 'Portrait',
]

// ─── Single select ────────────────────────────────────────────────────────────

/**
 * **Single select** — only one option active at a time.
 *
 * Clicking an already-active option does nothing. Clicking another option
 * deselects the current one and sweeps in the new selection.
 *
 * **Used in:** `KineticGrid.tsx` category filter bar. The active category
 * controls which photos are shown in the masonry grid.
 */
export const SingleSelect: Story = {
  render: function Render(args) {
    const [selected, setSelected] = useState('Street')
    return (
      <PingaToggle
        {...args}
        selected={selected}
        onChange={(v) => setSelected(v as string)}
      />
    )
  },
  args: {
    options: CATEGORY_OPTIONS,
    selected: 'Street',
    multiSelect: false,
    onChange: () => {},  // overridden by render function
  },
}

/**
 * **Multi select** — multiple options active simultaneously.
 *
 * Clicking an active option deselects it; clicking an inactive option adds
 * it to the selection. The sweep fill sweeps in on select and out on deselect.
 *
 * **Used in:** `EnquiryForm.tsx` occasion picker. Clients can select more
 * than one shoot type in a single enquiry.
 */
export const MultiSelect: Story = {
  render: function Render(args) {
    const [selected, setSelected] = useState<string[]>([])
    return (
      <PingaToggle
        {...args}
        selected={selected}
        onChange={(v) => setSelected(v as string[])}
      />
    )
  },
  args: {
    options: CATEGORY_OPTIONS,
    selected: [],
    multiSelect: true,
    onChange: () => {},  // overridden by render function
  },
}

/**
 * **Single select — all options**
 *
 * Tests that selecting any option immediately deselects the previous one.
 * The sweep-out (translateX back to -102%) on the deselected item is visible
 * here because the options don't wrap to a second row.
 */
export const SingleSelectAll: Story = {
  render: function Render(args) {
    const [selected, setSelected] = useState('Street')
    return (
      <PingaToggle
        {...args}
        selected={selected}
        onChange={(v) => setSelected(v as string)}
      />
    )
  },
  args: {
    options: CATEGORY_OPTIONS,
    selected: 'Street',
    multiSelect: false,
    onChange: () => {},  // overridden by render function
  },
}

/**
 * **Multi select — all pre-selected**
 *
 * All options start selected. Tests the deselect flow: clicking any option
 * sweeps its fill back out and restores the muted text colour.
 */
export const MultiSelectAll: Story = {
  render: function Render(args) {
    const [selected, setSelected] = useState<string[]>([...CATEGORY_OPTIONS])
    return (
      <PingaToggle
        {...args}
        selected={selected}
        onChange={(v) => setSelected(v as string[])}
      />
    )
  },
  args: {
    options: CATEGORY_OPTIONS,
    selected: CATEGORY_OPTIONS,
    multiSelect: true,
    onChange: () => {},  // overridden by render function
  },
}
