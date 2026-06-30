'use client';

import React, { useEffect, useState, useRef } from 'react';
import TemplateResolver from '@/components/templates/TemplateResolver';
import { mergeTemplateSample } from '@/lib/templateSampleData';
import { normalizeTemplateConfig, type TemplateConfig } from '@/lib/templateConfig';
import type { CardData } from '@/types/card';

// Custom CSS class styles for inspector highlighting inside the iframe
const INSPECTOR_STYLES = `
  .lab-hovered {
    outline: 2px dashed #4f46e5 !important;
    outline-offset: -2px !important;
    cursor: pointer !important;
  }
  .lab-selected {
    outline: 3px solid #4f46e5 !important;
    outline-offset: -3px !important;
    background-color: rgba(79, 70, 229, 0.15) !important;
  }
`;

function getUniqueSelector(el: HTMLElement): string {
  if (el.id) {
    return `#${el.id}`;
  }

  // Filter out inspector-specific classes and responsive prefix classes to get clean styling targets
  const classes = Array.from(el.classList).filter(c => {
    return !c.startsWith('hover:') &&
           !c.startsWith('focus:') &&
           !c.startsWith('active:') &&
           !c.startsWith('lab-') &&
           c !== 'lab-hovered' &&
           c !== 'lab-selected';
  });

  if (classes.length > 0) {
    // Prefer matching standard layouts like names, title, text, etc.
    const meaningfulClass = classes.find(c => 
      c.includes('title') || 
      c.includes('name') || 
      c.includes('btn') || 
      c.includes('button') || 
      c.includes('text') || 
      c.includes('section') || 
      c.includes('hero') ||
      c.includes('gallery') ||
      c.includes('date') ||
      c.includes('time') ||
      c.includes('address') ||
      c.includes('card')
    );
    if (meaningfulClass) {
      return `.${meaningfulClass}`;
    }
    return `.${classes[0]}`;
  }

  const parent = el.parentElement;
  if (parent && parent.tagName.toLowerCase() !== 'body') {
    const parentSelector = getUniqueSelector(parent as HTMLElement);
    return `${parentSelector} > ${el.tagName.toLowerCase()}`;
  }

  return el.tagName.toLowerCase();
}

export default function TemplateLabPreviewPage() {
  const [templateId, setTemplateId] = useState('template-10');
  const [card, setCard] = useState<CardData | null>(null);
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig | undefined>(undefined);
  const [cssOverride, setCssOverride] = useState('');
  const [inspectMode, setInspectMode] = useState(false);

  const inspectModeRef = useRef(inspectMode);
  inspectModeRef.current = inspectMode;

  // Initialize from query parameters
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const tid = params.get('template_id') || 'template-10';
    setTemplateId(tid);
    setCard(mergeTemplateSample(tid));

    const cfgParam = params.get('config');
    if (cfgParam) {
      try {
        setTemplateConfig(normalizeTemplateConfig(JSON.parse(decodeURIComponent(cfgParam))));
      } catch (e) {
        console.warn('Failed to parse initial template config:', e);
      }
    }
  }, []);

  // Listen to postMessage updates from parent
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'UPDATE_PREVIEW':
          if (data.templateId) {
            setTemplateId(data.templateId);
          }
          if (data.card) {
            setCard(data.card);
          }
          if (data.config) {
            setTemplateConfig(normalizeTemplateConfig(data.config));
          }
          if (data.cssOverride !== undefined) {
            setCssOverride(data.cssOverride);
          }
          break;
        case 'SET_INSPECT_MODE':
          setInspectMode(!!data.enabled);
          // Clean up any hover classes immediately if disabling
          if (!data.enabled) {
            document.querySelectorAll('.lab-hovered').forEach(el => el.classList.remove('lab-hovered'));
            document.querySelectorAll('.lab-selected').forEach(el => el.classList.remove('lab-selected'));
          }
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Inspect mode event handler setup
  useEffect(() => {
    const handleMouseOver = (e: MouseEvent) => {
      if (!inspectModeRef.current) return;
      const target = e.target as HTMLElement;
      if (!target || target === document.body || target === document.documentElement) return;
      
      // Avoid targeting floating leaves container, styles tags, etc.
      if (target.closest('.floating-decorations') || target.tagName === 'STYLE') return;

      target.classList.add('lab-hovered');
    };

    const handleMouseOut = (e: MouseEvent) => {
      if (!inspectModeRef.current) return;
      const target = e.target as HTMLElement;
      if (target) {
        target.classList.remove('lab-hovered');
      }
    };

    const handleMouseClick = (e: MouseEvent) => {
      if (!inspectModeRef.current) return;
      const target = e.target as HTMLElement;
      if (!target || target === document.body || target === document.documentElement) return;

      if (target.closest('.floating-decorations') || target.tagName === 'STYLE') return;

      e.preventDefault();
      e.stopPropagation();

      // Clear previous selection
      document.querySelectorAll('.lab-selected').forEach(el => el.classList.remove('lab-selected'));
      
      // Mark current selection
      target.classList.add('lab-selected');

      // Generate selector
      const selector = getUniqueSelector(target);

      // Extract a set of useful computed styles to pre-populate inputs
      const computed = window.getComputedStyle(target);
      const extractedStyles: Record<string, string> = {};
      const propertiesToExtract = [
        'font-family', 'font-size', 'font-weight', 'color', 'line-height',
        'background-color', 'background-image',
        'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
        'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
        'border-radius', 'box-shadow', 'opacity', 'transform'
      ];
      
      propertiesToExtract.forEach(prop => {
        extractedStyles[prop] = computed.getPropertyValue(prop);
      });

      // Send inspector event to parent
      window.parent.postMessage({
        type: 'INSPECT_ELEMENT',
        elementId: target.id || '',
        tagName: target.tagName.toLowerCase(),
        className: target.className || '',
        selector,
        styles: extractedStyles,
      }, '*');
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleMouseClick, true); // Use capture phase to intercept

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleMouseClick, true);
    };
  }, []);

  if (!card) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#fafafa', fontFamily: 'sans-serif' }}>
        Loading Preview Card...
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: INSPECTOR_STYLES }} />
      <TemplateResolver
        card={card}
        previewMode={true}
        cssOverride={cssOverride}
        templateKey={templateId}
        templateConfig={templateConfig}
      />
    </>
  );
}
