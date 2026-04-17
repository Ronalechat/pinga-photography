'use client'

export default function SkipLink() {
  return (
    <a
      href="#main-content"
      style={{
        position: 'absolute', top: '-100%', left: 0, zIndex: 9999,
        padding: '8px 16px',
        background: 'var(--color-bg-primary)',
        color: 'var(--color-text-primary)',
        fontFamily: 'var(--font-serif)',
        fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase',
      }}
      onFocus={e => { e.currentTarget.style.top = '0' }}
      onBlur={e => { e.currentTarget.style.top = '-100%' }}
    >
      Skip to content
    </a>
  )
}
