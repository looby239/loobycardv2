import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { TEMPLATE_CATALOG, getTemplateCatalogItem } from '@/lib/templateCatalog';
import { normalizeTemplateConfig, type TemplateConfig } from '@/lib/templateConfig';
import type { CardData } from '@/types/card';

interface TemplateConfigRow {
  id: string;
  name: string;
  description: string | null;
  type?: string | null;
  thumbnail_url: string | null;
  preview_url?: string | null;
  is_enabled: boolean;
  css_override: string;
  sample_data?: Partial<CardData> | null;
  sort_order: number;
  updated_at?: string | null;
  base_template_id?: string | null;
  base_template_key?: string | null;
  config?: TemplateConfig | null;
  is_customizable?: boolean | null;
  is_custom_template?: boolean | null;
}

function getPreviewUrl(templateId: string) {
  return `/template-preview/${templateId}`;
}

function enrichTemplate(row: TemplateConfigRow) {
  const catalog = getTemplateCatalogItem(row.base_template_key || row.id);
  return {
    id: row.id,
    name: row.name,
    type: row.type || catalog?.type || 'thiep-cuoi',
    typeName: catalog?.typeName || 'Thiep cuoi',
    thumbnail_url: row.thumbnail_url || catalog?.defaultThumbnail || '',
    defaultThumbnail: catalog?.defaultThumbnail || row.thumbnail_url || '',
    preview_url: row.preview_url || getPreviewUrl(row.id),
    is_enabled: row.is_enabled,
    sort_order: row.sort_order,
    updated_at: row.updated_at,
    base_template_key: row.base_template_key || catalog?.key || row.id,
    config: normalizeTemplateConfig(row.config),
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('template_configs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const templates = ((data || []) as TemplateConfigRow[])
      .filter((row) => row.is_enabled)
      .map(enrichTemplate);

    return NextResponse.json(
      { success: true, templates },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  } catch (error: unknown) {
    console.error('GET /api/templates/list error:', error);
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}
