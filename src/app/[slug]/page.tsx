import React from 'react';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase';
import TemplateResolver from '@/components/templates/TemplateResolver';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import crypto from 'crypto';

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Server-side helper to detect device type from User-Agent
function detectDevice(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
  if (/mobile|android|iphone|ipod|blackberry|windows phone/i.test(userAgent)) return 'mobile';
  return 'desktop';
}

// Classify referrer into readable source label
function classifyReferrer(referrer: string): string {
  if (!referrer) return 'direct';
  if (/facebook\.com|fb\.com|m\.facebook/i.test(referrer)) return 'facebook';
  if (/zalo\.me|zaloapp/i.test(referrer)) return 'zalo';
  if (/google\./i.test(referrer)) return 'google';
  if (/instagram\.com/i.test(referrer)) return 'instagram';
  if (/tiktok\.com/i.test(referrer)) return 'tiktok';
  if (/twitter\.com|t\.co/i.test(referrer)) return 'twitter';
  return 'other';
}

async function trackPageView(card: any, slug: string, reqHeaders: { get: (name: string) => string | null }) {
  try {
    const forwarded = reqHeaders.get('x-forwarded-for');
    const rawIp = forwarded
      ? forwarded.split(',')[0].trim()
      : reqHeaders.get('x-real-ip') || 'unknown';

    // Hash IP + slug for privacy (never store raw IP)
    const ip_hash = crypto
      .createHash('sha256')
      .update(rawIp + slug)
      .digest('hex')
      .slice(0, 32);

    const userAgent = reqHeaders.get('user-agent') || '';
    const referrerRaw = reqHeaders.get('referer') || '';
    const referrer = classifyReferrer(referrerRaw);
    const device_type = detectDevice(userAgent);

    // Anti-spam: skip if same ip_hash + slug visited in last 30 minutes
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const { data: existing } = await supabaseAdmin
      .from('page_views')
      .select('id')
      .eq('ip_hash', ip_hash)
      .eq('slug', slug)
      .gte('created_at', thirtyMinutesAgo)
      .limit(1)
      .maybeSingle();

    if (existing) return; // duplicate within 30 min — skip

    await supabaseAdmin.from('page_views').insert({
      card_id: card.id,
      slug,
      page_url: `/${slug}`,
      referrer,
      user_agent: userAgent,
      device_type,
      ip_hash,
    });
  } catch (err) {
    // Tracking failures must never break the page
    console.error('[Analytics] trackPageView error:', err);
  }
}

export default async function PublicCardPage({ params }: PageProps) {
  const { slug } = await params;
  const reqHeaders = await headers();

  // Retrieve card and associated album images
  const { data: card, error } = await supabaseAdmin
    .from('cards')
    .select('*, card_images(image_url)')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching card:', error);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow border border-slate-100 max-w-md w-full text-center">
          <p className="text-red-500 font-semibold">Lỗi cơ sở dữ liệu. Vui lòng quay lại sau.</p>
        </div>
      </div>
    );
  }

  if (!card || card.deleted_at) {
    return notFound();
  }

  // Check if card is expired
  const now = new Date();
  const isExpired = card.expires_at && new Date(card.expires_at) <= now;

  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 max-w-md w-full text-center space-y-6">
          <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-serif">Hết Hạn Hiển Thị</h2>
          <p className="text-slate-500 text-sm font-medium">
            Thiệp đã hết thời gian hiển thị.
          </p>
          <div className="border-t border-slate-100 pt-4">
            <Link href="/" className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition">
              Về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Business Rule: Only display if published AND paid
  const isPublished = card.status === 'published';
  const isPaid = card.payment_status === 'paid';

  if (!isPublished || !isPaid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 max-w-md w-full text-center space-y-6">
          <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-serif">Chưa Xuất Bản</h2>
          <p className="text-slate-500 text-sm">
            Thiệp cưới này hiện chưa được xuất bản hoặc chưa hoàn thành thanh toán phí dịch vụ.
          </p>
          <div className="border-t border-slate-100 pt-4">
            <Link href="/" className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition">
              Về Trang chủ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Track page view — fire-and-forget, never blocks render
  trackPageView(card, slug, reqHeaders);

  // Format album images
  const albumImages = card.card_images
    ? card.card_images.map((img: any) => img.image_url)
    : [];

  const { expandMapUrl } = await import('@/lib/mapUtils');
  const expandedMapUrl = await expandMapUrl(card.map_url);

  const cardData = {
    ...card,
    album_images: albumImages,
    map_url: expandedMapUrl,
  };

  // Fetch render config for this template from admin config
  let cssOverride = '';
  let templateKey = cardData.template_id || 'template-10';
  let customTemplateConfig = undefined;
  try {
    const templateId = card.template_id || 'template-10';
    const { data: templateConfigRow } = await supabaseAdmin
      .from('template_configs')
      .select('css_override, config, base_template_key, is_custom_template')
      .eq('id', templateId)
      .maybeSingle();
    if (templateConfigRow?.css_override) {
      cssOverride = templateConfigRow.css_override;
    }
    if (templateConfigRow?.base_template_key) {
      templateKey = templateConfigRow.base_template_key;
    }
    if (templateConfigRow?.is_custom_template && templateConfigRow.config) {
      customTemplateConfig = templateConfigRow.config;
    }
  } catch (e) {
    console.warn('Could not fetch template config:', e);
  }

  return <TemplateResolver card={cardData} previewMode={false} cssOverride={cssOverride} templateKey={templateKey} templateConfig={customTemplateConfig} />;
}
