import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import { CardData } from '@/types/card';
import TemplateResolver from '@/components/templates/TemplateResolver';
import { mergeTemplateSample } from '@/lib/templateSampleData';
import { normalizeTemplateConfig, type TemplateConfig } from '@/lib/templateConfig';

interface PageProps {
  params: Promise<{ templateId: string }>;
  searchParams: Promise<{ config?: string; adminPreview?: string }>;
}

interface TemplateConfigRow {
  is_enabled?: boolean;
  css_override?: string;
  sample_data?: Partial<CardData> | null;
  base_template_key?: string | null;
  config?: TemplateConfig | null;
  is_custom_template?: boolean | null;
}

function parsePreviewConfig(value?: string) {
  if (!value) return undefined;
  try {
    return normalizeTemplateConfig(JSON.parse(decodeURIComponent(value)));
  } catch {
    return undefined;
  }
}

export default async function TemplatePreviewPage({ params, searchParams }: PageProps) {
  const { templateId } = await params;
  const query = await searchParams;

  if (!/^[a-z0-9-]+$/.test(templateId)) {
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

  if (config?.is_enabled === false && query.adminPreview !== '1') {
    return notFound();
  }

  const renderKey = config?.base_template_key || templateId;
  const previewConfig = parsePreviewConfig(query.config);
  const card = {
    ...mergeTemplateSample(renderKey, config?.sample_data),
    template_id: templateId,
  };
  const templateConfig = previewConfig || (config?.config ? normalizeTemplateConfig(config.config) : undefined);

  return (
    <TemplateResolver
      card={card}
      previewMode={true}
      cssOverride={config?.css_override || ''}
      templateKey={renderKey}
      templateConfig={templateConfig}
    />
  );
}
