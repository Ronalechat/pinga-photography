import type { Meta, StoryObj } from '@storybook/react'
import Typography from './Typography'

const meta = {
  title: 'Pinga / UI / Typography',
  component: Typography,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ background: '#16161D', padding: '40px' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Typography>

export default meta
type Story = StoryObj<typeof meta>

// One story per variant
export const DisplayHero: Story   = { args: { variant: 'displayHero',   children: 'displayHero'   } }
export const DisplayLarge: Story  = { args: { variant: 'displayLarge',  children: 'displayLarge'  } }
export const DisplayMedium: Story = { args: { variant: 'displayMedium', children: 'displayMedium' } }
export const DisplayThin: Story   = { args: { variant: 'displayThin',   children: 'displayThin'   } }
export const HeadingMedium: Story = { args: { variant: 'headingMedium', children: 'headingMedium' } }
export const SentName: Story      = { args: { variant: 'sentName',      children: 'sentName'      } }
export const Eyebrow: Story       = { args: { variant: 'eyebrow',       children: 'eyebrow'       } }
export const Body: Story          = { args: { variant: 'body',          children: 'body'          } }
export const Label: Story         = { args: { variant: 'label',         children: 'label'         } }
export const Small: Story         = { args: { variant: 'small',         children: 'small'         } }
export const NavLink: Story       = { args: { variant: 'navLink',       children: 'navLink'       } }

/**
 * **Color override** — `color` prop overrides the variant's default CSS color.
 *
 * Use when a one-off color is needed without defining a new variant.
 * Here `small` renders in the accent blue instead of its default muted-low.
 */
export const ColorOverride: Story = {
  args: {
    variant:  'small',
    color:    '#3C3C91',
    children: 'small · color override',
  },
}

const VARIANTS = [
  { variant: 'displayHero',   element: 'h1'   },
  { variant: 'displayLarge',  element: 'h1'   },
  { variant: 'displayMedium', element: 'h2'   },
  { variant: 'displayThin',   element: 'h2'   },
  { variant: 'headingMedium', element: 'h2'   },
  { variant: 'sentName',      element: 'p'    },
  { variant: 'eyebrow',       element: 'span' },
  { variant: 'body',          element: 'p'    },
  { variant: 'label',         element: 'span' },
  { variant: 'small',         element: 'span' },
  { variant: 'navLink',       element: 'span' },
] as const

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {VARIANTS.map(({ variant, element }) => (
        <div key={variant}>
          <div style={{
            fontFamily: 'Georgia, serif',
            fontSize: '8px',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(179, 179, 186, 0.35)',
            marginBottom: '8px',
          }}>
            {variant} · &lt;{element}&gt;
          </div>
          <Typography variant={variant}>{variant}</Typography>
        </div>
      ))}
    </div>
  ),
  args: { variant: 'body', children: '' },
}
