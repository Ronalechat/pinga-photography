import type { Meta, StoryObj } from '@storybook/react'
import ProductEnquiry from './ProductEnquiry'

const imageOne = 'data:image/svg+xml,%3Csvg viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="800" height="1000" fill="%233A3A6E"/%3E%3Cpath d="M150 180h500v640H150z" fill="%2316161D"/%3E%3Ccircle cx="400" cy="420" r="130" fill="%23F2F2FC" fill-opacity=".18"/%3E%3Cpath d="M270 640h260" stroke="%23F2F2FC" stroke-width="18" stroke-linecap="square"/%3E%3C/svg%3E'
const imageTwo = 'data:image/svg+xml,%3Csvg viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="800" height="1000" fill="%2316161D"/%3E%3Cpath d="M185 160h430v680H185z" fill="%233C3C91"/%3E%3Cpath d="M250 300h300v300H250z" fill="%23F2F2FC" fill-opacity=".16"/%3E%3Cpath d="M300 690h200" stroke="%23B3B3BA" stroke-width="14"/%3E%3C/svg%3E'
const imageThree = 'data:image/svg+xml,%3Csvg viewBox="0 0 800 1000" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="800" height="1000" fill="%23F2F2FC"/%3E%3Cpath d="M170 140h460v720H170z" fill="%2316161D"/%3E%3Cpath d="M260 300l280 280M540 300L260 580" stroke="%23F2F2FC" stroke-width="16"/%3E%3C/svg%3E'

const meta = {
  title: 'Sections/ProductEnquiry',
  component: ProductEnquiry,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ProductEnquiry>

export default meta
type Story = StoryObj<typeof meta>

export const ShirtEnquiry: Story = {
  args: {
    productName: 'P!nga T-Shirt',
    subtitle: 'Register your interest for the first custom print run.',
    minimumOrderGoal: 20,
    images: [
      { src: imageOne, alt: 'P!nga T-shirt front print' },
      { src: imageTwo, alt: 'P!nga T-shirt back print' },
      { src: imageThree, alt: 'P!nga T-shirt detail' },
    ],
  },
}

export const SentState: Story = {
  args: {
    productName: 'P!nga T-Shirt',
    initialStatus: 'sent',
  },
}
