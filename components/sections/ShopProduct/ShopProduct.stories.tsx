import type { Meta, StoryObj } from '@storybook/react'
import { ShopCartProvider } from '../ShopCart/ShopCartProvider'
import ShopCartSummary from '../ShopCart/ShopCartSummary'
import ShopProduct from './ShopProduct'

const imageOne = 'data:image/svg+xml,%3Csvg viewBox="0 0 900 760" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="900" height="760" fill="%23F2F2FC"/%3E%3Crect x="145" y="92" width="610" height="540" fill="%23ffffff"/%3E%3Crect x="270" y="210" width="360" height="230" fill="%2316161D"/%3E%3Ccircle cx="450" cy="310" r="70" fill="%233A3A6E"/%3E%3C/svg%3E'
const imageTwo = 'data:image/svg+xml,%3Csvg viewBox="0 0 900 760" xmlns="http://www.w3.org/2000/svg"%3E%3Crect width="900" height="760" fill="%2316161D"/%3E%3Crect x="150" y="100" width="600" height="520" fill="%233A3A6E"/%3E%3Cpath d="M260 500h380" stroke="%23F2F2FC" stroke-width="22"/%3E%3Cpath d="M315 220l270 180M585 220L315 400" stroke="%23F2F2FC" stroke-width="18"/%3E%3C/svg%3E'

const meta = {
  title: 'Sections/ShopProduct',
  component: ShopProduct,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <ShopCartProvider>
        <div style={{ padding: '80px 24px', background: 'var(--color-bg-primary)' }}>
          <ShopCartSummary />
          <Story />
        </div>
      </ShopCartProvider>
    ),
  ],
} satisfies Meta<typeof ShopProduct>

export default meta
type Story = StoryObj<typeof meta>

export const LimitedPrint: Story = {
  args: {
    product: {
      productId: 'heart-balloon-print',
      title: 'Heart Balloon Print',
      subtitle: 'A limited run from Paul Pinga Matereke, available framed or unframed.',
      description: 'Printed to order from the archive and finished in a small numbered edition.',
      images: [
        { src: imageOne, alt: 'Heart Balloon print' },
        { src: imageTwo, alt: 'Heart Balloon print detail' },
      ],
      mode: 'cart_checkout',
      priceCents: 12000,
      currency: 'AUD',
      stockMode: 'limited',
      stockQuantity: 10,
      showStock: true,
      shippingProfile: 'framed_print',
      shippingNote: 'Framed shipping calculated before payment',
      weightGrams: 1200,
      packageLengthMm: 620,
      packageWidthMm: 460,
      packageHeightMm: 70,
      canCombineShipping: false,
      pickupAvailable: true,
      optionGroups: [
        {
          key: 'frame',
          label: 'Frame',
          values: [
            { key: 'none', label: 'No frame' },
            { key: 'wood', label: 'Wood frame', priceDeltaCents: 3000 },
            { key: 'black', label: 'Black frame', priceDeltaCents: 3000 },
          ],
        },
      ],
    },
  },
}

export const OneOfOneSoldOut: Story = {
  args: {
    product: {
      productId: 'one-of-one-print',
      title: 'One Of One Print',
      subtitle: 'A unique print from the archive.',
      images: [{ src: imageOne, alt: 'One of one print' }],
      mode: 'sold_out',
      priceCents: 26000,
      currency: 'AUD',
      stockMode: 'one_of_one',
      stockQuantity: 0,
      showStock: true,
      shippingProfile: 'manual_quote',
      requiresManualShippingQuote: true,
      optionGroups: [],
    },
  },
}
