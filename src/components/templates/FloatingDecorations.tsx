'use client';

import React from 'react';

type DecorationSpeed = 'slow' | 'medium' | 'fast';

interface FloatingDecorationsProps {
  type: 'leaf' | 'flower';
  imageUrl?: string;
  count?: number;
  speed?: DecorationSpeed;
  opacity?: number;
}

const DEFAULT_ASSETS = {
  leaf: '/assets/images/template-16/la2.webp',
  flower: '/assets/images/template-11/hoa.webp',
};

const SPEED_DURATION: Record<DecorationSpeed, number> = {
  slow: 18,
  medium: 12,
  fast: 8,
};

function valueFor(index: number, multiplier: number, offset = 0) {
  return (index * multiplier + offset) % 100;
}

export default function FloatingDecorations({
  type,
  imageUrl,
  count = 12,
  speed = 'medium',
  opacity = 0.7,
}: FloatingDecorationsProps) {
  const safeCount = Math.max(0, Math.min(count, 50));
  const assetUrl = imageUrl || DEFAULT_ASSETS[type];
  const duration = SPEED_DURATION[speed] || SPEED_DURATION.medium;
  const mobileCount = Math.ceil(safeCount * 0.55);

  if (!safeCount) return null;

  return (
    <div className={`floating-decorations floating-decorations-${type}`} aria-hidden="true">
      <style>{`
        .floating-decorations {
          position: fixed;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
          z-index: 8;
        }

        .floating-decoration-item {
          position: absolute;
          top: -12vh;
          width: var(--decor-size);
          height: var(--decor-size);
          opacity: var(--decor-opacity);
          background-image: var(--decor-image);
          background-size: contain;
          background-position: center;
          background-repeat: no-repeat;
          animation:
            templateDecorFall var(--decor-duration) linear infinite,
            templateDecorSway calc(var(--decor-duration) * 0.55) ease-in-out infinite alternate;
          animation-delay: var(--decor-delay);
          transform: translate3d(0, 0, 0) rotate(var(--decor-rotation));
          will-change: transform;
        }

        @keyframes templateDecorFall {
          0% { transform: translate3d(0, -12vh, 0) rotate(var(--decor-rotation)); }
          100% { transform: translate3d(var(--decor-drift), 112vh, 0) rotate(calc(var(--decor-rotation) + 220deg)); }
        }

        @keyframes templateDecorSway {
          0% { margin-left: -16px; }
          100% { margin-left: 16px; }
        }

        @media (max-width: 640px) {
          .floating-decoration-item:nth-child(n + ${mobileCount + 1}) {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-decoration-item {
            animation: none;
            display: none;
          }
        }
      `}</style>

      {Array.from({ length: safeCount }).map((_, index) => {
        const left = valueFor(index, 37, type === 'leaf' ? 5 : 13);
        const size = type === 'leaf'
          ? 18 + (valueFor(index, 11) % 24)
          : 20 + (valueFor(index, 13) % 28);
        const delay = -1 * (valueFor(index, 19) / 100) * duration;
        const drift = (valueFor(index, 29) - 50) * 1.2;
        const rotation = valueFor(index, 53);

        return (
          <span
            key={`${type}-${index}`}
            className="floating-decoration-item"
            style={{
              left: `${left}%`,
              '--decor-size': `${size}px`,
              '--decor-opacity': opacity,
              '--decor-image': `url("${assetUrl}")`,
              '--decor-duration': `${duration + (index % 5)}s`,
              '--decor-delay': `${delay}s`,
              '--decor-drift': `${drift}px`,
              '--decor-rotation': `${rotation}deg`,
            } as React.CSSProperties}
          />
        );
      })}
    </div>
  );
}
