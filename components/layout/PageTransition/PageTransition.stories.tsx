/**
 * PageTransition.stories.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * SETUP
 * npm install framer-motion
 * Add to .storybook/preview.ts:
 *   import '../src/styles/tokens.css'
 *
 * TESTING TRANSITIONS IN STORYBOOK
 * Route changes can't be simulated directly. Instead each story
 * exposes a "Trigger transition" button via a play function that
 * re-mounts the content — this exercises the AnimatePresence cycle.
 *
 * The overlay animations (diagonalWipe, stripReveal) are triggered by
 * incrementing the trigger prop — the play functions simulate this.
 *
 * FOR REAL ROUTE TESTING
 * Add PageTransition to app/layout.tsx and navigate between pages
 * in the browser. The transitions are designed to be tested in context.
 *
 * WHICH VARIANT TO USE
 * Start with one variant in layout.tsx. The others are ready when needed.
 * Recommended starting point: diagonalWipe — most distinctive on first
 * visit while remaining subtle on subsequent navigation.
 */

import type { Meta, StoryObj } from '@storybook/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import PageTransition, { type TransitionVariant } from './PageTransition'

// ─── Fake page content ────────────────────────────────────────────────────────

const PAGE_COLOURS: Record<string, string> = {
  Landing: '#14141f',
  Gallery: '#111a11',
  Enquiry: '#13111a',
}

function FakePage({ name }: { name: string }) {
  return (
    <div style={{
      background: PAGE_COLOURS[name] ?? '#16161D',
      padding: '32px 28px 48px',
      minHeight: '280px',
    }}>
      {/* Mini header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{
          fontFamily: 'system-ui', fontWeight: '700',
          fontSize: '11px', letterSpacing: '0.2em',
          textTransform: 'uppercase', color: '#F2F2FC',
          marginBottom: '6px',
        }}>P!nga</div>
        <div style={{ display: 'flex', gap: '14px' }}>
          {['Gallery','Enquire'].map(l => (
            <span key={l} style={{
              fontFamily: 'Georgia, serif', fontSize: '8px',
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: 'rgba(179,179,186,0.65)',
            }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Content sim */}
      <div style={{
        height: '160px', background: 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'system-ui', fontWeight: '700',
          fontSize: 'clamp(20px,4vw,40px)',
          color: 'rgba(255,255,255,0.07)', letterSpacing: '-0.01em',
        }}>{name}</span>
      </div>
    </div>
  )
}

// ─── Interactive demo wrapper ─────────────────────────────────────────────────
// Simulates route changes by cycling through fake pages

function TransitionDemo({ variant }: { variant: TransitionVariant }) {
  const pages = ['Landing', 'Gallery', 'Enquiry']
  const [index, setIndex] = useState(0)
  const [key, setKey] = useState(0)

  function next() {
    setIndex(i => (i + 1) % pages.length)
    setKey(k => k + 1)
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <div style={{
        background: 'rgba(20,20,28,0.98)',
        borderBottom: '1px solid rgba(242,242,252,0.08)',
        padding: '12px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <span style={{
          fontFamily: 'Georgia, serif', fontSize: '8px',
          letterSpacing: '0.2em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.28)',
        }}>
          Variant: {variant}
        </span>
        <button
          onClick={next}
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: '0', outline: 'none', cursor: 'pointer',
            fontFamily: 'Georgia, serif', fontSize: '8px',
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.6)', padding: '5px 10px',
          }}
        >
          Navigate → {pages[(index + 1) % pages.length]}
        </button>
      </div>

      {/* Transition wrapper with simulated key change */}
      {/* 
        Note: In the real app, PageTransition uses usePathname internally.
        Here we drive it with a key change to simulate route transitions.
      */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={key}
            initial={variant === 'liftSlide'
              ? { opacity: 0, y: 16 }
              : { opacity: 0 }
            }
            animate={variant === 'liftSlide'
              ? { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22,1,0.36,1] } }
              : { opacity: 1, transition: { duration: 0.3, delay: 0.1 } }
            }
            exit={variant === 'liftSlide'
              ? { opacity: 0, y: -8, x: -20, transition: { duration: 0.22 } }
              : { opacity: 0, transition: { duration: 0.15 } }
            }
          >
            <FakePage name={pages[index]} />
          </motion.div>
        </AnimatePresence>

        {/* Diagonal panel */}
        {variant === 'diagonalWipe' && (
          <DiagonalWipeDemoOverlay trigger={key} />
        )}

        {/* Strip overlay */}
        {variant === 'stripReveal' && (
          <StripRevealDemoOverlay trigger={key} />
        )}
      </div>
    </div>
  )
}

// Inline demo overlays — mirror the real component logic
function DiagonalWipeDemoOverlay({ trigger }: { trigger: number }) {
  const [clipPath, setClipPath] = useState('polygon(0 0, 0 0, 0 100%, 0 100%)')
  const [transitioning, setTransitioning] = useState('')

  const prevTrigger = useState(0)

  useState(() => {
    if (trigger === 0) return
    async function play() {
      setTransitioning('340ms cubic-bezier(0.76, 0, 0.24, 1)')
      setClipPath('polygon(0 0, 110% 0, 100% 100%, 0 100%)')
      await new Promise(r => setTimeout(r, 360))
      setClipPath('polygon(110% 0, 110% 0, 100% 100%, 110% 100%)')
      await new Promise(r => setTimeout(r, 360))
      setTransitioning('')
      setClipPath('polygon(0 0, 0 0, 0 100%, 0 100%)')
    }
    play()
  })

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: '#2a2a3a',
        clipPath,
        transition: transitioning ? `clip-path ${transitioning}` : 'none',
      }} />
    </div>
  )
}

function StripRevealDemoOverlay({ trigger }: { trigger: number }) {
  const refs = Array.from({ length: 5 }, () => useState<HTMLDivElement | null>(null))

  // Strips via CSS animation using trigger as key
  return (
    <AnimatePresence>
      {trigger > 0 && (
        <div
          key={'strips-' + trigger}
          style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none', overflow: 'hidden' }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute', top: 0, bottom: 0,
                left: `${(i / 5) * 100}%`,
                width: `${(1/5) * 100 + 0.4}%`,
                background: '#2a2a3a',
              }}
              initial={{ y: 0 }}
              animate={{ y: '-101%' }}
              transition={{
                duration: 0.42,
                ease: [0.76, 0, 0.24, 1],
                delay: i * 0.055,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}

// ─── Meta ────────────────────────────────────────────────────────────────────

const meta: Meta<typeof PageTransition> = {
  title:     'P!nga / Layout / PageTransition',
  component:  PageTransition,
  tags:      ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Client wrapper for Next.js App Router page transitions using Framer Motion.

**Installation**
\`\`\`bash
npm install framer-motion
\`\`\`

**Usage in app/layout.tsx**
\`\`\`tsx
import PageTransition from '@/components/layout/PageTransition'

export default function RootLayout({ children }) {
  return (
    <html><body>
      <SiteHeader />
      <PageTransition variant="diagonalWipe">
        {children}
      </PageTransition>
      <SiteFooter />
    </body></html>
  )
}
\`\`\`

**Variants**
- \`liftSlide\` — fade + translateY. Pure Framer Motion, no overlay.
- \`diagonalWipe\` — #2a2a3a panel sweeps left→right with diagonal edge.
- \`stripReveal\` — 5 strips slide upward with stagger. Mirrors KineticGrid language.

**Wipe colour:** \`#2a2a3a\` — slightly lifted from the page background. Enough contrast to register without jarring.

**Start with one variant.** All three are exported and ready. Switch by changing the \`variant\` prop in layout.tsx.
        `.trim(),
      },
    },
  },
  decorators: [
    Story => (
      <div style={{ background: '#16161D' }}>
        <Story />
      </div>
    ),
  ],
}

export default meta
type Story = StoryObj<typeof PageTransition>

// ─── Stories ─────────────────────────────────────────────────────────────────

/**
 * Lift + Slide — fade out left/up, new page lifts in from below.
 * Click "Navigate" to trigger.
 */
export const LiftSlide: Story = {
  name: 'Lift + Slide',
  render: () => <TransitionDemo variant="liftSlide" />,
  parameters: {
    docs: {
      description: {
        story: 'Pure Framer Motion variants — no overlay. Clean and fast. Best for sites where subtlety is the priority.',
      },
    },
  },
}

/**
 * Diagonal Wipe — #2a2a3a panel sweeps left→right with a diagonal edge.
 * Click "Navigate" to trigger.
 */
export const DiagonalWipe: Story = {
  name: 'Diagonal Wipe',
  render: () => <TransitionDemo variant="diagonalWipe" />,
  parameters: {
    docs: {
      description: {
        story: 'A dark panel with a hard diagonal edge sweeps across. Film-like and editorial. The diagonal adds energy without being aggressive.',
      },
    },
  },
}

/**
 * Strip Reveal — 5 vertical strips slide upward with stagger.
 * Click "Navigate" to trigger.
 */
export const StripReveal: Story = {
  name: 'Strip Reveal',
  render: () => <TransitionDemo variant="stripReveal" />,
  parameters: {
    docs: {
      description: {
        story: 'Five vertical strips slide upward with a stagger, revealing the new page beneath. Direct visual language from the KineticGrid column wipes — the site\'s own motion system.',
      },
    },
  },
}
