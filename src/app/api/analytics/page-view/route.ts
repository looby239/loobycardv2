import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

function detectDevice(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = userAgent.toLowerCase();
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function classifyReferrer(referrer: string): string {
  if (!referrer) return 'direct';
  if (/facebook\.com|fb\.com|m\.facebook/i.test(referrer)) return 'facebook';
  if (/zalo\.me|zaloapp/i.test(referrer)) return 'zalo';
  if (/google\.|gg\.gg/i.test(referrer)) return 'google';
  if (/instagram\.com/i.test(referrer)) return 'instagram';
  if (/tiktok\.com/i.test(referrer)) return 'tiktok';
  if (/youtube\.com/i.test(referrer)) return 'youtube';
  if (/twitter\.com|t\.co/i.test(referrer)) return 'twitter';
  return 'other';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { card_id, slug, page_url } = body;

    if (!slug) {
      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    }

    // Get IP from headers (works on Vercel/proxied environments)
    const forwarded = req.headers.get('x-forwarded-for');
    const rawIp = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown';
    
    // Hash the IP for privacy — never store raw IP
    const ip_hash = crypto.createHash('sha256').update(rawIp + slug).digest('hex').slice(0, 32);

    const userAgent = req.headers.get('user-agent') || '';
    const referrerRaw = req.headers.get('referer') || body.referrer || '';
    const referrer = classifyReferrer(referrerRaw);
    const device_type = detectDevice(userAgent);

    // Anti-spam: check if same ip_hash + slug viewed in last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: existing } = await supabaseAdmin
      .from('page_views')
      .select('id')
      .eq('ip_hash', ip_hash)
      .eq('slug', slug)
      .gte('created_at', thirtyMinutesAgo)
      .limit(1)
      .maybeSingle();

    if (existing) {
      // Already tracked within 30 minutes, skip
      return NextResponse.json({ tracked: false, reason: 'duplicate_within_30m' });
    }

    // Insert new page view
    const { error: insertError } = await supabaseAdmin
      .from('page_views')
      .insert({
        card_id: card_id || null,
        slug,
        page_url: page_url || null,
        referrer,
        user_agent: userAgent,
        device_type,
        ip_hash,
      });

    if (insertError) {
      console.error('Error inserting page_view:', insertError);
      return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
    }

    return NextResponse.json({ tracked: true });
  } catch (err) {
    console.error('Analytics page-view error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
