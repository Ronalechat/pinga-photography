# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Status

Pre-framework component library for a photography website. No build system, package manager, or test runner is set up yet. The folder contains standalone React TSX components and plain HTML prototypes. The project is planned to use Storyblok CMS with React.

## Structure

| File                                   | Purpose                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------ |
| `tokens.ts`                            | Single source of truth for all design tokens (import in React components)            |
| `tokens.css`                           | CSS custom properties mirroring `tokens.ts` (link in plain HTML files)               |
| `components/ui/Typography.tsx`         | Canonical text component — 12 named variants, single source of truth for type styles |
| `components/ui/Container.tsx`          | Shared max-width container for all non-full-width content                             |
| `components/sections/PageHeader.tsx`    | Display-scale page title + hairline rule. Used at the top of any non-full-bleed page (e.g. /enquiry). |
| `ScrollHero.tsx`                       | Scroll-driven hero — pins slides to viewport, crossfades between them                |
| `ImageCarousel.tsx`                    | Full-bleed image carousel with touch swipe, keyboard nav, and prev/next controls     |
| `KineticGrid-final.tsx`                | Masonry-style 3-column photo grid with category filters, scroll-reveal, and lightbox |
| `*.example.tsx`                        | Usage examples for each component                                                    |
| `*.html`                               | Plain HTML + vanilla JS prototypes of each component                                 |
| `fonts/`                               | Jean-Luc web font files (Bold 700 + Thin 100) in woff/otf                            |

## Component Folder Rule

If a component has more than one file (e.g. `.tsx` + `.module.css`, or `.tsx` + `.stories.tsx`),
it must live in its own folder named after the component.
Import using the full subfolder path — never a flat alias:

  ✓  import Typography from '@/components/ui/Typography/Typography'
  ✗  import Typography from '@/components/ui/Typography'

No barrel index files. Explicit paths only.

## Code Rules

- Functional React components only, no class components
- Always use TypeScript — no `any` types
- Import from `@/components` not relative paths

## Workflow Rules

- Run typecheck after any series of file edits: `npm run typecheck`
- Write a test file alongside any new component
- Never edit files in `packages/tokens` without telling me first
- Prefer running single tests, not the full suite

## What To Avoid

- Never use `console.log` in committed code (use our logger)
- Never install packages without asking me first

## Design Tokens

**Always use tokens — never hardcode hex values in components.**

- React components import from `./tokens`: `COLOR`, `FONT`, `FONT_SIZE`, `LETTER_SPACING`, `SPACE`, `EASING`, `DURATION`, `RADIUS`, `BREAKPOINT`
- Plain HTML files use CSS custom properties from `tokens.css` (e.g. `var(--color-bg-primary)`)
- When updating a value, mirror the change in both files

**When to add a token vs a scoped CSS custom property:**
Add a value to `tokens.ts` only when it is used as a pattern across 3 or more unrelated places. One-off component-specific values (a unique offset, a single component's internal spacing) belong as CSS custom properties scoped inside that component's `.module.css` — not in the global token file.

**Key palette:**

- `bgPrimary` `#16161D` — page background
- `bgSurface` `#3A3A6E` — elevated surfaces, cards
- `textPrimary` `#F2F2FC` — primary text on dark
- `textMuted` `#B3B3BA` — secondary text

**Typography:**

- `Jean-Luc` Bold (700) — headings, nav, CTAs
- `Jean-Luc` Thin (100) — large display text
- `Georgia` serif — body copy, captions, metadata, form fields

**Breakpoints:** mobile 0px / tablet 768px / desktop 1024px

## Animation Pattern

Scroll-driven and reveal animations bypass React state intentionally — they use direct DOM ref manipulation (`ref.current.style.*`) to avoid per-frame re-renders. Do not convert these to `useState`/`setState`.

## Component Notes

- **ScrollHero**: Layout measurements (outer element top offset, scrollable height) are cached in a ref and invalidated by ResizeObserver — do not read `getBoundingClientRect` inside the rAF loop. The outer div sets scroll height (`scrollMultiplier × 100vh`); the inner stage is `position: sticky`. Scroll listeners are passive.
- **KineticGrid**: Cards use `data-reveal="pending"` and animate via `opacity + transform` (not clip-path). Reveal fires only after the card's `<img>` has loaded (`img.complete`). Hover state for `.cardMeta` is in `KineticGrid.module.css` using `!important` — required to override the inline resting state. The lightbox renders via `createPortal` to `document.body` so it sits above the header's stacking context.
- **Lightbox**: Lives at `components/ui/Lightbox/`. Reusable outside of KineticGrid. Receives `list`, `index`, `colors`, `onClose`, `onNavigate`, `onJump` props.

## UI Component System

**PingaButton** (`/components/ui/PingaButton.tsx`)
- Two variants: `ghost` (underline draw on hover) and `sweep` (fill sweep on hover).
- Always renders as `<button>`. Never use for navigation — SiteHeader and SiteFooter
  use plain Next.js `<Link>` elements with their own hover behaviour.
- **No triangle/arrow** — the decorative triangle in EnquiryForm's submit button is
  hand-coded inside that component, not a prop or feature of PingaButton.
- `border-radius: 0` always on sweep — enforced in CSS, do not override.
- Current usage: `EnquiryForm.tsx` submit button (`variant="sweep" type="submit"`).

**PingaToggle** (`/components/ui/PingaToggle.tsx`)
- One visual variant: state-driven sweep fill (same mechanic as PingaButton sweep).
- `multiSelect` prop controls behaviour, not appearance:
  - `false` (default) — single select. Used in KineticGrid category filters.
  - `true` — multi select. Used in EnquiryForm occasion picker.
- Sweep fires on `selected` state change, not on hover. Hover has no visual effect.
- `border-radius: 0` always — enforced in CSS, do not override.

Before building any new interactive element, check whether `PingaButton` or
`PingaToggle` satisfies the requirement. Only create a new button or toggle
pattern if neither component fits, and document the reasoning in a PR description.

**Typography** (`/components/ui/Typography.tsx`)
- Variants: displayHero, displayLarge, displayMedium, displayThin, headingMedium,
  sentName, eyebrow, body, label, small, subtitle, navLink.
- Always use Typography for text rendering. Do not hardcode font-family, font-size,
  letter-spacing, text-transform, or color on text elements in new components —
  use a Typography variant instead.
- Use the `as` prop to override the HTML element for semantic markup.

**Container** (`/components/ui/Container.tsx`)
- Single shared container for all non-full-width content.
- max-width 1200px, padding clamp(24px, 4vw, 40px).
- Use for pages, sections, and individual components.
- Do NOT call this PageContainer — that name was rejected.
- Do not wrap ScrollHero, SiteHeader, or SiteFooter.

Full documentation: `/docs/ui-components.md`

## Typography Rules

- **All text in all components must use a Typography variant** — new and existing.
- Never hardcode font-family, font-size, letter-spacing, text-transform, or
  color on a text element anywhere in the codebase.
- If no existing variant fits, propose a new named variant rather than
  hardcoding values inline. Add it to `Typography.module.css` and the `Variant`
  type in `Typography.tsx`.
- Display variants (displayHero → sentName) use Jean-Luc (var(--font-sans)).
  All other variants use Georgia (var(--font-serif)).
- Do not use system-ui, Arial, Inter, or any font not in the token system.
- The `color` prop on `<Typography>` overrides the variant's default colour —
  use it when a specific element needs a different colour than the variant default.

## Routes

| Route      | Page                                                          |
| ---------- | ------------------------------------------------------------- |
| `/`        | Landing page                                                  |
| `/gallery` | Gallery page — all categories, KineticGrid                    |
| `/enquiry` | Enquiry form page — EnquiryForm with all fields pre-revealed  |

## Placeholder → Real Image Migration

Both `ImageCarousel` and `KineticGrid` support a `src` prop on each slide/photo config. When `src` is provided a real `<img>` renders; otherwise a coloured placeholder block is shown. Remove placeholder-only code paths once real images are wired in.
