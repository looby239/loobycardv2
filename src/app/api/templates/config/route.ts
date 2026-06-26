import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// Public API: get css_override and is_enabled for a given template
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get('id');

    if (!templateId) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('template_configs')
      .select('id, name, css_override, is_enabled, thumbnail_url')
      .eq('id', templateId)
      .maybeSingle();

    if (error) throw error;

    return NextResponse.json({ success: true, config: data || null });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
