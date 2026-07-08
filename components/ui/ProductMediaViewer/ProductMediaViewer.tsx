'use client'

import { useId, useRef, useState } from 'react'
import Typography from '@/components/ui/Typography/Typography'
import type { ProductMediaImage } from '@/lib/media/types'
import utilStyles from '@/styles/utility.module.css'
import styles from './ProductMediaViewer.module.css'

export type { ProductMediaImage }

export interface ProductMediaViewerProps {
  images?: ProductMediaImage[]
  label: string
  className?: string
  initialIndex?: number
}

export default function ProductMediaViewer({
  images = [],
  label,
  className,
  initialIndex = 0,
}: ProductMediaViewerProps) {
  const boundedInitialIndex = images.length > 0
    ? Math.min(Math.max(initialIndex, 0), images.length - 1)
    : 0
  const [activeImage, setActiveImage] = useState(boundedInitialIndex)
  const touchStartXRef = useRef<number | null>(null)
  const swipeHandledRef = useRef(false)
  const instructionsId = useId()
  const selectedImage = images[activeImage]
  const hasMultipleImages = images.length > 1

  function showImage(direction: 'previous' | 'next') {
    if (!hasMultipleImages) return
    setActiveImage((current) => (
      direction === 'next'
        ? (current + 1) % images.length
        : (current - 1 + images.length) % images.length
    ))
  }

  function handleImageNavClick(direction: 'previous' | 'next') {
    if (swipeHandledRef.current) {
      swipeHandledRef.current = false
      return
    }

    showImage(direction)
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    touchStartXRef.current = e.touches[0]?.clientX ?? null
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    const startX = touchStartXRef.current
    touchStartXRef.current = null
    if (startX === null) return

    const endX = e.changedTouches[0]?.clientX
    if (endX === undefined) return

    const deltaX = endX - startX
    if (Math.abs(deltaX) < 40) return

    swipeHandledRef.current = true
    showImage(deltaX > 0 ? 'next' : 'previous')
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (!hasMultipleImages) return

    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      showImage('previous')
    }

    if (e.key === 'ArrowRight') {
      e.preventDefault()
      showImage('next')
    }
  }

  return (
    <div className={[styles.root, className ?? ''].filter(Boolean).join(' ')}>
      <div
        className={styles.imageFrame}
        role="group"
        aria-label={`${label} images`}
        aria-describedby={hasMultipleImages ? instructionsId : undefined}
        tabIndex={hasMultipleImages ? 0 : undefined}
        onKeyDown={handleKeyDown}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {selectedImage?.src ? (
          <img
            src={selectedImage.src}
            alt={selectedImage.alt || label}
            className={utilStyles.imgBlock}
            loading="eager"
            decoding="async"
            draggable={false}
          />
        ) : (
          <div className={styles.placeholder}>
            <Typography variant="eyebrow">{label}</Typography>
          </div>
        )}

        {hasMultipleImages && (
          <>
            <button
              type="button"
              className={`${styles.imageNav} ${styles.imageNavPrevious}`}
              onClick={() => handleImageNavClick('previous')}
              aria-label="Show previous product image"
            />
            <button
              type="button"
              className={`${styles.imageNav} ${styles.imageNavNext}`}
              onClick={() => handleImageNavClick('next')}
              aria-label="Show next product image"
            />
          </>
        )}
      </div>

      {hasMultipleImages && (
        <>
          <Typography variant="caption" as="p" id={instructionsId} className={styles.instructions}>
            Use arrow keys, swipe, or select a thumbnail to view product images.
          </Typography>
          <div className={styles.thumbnails} aria-label="Product images">
            {images.map((image, index) => (
              <button
                key={`${image.src}-${index}`}
                type="button"
                className={[
                  styles.thumbnail,
                  index === activeImage ? styles.thumbnailActive : '',
                ].filter(Boolean).join(' ')}
                onClick={() => setActiveImage(index)}
                aria-label={`Show image ${index + 1}`}
                aria-pressed={index === activeImage}
              >
                <img
                  src={image.src}
                  alt=""
                  className={utilStyles.imgBlock}
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
