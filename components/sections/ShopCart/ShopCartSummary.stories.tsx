import type { Meta, StoryObj } from '@storybook/react'
import { useEffect } from 'react'
import { ShopCartProvider, useShopCart } from './ShopCartProvider'
import ShopCartSummary from './ShopCartSummary'

function SeededCartSummary() {
  const { addLine } = useShopCart()

  useEffect(() => {
    addLine({
      productId: 'heart-balloon-print',
      title: 'Heart Balloon Print',
      unitPriceCents: 15000,
      currency: 'AUD',
      quantity: 2,
      shippingProfile: 'framed_print',
      pickupAvailable: true,
      canCombineShipping: false,
      selectedOptions: [
        {
          groupKey: 'frame',
          groupLabel: 'Frame',
          valueKey: 'wood',
          valueLabel: 'Wood frame',
          priceDeltaCents: 3000,
        },
      ],
    })
  }, [addLine])

  return <ShopCartSummary />
}

const meta = {
  title: 'Sections/ShopCartSummary',
  component: ShopCartSummary,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <ShopCartProvider>
        <div style={{ padding: '80px 24px', background: 'var(--color-bg-primary)' }}>
          <Story />
        </div>
      </ShopCartProvider>
    ),
  ],
} satisfies Meta<typeof ShopCartSummary>

export default meta
type Story = StoryObj<typeof meta>

export const Empty: Story = {}

export const WithItems: Story = {
  render: () => <SeededCartSummary />,
}
