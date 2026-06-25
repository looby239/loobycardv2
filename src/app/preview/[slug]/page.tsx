import React from 'react';
import { notFound } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase';
import TemplateResolver from '@/components/templates/TemplateResolver';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PreviewPage({ params }: PageProps) {
  const { slug } = await params;

  // Query database using supabaseAdmin (bypasses RLS since this is a secure server component)
  const { data: card, error } = await supabaseAdmin
    .from('cards')
    .select('*, card_images(image_url)')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    console.error('Error fetching card for preview:', error);
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow max-w-md w-full text-center">
          <p className="text-red-500 font-semibold">Lỗi cơ sở dữ liệu khi tải bản xem trước.</p>
        </div>
      </div>
    );
  }

  if (!card) {
    return notFound();
  }

  // Format album images relation
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

  let planName = 'Gói Cơ Bản';
  let durationText = '1 tháng';
  if (card.plan_id === 'premium') {
    planName = 'Gói Premium';
    durationText = '3 tháng';
  } else if (card.plan_id === 'luxury') {
    planName = 'Gói Luxury';
    durationText = '6 tháng';
  }

  return (
    <div className="relative">
      {/* Informative top banner */}
      <div className="bg-amber-50 border-b border-amber-200 text-amber-900 py-3 px-4 sticky top-0 z-50 shadow-md select-none">
        <div className="max-w-4xl mx-auto flex flex-col gap-1.5 text-xs sm:text-sm">
          <div className="flex items-start gap-1.5 font-bold text-amber-700">
            <span className="text-sm mt-0.5">⚠️</span>
            <span>Đây là bản demo thiệp của bạn. Link demo sẽ được lưu trong 24 giờ. Sau 24 giờ nếu chưa thanh toán, hệ thống sẽ tự động xóa demo và toàn bộ hình ảnh đã tải lên.</span>
          </div>
          <div className="text-slate-600 pl-5 text-[11px] sm:text-xs">
            <strong>Gói bạn chọn:</strong> {planName} | <strong>Thời hạn hiển thị sau khi thanh toán:</strong> {durationText}
          </div>
        </div>
      </div>
      
      <TemplateResolver card={cardData} previewMode={true} />
    </div>
  );
}
