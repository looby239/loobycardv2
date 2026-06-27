import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { CardData } from '@/types/card';
import TemplateResolver from '@/components/templates/TemplateResolver';
import { mergeTemplateSample } from '@/lib/templateSampleData';

interface PageProps {
  params: Promise<{ templateId: string }>;
}

interface TemplateConfigRow {
  is_enabled?: boolean;
  css_override?: string;
  sample_data?: Partial<CardData> | null;
}

export default async function TemplatePreviewPage({ params }: PageProps) {
  const { templateId } = await params;

  if (!/^template-\d+$/.test(templateId)) {
    return notFound();
  }

  let config: TemplateConfigRow | null = null;

  try {
    const { data, error } = await supabaseAdmin
      .from('template_configs')
      .select('*')
      .eq('id', templateId)
      .maybeSingle();

    if (!error && data) {
      config = data as TemplateConfigRow;
    }
  } catch (error) {
    console.warn('Could not fetch template preview config:', error);
  }

  if (config?.is_enabled === false) {
    return notFound();
  }

  const card = mergeTemplateSample(templateId, config?.sample_data);

  return (
    <TemplateResolver
      card={card}
      previewMode={true}
      cssOverride={config?.css_override || ''}
    />
  );
}
