import type { Meta, StoryObj } from '@storybook/react'
import PageHeader from './PageHeader'

const meta = {
  title: 'Pinga / Sections / PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ background: '#16161D', padding: '40px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PageHeader>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story  = { args: { title: 'Gallery'   } }
export const Portrait: Story = { args: { title: 'Portraits' } }
export const Mobile: Story   = {
  args: { title: 'Gallery' },
  parameters: { viewport: { defaultViewport: 'mobile1' } },
}
