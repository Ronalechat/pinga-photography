# P!nga Design System Rules

This document captures rules that are already present in the codebase. If a
new interface needs a different pattern, add it to the relevant component API
instead of overriding nested styles from a section stylesheet.

## Typography

- Render text with `Typography`. Do not hardcode font family, font size,
  letter spacing, text transform, or colour on text elements in new components.
- Use display variants only for true display moments: hero titles, page titles,
  large slide titles, and product names where the product is the section focus.
- Use `bodyLarge` for lead copy, product price, or short product subtitles.
- Use `body` for readable paragraph copy.
- Use `caption`, `label`, `eyebrow`, and `meta` for compact interface text.
  Choose the quietest variant that still reads clearly.
- Use `meta` for low-emphasis operational notes such as shipping helper text.

## Inputs

- Labels sit above inputs.
- Inputs are square-edged. Do not add border radius.
- Inputs use the shared dark input surface, muted border, serif body type, and
  token colours.
- On mobile, text inputs should be at least `16px` to avoid browser zoom.
- Utility inputs paired with a primary action come before the action in source
  and visual order.

## Button Placement

- Primary actions sit on the right side of their interaction row.
- Submit rows are right-aligned. This is used by `EnquiryForm` and
  `ProductEnquiry`.
- When a row contains a utility input and a primary action, the primary action
  belongs on the right. This is the `ShopProduct` quantity + add-to-cart pattern.
- Keep the control group compact when the interaction is part of a product card
  or product detail flow. Do not stretch a primary button across the whole
  mobile column unless the surrounding form pattern already does that.
- If an icon sits next to text, the icon should inherit the text colour unless
  it is intentionally the primary affordance.

## PingaButton

- Use `PingaButton` for actions only. Navigation uses `Link`.
- Use `variant="sweep"` for primary actions such as submit, checkout, and
  add-to-cart.
- Use `variant="ghost"` for secondary button actions.
- Use `size="default"` for standard form submits.
- Use `size="compact"` for dense product controls where the button sits beside
  a utility input.
- Do not add arrows, triangles, or icons to `PingaButton`. Component-specific
  decoration belongs in the owning component.
- Do not override `PingaButton` internals from section CSS. If a repeated size
  or placement is needed, add a prop to `PingaButton`.

## PingaToggle

- Use `PingaToggle` for selectable options.
- Use `layout="wrap"` for filters and short option sets that can flow inline.
- Use `layout="stacked"` for product options with longer labels, such as frame
  choices.
- Use `size="default"` for general filters and form pickers.
- Use `size="compact"` for product option rows.
- Use `variant="primary"` when the option set is a core interaction, such as
  gallery filters, enquiry occasions, and product options.
- Do not override nested toggle buttons from section CSS. If a repeated layout
  or sizing need appears, add it as a toggle prop.

## Product Controls

- Product option groups appear between product copy and shipping helper text.
- Product option rows should be stable in width so longer labels do not create
  uneven button sizes.
- Quantity and add-to-cart controls should share the same visual height.
- Add-to-cart copy should say `Add to cart`, because the action updates the
  cart rather than starting immediate checkout.

## Cart

- The cart is scoped to `/shop`.
- Cart trigger content is right-aligned.
- The cart icon is a minimalist CSS icon and should inherit the same muted
  colour as the `Cart` label.
- The item count remains visually distinct, but the icon should not compete
  with the label or count.

## Layout

- Use `Container` for non-full-width page content.
- Do not put cards inside cards.
- Product sections use centered media/content columns, not left-heavy layouts
  with dead space on the right.
- Keep full-bleed treatment for components that are intentionally immersive,
  such as the hero and carousel.
