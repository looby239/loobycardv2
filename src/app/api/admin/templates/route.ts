import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Static template metadata (source of truth for names/descriptions)
const TEMPLATE_META: Record<string, { name: string; description: string; defaultThumbnail: string }> = {
  'template-10': { name: 'Lời Hứa Vĩnh Cửu', description: 'Phong cách Á Đông truyền thống, màu đỏ son và vàng rực rỡ', defaultThumbnail: '/templates/template-10/assets/images/cover_photo.png' },
  'template-11': { name: 'Hoa Anh Đào', description: 'Nhẹ nhàng, lãng mạn với sắc hồng anh đào', defaultThumbnail: '' },
  'template-12': { name: 'Hoàng Hôn Vàng', description: 'Sang trọng với tông vàng kem và trắng tinh', defaultThumbnail: '' },
  'template-13': { name: 'Bảo Ngọc', description: 'Quý phái với tông xanh ngọc và vàng ánh kim', defaultThumbnail: '' },
  'template-14': { name: 'Lá Mùa Thu', description: 'Ấm áp với tông nâu đất và vàng lá thu', defaultThumbnail: '' },
  'template-15': { name: 'Hương Thơm Đồng Nội', description: 'Tươi mát với sắc xanh lá và trắng tinh khôi', defaultThumbnail: '' },
  'template-16': { name: 'Bình Minh Mới', description: 'Hiện đại với gradient tím hồng', defaultThumbnail: '' },
  'template-17': { name: 'Đêm Sao', description: 'Huyền bí với nền tối và điểm sao lấp lánh', defaultThumbnail: '' },
  'template-18': { name: 'Mùa Xuân', description: 'Tươi vui với sắc hồng phấn và xanh lá', defaultThumbnail: '' },
  'template-19': { name: 'Thiên Đường', description: 'Bay bổng với sắc trắng và lavender nhẹ nhàng', defaultThumbnail: '' },
};

// Ensure template_configs table has rows for all templates (upsert defaults)
async function ensureTemplateRows() {
  const entries = Object.entries(TEMPLATE_META).map(([id, meta], i) => ({
    id,
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

export async function GET() {
  try {
    await ensureTemplateRows();

    const { data, error } = await supabaseAdmin
      .from('template_configs')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;

    // Merge static meta with DB data
    const enriched = (data || []).map((row: any) => ({
      ...row,
      defaultThumbnail: TEMPLATE_META[row.id]?.defaultThumbnail || '',
    }));

    return NextResponse.json({ success: true, templates: enriched });
  } catch (error: any) {
    console.error('GET /api/admin/templates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, is_enabled, thumbnail_url, css_override, name, description, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing template id' }, { status: 400 });
    }

    const updateData: any = { updated_at: new Date().toISOString() };
    if (is_enabled !== undefined) updateData.is_enabled = is_enabled;
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
    if (css_override !== undefined) updateData.css_override = css_override;
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    const { error } = await supabaseAdmin
      .from('template_configs')
      .update(updateData)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('PATCH /api/admin/templates error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
