# Shop Environment Setup

The current code can render products, persist a local cart, and estimate
rule-based shipping without external credentials.

Payment, stock reservations, and admin data need Supabase and Stripe.
Order and enquiry email notifications use the existing Resend variables.

## Supabase

Create a Supabase project, then apply `/docs/supabase-shop-schema.sql`.
For existing projects created before admin PIN login, also apply
`/docs/supabase-admin-auth-migration.sql`. For existing projects created before
the atomic checkout reservation RPC and service-role RPC grants, also apply
`/docs/supabase-shop-hardening-migration.sql`.

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
SHOP_ADMIN_USERNAMES=
SHOP_ADMIN_SESSION_SECRET=
SHOP_ADMIN_SETUP_SECRET=
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

Paid webhooks are safe to retry: the handler verifies a matching order, converts
only active reservations, marks only pending orders paid, and acknowledges
duplicate paid sessions without sending another notification.

The checkout route creates a pending Supabase order before returning the Stripe
Checkout URL. It sends the Supabase order id to Stripe as `client_reference_id`
and `metadata.shop_order_id`, links the returned Stripe Checkout Session id back
to the order, then reserves limited and one-of-one stock with
`shop_create_checkout_reservations` before the customer leaves the site.

If local order linking or reservation creation fails after Stripe creates a
Checkout Session, the route cancels the pending order, releases any active
reservations for the session, and attempts to expire the Stripe session.

When Resend is configured, a successful paid-order webhook also emails Paul a
compact order summary. Email failures are logged but do not fail the Stripe
webhook response, because the paid order and stock mutation are the source of
truth.

Apply the current `/docs/supabase-shop-schema.sql` before enabling checkout in a
Supabase project. The shop SECURITY DEFINER RPC functions revoke default public,
anonymous, and authenticated execute access and grant execution only to
`service_role`, so server routes must keep using `SUPABASE_SERVICE_ROLE_KEY`.

Shirt/product enquiries still send Paul an email first. If Supabase is
configured, they are also written to `shop_enquiries` so they appear in the admin
dashboard. Google Sheets remains a quiet fallback/export path and does not block
the customer thank-you state.

## Admin

The admin shell lives at:

```txt
/admin/shop
```

It is a lightweight operational dashboard behind username + six digit PIN login.
It shows recent orders, enquiries, inventory, and active stock reservations once
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

`GET /api/admin/shop/summary` supports history filters:

```txt
orderStatus=all|pending|paid|cancelled|fulfilled|refunded
enquiryStatus=all|new|contacted|closed
reservationStatus=active|all|converted|released|expired
inventoryMode=all|unlimited|limited|one_of_one|enquiry_goal
ordersLimit/ordersOffset, enquiriesLimit/enquiriesOffset,
reservationsLimit/reservationsOffset, inventoryLimit/inventoryOffset
```

Admin API routes require the signed `pinga_shop_admin_session` cookie created by
`POST /api/admin/shop/login`. The PIN is hashed before storage in Supabase, and
failed attempts lock the account temporarily.

The login and session APIs return a CSRF token for dashboard JavaScript to send
as `X-Pinga-Shop-CSRF` on admin POST/PATCH routes. Missing or stale tokens are
rejected before any Supabase mutation runs.

First-time PIN setup requires the one-time `SHOP_ADMIN_SETUP_SECRET`. Only
usernames listed in `SHOP_ADMIN_USERNAMES` can enrol or log in.

Order status updates are operational records only. Marking an order as
`refunded` in the dashboard does not create a Stripe refund; Stripe refunds
still need a dedicated payment action later.
Pending orders cannot be fulfilled or refunded from the admin dashboard; they
can only be cancelled until Stripe marks them paid through the webhook.
