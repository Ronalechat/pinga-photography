import { Resend } from 'resend'
import { formatMoney } from '@/lib/shop/money'
import { supabaseRequest } from '@/lib/shop/supabaseRest'

interface NotificationOrderItem {
  title: string
  quantity: number
  unit_amount_cents: number
  currency: string
  selected_options: unknown
}

interface NotificationOrderRow {
  id: string
  customer_name: string | null
  customer_email: string | null
  customer_phone: string | null
  total_cents: number
  currency: string
  shipping_option_label: string | null
  shop_order_items?: NotificationOrderItem[]
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function getSelectedOptionsLabel(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return ''

  return value
    .map((option) => {
      if (!option || typeof option !== 'object') return ''
      const maybeOption = option as { groupLabel?: unknown; valueLabel?: unknown }
      const groupLabel = typeof maybeOption.groupLabel === 'string' ? maybeOption.groupLabel : ''
      const valueLabel = typeof maybeOption.valueLabel === 'string' ? maybeOption.valueLabel : ''

      if (!groupLabel && !valueLabel) return ''
      return groupLabel ? `${groupLabel}: ${valueLabel}` : valueLabel
    })
    .filter(Boolean)
    .join(' / ')
}

async function getNotificationOrder(stripeSessionId: string) {
  const rows = await supabaseRequest<NotificationOrderRow[]>(
    `/rest/v1/shop_orders?stripe_session_id=eq.${encodeURIComponent(stripeSessionId)}&select=id,customer_name,customer_email,customer_phone,total_cents,currency,shipping_option_label,shop_order_items(title,quantity,unit_amount_cents,currency,selected_options)&limit=1`
  )

  return rows[0] ?? null
}

export async function sendPaidOrderNotification(stripeSessionId: string) {
  const apiKey = process.env.RESEND_API_KEY
  const senderEmail = process.env.SENDER_EMAIL
  const recipientEmail = process.env.RECIPIENT_EMAIL

  if (!apiKey || !senderEmail || !recipientEmail) return

  const order = await getNotificationOrder(stripeSessionId)
  if (!order) return

  const resend = new Resend(apiKey)
  const customer = order.customer_name || order.customer_email || 'Customer'
  const items = order.shop_order_items ?? []
  const itemRows = items.map((item) => {
    const options = getSelectedOptionsLabel(item.selected_options)

    return `
      <tr>
        <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${escapeHtml(`${item.quantity} x ${item.title}`)}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${escapeHtml(options || 'Default')}</td>
        <td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; text-align: right;">${escapeHtml(formatMoney(item.unit_amount_cents, item.currency))}</td>
      </tr>
    `
  }).join('')

  await resend.emails.send({
    from: senderEmail,
    to: recipientEmail,
    replyTo: order.customer_email ?? undefined,
    subject: `Paid shop order - ${customer}`,
    html: `
      <table style="font-family: Georgia, serif; font-size: 15px; color: #1a1a1a; max-width: 640px; width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 32px 32px 0; font-family: sans-serif; font-size: 22px; font-weight: bold; color: #16161D; background: #f5f5f5;">New paid shop order</td></tr>
        <tr><td style="padding: 20px 32px; background: #f5f5f5;">
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; width: 150px; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Customer</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${escapeHtml(customer)}</td></tr>
            ${order.customer_email ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Email</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;"><a href="mailto:${escapeHtml(order.customer_email)}" style="color: #3A3A6E;">${escapeHtml(order.customer_email)}</a></td></tr>` : ''}
            ${order.customer_phone ? `<tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Phone</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${escapeHtml(order.customer_phone)}</td></tr>` : ''}
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Shipping</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${escapeHtml(order.shipping_option_label ?? 'Not selected')}</td></tr>
            <tr><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0; font-family: sans-serif; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; color: #888;">Total</td><td style="padding: 8px 0; border-bottom: 1px solid #e0e0e0;">${escapeHtml(formatMoney(order.total_cents, order.currency))}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding: 0 32px 32px; background: #f5f5f5;">
          <table style="width:100%; border-collapse: collapse;">
            ${itemRows}
          </table>
        </td></tr>
      </table>
    `,
  })
}
