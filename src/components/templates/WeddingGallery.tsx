'use client';

import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

import type { TemplateGalleryLayout } from '@/lib/templateConfig';

interface WeddingGalleryProps {
  images: string[];
  layout?: TemplateGalleryLayout;
  imageRadius?: 'none' | 'small' | 'medium' | 'large' | 'full';
  spacing?: 'tight' | 'medium' | 'relaxed';
  onImageClick?: (imageUrl: string, index: number) => void;
}

const radiusClass = {
  none: '0',
  small: '8px',
  medium: '16px',
  large: '24px',
  full: '999px',
};

const gapClass = {
  tight: '8px',
  medium: '14px',
  relaxed: '22px',
};

export default function WeddingGallery({
  images,
  layout = 'grid',
  imageRadius = 'medium',
  spacing = 'medium',
  onImageClick,
}: WeddingGalleryProps) {
  const safeImages = images.filter(Boolean);
  const radius = radiusClass[imageRadius];
  const gap = gapClass[spacing];

  if (safeImages.length === 0) return null;

  const renderImage = (imageUrl: string, index: number, className = '') => (
    <img
      key={`${imageUrl}-${index}`}
      src={imageUrl}
      alt={`Wedding gallery ${index + 1}`}
      loading="lazy"
      className={className}
      onClick={() => onImageClick?.(imageUrl, index)}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        borderRadius: radius,
        cursor: onImageClick ? 'pointer' : 'default',
      }}
    />
  );

  if (layout === 'carousel') {
    const hasMultiple = safeImages.length > 1;
    return (
      <Swiper
        modules={[Pagination, Autoplay]}
        spaceBetween={parseInt(gap, 10)}
        slidesPerView={hasMultiple ? 1.25 : 1}
        centeredSlides={hasMultiple}
        loop={hasMultiple}
        pagination={{ clickable: true }}
        autoplay={hasMultiple ? { delay: 3200, disableOnInteraction: false } : false}
      >
        {safeImages.map((imageUrl, index) => (
          <SwiperSlide key={`${imageUrl}-${index}`}>
            <div style={{ aspectRatio: '4 / 5', paddingBottom: 28 }}>
              {renderImage(imageUrl, index)}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    );
  }

  if (layout === 'masonry') {
    return (
      <div style={{ columns: '220px 3', columnGap: gap }}>
        {safeImages.map((imageUrl, index) => (
          <div key={`${imageUrl}-${index}`} style={{ breakInside: 'avoid', marginBottom: gap }}>
            {renderImage(imageUrl, index, 'template-gallery-masonry-img')}
          </div>
        ))}
      </div>
    );
  }

  if (layout === 'filmstrip') {
    return (
      <div style={{ display: 'flex', gap, overflowX: 'auto', paddingBottom: 8, scrollSnapType: 'x mandatory' }}>
        {safeImages.map((imageUrl, index) => (
          <div
            key={`${imageUrl}-${index}`}
            style={{ flex: '0 0 min(72vw, 280px)', aspectRatio: '4 / 5', scrollSnapAlign: 'center' }}
          >
            {renderImage(imageUrl, index)}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 45%), 1fr))',
        gap,
      }}
    >
      {safeImages.map((imageUrl, index) => (
        <div key={`${imageUrl}-${index}`} style={{ aspectRatio: '4 / 5' }}>
          {renderImage(imageUrl, index)}
        </div>
      ))}
    </div>
  );
}
