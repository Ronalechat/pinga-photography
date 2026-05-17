# Shop Architecture

The shop is an artist-store layer, not a generic ecommerce theme. It should feel
quiet, editorial, and consistent with the rest of P!nga: image-led, compact,
square-edged, and typography-driven.

## Ownership

| Concern | Owner |
| --- | --- |
| Product copy, images, option labels, base prices, shipping profile metadata | Storyblok |
| Stock, reservations, enquiries, orders, fulfilment state, admin data | Supabase |
| Payments, receipts, checkout session state | Stripe |
| Transactional email to Paul/customers | Resend |
| In-progress anonymous cart | Browser `localStorage` |

Storyblok schema setup for the shop is documented in
`/docs/storyblok-shop-schema.md`.

Never trust Storyblok or `localStorage` for checkout totals on their own. Before
checkout, the server must revalidate product availability, selected options,
prices, stock, and shipping.

## Cart

- The cart UI is scoped to `/shop`; it must not appear on home, gallery,
  exhibits, or enquiry routes.
- The cart persists in `localStorage` so visitors can leave and return.
- The visible cart count is the total quantity across all cart lines.
- Cart line identity is `product_id + selected option values`, so the same print
  with wood frame and black frame are separate lines.
- There is no arbitrary per-person purchase limit. Quantity is limited only by
  available stock for limited products.
- `localStorage` is convenience state only. Prices, option validity, stock, and
  shipping must be recalculated server-side before checkout.
- Customers choose one returned shipping option before checkout. The cart shows
  subtotal, selected shipping, and total before calling `/api/shop/checkout`.
- Manual quote shipping options block checkout and should direct the customer
  back to Paul for confirmation before payment.

## Product Media

Do not duplicate product image viewer logic. Product-style image galleries use
`components/ui/ProductMediaViewer/ProductMediaViewer`.

The shared viewer handles:

- main product image display
- thumbnails only when multiple images exist
- previous/next tap zones
- touch swipe
- keyboard navigation
- accessible labels
- placeholder state

Current and future product components should compose this viewer rather than
owning their own image navigation.

## Product Modes

Storyblok products can render in multiple modes:

- `enquiry`: collect contact details or demand signal. No stock reservation.
- `cart_checkout`: can be added to cart and paid through Stripe.
- `manual_quote`: shown in shop, but requires Paul to quote/confirm manually.
- `sold_out`: visible but not purchasable.

## Stock

Stock modes:

- `unlimited`: no stock count shown unless editorial copy asks for it.
- `limited`: show edition/remaining count when configured.
- `one_of_one`: show one-of-one language and block purchase after sale.
- `enquiry_goal`: demand collection only, such as a minimum shirt run.

Reservations are used only for limited paid products. A reservation temporarily
holds stock while a visitor is in Stripe Checkout. It expires if checkout is not
completed, and converts to sold stock after the Stripe webhook confirms payment.

Supabase provides the atomic reservation functions:

- `shop_create_reservation`
- `shop_convert_reservations`
- `shop_release_expired_reservations`
- `shop_release_reservations`

## Shipping

Shipping starts as server-side rule-based calculation, with a carrier API later.

Required product metadata:

- shipping profile
- weight
- package dimensions
- whether it can combine with other items
- whether pickup is available
- whether manual quote is required

Recommended first rules:

- profile base rate
- additional item rate
- mixed-cart rate = highest base rate + additional item rates
- products marked `can_combine_shipping = false` charge their base rate per unit
- free pickup if enabled
- manual quote fallback for framed, oversized, fragile, international, or unknown
  parcels

Stripe hosted Checkout receives the selected fixed shipping amount after the app
calculates it. If we need true dynamic shipping after the customer enters an
address inside Stripe, move to Stripe embedded/custom Checkout or calculate the
shipping quote before redirecting to hosted Checkout.

## Checkout

The checkout route starts at `/api/shop/checkout`. It sanitises the submitted
cart, refetches the current Storyblok shop catalog, rebuilds product
prices/options from CMS data, validates quantities, currency, shipping
destination, and selected shipping option, then returns a setup-required
response until Supabase, Stripe, and the explicit checkout flag are connected.

This route is deliberately not a payment simulation. When Stripe is wired, it
must re-fetch the relevant Storyblok products and Supabase stock records before
creating a Checkout Session. Client-submitted prices, options, shipping totals,
and stock claims are only hints.

The Stripe webhook starts at `/api/stripe/webhook`. It must verify the Stripe
signature before converting reservations into paid orders.

Paid checkout is guarded by `SHOP_CHECKOUT_ENABLED=true`. Keep it disabled until
webhook handling and Supabase order persistence are verified, even if Stripe keys
are already present.

Before redirecting to Stripe, checkout creates a pending Supabase order and order
items. If reservation creation fails for a limited product, the checkout URL is
not returned.

## Admin

Paul should not need Netlify or Supabase day to day. Build a small admin surface
after checkout works:

- orders
- enquiries
- stock
- reservations
- selected options
- shipping details
- fulfilment status

The setup shell lives at `/admin/shop` and is marked noindex. It must remain a
status-only surface until authentication and Supabase reads are implemented.

The protected summary endpoint is `/api/admin/shop/summary`. It requires the
`x-shop-admin-token` header to match `SHOP_ADMIN_ACCESS_TOKEN` and should be
replaced by a real login flow before Paul uses the dashboard day to day.

`/admin/shop` includes a temporary token prompt and stores the token in
`sessionStorage` for the current browser session only. This keeps the dashboard
useful for staging without making the token a permanent browser credential.

The dashboard summary includes recent order line items, selected options,
customer contact details, shipping labels/addresses, inventory rows, and active
reservations. It also includes a maintenance action to expire old active
reservations by calling Supabase's `shop_release_expired_reservations` function.

Protected admin mutations:

- `PATCH /api/admin/shop/orders/:id` updates order fulfilment/refund/cancel
  status records.
- `PATCH /api/admin/shop/enquiries/:id` updates enquiry follow-up state.
- `POST /api/admin/shop/inventory` creates or updates inventory rows for
  Storyblok product IDs.
- `POST /api/admin/shop/reservations/release-expired` releases expired stock
  holds.

Admin order status changes do not call Stripe. A future refund flow must use a
Stripe refund API action rather than treating the local `refunded` status as
money movement.

## Notifications

Product enquiries send email first. Supabase and Google Sheets writes are
secondary and must fail quietly so the customer is not shown an error after Paul
has already received the enquiry email.

Paid order notifications are sent from the verified Stripe webhook after the
Supabase order is marked paid and reservations are converted. Notification
failure is logged but does not fail the webhook response.
