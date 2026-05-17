import type { Meta, StoryObj } from '@storybook/react'
import ProductMediaViewer from './ProductMediaViewer'

const imageOne = 'data:image/svg+xml,%3Csvg viewBox="0 0 900 760" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="900" height="760" fill="%23F2F2FC"/%3E%3Crect x="130" y="80" width="640" height="560" fill="%23ffffff"/%3E%3Crect x="270" y="210" width="360" height="230" fill="%2316161D"/%3E%3Ccircle cx="450" cy="310" r="70" fill="%233A3A6E"/%3E%3C/svg%3E'
const imageTwo = 'data:image/svg+xml,%3Csvg viewBox="0 0 900 760" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="900" height="760" fill="%2316161D"/%3E%3Crect x="150" y="100" width="600" height="520" fill="%233A3A6E"/%3E%3Cpath d="M260 500h380" stroke="%23F2F2FC" stroke-width="22"/%3E%3Cpath d="M315 220l270 180M585 220L315 400" stroke="%23F2F2FC" stroke-width="18"/%3E%3C/svg%3E'
const imageThree = 'data:image/svg+xml,%3Csvg viewBox="0 0 900 760" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="900" height="760" fill="%233A3A6E"/%3E%3Crect x="190" y="120" width="520" height="500" fill="%2316161D"/%3E%3Crect x="300" y="250" width="300" height="210" fill="%23F2F2FC" fill-opacity=".18"/%3E%3C/svg%3E'

const meta = {
  title: 'P!nga / UI / ProductMediaViewer',
  component: ProductMediaViewer,
  parameters: {
    layout: 'centered',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(420px, 90vw)' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductMediaViewer>

export default meta
type Story = StoryObj<typeof meta>

export const MultipleImages: Story = {
  args: {
    label: 'Framed print',
    images: [
      { src: imageOne, alt: 'Framed print front view' },
      { src: imageTwo, alt: 'Framed print detail' },
      { src: imageThree, alt: 'Framed print scale reference' },
    ],
  },
}

export const SingleImage: Story = {
  args: {
    label: 'P!nga T-Shirt',
    images: [
      { src: imageOne, alt: 'P!nga T-shirt front view' },
    ],
  },
}

export const Placeholder: Story = {
  args: {
    label: 'Untitled product',
    images: [],
  },
}
