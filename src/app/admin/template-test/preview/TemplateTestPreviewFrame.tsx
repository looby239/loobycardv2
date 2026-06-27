'use client';

import { useEffect } from 'react';
import TemplateResolver from '@/components/templates/TemplateResolver';
import type { TemplateConfig } from '@/lib/templateConfig';
import type { CardData } from '@/types/card';

interface TemplateTestPreviewFrameProps {
  card: CardData;
  cssOverride?: string;
  templateKey: string;
  templateConfig?: TemplateConfig;
}

function getFetchPath(input: Parameters<typeof fetch>[0]) {
  const rawUrl = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.toString()
      : input.url;
  return new URL(rawUrl, window.location.origin).pathname;
}

function getFetchMethod(input: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) {
  const inputMethod = typeof input === 'string' || input instanceof URL ? 'GET' : input.method;
  return (init?.method || inputMethod).toUpperCase();
}

export default function TemplateTestPreviewFrame({
  card,
  cssOverride,
  templateKey,
  templateConfig,
}: TemplateTestPreviewFrameProps) {
  useEffect(() => {
    const originalFetch = window.fetch.bind(window);

    window.fetch = (async (input, init) => {
      const pathname = getFetchPath(input);
      const method = getFetchMethod(input, init);

      if ((pathname === '/api/rsvp' || pathname === '/api/guestbook') && method !== 'GET') {
        return new Response(JSON.stringify({ success: true, mock: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      return originalFetch(input, init);
    }) as typeof window.fetch;

    return () => {
      window.fetch = originalFetch;
    };
  }, []);

  return (
    <TemplateResolver
      card={card}
      previewMode={true}
      cssOverride={cssOverride}
      templateKey={templateKey}
      templateConfig={templateConfig}
    />
  );
}
