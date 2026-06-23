import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET() {
  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const last7 = new Date(now);
    last7.setDate(last7.getDate() - 7);

    const last30 = new Date(now);
    last30.setDate(last30.getDate() - 30);

    // --- Total views ---
    const { count: total_views } = await supabaseAdmin
      .from('page_views')
      .select('*', { count: 'exact', head: true });

    // --- Today views ---
    const { count: today_views } = await supabaseAdmin
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString());

    // --- Last 7 days views ---
    const { count: last_7_days_views } = await supabaseAdmin
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last7.toISOString());

    // --- Last 30 days views ---
    const { count: last_30_days_views } = await supabaseAdmin
      .from('page_views')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', last30.toISOString());

    // --- Views by day (last 30 days) ---
    const { data: rawViews30 } = await supabaseAdmin
      .from('page_views')
      .select('created_at')
      .gte('created_at', last30.toISOString())
      .order('created_at', { ascending: true });

    // Aggregate by day
    const dayMap: Record<string, number> = {};
    (rawViews30 || []).forEach((row: any) => {
      const day = row.created_at.slice(0, 10); // YYYY-MM-DD
      dayMap[day] = (dayMap[day] || 0) + 1;
    });

    // Fill in missing days with 0
    const views_by_day: { date: string; views: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      views_by_day.push({ date: key, views: dayMap[key] || 0 });
    }

    // --- Top 10 cards by views ---
    const { data: rawTopCards } = await supabaseAdmin
      .from('page_views')
      .select('slug, card_id')
      .not('slug', 'is', null);

    const topMap: Record<string, { count: number; card_id: string | null }> = {};
    (rawTopCards || []).forEach((row: any) => {
      if (!topMap[row.slug]) topMap[row.slug] = { count: 0, card_id: row.card_id };
      topMap[row.slug].count++;
    });

    const sortedSlugs = Object.entries(topMap)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 10);

    // Fetch customer names for top cards
    const topCardIds = sortedSlugs
      .map(([, v]) => v.card_id)
      .filter(Boolean) as string[];

    let cardNameMap: Record<string, string> = {};
    if (topCardIds.length > 0) {
      const { data: cardData } = await supabaseAdmin
        .from('cards')
        .select('id, customer_name, groom_name, bride_name')
        .in('id', topCardIds);

      (cardData || []).forEach((c: any) => {
        cardNameMap[c.id] = `${c.groom_name} & ${c.bride_name}`;
      });
    }

    const top_cards = sortedSlugs.map(([slug, v]) => ({
      slug,
      name: cardNameMap[v.card_id || ''] || slug,
      views: v.count,
    }));

    // --- Views by device ---
    const { data: rawDevices } = await supabaseAdmin
      .from('page_views')
      .select('device_type');

    const deviceMap: Record<string, number> = {};
    (rawDevices || []).forEach((row: any) => {
      const d = row.device_type || 'unknown';
      deviceMap[d] = (deviceMap[d] || 0) + 1;
    });

    const views_by_device = Object.entries(deviceMap).map(([device_type, count]) => ({
      device_type,
      count,
    }));

    // --- Views by referrer ---
    const { data: rawReferrers } = await supabaseAdmin
      .from('page_views')
      .select('referrer');

    const referrerMap: Record<string, number> = {};
    (rawReferrers || []).forEach((row: any) => {
      const r = row.referrer || 'direct';
      referrerMap[r] = (referrerMap[r] || 0) + 1;
    });

    const views_by_referrer = Object.entries(referrerMap)
      .sort(([, a], [, b]) => b - a)
      .map(([referrer, count]) => ({ referrer, count }));

    return NextResponse.json({
      total_views: total_views || 0,
      today_views: today_views || 0,
      last_7_days_views: last_7_days_views || 0,
      last_30_days_views: last_30_days_views || 0,
      top_cards,
      views_by_day,
      views_by_device,
      views_by_referrer,
    });
  } catch (err) {
    console.error('Admin analytics error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
