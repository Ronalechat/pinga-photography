import type { Meta, StoryObj } from '@storybook/react'
import PingaButton from './PingaButton'

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: 'P!nga / UI / PingaButton',
  component: PingaButton,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{
        background: '#16161D',
        minHeight: 200,
        padding: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof PingaButton>

export default meta
type Story = StoryObj<typeof meta>

// ─── Ghost ────────────────────────────────────────────────────────────────────

/**
 * **Ghost** — text-only button. No fill, no border.
 *
 * On hover the text brightens to full white and a 1px underline draws
 * left-to-right beneath the label (350ms, sharp deceleration easing).
 *
 * Use for secondary actions where a true `<button>` element is required.
 * For navigation links use Next.js `<Link>` directly — SiteHeader and
 * SiteFooter are not changed.
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Learn more',
  },
}

/**
 * **Ghost — disabled**
 *
 * Opacity drops to 35%. The underline draw and colour transition are
 * suppressed. Pointer is `not-allowed`. All driven by CSS `:disabled`;
 * no extra JS logic needed.
 */
export const GhostDisabled: Story = {
  args: {
    variant: 'ghost',
    children: 'Learn more',
    disabled: true,
  },
}

// ─── Sweep ────────────────────────────────────────────────────────────────────

/**
 * **Sweep** — primary action button.
 *
 * Bordered at rest (1px, muted white). On hover a white fill sweeps in
 * from the left (380ms) and the text inverts to near-black (`#16161D`) as
 * the fill arrives. `border-radius` is always 0 — this rule is enforced in
 * CSS and must not be overridden.
 *
 * **Only current usage:** EnquiryForm submit — `variant="sweep" type="submit"`.
 */
export const Sweep: Story = {
  args: {
    variant: 'sweep',
    children: 'Send enquiry',
  },
}

/**
 * **Sweep — disabled**
 *
 * Opacity drops to 35%. The fill sweep is suppressed (hover selectors use
 * `:not(:disabled)`). Pointer is `not-allowed`.
 */
export const SweepDisabled: Story = {
  args: {
    variant: 'sweep',
    children: 'Send enquiry',
    disabled: true,
  },
}

/**
 * **Sweep — submit**
 *
 * The only usage pattern in the codebase today: `type="submit"` inside
 * `EnquiryForm`. The decorative triangle beside the label is hand-coded in
 * `EnquiryForm` and is not a feature of `PingaButton`.
 */
export const SweepSubmit: Story = {
  args: {
    variant: 'sweep',
    type: 'submit',
    children: 'Send enquiry',
  },
}
