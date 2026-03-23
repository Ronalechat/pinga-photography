import React from 'react'
import styles from './Typography.module.css'

type Variant =
  | 'displayHero' | 'displayLarge' | 'displayMedium' | 'displayThin'
  | 'headingMedium' | 'displaySlide'
  | 'eyebrow' | 'body' | 'bodyLarge' | 'caption' | 'label' | 'navLink'
  | 'meta'

const DEFAULT_ELEMENT: Record<Variant, React.ElementType> = {
  displayHero:   'h1',
  displayLarge:  'h1',
  displayMedium: 'h2',
  displayThin:   'h2',
  headingMedium: 'h2',
  displaySlide:  'span',
  eyebrow:       'span',
  body:          'p',
  bodyLarge:     'p',
  caption:       'span',
  label:         'span',
  navLink:       'span',
  meta:          'span',
}

export interface TypographyProps {
  variant: Variant
  as?: React.ElementType
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
  color?: string
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  function Typography({ variant, as, children, className, style, color }, ref) {
    const Tag = as ?? DEFAULT_ELEMENT[variant]
    return (
      <Tag
        ref={ref}
        className={[styles[variant], className].filter(Boolean).join(' ')}
        style={{ color, ...style }}
      >
        {children}
      </Tag>
    )
  }
)

export default Typography
