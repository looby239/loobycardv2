import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { TEMPLATE_CATALOG } from '@/lib/templateCatalog';
import { normalizeTemplateConfig } from '@/lib/templateConfig';

export const dynamic = 'force-dynamic';

interface TemplateRow {
  id: string;
  name: string;
  type?: string | null;
  thumbnail_url?: string | null;
  preview_url?: string | null;
  is_active?: boolean | null;
  is_enabled?: boolean | null;
  base_template_id?: string | null;
  base_template_key?: string | null;
  config?: unknown;
  is_custom_template?: boolean | null;
}

function enrichTemplate(row: TemplateRow) {
  return {
    id: row.id,
    name: row.name,
    type: row.type || 'thiep-cuoi',
    thumbnail_url: row.thumbnail_url || '',
    preview_url: row.preview_url || `/template-preview/${row.id}`,
    is_active: row.is_active ?? row.is_enabled ?? true,
    base_template_id: row.base_template_id || null,
    base_template_key: row.base_template_key || row.id,
    config: normalizeTemplateConfig(row.config),
    is_custom_template: row.is_custom_template ?? false,
  };
}

export async function GET() {
  try {
    const { data: templateRows, error: templateError } = await supabaseAdmin
      .from('templates')
      .select('id,name,type,thumbnail_url,preview_url,is_active,base_template_id,base_template_key,config,is_custom_template')
      .order('name', { ascending: true });

    if (!templateError && templateRows?.length) {
      return NextResponse.json({
        success: true,
        templates: (templateRows as TemplateRow[]).map(enrichTemplate),
      });
    }

    const { data: configRows, error: configError } = await supabaseAdmin
      .from('template_configs')
      .select('id,name,type,thumbnail_url,preview_url,is_enabled,base_template_id,base_template_key,config,is_custom_template,sort_order')
      .order('sort_order', { ascending: true });

    if (!configError && configRows?.length) {
      return NextResponse.json({
        success: true,
        templates: (configRows as TemplateRow[]).map(enrichTemplate),
      });
    }

    if (configError && templateError) {
      throw configError;
    }

    return NextResponse.json({
      success: true,
      templates: TEMPLATE_CATALOG.map((template) => enrichTemplate({
        id: template.id,
        name: template.name,
        type: template.type,
        thumbnail_url: template.defaultThumbnail,
        preview_url: template.previewUrl,
        base_template_key: template.key,
      })),
    });
  } catch (error: unknown) {
    console.error('GET /api/admin/template-test/templates error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
