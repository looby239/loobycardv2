import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { card_id, guest_name, message } = await request.json();

    if (!card_id || !guest_name || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch card details to check if guestbook wishes are supported (Premium & Luxury only)
    const { data: card, error: cardError } = await supabaseAdmin
      .from('cards')
      .select('plan_id')
      .eq('id', card_id)
      .maybeSingle();

    if (cardError || !card) {
      console.error('[Guestbook] Card lookup error:', cardError, 'card_id:', card_id);
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // Basic plan does NOT support wishes/guestbook
    if (card.plan_id === 'basic') {
      return NextResponse.json({ error: 'Gói Cơ Bản không hỗ trợ ghi Sổ lưu bút.' }, { status: 400 });
    }

    // 2. Insert wish message
    const { data, error } = await supabaseAdmin
      .from('guest_messages')
      .insert({
        card_id,
        guest_name,
        message,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting wish message:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Guestbook API Route error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
