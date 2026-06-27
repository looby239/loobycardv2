'use client';

import React from 'react';
import Template10 from './Template10';
import Template11 from './Template11';
import Template12 from './Template12';
import Template13 from './Template13';
import Template14 from './Template14';
import Template15 from './Template15';
import Template16 from './Template16';
import Template17 from './Template17';
import Template18 from './Template18';
import Template19 from './Template19';
import FloatingDecorations from './FloatingDecorations';

import { CardData } from '@/types/card';
import { DEFAULT_TEMPLATE_CONFIG, normalizeTemplateConfig, TemplateConfig } from '@/lib/templateConfig';

interface TemplateResolverProps {
  card: CardData;
  previewMode?: boolean;
  cssOverride?: string;
  templateConfig?: TemplateConfig;
  templateKey?: string;
}

function PlanRuleStyles() {
  return (
    <style>{`
      .template-plan-basic [class*="quote"],
      .template-plan-basic [class*="rsvp"],
      .template-plan-basic [class*="guestbook"],
      .template-plan-basic [id*="rsvp"],
      .template-plan-basic [id*="wishes"],
      .template-plan-basic a[href*="rsvp"] {
        display: none !important;
      }

      .template-plan-premium .footer-link,
      .template-plan-luxury .footer-link,
      .template-plan-premium a[href*="loobycard.com"],
      .template-plan-luxury a[href*="loobycard.com"] {
        display: none !important;
      }
    `}</style>
  );
}

function ConfiguredTemplateShell({
  config,
  children,
}: {
  config?: TemplateConfig;
  children: React.ReactNode;
}) {
  const normalizedConfig = config ? normalizeTemplateConfig(config) : DEFAULT_TEMPLATE_CONFIG;
  const backgroundImage = normalizedConfig.background.imageUrl;
  const showBackgroundImage = normalizedConfig.background.type === 'image' && backgroundImage;
  const galleryRadius = {
    none: '0px',
    small: '8px',
    medium: '16px',
    large: '24px',
    full: '999px',
  }[normalizedConfig.gallery.imageRadius];

  const galleryGap = {
    tight: '8px',
    medium: '14px',
    relaxed: '22px',
  }[normalizedConfig.gallery.spacing];

  return (
    <div
      className={`template-config-scope template-gallery-${normalizedConfig.gallery.layout}`}
      style={{
        '--primary-color': normalizedConfig.theme.primaryColor,
        '--secondary-color': normalizedConfig.theme.secondaryColor,
        '--background-color': normalizedConfig.theme.backgroundColor,
        '--text-color': normalizedConfig.theme.textColor,
        '--heading-font': normalizedConfig.theme.headingFont,
        '--body-font': normalizedConfig.theme.bodyFont,
        '--color-primary': normalizedConfig.theme.primaryColor,
        '--color-secondary': normalizedConfig.theme.secondaryColor,
        '--color-text': normalizedConfig.theme.textColor,
        '--bg-primary': normalizedConfig.theme.backgroundColor,
        '--bg-secondary': normalizedConfig.theme.secondaryColor,
        '--template-gallery-radius': galleryRadius,
        '--template-gallery-gap': galleryGap,
      } as React.CSSProperties}
    >
      <style>{`
        .template-config-scope {
          position: relative;
          min-height: 100vh;
          color: var(--text-color);
          font-family: var(--body-font), system-ui, sans-serif;
          background: var(--background-color);
        }

        .template-config-scope::before {
          content: '';
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          background:
            ${showBackgroundImage ? `linear-gradient(rgba(255,255,255,${normalizedConfig.background.overlayOpacity}), rgba(255,255,255,${normalizedConfig.background.overlayOpacity})), url("${backgroundImage}") center / cover no-repeat` : 'var(--background-color)'};
        }

        .template-config-scope > *:not(style) {
          position: relative;
          z-index: 1;
        }

        .template-config-scope .template-container,
        .template-config-scope .t10-wrapper,
        .template-config-scope .wedding-template {
          color: var(--text-color);
          font-family: var(--body-font), system-ui, sans-serif;
        }

        .template-config-scope h1,
        .template-config-scope h2,
        .template-config-scope h3,
        .template-config-scope .names,
        .template-config-scope .section-title {
          color: var(--primary-color);
          font-family: var(--heading-font), serif;
        }

        .template-config-scope .btn,
        .template-config-scope button[type="submit"] {
          background-color: var(--primary-color);
        }

        .template-config-scope .album img,
        .template-config-scope .gallery-img,
        .template-config-scope .hero-image {
          border-radius: var(--template-gallery-radius);
        }

        .template-config-scope.template-gallery-grid .album-swiper,
        .template-config-scope.template-gallery-masonry .album-swiper,
        .template-config-scope.template-gallery-filmstrip .album-swiper {
          overflow: visible !important;
        }

        .template-config-scope.template-gallery-grid .album-swiper .swiper-pagination,
        .template-config-scope.template-gallery-masonry .album-swiper .swiper-pagination,
        .template-config-scope.template-gallery-filmstrip .album-swiper .swiper-pagination {
          display: none !important;
        }

        .template-config-scope.template-gallery-grid .gallery-grid,
        .template-config-scope.template-gallery-grid .album-grid,
        .template-config-scope.template-gallery-grid .album-swiper .swiper-wrapper {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: var(--template-gallery-gap) !important;
          transform: none !important;
        }

        @media (min-width: 768px) {
          .template-config-scope.template-gallery-grid .gallery-grid,
          .template-config-scope.template-gallery-grid .album-grid,
          .template-config-scope.template-gallery-grid .album-swiper .swiper-wrapper {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
        }

        .template-config-scope.template-gallery-carousel .gallery-grid,
        .template-config-scope.template-gallery-carousel .album-grid,
        .template-config-scope.template-gallery-filmstrip .gallery-grid,
        .template-config-scope.template-gallery-filmstrip .album-grid,
        .template-config-scope.template-gallery-filmstrip .album-swiper .swiper-wrapper {
          display: flex !important;
          gap: var(--template-gallery-gap) !important;
          overflow-x: auto;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          padding-bottom: 10px;
          transform: none !important;
        }

        .template-config-scope.template-gallery-carousel .gallery-item,
        .template-config-scope.template-gallery-carousel .gallery-img,
        .template-config-scope.template-gallery-filmstrip .gallery-item,
        .template-config-scope.template-gallery-filmstrip .gallery-img,
        .template-config-scope.template-gallery-filmstrip .album-swiper .swiper-slide {
          flex: 0 0 min(74vw, 280px) !important;
          scroll-snap-align: center;
          width: min(74vw, 280px) !important;
          margin-right: 0 !important;
        }

        .template-config-scope.template-gallery-grid .album-swiper .swiper-slide {
          width: auto !important;
          margin-right: 0 !important;
        }

        .template-config-scope.template-gallery-filmstrip .gallery-grid,
        .template-config-scope.template-gallery-filmstrip .album-grid,
        .template-config-scope.template-gallery-filmstrip .album-swiper .swiper-wrapper {
          align-items: stretch;
        }

        .template-config-scope.template-gallery-masonry .gallery-grid,
        .template-config-scope.template-gallery-masonry .album-grid,
        .template-config-scope.template-gallery-masonry .album-swiper .swiper-wrapper {
          display: block !important;
          columns: 220px 3;
          column-gap: var(--template-gallery-gap);
          transform: none !important;
        }

        .template-config-scope.template-gallery-masonry .gallery-item,
        .template-config-scope.template-gallery-masonry .gallery-img,
        .template-config-scope.template-gallery-masonry .album-swiper .swiper-slide {
          display: block;
          width: 100% !important;
          break-inside: avoid;
          margin-bottom: var(--template-gallery-gap);
          margin-right: 0 !important;
        }

        .template-config-scope.template-gallery-masonry .album-swiper .swiper-slide > div,
        .template-config-scope.template-gallery-grid .album-swiper .swiper-slide > div,
        .template-config-scope.template-gallery-filmstrip .album-swiper .swiper-slide > div {
          padding-bottom: 0 !important;
          height: 100%;
        }
      `}</style>

      {normalizedConfig.decorations.cornerOrnament.enabled && (
        <div className="template-corner-ornaments" aria-hidden="true">
          {[
            ['top-left', normalizedConfig.decorations.cornerOrnament.topLeftUrl],
            ['top-right', normalizedConfig.decorations.cornerOrnament.topRightUrl],
            ['bottom-left', normalizedConfig.decorations.cornerOrnament.bottomLeftUrl],
            ['bottom-right', normalizedConfig.decorations.cornerOrnament.bottomRightUrl],
          ].map(([position, url]) => url ? (
            <img
              key={position}
              src={url}
              alt=""
              style={{
                position: 'fixed',
                zIndex: 9,
                pointerEvents: 'none',
                width: 'min(24vw, 150px)',
                opacity: 0.85,
                ...(position.includes('top') ? { top: 12 } : { bottom: 12 }),
                ...(position.includes('left') ? { left: 12 } : { right: 12 }),
              }}
            />
          ) : null)}
        </div>
      )}

      {normalizedConfig.decorations.fallingLeaves.enabled && (
        <FloatingDecorations
          type="leaf"
          imageUrl={normalizedConfig.decorations.fallingLeaves.imageUrl}
          count={normalizedConfig.decorations.fallingLeaves.count}
          speed={normalizedConfig.decorations.fallingLeaves.speed}
          opacity={normalizedConfig.decorations.fallingLeaves.opacity}
        />
      )}

      {normalizedConfig.decorations.floatingFlowers.enabled && (
        <FloatingDecorations
          type="flower"
          imageUrl={normalizedConfig.decorations.floatingFlowers.imageUrl}
          count={normalizedConfig.decorations.floatingFlowers.count}
          speed={normalizedConfig.decorations.floatingFlowers.speed}
          opacity={normalizedConfig.decorations.floatingFlowers.opacity}
        />
      )}

      {children}
    </div>
  );
}

export default function TemplateResolver({ card, previewMode = false, cssOverride, templateConfig, templateKey }: TemplateResolverProps) {
  const templateId = templateKey || card.template_id || 'template-10';
  const planClass = `template-plan-${card.plan_id || 'basic'}`;

  const renderedTemplate = (() => {
    switch (templateId) {
      case 'template-10':
        return <Template10 card={card} previewMode={previewMode} />;
      case 'template-11':
        return <Template11 card={card} previewMode={previewMode} />;
      case 'template-12':
        return <Template12 card={card} previewMode={previewMode} />;
      case 'template-13':
        return <Template13 card={card} previewMode={previewMode} />;
      case 'template-14':
        return <Template14 card={card} previewMode={previewMode} />;
      case 'template-15':
        return <Template15 card={card} previewMode={previewMode} />;
      case 'template-16':
        return <Template16 card={card} previewMode={previewMode} />;
      case 'template-17':
        return <Template17 card={card} previewMode={previewMode} />;
      case 'template-18':
        return <Template18 card={card} previewMode={previewMode} />;
      case 'template-19':
        return <Template19 card={card} previewMode={previewMode} />;
      default:
        return <Template10 card={card} previewMode={previewMode} />;
    }
  })();

  return (
    <>
      <PlanRuleStyles />
      {/* Inject admin CSS overrides as a scoped <style> block */}
      {cssOverride && cssOverride.trim() && (
        <style dangerouslySetInnerHTML={{ __html: cssOverride }} />
      )}
      <div className={`template-plan-rules ${planClass}`}>
        {templateConfig ? (
          <ConfiguredTemplateShell config={templateConfig}>
            {renderedTemplate}
          </ConfiguredTemplateShell>
        ) : renderedTemplate}
      </div>
    </>
  );
}
