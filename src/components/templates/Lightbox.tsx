'use client';

import React, { useEffect, useState } from 'react';
import '@/styles/templates/lightbox.css';

interface LightboxProps {
  currentImage: string | null;
  images: string[];
  onClose: () => void;
  onNavigate: (imageUrl: string) => void;
}

export default function Lightbox({
  currentImage,
  images,
  onClose,
  onNavigate,
}: LightboxProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Filter unique images and exclude null/undefined/empty strings
  const uniqueImages = Array.from(new Set(images.filter(Boolean)));

  // If currentImage is not in uniqueImages, append it (e.g. dynamic QRs or newly loaded images)
  if (currentImage && !uniqueImages.includes(currentImage)) {
    uniqueImages.push(currentImage);
  }

  const currentIndex = currentImage ? uniqueImages.indexOf(currentImage) : -1;
  const hasMultiple = uniqueImages.length > 1;

  const handlePrev = () => {
    if (currentIndex === -1 || !hasMultiple) return;
    const prevIndex = (currentIndex - 1 + uniqueImages.length) % uniqueImages.length;
    onNavigate(uniqueImages[prevIndex]);
  };

  const handleNext = () => {
    if (currentIndex === -1 || !hasMultiple) return;
    const nextIndex = (currentIndex + 1) % uniqueImages.length;
    onNavigate(uniqueImages[nextIndex]);
  };

  // Keyboard navigation
  useEffect(() => {
    if (!currentImage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentImage, currentIndex, uniqueImages]);

  // Prevent background scrolling
  useEffect(() => {
    if (currentImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [currentImage]);

  if (!currentImage) return null;

  // Touch handlers for swipe support
  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  );

  const ChevronLeft = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  );

  const ChevronRight = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  );

  return (
    <div
      className={`premium-lightbox-overlay active`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="premium-lightbox-container" onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}>
        {/* Close Button */}
        <button
          className="premium-lightbox-close"
          onClick={onClose}
          aria-label="Close lightbox"
        >
          <CloseIcon />
        </button>

        {/* Counter */}
        {hasMultiple && currentIndex !== -1 && (
          <div className="premium-lightbox-counter">
            {currentIndex + 1} / {uniqueImages.length}
          </div>
        )}

        {/* Previous Button */}
        {hasMultiple && (
          <button
            className="premium-lightbox-btn prev"
            onClick={handlePrev}
            aria-label="Previous image"
          >
            <ChevronLeft />
          </button>
        )}

        {/* Image Content */}
        <div
          className="premium-lightbox-content"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <img
            src={currentImage}
            alt={`Enlarged wedding photo ${currentIndex + 1}`}
            className="premium-lightbox-img"
            onClick={(e) => {
              e.stopPropagation();
            }}
          />
        </div>

        {/* Next Button */}
        {hasMultiple && (
          <button
            className="premium-lightbox-btn next"
            onClick={handleNext}
            aria-label="Next image"
          >
            <ChevronRight />
          </button>
        )}
      </div>
    </div>
  );
}
