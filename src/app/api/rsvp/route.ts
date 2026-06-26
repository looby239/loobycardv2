import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { card_id, guest_name, phone, attend_status, guests_count, message } = await request.json();

    if (!card_id || !guest_name || !attend_status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Verify card exists and get plan info
    const { data: card, error: cardError } = await supabaseAdmin
      .from('cards')
      .select('id, plan_id')
      .eq('id', card_id)
      .maybeSingle();

    if (cardError || !card) {
      console.error('[RSVP] Card lookup error:', cardError, 'card_id:', card_id);
      return NextResponse.json({ error: 'Card not found' }, { status: 404 });
    }

    // 2. Basic plan does NOT support RSVP
    if (card.plan_id === 'basic') {
      return NextResponse.json({ error: 'Gói Cơ Bản không hỗ trợ tính năng RSVP.' }, { status: 400 });
    }

    // 3. Insert response record
    const { data, error } = await supabaseAdmin
      .from('rsvp_responses')
      .insert({
        card_id,
        guest_name,
        phone: phone || null,
        attend_status,
        guests_count: guests_count || 0,
        message: message || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting RSVP:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('RSVP API Route error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
