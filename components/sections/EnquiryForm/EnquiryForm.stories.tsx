import type { Meta, StoryObj } from '@storybook/react'
import { within, userEvent } from '@storybook/test'
import EnquiryForm from './EnquiryForm'

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta = {
  title: 'P!nga / Sections / EnquiryForm',
  component: EnquiryForm,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ background: '#16161D', minHeight: '100vh' }}>
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof EnquiryForm>

export default meta
type Story = StoryObj<typeof meta>

// ─── Default ──────────────────────────────────────────────────────────────────

/**
 * **Default** — idle form state. All fields empty, submit button enabled.
 *
 * Layout:
 * - Desktop (≥1024px): two-column grid — intro left (sticky), form right.
 * - Mobile / tablet: single column, intro stacks above form.
 *
 * Try selecting multiple occasions with the PingaToggle before submitting.
 */
export const Default: Story = {}

// ─── Sent confirmation ────────────────────────────────────────────────────────

/**
 * **Sent** — the confirmation state shown after a successful form submission.
 *
 * The form is replaced with a simple heading + body message. The section
 * keeps the same id="enquire" so scroll-to still lands correctly.
 *
 * Seeded via `initialStatus="sent"` — in production this state is reached
 * after a successful Netlify Forms POST.
 */
export const Sent: Story = {
  args: { initialStatus: 'sent' },
}

// ─── Sending ──────────────────────────────────────────────────────────────────

/**
 * **Sending** — in-flight submission state.
 *
 * Submit button is disabled and its label changes to "Sending…".
 * The form fields remain visible. Seeded via `initialStatus="sending"`.
 */
export const Sending: Story = {
  args: { initialStatus: 'sending' },
}

// ─── Error ────────────────────────────────────────────────────────────────────

/**
 * **Error** — failed submission state.
 *
 * An error message appears above the submit button (`role="alert"`).
 * The form fields remain editable so the user can retry.
 * Seeded via `initialStatus="error"`.
 */
export const Error: Story = {
  args: { initialStatus: 'error' },
}

// ─── Validation errors ────────────────────────────────────────────────────────

/**
 * **Validation errors** — play function types an invalid email and a
 * phone number containing letters, then clicks submit. Both per-field
 * error messages appear inline below their respective inputs.
 */
export const ValidationErrors: Story = {
  name: 'Validation errors (email + phone)',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const emailInput = canvas.getByPlaceholderText('your@email.com')
    await userEvent.type(emailInput, 'not-an-email', { delay: 30 })
    const phoneInput = canvas.getByPlaceholderText('+61 400 000 000')
    await userEvent.type(phoneInput, 'abc123', { delay: 30 })
    const submit = canvas.getByRole('button', { name: /send enquiry/i })
    await userEvent.click(submit)
  },
}

// ─── Progressive reveal triggered ─────────────────────────────────────────────

/**
 * **Progressive reveal triggered** — play function types an email address into
 * the email field, which triggers the reveal animation for Occasion, Date, and
 * Tell me more.
 */
export const RevealTriggered: Story = {
  name: 'Progressive reveal triggered',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const email = canvas.getByPlaceholderText('your@email.com')
    await userEvent.type(email, 'paul@example.com', { delay: 40 })
  },
}
