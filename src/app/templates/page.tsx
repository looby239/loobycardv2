'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { ArrowLeft, Play, Check, RotateCcw, Heart, Loader2 } from 'lucide-react';
import 'swiper/css';

// Fallback static metadata (thumbnail & previewUrl are static, not from DB)
const TEMPLATE_STATIC: Record<string, { thumbnail: string; previewUrl: string; typeName: string }> = {
  'template-10': { thumbnail: '/assets/images/template-10-thumbnail.png', previewUrl: '/loc-thu', typeName: 'Thiệp cưới' },
  'template-11': { thumbnail: '/assets/images/template-11-thumbnail.png', previewUrl: '/template11', typeName: 'Thiệp cưới' },
  'template-12': { thumbnail: '/assets/images/template-12/preview.png', previewUrl: '/templates/template-12/index.html', typeName: 'Thiệp cưới' },
  'template-13': { thumbnail: '/assets/images/template-13/preview.png', previewUrl: '/templates/template-13/index.html', typeName: 'Thiệp cưới' },
  'template-14': { thumbnail: '/assets/images/template-14/preview.png', previewUrl: '/templates/template-14/index.html', typeName: 'Thiệp cưới' },
  'template-15': { thumbnail: '/assets/images/template-15/preview.png', previewUrl: '/templates/template-15/index.html', typeName: 'Thiệp cưới' },
  'template-16': { thumbnail: '/assets/images/template-16/preview.png', previewUrl: '/templates/template-16/index.html', typeName: 'Thiệp cưới' },
  'template-17': { thumbnail: '/assets/images/template-17/photo1.jpg', previewUrl: '/templates/template-17/index.html', typeName: 'Thiệp cưới' },
  'template-18': { thumbnail: '/assets/images/template-18/photo1.jpg', previewUrl: '/templates/template-18/index.html', typeName: 'Thiệp cưới' },
  'template-19': { thumbnail: '/assets/images/template-19/photo1.jpg', previewUrl: '/templates/template-19/index.html', typeName: 'Thiệp cưới' },
};

interface Template {
  id: string;
  name: string;
  typeName: string;
  thumbnail: string;
  previewUrl: string;
}

// Fallback list (used before DB loads or if DB fails)
const FALLBACK_TEMPLATES: Template[] = Object.entries(TEMPLATE_STATIC).map(([id, meta]) => ({
  id,
  name: id.replace('template-', 'Mẫu '),
  ...meta,
}));

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>(FALLBACK_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [activeIdx, setActiveIdx] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load enabled templates from admin config (sorted by sort_order)
  useEffect(() => {
    fetch('/api/admin/templates')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.templates?.length > 0) {
          const enabled = (data.templates as any[])
            .filter(t => t.is_enabled)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(t => {
              const meta = TEMPLATE_STATIC[t.id] || { thumbnail: '', previewUrl: '#', typeName: 'Thiệp cưới' };
              return {
                id: t.id,
                name: t.name || meta.typeName,
                typeName: meta.typeName,
                // Use admin-uploaded thumbnail if available, otherwise static fallback
                thumbnail: t.thumbnail_url || meta.thumbnail,
                previewUrl: meta.previewUrl,
              };
            });
          if (enabled.length > 0) setTemplates(enabled);
        }
      })
      .catch(() => { /* use fallback silently */ })
      .finally(() => setLoading(false));
  }, []);

  const activeTemplate = templates[activeIdx] || templates[0];

  const startAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    const iframe = iframeRef.current;
    if (!iframe) return;
    let isScrollingDown = true;
    scrollIntervalRef.current = setInterval(() => {
      try {
        const win = iframe.contentWindow;
        const doc = iframe.contentDocument || win?.document;
        if (!win || !doc) return;
        const currentScroll = doc.documentElement.scrollTop || doc.body.scrollTop;
        const maxScroll = doc.documentElement.scrollHeight - doc.documentElement.clientHeight;
        if (maxScroll <= 0) return;
        if (isScrollingDown) {
          win.scrollBy(0, 1);
          if (currentScroll >= maxScroll - 2) isScrollingDown = false;
        } else {
          win.scrollTo(0, 0);
          isScrollingDown = true;
        }
      } catch (err) {}
    }, 40);
  };

  const stopAutoScroll = () => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  };

  const handleResetScroll = () => {
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      try {
        iframe.contentWindow.scrollTo({ top: 0, behavior: 'smooth' });
        stopAutoScroll();
        setTimeout(startAutoScroll, 1000);
      } catch (err) {}
    }
  };

  useEffect(() => {
    startAutoScroll();
    return () => stopAutoScroll();
  }, [activeIdx]);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header Bar */}
      <header className="bg-slate-950/80 border-b border-slate-800 sticky top-0 z-30 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition font-medium text-sm">
            <ArrowLeft size={16} />
            <span>Về trang chủ</span>
          </Link>
          <div className="flex items-center gap-2 font-bold text-rose-500">
            <Heart size={20} className="fill-rose-500" />
            <span>Looby Templates</span>
          </div>
          <div className="w-24"></div>
        </div>
      </header>

      {loading ? (
        <div className="flex-1 flex items-center justify-center gap-3 text-slate-400">
          <Loader2 size={28} className="animate-spin" />
          <span className="text-sm">Đang tải danh sách mẫu...</span>
        </div>
      ) : (
        /* Main Split Layout */
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Side: Templates List (Carousel) */}
          <div className="flex-1 p-6 md:p-12 flex flex-col justify-between bg-gradient-to-b from-slate-900 to-slate-950 lg:max-w-2xl xl:max-w-3xl">
            <div className="space-y-4 mb-8">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Chọn Mẫu Thiết Kế</h1>
              <p className="text-slate-400 text-sm md:text-base">
                Vuốt chọn mẫu thiệp cưới ưng ý. Xem trực tiếp demo hiển thị của thiệp ở khung bên cạnh trước khi bấm chọn.
              </p>
            </div>

            {/* Swiper Slider */}
            <div className="w-full py-4">
              <Swiper
                className="templates-swiper"
                spaceBetween={20}
                slidesPerView={1.5}
                centeredSlides={true}
                initialSlide={0}
                breakpoints={{
                  480: { slidesPerView: 1.8 },
                  640: { slidesPerView: 2.2 },
                  768: { slidesPerView: 2.5 },
                }}
                onSlideChange={(swiper) => {
                  setActiveIdx(swiper.activeIndex);
                }}
              >
                {templates.map((tpl, idx) => (
                  <SwiperSlide key={tpl.id}>
                    <div
                      className={`rounded-2xl overflow-hidden border-2 cursor-pointer transition-all duration-300 ${
                        activeIdx === idx
                          ? 'border-rose-500 scale-105 shadow-lg shadow-rose-950/20'
                          : 'border-slate-800 opacity-40 scale-95 hover:opacity-75'
                      }`}
                    >
                      <div className="aspect-[4/5] relative bg-slate-800">
                        <img
                          src={tpl.thumbnail}
                          alt={tpl.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/assets/images/template-10-thumbnail.png';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent flex flex-col justify-end p-4">
                          <span className="text-xs text-rose-400 font-semibold uppercase">{tpl.typeName}</span>
                          <h3 className="font-bold text-white text-sm sm:text-base">{tpl.name}</h3>
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>

            {/* Focused Template Meta & Actions */}
            {activeTemplate && (
              <div className="mt-8 bg-slate-950/50 border border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-rose-500 tracking-wider uppercase">{activeTemplate.typeName}</span>
                    <h2 className="text-xl md:text-2xl font-bold text-white mt-1">{activeTemplate.name}</h2>
                  </div>
                  <button
                    onClick={handleResetScroll}
                    className="flex items-center gap-1 text-slate-400 hover:text-white transition text-xs font-semibold py-1.5 px-3 rounded-lg border border-slate-800 bg-slate-900"
                  >
                    <RotateCcw size={14} />
                    <span>Xem lại từ đầu</span>
                  </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <a
                    href={activeTemplate.previewUrl}
                    target="_blank"
                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition"
                  >
                    <Play size={16} />
                    <span>Xem thử toàn màn hình</span>
                  </a>
                  <Link
                    href={`/pricing?template_id=${activeTemplate.id}`}
                    className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-950/20 transition hover:scale-[1.02]"
                  >
                    <Check size={16} />
                    <span>Chọn mẫu này</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Right Side: Phone View Iframe Previewer */}
          <div className="flex-1 bg-slate-950 border-t lg:border-t-0 lg:border-l border-slate-800 flex items-center justify-center p-6 min-h-[500px] lg:min-h-0 relative">
            <div className="absolute top-4 left-6 text-xs text-slate-500 font-semibold uppercase">
              Xem trước hiển thị di động
            </div>

            <div className="relative border-[12px] border-slate-800 rounded-[3rem] h-[650px] w-[320px] shadow-2xl bg-white overflow-hidden my-6">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 h-5 w-32 bg-slate-800 rounded-b-xl z-20"></div>
              
              {activeTemplate && (
                <iframe
                  ref={iframeRef}
                  src={`${activeTemplate.previewUrl}${activeTemplate.previewUrl.includes('?') ? '&' : '?'}autoOpen=true`}
                  className="w-full h-full border-none pt-4 bg-white"
                  title="Template Live Preview"
                  onLoad={startAutoScroll}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
