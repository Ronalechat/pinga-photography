import type { Meta, StoryObj } from '@storybook/react'
import type { ReactNode } from 'react'
import PingaButton from '@/components/ui/Button/PingaButton'
import PingaToggle from '@/components/ui/ToggleButton/PingaToggle'
import Typography from '@/components/ui/Typography/Typography'

function RuleSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section style={{
      display: 'grid',
      gap: 18,
      paddingTop: 28,
      borderTop: '0.5px solid var(--color-border-divider)',
    }}>
      <Typography variant="eyebrow" as="h2">
        {title}
      </Typography>
      {children}
    </section>
  )
}

function RuleList({ items }: { items: string[] }) {
  return (
    <ul style={{
      display: 'grid',
      gap: 10,
      margin: 0,
      padding: 0,
      listStyle: 'none',
      maxWidth: 720,
    }}>
      {items.map((item) => (
        <li key={item}>
          <Typography variant="body" as="p">
            {item}
          </Typography>
        </li>
      ))}
    </ul>
  )
}

function DemoInput() {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <Typography variant="label" as="span">
        Quantity
      </Typography>
      <input
        defaultValue="1"
        aria-label="Quantity"
        style={{
          width: 96,
          minHeight: 38,
          boxSizing: 'border-box',
          border: '1px solid var(--color-border-input)',
          borderRadius: 0,
          background: 'var(--color-bg-input)',
          color: 'var(--color-text-primary)',
          fontFamily: 'var(--font-serif)',
          fontSize: 'var(--font-size-body)',
          padding: '8px 10px',
        }}
      />
    </label>
  )
}

function DesignSystemRules() {
  return (
    <main style={{
      minHeight: '100vh',
      background: 'var(--color-bg-primary)',
      color: 'var(--color-text-primary)',
      padding: '56px clamp(24px, 5vw, 72px)',
    }}>
      <div style={{
        display: 'grid',
        gap: 34,
        maxWidth: 980,
        margin: '0 auto',
      }}>
        <header style={{ display: 'grid', gap: 14, maxWidth: 760 }}>
          <Typography variant="displayMedium" as="h1">
            Design System Rules
          </Typography>
          <Typography variant="bodyLarge" as="p">
            Current interaction, text, input, and alignment rules captured from
            the production components. If a new pattern repeats, promote it to
            a component prop before styling around it in a section.
          </Typography>
        </header>

        <RuleSection title="Button Placement">
          <RuleList items={[
            'Primary actions sit on the right side of their interaction row.',
            'Submit rows are right-aligned.',
            'When a row pairs a utility input with a primary action, place the utility input first and the primary action on the right.',
            'Dense product controls stay compact instead of stretching across the full mobile column.',
          ]} />
          <div style={{
            width: 'min(100%, 420px)',
            display: 'grid',
            gridTemplateColumns: '96px 154px',
            alignItems: 'end',
            justifyContent: 'end',
            gap: 10,
            paddingTop: 8,
          }}>
            <DemoInput />
            <PingaButton variant="sweep" size="compact">
              Add to cart
            </PingaButton>
          </div>
        </RuleSection>

        <RuleSection title="Button Variants">
          <RuleList items={[
            'Use PingaButton for actions only. Navigation uses Link.',
            'Use sweep for primary actions such as submit, checkout, and add-to-cart.',
            'Use compact sizing for dense product controls.',
            'Do not add arrows, triangles, or icons to PingaButton.',
          ]} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <PingaButton variant="sweep">Send enquiry</PingaButton>
            <PingaButton variant="sweep" size="compact">Add to cart</PingaButton>
            <PingaButton variant="ghost">Secondary</PingaButton>
          </div>
        </RuleSection>

        <RuleSection title="Toggle Layouts">
          <RuleList items={[
            'Use wrap layout for filters and short option sets.',
            'Use stacked layout for product options with longer labels.',
            'Use compact size for product option rows.',
            'Do not override nested toggle buttons from section CSS.',
          ]} />
          <div style={{ display: 'grid', gap: 22 }}>
            <PingaToggle
              options={['Street', 'Engagement', 'Portrait']}
              selected="Street"
              onChange={() => {}}
              variant="primary"
            />
            <PingaToggle
              options={['Black frame +$30', 'Natural wood frame +$30']}
              selected="Black frame +$30"
              onChange={() => {}}
              variant="primary"
              layout="stacked"
              size="compact"
            />
          </div>
        </RuleSection>

        <RuleSection title="Text And Inputs">
          <RuleList items={[
            'Render text with Typography. Do not hardcode font family, size, tracking, transform, or colour on new text elements.',
            'Labels sit above inputs.',
            'Inputs are square-edged and use shared dark surfaces, muted borders, serif body type, and token colours.',
            'Use the quietest text variant that still reads clearly. Shipping helper text uses meta.',
          ]} />
        </RuleSection>

        <RuleSection title="Cart">
          <RuleList items={[
            'Cart trigger content is right-aligned.',
            'The cart icon is minimalist and inherits the same muted colour as the Cart label.',
            'The item count remains distinct, but the icon should not compete with label or count.',
          ]} />
        </RuleSection>
      </div>
    </main>
  )
}

const meta = {
  title: 'P!nga / Design System / Rules',
  component: DesignSystemRules,
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof DesignSystemRules>

export default meta
type Story = StoryObj<typeof meta>

export const Rules: Story = {}
