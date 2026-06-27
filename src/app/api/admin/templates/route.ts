import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { CardData } from '@/types/card';
import { TEMPLATE_CATALOG, getTemplateCatalogItem } from '@/lib/templateCatalog';
import {
  DEFAULT_TEMPLATE_CONFIG,
  createTemplateSchema,
  normalizeTemplateConfig,
  templateUpsertSchema,
  type TemplateConfig,
} from '@/lib/templateConfig';

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

function nowIso() {
  return new Date().toISOString();
}

function getRenderKey(row: Partial<TemplateConfigRow>) {
  return row.base_template_key || row.id || 'template-10';
}

function getPreviewUrl(templateId: string) {
  return `/template-preview/${templateId}`;
}

function enrichTemplate(row: TemplateConfigRow) {
  const catalog = getTemplateCatalogItem(row.base_template_key || row.id);
  return {
    ...row,
    type: row.type || catalog?.type || 'thiep-cuoi',
    typeName: catalog?.typeName || 'Thiep cuoi',
    preview_url: row.preview_url || getPreviewUrl(row.id),
    defaultThumbnail: catalog?.defaultThumbnail || row.thumbnail_url || '',
    base_template_key: row.base_template_key || catalog?.key || row.id,
    config: normalizeTemplateConfig(row.config),
    is_customizable: row.is_customizable ?? true,
    is_custom_template: row.is_custom_template ?? false,
  };
}

async function ensureTemplateRows() {
  const entries = TEMPLATE_CATALOG.map((meta, i) => ({
    id: meta.id,
    name: meta.name,
    description: meta.description,
    thumbnail_url: meta.defaultThumbnail || null,
    is_enabled: true,
    css_override: '',
    sort_order: i,
  }));

  const { error } = await supabaseAdmin
    .from('template_configs')
    .upsert(entries, { onConflict: 'id', ignoreDuplicates: true });

  if (error) {
    console.error('ensureTemplateRows error:', error);
  }
}

async function mirrorTemplateRow(row: {
  id: string;
  name: string;
  type: string;
  thumbnail_url: string | null;
  preview_url: string;
  is_enabled: boolean;
  base_template_id?: string | null;
  base_template_key?: string | null;
  config?: TemplateConfig;
  is_customizable?: boolean;
  is_custom_template?: boolean;
}) {
  try {
    await supabaseAdmin.from('templates').upsert({
      id: row.id,
      name: row.name,
      type: row.type,
      thumbnail_url: row.thumbnail_url || '',
      preview_url: row.preview_url,
      is_active: row.is_enabled,
      base_template_id: row.base_template_id || null,
      base_template_key: row.base_template_key || row.id,
      config: row.config || DEFAULT_TEMPLATE_CONFIG,
      is_customizable: row.is_customizable ?? true,
      is_custom_template: row.is_custom_template ?? false,
    }, { onConflict: 'id' });
  } catch (error) {
    console.warn('Could not mirror template_configs row into templates table:', error);
  }
}

export async function GET() {
  try {
    await ensureTemplateRows();

    const { data, error } = await supabaseAdmin
      .from('template_configs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    const templates = ((data || []) as TemplateConfigRow[]).map(enrichTemplate);
    return NextResponse.json({ success: true, templates });
  } catch (error: unknown) {
    console.error('GET /api/admin/templates error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureTemplateRows();

    const body = createTemplateSchema.parse(await request.json());
    const { data: baseData, error: baseError } = await supabaseAdmin
      .from('template_configs')
      .select('*')
      .eq('id', body.base_template_id)
      .maybeSingle();

    if (baseError) throw baseError;
    if (!baseData) {
      return NextResponse.json({ error: 'Base template not found' }, { status: 404 });
    }

    const base = enrichTemplate(baseData as TemplateConfigRow);
    const { count } = await supabaseAdmin
      .from('template_configs')
      .select('id', { count: 'exact', head: true });

    const id = body.id || `custom-${randomUUID()}`;
    const baseTemplateKey = getRenderKey(base);
    const config = normalizeTemplateConfig(body.config || base.config);
    const createdAt = nowIso();
    const thumbnailUrl = body.thumbnail_url || base.thumbnail_url || base.defaultThumbnail || null;
    const row = {
      id,
      name: body.name,
      description: base.description || '',
      type: base.type || 'thiep-cuoi',
      thumbnail_url: thumbnailUrl,
      preview_url: getPreviewUrl(id),
      is_enabled: body.is_enabled,
      css_override: base.css_override || '',
      sample_data: base.sample_data || {},
      sort_order: typeof count === 'number' ? count : 999,
      updated_at: createdAt,
      base_template_id: base.id,
      base_template_key: baseTemplateKey,
      config,
      is_customizable: true,
      is_custom_template: true,
    };

    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('template_configs')
      .insert(row)
      .select('*')
      .single();

    if (insertError) throw insertError;

    await mirrorTemplateRow(row);

    return NextResponse.json({ success: true, template: enrichTemplate(inserted as TemplateConfigRow) });
  } catch (error: unknown) {
    console.error('POST /api/admin/templates error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const parsed = templateUpsertSchema.parse(await request.json());
    const { id, ...patch } = parsed;

    if (!id) {
      return NextResponse.json({ error: 'Missing template id' }, { status: 400 });
    }

    const updateData: Record<string, unknown> = { updated_at: nowIso() };
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) {
        updateData[key] = key === 'config' ? normalizeTemplateConfig(value) : value;
      }
    }

    const { data, error } = await supabaseAdmin
      .from('template_configs')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    const enriched = enrichTemplate(data as TemplateConfigRow);
    await mirrorTemplateRow({
      id: enriched.id,
      name: enriched.name,
      type: enriched.type,
      thumbnail_url: enriched.thumbnail_url,
      preview_url: enriched.preview_url,
      is_enabled: enriched.is_enabled,
      base_template_id: enriched.base_template_id,
      base_template_key: enriched.base_template_key,
      config: enriched.config,
      is_customizable: enriched.is_customizable,
      is_custom_template: enriched.is_custom_template,
    });

    return NextResponse.json({ success: true, template: enriched });
  } catch (error: unknown) {
    console.error('PATCH /api/admin/templates error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing template id' }, { status: 400 });
    }

    const [{ count: cardCount }, { count: configChildCount }, { count: templateChildCount }] = await Promise.all([
      supabaseAdmin.from('cards').select('id', { count: 'exact', head: true }).eq('template_id', id),
      supabaseAdmin.from('template_configs').select('id', { count: 'exact', head: true }).eq('base_template_id', id),
      supabaseAdmin.from('templates').select('id', { count: 'exact', head: true }).eq('base_template_id', id),
    ]);

    if ((cardCount || 0) > 0) {
      return NextResponse.json({ error: 'Không thể xóa template đang được thiệp sử dụng' }, { status: 409 });
    }

    if ((configChildCount || 0) > 0 || (templateChildCount || 0) > 0) {
      return NextResponse.json({ error: 'Không thể xóa template đang có custom template phụ thuộc' }, { status: 409 });
    }

    const { error } = await supabaseAdmin.from('template_configs').delete().eq('id', id);
    if (error) throw error;

    try {
      await supabaseAdmin.from('templates').delete().eq('id', id);
    } catch (error) {
      console.warn('Could not delete mirrored templates row:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('DELETE /api/admin/templates error:', error);
    const message = error instanceof Error ? error.message : 'Server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
