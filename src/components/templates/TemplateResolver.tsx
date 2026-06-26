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

import { CardData } from '@/types/card';

interface TemplateResolverProps {
  card: CardData;
  previewMode?: boolean;
  cssOverride?: string;
}

export default function TemplateResolver({ card, previewMode = false, cssOverride }: TemplateResolverProps) {
  const templateId = card.template_id || 'template-10';

  return (
    <>
      {/* Inject admin CSS overrides as a scoped <style> block */}
      {cssOverride && cssOverride.trim() && (
        <style dangerouslySetInnerHTML={{ __html: cssOverride }} />
      )}
      {(() => {
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
      })()}
    </>
  );
}
