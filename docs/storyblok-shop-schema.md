# Storyblok Shop Schema

Create these components in Storyblok to power `/shop`.

Field names below are the API keys the code expects.

## `product_enquiry`

Use this for the current T-shirt demand form and any future product that should
collect contact details instead of going through cart checkout.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `product_id` | Text | Recommended | Stable ID for admin tracking, e.g. `heart-balloon-shirt`. Do not change after publishing. |
| `product_name` | Text | Yes | Product name shown in the form and email. |
| `price` | Text | No | Editorial price label, e.g. `80`. Displayed as `$80 + shipping`. |
| `subtitle` | Textarea | No | Short context under the product title. |
| `images` | Assets | No | Product image set. First image is the default hero image. |
| `minimum_order_goal` | Number | No | Demand target, such as `20` for a shirt run. |
| `cta_label` | Text | No | Optional submit label override. |

Submitted enquiries email Paul first. If Supabase is configured, they are also
stored in `shop_enquiries` and shown in `/admin/shop`. Google Sheets remains a
quiet fallback/export path.

## `shop_product`

Use this for prints, framed works, future shirts, and any product that can be
shown in the shop.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `product_id` | Text | Yes | Stable ID, e.g. `heart-balloon-print`. Do not change after publishing. |
| `title` | Text | Yes | Product name shown in the shop. |
| `subtitle` | Textarea | No | Short product note. |
| `description` | Textarea | No | Longer product detail. Keep concise. |
| `images` | Assets | No | Product image set. First image is cart thumbnail. |
| `mode` | Single-option | Yes | `enquiry`, `cart_checkout`, `manual_quote`, `sold_out`. |
| `price_cents` | Number | Yes | Store as cents, e.g. `12000` for `$120`. |
| `currency` | Single-option | Yes | Start with `AUD`. |
| `stock_mode` | Single-option | Yes | `unlimited`, `limited`, `one_of_one`, `enquiry_goal`. |
| `stock_quantity` | Number | Conditional | Required for `limited` and `one_of_one`. |
| `show_stock` | Boolean | No | Show remaining/edition language in the UI. |
| `low_stock_threshold` | Number | No | Future admin/display hook. |
| `shipping_profile` | Single-option | No | See shipping profiles below. |
| `shipping_note` | Text | No | Optional display copy, e.g. `Pickup available in Sydney`. |
| `weight_grams` | Number | No | Used later by the shipping quote engine. |
| `package_length_mm` | Number | No | Packed parcel length. |
| `package_width_mm` | Number | No | Packed parcel width. |
| `package_height_mm` | Number | No | Packed parcel height. |
| `can_combine_shipping` | Boolean | No | Whether multiple units can share packaging. |
| `requires_manual_shipping_quote` | Boolean | No | Use for framed, oversized, fragile, or international-uncertain products. |
| `pickup_available` | Boolean | No | Whether local pickup can be offered. |
| `option_groups` | Blocks | No | Use `shop_option_group`. |
| `cta_label` | Text | No | Optional override, e.g. `Add print`. |

### `mode` options

| Value | Meaning |
| --- | --- |
| `enquiry` | Product is shown for interest/manual follow-up. No cart checkout yet. |
| `cart_checkout` | Product can be added to cart. |
| `manual_quote` | Product is visible, but needs Paul to confirm details/shipping. |
| `sold_out` | Product remains visible but cannot be bought. |

### `stock_mode` options

| Value | Meaning |
| --- | --- |
| `unlimited` | No stock display or stock cap. |
| `limited` | Uses `stock_quantity`. |
| `one_of_one` | Single unique product. |
| `enquiry_goal` | Demand collection, such as a minimum shirt run. |

### `shipping_profile` options

| Value | Meaning |
| --- | --- |
| `shirt` | Small apparel parcel. |
| `unframed_print` | Print shipped flat or tubed. |
| `framed_print` | Framed print parcel. |
| `oversized` | Large/fragile item. |
| `pickup_only` | Local pickup only. |
| `manual_quote` | Freight must be quoted manually. |

## `shop_option_group`

Use as a nested block inside `shop_product.option_groups`.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `key` | Text | Yes | Stable key, e.g. `frame`. |
| `label` | Text | Yes | UI label, e.g. `Frame`. |
| `display` | Single-option | No | `toggle` or `select`. Current UI uses toggle styling. |
| `required` | Boolean | No | Defaults to selected first option. |
| `values` | Blocks | Yes | Use `shop_option_value`. |

## `shop_option_value`

Use as a nested block inside `shop_option_group.values`.

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `key` | Text | Yes | Stable key, e.g. `wood`. |
| `label` | Text | Yes | UI label, e.g. `Wood frame`. |
| `price_delta_cents` | Number | No | Extra price in cents, e.g. `3000` for `$30`. |

## Example: limited framed print

`shop_product`

- `product_id`: `heart-balloon-print`
- `title`: `Heart Balloon Print`
- `subtitle`: `Limited print from the archive.`
- `mode`: `cart_checkout`
- `price_cents`: `12000`
- `currency`: `AUD`
- `stock_mode`: `limited`
- `stock_quantity`: `10`
- `show_stock`: `true`
- `shipping_profile`: `framed_print`
- `requires_manual_shipping_quote`: `false`
- `pickup_available`: `true`

`shop_option_group`

- `key`: `frame`
- `label`: `Frame`
- `display`: `toggle`

`shop_option_value`

- `key`: `none`
- `label`: `No frame`
- `price_delta_cents`: `0`

`shop_option_value`

- `key`: `wood`
- `label`: `Wood frame`
- `price_delta_cents`: `3000`

`shop_option_value`

- `key`: `black`
- `label`: `Black frame`
- `price_delta_cents`: `3000`

## Editing Rules

- Do not change `product_id`, option group `key`, or option value `key` after
  launch. Orders and cart lines depend on those stable keys.
- Use cents for prices. Do not enter `$`, commas, or decimals in `price_cents`.
- Use `manual_quote` when shipping is uncertain. It is better to block checkout
  than undercharge for a framed or international order.
- Keep product copy short. This layout is designed for scanning several products
  on one shop page.

## Live Supabase Overrides

Storyblok remains the editorial fallback for stock and shipping setup. When
`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available, server-side shop
helpers can read `shop_inventory`, active `shop_reservations`, and
`shop_shipping_profiles` before returning product availability or shipping
quotes.

- `shop_inventory.stock_quantity` is the total available edition/run size.
  Live availability subtracts `sold_quantity` and active, unexpired
  reservations.
- Missing Supabase rows fall back to the Storyblok fields above, so a newly
  published product can still render before the admin inventory row is seeded.
- `shop_shipping_profiles` rows override the default rule table one profile at
  a time. Missing or invalid rows keep the built-in safe defaults.
- `mode` still controls the product action: use `cart_checkout` for direct cart
  purchase, `manual_quote` for quote-first products, `enquiry` for interest
  capture, and `sold_out` when the product should stay visible without checkout.
