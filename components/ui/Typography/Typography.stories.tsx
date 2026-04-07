import type { Meta, StoryObj } from '@storybook/react'
import Typography from './Typography'

const meta = {
  title: 'P!nga / UI / Typography',
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
export const DisplaySlide: Story  = { args: { variant: 'displaySlide',  children: 'displaySlide'  } }
export const Eyebrow: Story       = { args: { variant: 'eyebrow',       children: 'eyebrow'       } }
export const Body: Story          = { args: { variant: 'body',          children: 'body'          } }
export const BodyLarge: Story     = { args: { variant: 'bodyLarge',     children: 'bodyLarge'     } }
export const Caption: Story       = { args: { variant: 'caption',       children: 'caption'       } }
export const Label: Story         = { args: { variant: 'label',         children: 'label'         } }
export const NavLink: Story       = { args: { variant: 'navLink',       children: 'navLink'       } }
export const MetaVariant: Story   = { args: { variant: 'meta',          children: 'meta'          } }

/**
 * **Color override** — `color` prop overrides the variant's default CSS color.
 *
 * Use when a one-off color is needed without defining a new variant.
 * Here `eyebrow` renders with a dimmed white for a hero subtitle context.
 */
export const ColorOverride: Story = {
  args: {
    variant:  'eyebrow',
    color:    'rgba(255,255,255,0.45)',
    children: 'eyebrow · hero subtitle context',
  },
}

const VARIANTS = [
  { variant: 'displayHero',   element: 'h1'   },
  { variant: 'displayLarge',  element: 'h1'   },
  { variant: 'displayMedium', element: 'h2'   },
  { variant: 'displayThin',   element: 'h2'   },
  { variant: 'headingMedium', element: 'h2'   },
  { variant: 'displaySlide',  element: 'span' },
  { variant: 'eyebrow',       element: 'span' },
  { variant: 'body',          element: 'p'    },
  { variant: 'bodyLarge',     element: 'p'    },
  { variant: 'caption',       element: 'span' },
  { variant: 'label',         element: 'span' },
  { variant: 'navLink',       element: 'span' },
  { variant: 'meta',          element: 'span' },
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
