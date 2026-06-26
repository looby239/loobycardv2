import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import TemplateResolver from '@/components/templates/TemplateResolver';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ domain: string }>;
}

export default async function DomainPage({ params }: PageProps) {
  const { domain } = await params;
  const cleanDomain = domain.toLowerCase().trim();

  // Retrieve card by custom domain (using admin client to bypass client RLS)
  const { data: card, error } = await supabaseAdmin
    .from('cards')
    .select('*, card_images(image_url)')
    .eq('custom_domain', cleanDomain)
    .maybeSingle();

  if (error) {
    console.error('Error fetching card for custom domain:', error);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow max-w-md w-full text-center">
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
            <a href="https://loobycard.com" className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition">
              Truy cập LoobyCard
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Check if card is paid, is published, and has active custom domain status
  if (
    card.status !== 'published' ||
    card.payment_status !== 'paid' ||
    card.domain_status !== 'active'
  ) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 max-w-md w-full text-center space-y-6">
          <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-serif">Chưa Kích Hoạt</h2>
          <p className="text-slate-500 text-sm">
            Tên miền riêng này hiện chưa được kích hoạt hoặc thiệp cưới tương ứng chưa được xuất bản.
          </p>
          <div className="border-t border-slate-100 pt-4">
            <a href="https://loobycard.com" className="inline-block bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 px-6 rounded-xl text-xs transition">
              Truy cập LoobyCard
            </a>
          </div>
        </div>
      </div>
    );
  }

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

  // Fetch CSS override for this template from admin config
  let cssOverride = '';
  try {
    const templateId = card.template_id || 'template-10';
    const { data: templateConfig } = await supabaseAdmin
      .from('template_configs')
      .select('css_override')
      .eq('id', templateId)
      .maybeSingle();
    if (templateConfig?.css_override) {
      cssOverride = templateConfig.css_override;
    }
  } catch (e) {
    console.warn('Could not fetch template css_override:', e);
  }

  return <TemplateResolver card={cardData} previewMode={false} cssOverride={cssOverride} />;
}

