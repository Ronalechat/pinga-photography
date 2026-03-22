import type { Meta, StoryObj } from '@storybook/react'
import KineticGrid from './KineticGrid'

const meta = {
  title: 'Sections/KineticGrid',
  component: KineticGrid,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof KineticGrid>

export default meta
type Story = StoryObj<typeof meta>

// ─── Shared fixtures ──────────────────────────────────────────────────────────

const STREET = [
  { cat: 'Street', ratio: [3, 4] as [number, number], num: '01' },
  { cat: 'Street', ratio: [4, 3] as [number, number], num: '02' },
  { cat: 'Street', ratio: [2, 3] as [number, number], num: '03' },
  { cat: 'Street', ratio: [3, 2] as [number, number], num: '04' },
  { cat: 'Street', ratio: [1, 1] as [number, number], num: '05' },
  { cat: 'Street', ratio: [3, 4] as [number, number], num: '06' },
]

const PORTRAITS = [
  { cat: 'Portraits', ratio: [2, 3] as [number, number], num: '01' },
  { cat: 'Portraits', ratio: [3, 4] as [number, number], num: '02' },
  { cat: 'Portraits', ratio: [4, 5] as [number, number], num: '03' },
  { cat: 'Portraits', ratio: [3, 2] as [number, number], num: '04' },
]

const ENGAGEMENTS = [
  { cat: 'Engagements', ratio: [16, 9] as [number, number], num: '01' },
  { cat: 'Engagements', ratio: [3, 4] as [number, number],  num: '02' },
  { cat: 'Engagements', ratio: [4, 3] as [number, number],  num: '03' },
]

// ─── Stories ──────────────────────────────────────────────────────────────────

/** Full multi-category default — starts in the "All" view with 4 items per category */
export const AllCategories: Story = {
  args: {
    categories: {
      Street:      STREET,
      Portraits:   PORTRAITS,
      Engagements: ENGAGEMENTS,
    },
  },
}

/** One category only — tests the filter path without the "All" interleaving logic */
export const SingleCategory: Story = {
  args: {
    categories: {
      Street: STREET,
    },
  },
}

/** allPreviewCount: 2 — fewer items per category in the "All" view */
export const SmallPreview: Story = {
  args: {
    allPreviewCount: 2,
    categories: {
      Street:      STREET,
      Portraits:   PORTRAITS,
      Engagements: ENGAGEMENTS,
    },
  },
}

/** Custom eyebrow label */
export const CustomEyebrow: Story = {
  args: {
    eyebrow: 'Portfolio',
    categories: {
      Street:    STREET,
      Portraits: PORTRAITS,
    },
  },
}
