# Shop Environment Setup

The current code can render products, persist a local cart, and estimate
rule-based shipping without external credentials.

Payment, stock reservations, and admin data need Supabase and Stripe.
Order and enquiry email notifications use the existing Resend variables.

## Supabase

Create a Supabase project, then apply `/docs/supabase-shop-schema.sql`.

Required environment variables:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Use the service role key only in server routes. Do not expose it to the browser.

## Stripe

Install and wire Stripe only after credentials are ready.

Required environment variables:

```bash
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_SITE_URL=
SHOP_CHECKOUT_ENABLED=false
SHOP_ADMIN_ACCESS_TOKEN=
```

Checkout route:

```txt
POST /api/shop/checkout
```

Webhook route:

```txt
POST /api/stripe/webhook
```

The checkout route validates request shape, refetches the current Storyblok shop
catalog, rebuilds product prices/options server-side, and then returns a
setup-required response until Stripe, Supabase, webhook handling, and the
explicit `SHOP_CHECKOUT_ENABLED=true` flag are ready.

Keep `SHOP_CHECKOUT_ENABLED=false` on staging until paid order persistence and
webhook handling have been tested end to end. The route does not simulate
payment success.

## Webhooks and orders

Stripe should send `checkout.session.completed` events to:

```txt
POST /api/stripe/webhook
```

The webhook verifies Stripe's signature before marking the matching Supabase
order as `paid` and converting active reservations into sold stock.
`checkout.session.expired` cancels the pending order and releases active
reservations for that Stripe session.

The checkout route creates a pending Supabase order before returning the Stripe
Checkout URL. Limited and one-of-one products call the Supabase reservation
function before the customer leaves the site.

When Resend is configured, a successful paid-order webhook also emails Paul a
compact order summary. Email failures are logged but do not fail the Stripe
webhook response, because the paid order and stock mutation are the source of
truth.

Shirt/product enquiries still send Paul an email first. If Supabase is
configured, they are also written to `shop_enquiries` so they appear in the admin
dashboard. Google Sheets remains a quiet fallback/export path and does not block
the customer thank-you state.

## Admin

The admin shell lives at:

```txt
/admin/shop
```

It is a lightweight operational dashboard behind a temporary token gate. It
shows recent orders, enquiries, inventory, and active stock reservations once
Supabase is connected. Admin reads and operational updates do not require Stripe;
paid checkout and webhook stock conversion still do.

Admin data API:

```txt
GET /api/admin/shop/summary
PATCH /api/admin/shop/orders/:id
PATCH /api/admin/shop/enquiries/:id
POST /api/admin/shop/inventory
POST /api/admin/shop/reservations/release-expired
```

This route requires the `x-shop-admin-token` header to match
`SHOP_ADMIN_ACCESS_TOKEN`. Without that token it returns no customer or order
data.

The `/admin/shop` page has a temporary token prompt that stores the token in
`sessionStorage` for the current browser session. Replace this with a proper
login flow before handing the dashboard to Paul as a daily tool.

Order status updates are operational records only. Marking an order as
`refunded` in the dashboard does not create a Stripe refund; Stripe refunds
still need a dedicated payment action later.
