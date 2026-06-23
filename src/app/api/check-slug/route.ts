import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug')?.toLowerCase().trim();
    const cardId = searchParams.get('card_id');

    if (!slug) {
      return NextResponse.json({ available: false, error: 'Slug is required' }, { status: 400 });
    }

    // Validate slug formatting
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(slug)) {
      return NextResponse.json({ available: false, error: 'Slug format invalid' });
    }

    // Query cards table for slug conflicts
    let query = supabaseAdmin
      .from('cards')
      .select('id')
      .eq('slug', slug);

    // If checking for an existing card, exclude its own ID
    if (cardId) {
      query = query.neq('id', cardId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Slug check query error:', error);
      return NextResponse.json({ available: false, error: error.message }, { status: 500 });
    }

    const isAvailable = data.length === 0;

    return NextResponse.json({
      available: isAvailable,
      slug,
    });
  } catch (error: any) {
    console.error('Slug check handler error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
