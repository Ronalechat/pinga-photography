# UI Component System

Two reusable interactive components cover all button and toggle patterns in
the codebase. Before building any new interactive element, check whether either
component satisfies the requirement. If neither fits, document the reasoning
in a PR description before creating a new pattern.

---

## PingaButton

**File:** `/components/ui/PingaButton.tsx`
**CSS:** `/components/ui/PingaButton.module.css`
**Stories:** `Pinga / UI / PingaButton` in Storybook

Always renders as a `<button>` element. For navigation links use Next.js
`<Link>` directly — SiteHeader and SiteFooter use plain Link elements with
their own established hover behaviour and are not changed.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `variant` | `'ghost' \| 'sweep'` | — | Visual variant. Required. |
| `children` | `React.ReactNode` | — | Button label. Required. |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type. |
| `disabled` | `boolean` | `false` | Disables the button. Applies 35% opacity and suppresses all hover animations. |
| `onClick` | `React.MouseEventHandler` | — | Click handler. |
| `className` | `string` | — | Additional CSS class forwarded to the root element. |
| `aria-label` | `string` | — | Accessible label when text alone is insufficient. |

### Variant: ghost

No fill, no border. Text only.

- **Rest:** `color: rgba(242, 242, 252, 0.6)`
- **Hover:** `color: #F2F2FC` + 1px underline draws left-to-right beneath the
  text (`width: 0 → 100%`, 350ms `cubic-bezier(0.76, 0, 0.24, 1)`)
- **No triangle, no arrow, no icon of any kind.**

```tsx
<PingaButton variant="ghost" onClick={handleLearnMore}>
  Learn more
</PingaButton>
```

### Variant: sweep

Bordered box. White fill sweeps from left on hover; text inverts to near-black.

- **Rest:** `border: 1px solid rgba(242, 242, 252, 0.35)` · text `#F2F2FC`
- **Hover:** `::before` fill slides from `translateX(-102%)` to `translateX(0)`
  (380ms `cubic-bezier(0.76, 0, 0.24, 1)`); text transitions to `#16161D`;
  border brightens to `#F2F2FC`
- **`border-radius: 0` always** — never rounded under any circumstance
- **No triangle, no arrow, no icon of any kind.**

```tsx
<PingaButton variant="sweep" type="submit">
  Send enquiry
</PingaButton>
```

### The triangle note

The decorative CSS triangle beside the "Send enquiry" label in `EnquiryForm`
is hand-coded inside that component. It is component-specific and is **not**
a prop or feature of `PingaButton`. Do not add triangle, arrow, or icon
support to `PingaButton`.

### Current usage

| Location | Variant | Type |
|---|---|---|
| `EnquiryForm.tsx` submit | `sweep` | `submit` |
| `ProductEnquiry.tsx` submit | `sweep` | `submit` |

---

## PingaToggle

**File:** `/components/ui/PingaToggle.tsx`
**CSS:** `/components/ui/PingaToggle.module.css`
**Stories:** `Pinga / UI / PingaToggle` in Storybook

Inline group of toggle buttons. One visual variant: state-driven sweep fill
(same sweep mechanic as `PingaButton` sweep, 320ms). The `multiSelect` prop
controls behaviour — the visual appearance is identical for both modes.

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `options` | `string[]` | — | List of option labels. Required. |
| `selected` | `string \| string[]` | — | Currently active option(s). Pass `string` for single select, `string[]` for multi. Required. |
| `onChange` | `(value: string \| string[]) => void` | — | Called with the new selection. Value type matches `selected` type. Required. |
| `multiSelect` | `boolean` | `false` | When `false`: single select. When `true`: multi select. |

### Behaviour

**Single select (`multiSelect: false`)**
Clicking an inactive option calls `onChange(option)`. Clicking the active
option does nothing — no unnecessary re-render or state churn.

**Multi select (`multiSelect: true`)**
Clicking an inactive option adds it: `onChange([...current, option])`.
Clicking an active option removes it: `onChange(current.filter(s => s !== option))`.

### Visual design

- **`border-radius: 0` always** — consistent with PingaButton sweep.
- **Hover has no visual effect.** Selected state is the only visual signal.
  This avoids ambiguity when multiple items can be simultaneously selected.
- Sweep animation is triggered by `selected` prop change, not by pointer events.
- Resting text: `rgba(179, 179, 186, 0.5)`. Selected text: `#16161D`.
- Resting border: `rgba(255, 255, 255, 0.18)`. Selected border: `#F2F2FC`.

### Single select example (KineticGrid)

```tsx
const [activeFilter, setActiveFilter] = useState('all')

<PingaToggle
  options={['all', ...categoryNames]}
  selected={activeFilter}
  onChange={(v) => setActiveFilter(v as string)}
/>
```

### Multi select example (EnquiryForm)

```tsx
const [occasions, setOccasions] = useState<string[]>([])

<PingaToggle
  options={['Street', 'Engagement', 'Pregnancy', 'Birthday', 'Exhibition', 'Portrait']}
  selected={occasions}
  onChange={(v) => setOccasions(v as string[])}
  multiSelect
/>
```

### The toggle variant note

There is only one visual variant. `multiSelect` changes **behaviour**, not
appearance — the sweep fill and typography are identical in both modes. This
keeps the visual language consistent: users always see the same selected-state
signal regardless of whether they're in a single-select or multi-select context.

### Current usage

| Location | Mode | Purpose |
|---|---|---|
| `KineticGrid.tsx` | `multiSelect: false` | Category filter bar |
| `EnquiryForm.tsx` | `multiSelect: true` | Occasion picker |

---

## Visual design rules (both components)

| Rule | Value |
|---|---|
| Easing | `cubic-bezier(0.76, 0, 0.24, 1)` — fast start, sharp deceleration |
| PingaButton ghost duration | 350ms |
| PingaButton sweep duration | 380ms |
| PingaToggle sweep duration | 320ms |
| Border radius | **0 always** — never rounded |
| Fill colour | `#F2F2FC` (lavender white) |
| Text on fill | `#16161D` (ink black) |
| Resting text (button) | `rgba(242, 242, 252, 0.6)` |
| Resting text (toggle) | `rgba(179, 179, 186, 0.5)` |
| Reduced motion | All transitions suppressed via `prefers-reduced-motion: reduce` |

---

## ProductMediaViewer

**File:** `/components/ui/ProductMediaViewer/ProductMediaViewer.tsx`
**CSS:** `/components/ui/ProductMediaViewer/ProductMediaViewer.module.css`
**Stories:** `Pinga / UI / ProductMediaViewer` in Storybook

Shared image viewer for shop/product-style components. Use this instead of
duplicating image navigation inside section components.

### Responsibilities

- main product image display
- square thumbnail strip when more than one image exists
- no thumbnails when only one image exists
- previous/next tap zones on the image
- touch swipe
- keyboard navigation
- accessible labels
- placeholder state when no image is available

### Current usage

| Location | Purpose |
| --- | --- |
| `ProductEnquiry.tsx` | Demand/enquiry product media |
| `ShopProduct.tsx` | Cart-enabled product media |
