'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getMapIframeSrc } from '@/lib/mapUtils';
import { Heart, Volume2, VolumeX, MailOpen, MapPin, Check, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CardData } from '@/types/card';

interface TemplateProps {
  card: CardData;
  previewMode?: boolean;
}

interface Wish {
  id: number;
  guest_name: string;
  message: string;
  created_at: string;
}

export default function Template15({ card, previewMode = false }: TemplateProps) {
  const [opened, setOpened] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loadingWishes, setLoadingWishes] = useState(false);
  const [showGiftModal, setShowGiftModal] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // RSVP Form state
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState('yes');
  const [rsvpCount, setRsvpCount] = useState(0);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);

  // Guestbook Form state
  const [wishName, setWishName] = useState('');
  const [wishText, setWishText] = useState('');
  const [wishSuccess, setWishSuccess] = useState(false);
  const [wishSubmitting, setWishSubmitting] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (previewMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWishes([
        { id: 1, guest_name: 'Minh Khang', message: 'Chúc hai bạn trăm năm hạnh phúc! Chúc Thành Lộc & Minh Thư mãi mãi yêu thương bền chặt, gia đình ngập tràn may mắn.', created_at: new Date().toISOString() },
        { id: 2, guest_name: 'Thùy Trang', message: 'Chúc mừng đôi bạn trẻ! Thật tiếc vì mình đang ở nước ngoài không thể trực tiếp dự tiệc cưới. Chúc hai bạn bạc đầu nghĩa tình!', created_at: new Date().toISOString() },
      ]);
      return;
    }

    const fetchWishes = async () => {
      setLoadingWishes(true);
      try {
        const { data, error } = await supabase
          .from('guest_messages')
          .select('id, guest_name, message, created_at')
          .eq('card_id', card.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (data) setWishes(data);
      } catch (err) {
        console.error('Error fetching guest wishes:', err);
      } finally {
        setLoadingWishes(false);
      }
    };

    fetchWishes();
  }, [card.id, previewMode]);

  useEffect(() => {
    if (!card.event_date) return;
    const weddingTime = new Date(card.event_date).getTime();
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = weddingTime - now;

      if (distance < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, [card.event_date]);

  const handleOpenEnvelope = () => {
    setOpened(true);
    if (card.music_url && audioRef.current) {
      audioRef.current.play().then(() => {
        setMusicPlaying(true);
      }).catch((err) => {
        console.log('Audio autoplay blocked by browser:', err);
      });
    }
  };

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current.play();
      setMusicPlaying(true);
    }
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previewMode) {
      alert('Chế độ xem thử: Không ghi nhận phản hồi.');
      return;
    }

    setRsvpSubmitting(true);
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: card.id,
          guest_name: rsvpName,
          attend_status: rsvpStatus,
          guests_count: rsvpCount,
          message: 'RSVP: Gửi phản hồi xác nhận',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRsvpSuccess(true);
      } else {
        alert(data.error || 'Lỗi gửi phản hồi.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối gửi RSVP.');
    } finally {
      setRsvpSubmitting(false);
    }
  };

  const handleWishSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishName.trim() || !wishText.trim()) return;

    if (previewMode) {
      const newWish = {
        id: Date.now(),
        guest_name: wishName,
        message: wishText,
        created_at: new Date().toISOString(),
      };
      setWishes([newWish, ...wishes]);
      setWishName('');
      setWishText('');
      setWishSuccess(true);
      return;
    }

    setWishSubmitting(true);
    try {
      const res = await fetch('/api/guestbook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: card.id,
          guest_name: wishName,
          message: wishText,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const newWishObj = {
          id: data.data.id || Date.now(),
          guest_name: wishName,
          message: wishText,
          created_at: new Date().toISOString(),
        };
        setWishes([newWishObj, ...wishes]);
        setWishName('');
        setWishText('');
        setWishSuccess(true);
      } else {
        alert(data.error || 'Lỗi gửi lời chúc.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối gửi lời chúc.');
    } finally {
      setWishSubmitting(false);
    }
  };

  const getQR = (bank?: string | null, acc?: string | null, holder?: string | null) => {
    if (!bank || !acc) return '';
    const name = holder || '';
    const memo = `Mung cuoi ${card.groom_name} ${card.bride_name}`;
    return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=0&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(name)}`;
  };

  const formattedDate = card.event_date
    ? new Date(card.event_date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Chưa cập nhật';

  return (
    <div className="t15-wrapper min-h-screen bg-[#faf8f5] relative overflow-x-hidden text-slate-800">
      {/* Audio Element */}
      {card.music_url && (
        <audio ref={audioRef} src={card.music_url} loop />
      )}

      {/* Envelope Overlay Cover */}
      {!opened && (
        <div className="envelope-overlay z-50">
          <div className="particles-container">
            <div className="particle">✨</div>
            <div className="particle">✨</div>
            <div className="particle">✨</div>
            <div className="particle">✨</div>
          </div>

          <div className="envelope-card shadow-2xl">
            <div className="envelope-seal">
              <i className="fas fa-rings text-[#c5a880] text-xl"></i>
            </div>
            
            <div className="envelope-inner relative">
              <img src="/assets/images/template-15/hoa.webp" className="decor top-left" alt="" />
              <img src="/assets/images/template-15/hoa.webp" className="decor bottom-right" alt="" />

              <div className="envelope-content">
                <h1 className="couple-names-cover font-serif text-[#8a5a2a]">
                  {card.groom_name} <span>&amp;</span> {card.bride_name}
                </h1>
                <div className="divider text-[#c5a880]">❦</div>
                <div className="wedding-date-cover text-xs font-semibold text-[#8a5a2a] uppercase tracking-widest">
                  {card.event_date ? new Date(card.event_date).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Ngày Lễ Thành Hôn'}
                </div>
                <p className="envelope-invite mt-3 italic text-sm text-slate-500">Trân Trọng Kính Mời</p>
                
                <button onClick={handleOpenEnvelope} className="btn-open-card flex items-center justify-center gap-2 bg-[#8a5a2a] hover:bg-[#704820] text-white">
                  <MailOpen size={16} />
                  <span>Mở Thiệp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Music Action Button */}
      {opened && card.music_url && (
        <button
          onClick={toggleMusic}
          className="music-toggle fixed bottom-6 right-6 h-12 w-12 bg-[#8a5a2a] hover:bg-[#704820] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all z-40"
        >
          {musicPlaying ? <Volume2 size={20} className="animate-bounce" /> : <VolumeX size={20} />}
        </button>
      )}

      {/* Main content wrapper */}
      <div className={`template-container ${opened ? 'fade-in animate-fade-in' : 'hidden'} mx-auto max-w-[600px] bg-white shadow-xl relative min-h-screen pb-12`} id="main-container">
        <img src="/assets/images/template-15/hoa.webp" className="bg-decor-top" alt="" />

        {/* Intro Roles (Conditional display for Premium/Luxury) */}
        {card.plan_id !== 'basic' && (
          <header className="wedding-header pt-12 text-center px-6">
            <div className="header-intro flex items-center justify-center gap-4 text-xs font-semibold text-slate-500 uppercase tracking-widest">
              <div className="intro-column flex flex-col items-center">
                <span className="role text-[10px] text-slate-400">{card.groom_role || 'Trưởng Nam'}</span>
                <span className="name text-slate-800 font-bold mt-1">{card.groom_name}</span>
              </div>
              <div className="intro-divider text-[#c5a880] text-base">❦</div>
              <div className="intro-column flex flex-col items-center">
                <span className="role text-[10px] text-slate-400">{card.bride_role || 'Út Nữ'}</span>
                <span className="name text-slate-800 font-bold mt-1">{card.bride_name}</span>
              </div>
            </div>

            {card.cover_image_url && (
              <div className="hero-frame-container mt-6 mx-auto max-w-sm overflow-hidden rounded-2xl border-4 border-white shadow-lg">
                <img
                  src={card.cover_image_url}
                  alt="Cover image"
                  className="w-full h-80 object-cover cursor-zoom-in"
                  onClick={() => setLightboxImg(card.cover_image_url)}
                />
              </div>
            )}

            <div className="hero-names-section mt-6">
              <h1 className="hero-couple-names font-serif text-3xl sm:text-4xl text-slate-900 font-bold">
                {card.groom_name} &amp; {card.bride_name}
              </h1>
              <div className="hero-date text-xs text-[#8a5a2a] font-semibold tracking-wider mt-2">
                {formattedDate}
              </div>
              <div className="hero-invite-badge inline-block bg-[#c5a880]/20 border border-[#c5a880]/50 text-[#8a5a2a] font-bold px-4 py-1 rounded-full text-[10px] tracking-widest mt-3">
                THÂN MỜI
              </div>
            </div>
          </header>
        )}

        {/* Family Information */}
        {card.plan_id !== 'basic' && (
          <section className="parents-info py-8 px-6 mt-8 bg-[#faf8f5]/60 border-t border-b border-[#c5a880]/20">
            <div className="section-title-wrapper flex items-center justify-center gap-2 mb-6">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title font-serif text-lg font-bold text-slate-800">THÔNG TIN LỄ CƯỚI</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <div className="parents-grid grid grid-cols-1 sm:grid-cols-2 gap-8 text-center">
              <div className="family-column space-y-1">
                <h3 className="font-bold text-[#8a5a2a] font-serif text-base">Nhà Trai</h3>
                {card.groom_father_name && <p className="parent-name text-sm">Ông: {card.groom_father_name}</p>}
                {card.groom_mother_name && <p className="parent-name text-sm">Bà: {card.groom_mother_name}</p>}
                {card.groom_address && <p className="text-xs text-slate-500"><i className="fas fa-map-marker-alt text-[10px] mr-1"></i> {card.groom_address}</p>}
              </div>

              <div className="family-column space-y-1">
                <h3 className="font-bold text-[#8a5a2a] font-serif text-base">Nhà Gái</h3>
                {card.bride_father_name && <p className="parent-name text-sm">Ông: {card.bride_father_name}</p>}
                {card.bride_mother_name && <p className="parent-name text-sm">Bà: {card.bride_mother_name}</p>}
                {card.bride_address && <p className="text-xs text-slate-500"><i className="fas fa-map-marker-alt text-[10px] mr-1"></i> {card.bride_address}</p>}
              </div>
            </div>

            <div className="ceremony-announcement text-center mt-8 pt-6 border-t border-slate-200/50">
              <p className="announcement-text text-[10px] tracking-widest text-slate-400 font-bold uppercase">Trân trọng báo tin lễ thành hôn của hai con</p>
              <h2 className="couple-names-vertical font-serif font-bold text-xl text-slate-800 mt-2">
                {card.groom_name} <span className="text-[#8a5a2a] text-base block my-1">&amp;</span> {card.bride_name}
              </h2>
            </div>
          </section>
        )}

        {/* Home Ceremony Details for Basic Plan */}
        {card.plan_id === 'basic' && (
          <section className="parents-info text-center py-8 px-6">
            <h1 className="couple-names-vertical font-serif font-bold text-3xl text-slate-800">
              {card.groom_name} <span className="text-[#8a5a2a]">&amp;</span> {card.bride_name}
            </h1>
            <p className="text-sm text-slate-500 italic mt-4">{card.invitation_text}</p>
          </section>
        )}

        {/* Ceremony details Card */}
        <section className="ceremony-details py-6 px-6 text-center">
          <div className="ceremony-card bg-[#faf8f5] border-2 border-dashed border-[#c5a880]/30 rounded-2xl p-6 max-w-md mx-auto space-y-2">
            <h3 className="font-serif text-[#8a5a2a] font-bold text-lg">LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH</h3>
            <p className="ceremony-time text-xs font-bold text-slate-600">VÀO LÚC {card.ceremony_time || '09:00 SÁNG'}</p>
            <p className="ceremony-date text-sm font-serif font-bold text-[#8a5a2a]">{formattedDate}</p>
            <p className="lunar-date text-[10px] text-slate-400 italic">Mời quý khách đến chung vui cùng gia đình</p>
          </div>
        </section>

        {/* Gallery Album */}
        {card.album_images && card.album_images.length > 0 && (
          <section className="gallery py-12 px-6">
            <div className="section-title-wrapper flex items-center justify-center gap-2 mb-2">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title font-serif text-lg font-bold text-slate-800">ALBUM ẢNH CƯỚI</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <p className="section-subtitle text-center text-xs text-slate-400 italic mb-8">Tình yêu ngọt ngào qua những khung hình</p>
            <div className="gallery-grid grid grid-cols-2 gap-4 max-w-md mx-auto">
              {card.album_images.map((imgUrl, i) => (
                <div
                  key={i}
                  className="gallery-item overflow-hidden rounded-xl shadow-sm border border-slate-100 cursor-zoom-in"
                  onClick={() => setLightboxImg(imgUrl)}
                >
                  <img
                    src={imgUrl}
                    alt={`Album wedding ${i + 1}`}
                    className="gallery-img w-full h-44 object-cover transition hover:scale-[1.02] duration-300"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Wedding Party Info Section */}
        <section className="party-info py-12 px-6 bg-[#faf8f5]/65 border-t border-b border-[#c5a880]/20 text-center">
          <div className="section-title-wrapper flex items-center justify-center gap-2 mb-2">
            <span className="ornament-icon">❦</span>
            <h2 className="section-title font-serif text-lg font-bold text-slate-800">THÔNG TIN TIỆC CƯỚI</h2>
            <span className="ornament-icon">❦</span>
          </div>
          <p className="party-intro-text text-xs text-slate-500">Tiệc cưới được diễn ra tại:</p>
          
          <div className="party-time-badge inline-flex items-center gap-2.5 bg-[#8a5a2a] text-white font-bold py-2.5 px-6 rounded-full text-xs tracking-widest mt-4 shadow-sm">
            <span className="time">{card.ceremony_time || '11:30'}</span>
            <span className="divider">|</span>
            <span className="date">{card.event_date ? new Date(card.event_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '00/00/0000'}</span>
          </div>

          {/* Countdown Widget */}
          <div className="countdown-section mt-8">
            <h3 className="widget-title text-[10px] tracking-widest font-bold text-slate-400 uppercase mb-4">CÙNG ĐẾM NGƯỢC</h3>
            <div className="countdown-container flex justify-center gap-3">
              <div className="countdown-item bg-white border border-[#c5a880]/30 text-[#8a5a2a] p-3 rounded-xl min-w-[65px] shadow-sm">
                <span className="block font-bold text-xl">{timeLeft.days.toString().padStart(2, '0')}</span>
                <small className="text-[10px] text-slate-400">Ngày</small>
              </div>
              <div className="countdown-item bg-white border border-[#c5a880]/30 text-[#8a5a2a] p-3 rounded-xl min-w-[65px] shadow-sm">
                <span className="block font-bold text-xl">{timeLeft.hours.toString().padStart(2, '0')}</span>
                <small className="text-[10px] text-slate-400">Giờ</small>
              </div>
              <div className="countdown-item bg-white border border-[#c5a880]/30 text-[#8a5a2a] p-3 rounded-xl min-w-[65px] shadow-sm">
                <span className="block font-bold text-xl">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                <small className="text-[10px] text-slate-400">Phút</small>
              </div>
              <div className="countdown-item bg-white border border-[#c5a880]/30 text-[#8a5a2a] p-3 rounded-xl min-w-[65px] shadow-sm">
                <span className="block font-bold text-xl">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                <small className="text-[10px] text-slate-400">Giây</small>
              </div>
            </div>
          </div>

          {/* Venue details */}
          <div className="venue-details mt-10 space-y-2">
            <h3 className="font-bold text-slate-800 text-base font-serif">{card.venue_name}</h3>
            <p className="venue-address text-xs text-slate-500 max-w-sm mx-auto flex items-center justify-center gap-1"><MapPin size={12} className="text-[#8a5a2a]" /> {card.venue_address}</p>
            
            {card.map_url && (
              <div className="map-container mt-6 overflow-hidden rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto h-64">
                <iframe
                  src={getMapIframeSrc(card)}
                  allowFullScreen
                  loading="lazy"
                  className="w-full h-full border-none"
                  title="Google Maps"
                />
              </div>
            )}
          </div>
        </section>

        {/* Dresscode suggestions */}
        {card.plan_id !== 'basic' && card.dress_code && (
          <section className="dress-code py-12 px-6 text-center bg-white">
            <div className="section-title-wrapper flex items-center justify-center gap-2 mb-2">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title font-serif text-lg font-bold text-slate-800">DRESS CODE</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <p className="section-subtitle text-center text-xs text-slate-400 italic mb-6">Trang phục gợi ý dự tiệc</p>
            <div className="dress-colors flex justify-center gap-4 items-center">
              {card.dress_code.split(',').map((colorText, i) => {
                const cleanText = colorText.trim();
                let bgStyle = '#dfb279';
                if (cleanText.toLowerCase().includes('kem') || cleanText.toLowerCase().includes('be')) bgStyle = '#FAF9F6';
                else if (cleanText.toLowerCase().includes('gold') || cleanText.toLowerCase().includes('vàng')) bgStyle = '#dfb279';
                else if (cleanText.toLowerCase().includes('trắng')) bgStyle = '#FFFFFF';
                else if (cleanText.toLowerCase().includes('nâu')) bgStyle = '#8a5a2a';

                return (
                  <div key={i} className="color-item flex flex-col items-center gap-1">
                    <div className="color-circle h-10 w-10 rounded-full border border-slate-350 shadow-sm" style={{ backgroundColor: bgStyle }}></div>
                    <span className="text-[10px] font-semibold text-slate-500">{cleanText}</span>
                  </div>
                );
              })}
            </div>
            <p className="dress-code-note text-[10px] text-slate-400 mt-4 max-w-xs mx-auto">Tone trang phục đồng điệu mang đến những kỷ niệm hình ảnh đẹp nhất</p>
          </section>
        )}

        {/* Timeline details */}
        {card.has_schedule && card.wedding_schedule && card.wedding_schedule.length > 0 && (
          <section className="timeline-section py-12 px-6 bg-[#faf8f5]/40 border-t border-[#c5a880]/20">
            <div className="section-title-wrapper flex items-center justify-center gap-2 mb-8 text-center">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title font-serif text-lg font-bold text-slate-800">LỊCH TRÌNH TIỆC CƯỚI</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <div className="timeline-container relative max-w-md mx-auto pl-8">
              <div className="timeline-line absolute left-3 top-2 bottom-2 w-0.5 bg-[#c5a880]"></div>
              {card.wedding_schedule.map((item, index) => (
                <div key={index} className="timeline-item relative space-y-1 mb-6 text-left">
                  <div className="absolute -left-[25px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white bg-[#8a5a2a] shadow-sm"></div>
                  <div className="timeline-time text-xs font-bold text-[#8a5a2a]">{item.time}</div>
                  <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
                  {item.description && <p className="text-xs text-slate-500">{item.description}</p>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RSVP Section */}
        {card.plan_id !== 'basic' && (
          <section className="rsvp py-12 px-6 border-t border-[#c5a880]/20" id="rsvp-section">
            <div className="section-title-wrapper flex items-center justify-center gap-2 mb-2">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title font-serif text-lg font-bold text-slate-800">XÁC NHẬN THAM DỰ</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <p className="section-subtitle text-center text-xs text-slate-400 italic mb-8">Vui lòng phản hồi trước để chúng tôi chuẩn bị đón tiếp chu đáo nhất</p>

            {rsvpSuccess ? (
              <div className="py-8 text-center text-green-600 font-bold text-sm bg-green-50 border border-green-200 rounded-2xl max-w-md mx-auto">
                <Check className="mx-auto" size={32} />
                <p>Cảm ơn bạn đã phản hồi tham dự!</p>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit} className="rsvp-form bg-white border border-[#c5a880]/30 p-6 rounded-2xl shadow-sm space-y-4 max-w-md mx-auto text-left">
                <div className="form-group flex flex-col">
                  <label className="text-xs font-semibold text-slate-700 mb-1">Họ và tên của bạn *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập họ tên..."
                    className="p-3 rounded-lg border border-slate-200 focus:outline-[#8a5a2a] bg-slate-50 text-sm"
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="form-group flex flex-col">
                    <label className="text-xs font-semibold text-slate-700 mb-1">Bạn sẽ tham dự chứ? *</label>
                    <select
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-[#8a5a2a]"
                      value={rsvpStatus}
                      onChange={(e) => setRsvpStatus(e.target.value)}
                    >
                      <option value="yes">Chắc chắn tham gia</option>
                      <option value="no">Tiếc quá, vắng mặt</option>
                    </select>
                  </div>

                  <div className="form-group flex flex-col">
                    <label className="text-xs font-semibold text-slate-700 mb-1">Số người đi cùng</label>
                    <select
                      className="p-3 rounded-lg border border-slate-200 bg-slate-50 text-sm focus:outline-[#8a5a2a]"
                      value={rsvpCount}
                      onChange={(e) => setRsvpCount(Number(e.target.value))}
                    >
                      <option value={0}>Đi một mình</option>
                      <option value={1}>1 người đi cùng</option>
                      <option value={2}>2 người đi cùng</option>
                      <option value={3}>3 người đi cùng</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={rsvpSubmitting}
                  className="w-full bg-[#8a5a2a] hover:bg-[#704820] text-white font-bold py-3.5 rounded-lg text-sm transition shadow flex items-center justify-center gap-1.5"
                >
                  {rsvpSubmitting ? (
                    <RefreshCw className="animate-spin" size={16} />
                  ) : (
                    <span>Gửi xác nhận RSVP</span>
                  )}
                </button>
              </form>
            )}
          </section>
        )}

        {/* Guestbook Section */}
        {card.plan_id !== 'basic' && (
          <section className="guestbook py-12 px-6 bg-[#faf8f5]/40 border-t border-b border-[#c5a880]/20">
            <div className="section-title-wrapper flex items-center justify-center gap-2 mb-2">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title font-serif text-lg font-bold text-slate-800">GỬI LỜI CHÚC MỪNG</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <p className="section-subtitle text-center text-xs text-slate-400 italic mb-8">Để lại những lời chúc ngọt ngào nhất gửi đến cô dâu & chú rể</p>

            <div className="wishes-list space-y-3 max-w-md mx-auto max-h-60 overflow-y-auto mb-6 pr-2">
              {loadingWishes ? (
                <p className="text-center text-xs text-slate-400">Đang tải...</p>
              ) : wishes.length > 0 ? (
                wishes.map((wish) => (
                  <div key={wish.id} className="wish-item bg-white border border-[#c5a880]/30 p-4 rounded-xl shadow-sm text-left">
                    <strong className="text-[#8a5a2a] text-sm block font-bold">{wish.guest_name}</strong>
                    <p className="text-slate-650 text-xs mt-1 leading-relaxed">{wish.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 italic">Chưa có lời chúc nào.</p>
              )}
            </div>

            {wishSuccess ? (
              <div className="text-center py-4 bg-green-50 text-green-600 rounded-xl text-xs max-w-md mx-auto border border-green-200">
                <p>✓ Cảm ơn bạn đã gửi lời chúc mừng!</p>
              </div>
            ) : (
              <form onSubmit={handleWishSubmit} className="wish-form space-y-3 max-w-md mx-auto text-left">
                <input
                  type="text"
                  required
                  placeholder="Tên của bạn..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-[#8a5a2a]"
                  value={wishName}
                  onChange={(e) => setWishName(e.target.value)}
                />
                <textarea
                  rows={2}
                  required
                  placeholder="Nhập lời chúc tốt đẹp nhất gửi đến cô dâu & chú rể..."
                  className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-sm focus:outline-[#8a5a2a]"
                  value={wishText}
                  onChange={(e) => setWishText(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={wishSubmitting}
                  className="w-full bg-[#8a5a2a] hover:bg-[#704820] text-white font-bold py-2.5 rounded-lg text-xs transition"
                >
                  {wishSubmitting ? 'Đang gửi...' : 'Gửi Lời Chúc'}
                </button>
              </form>
            )}
          </section>
        )}

        {/* Gift registry Box mừng cưới Trigger Button */}
        {(card.groom_bank_account || card.bride_bank_account) && (
          <section className="gifts py-12 px-6 text-center">
            <div className="section-title-wrapper flex items-center justify-center gap-2 mb-2">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title font-serif text-lg font-bold text-slate-800">PHONG BAO MỪNG CƯỚI</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <p className="section-subtitle text-center text-xs text-slate-400 italic mb-8">Mọi lời chúc mừng và quà tặng đều được trân quý ghi nhận</p>

            <button
              onClick={() => setShowGiftModal(true)}
              className="gift-envelope-btn flex flex-col items-center justify-center bg-[#faf8f5] hover:bg-[#eae6e0] border border-dashed border-[#c5a880]/40 p-6 rounded-2xl max-w-xs mx-auto shadow-sm transition w-full"
            >
              <div className="envelope-character text-2xl text-[#8a5a2a] animate-bounce"><Heart className="fill-[#8a5a2a]/20" /></div>
              <span className="text-xs font-bold text-slate-700 mt-2">Nhấn để mở phong bao mừng cưới</span>
            </button>
          </section>
        )}

        {/* Footer */}
        <footer className="wedding-footer text-center py-12 border-t border-slate-100 mt-12 bg-white px-4">
          <p className="footer-thank text-center italic font-serif text-slate-500 text-sm mx-auto px-4">
            {card.thank_you_text || 'Sự hiện diện của quý khách là niềm vinh hạnh lớn cho hai bên gia đình chúng tôi!'}
          </p>
            <a href="https://loobycard.com" target="_blank" rel="noopener noreferrer" className="footer-link text-[10px] text-slate-400 hover:text-[#8a5a2a] block mt-6 font-semibold">
              ❦ loobycard.com
            </a>
        </footer>

        <img src="/assets/images/template-15/hoa.webp" className="bg-decor-bottom" alt="" />
      </div>

      {/* Gift Registry Modal Overlay */}
      {showGiftModal && (
        <div className="gift-modal-overlay fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="gift-modal-card bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => setShowGiftModal(false)}
              className="gift-modal-close absolute top-4 right-4 text-2xl font-bold text-slate-400 hover:text-slate-600 h-8 w-8 flex items-center justify-center bg-slate-100 rounded-full"
            >
              ×
            </button>
            <h3 className="modal-title font-serif text-xl font-bold text-center text-slate-800 mb-6">Thông Tin Mừng Cưới</h3>
            
            <div className="bank-accounts-grid grid grid-cols-1 gap-6">
              {card.groom_bank_account && (
                <div className="bank-card bg-slate-50 border border-[#c5a880]/30 rounded-2xl p-4 text-center">
                  <div className="bank-card-header bg-[#8a5a2a] text-white text-[10px] font-bold py-1 px-3 rounded-full inline-block mb-3">
                    CHÚ RỂ
                  </div>
                  <h4 className="account-name font-serif font-bold text-[#8a5a2a] text-base">{card.groom_bank_holder}</h4>
                  <p className="bank-info text-xs text-slate-400 mt-1">{card.groom_bank_name}</p>
                  <p className="account-number font-mono text-sm font-bold text-slate-850 mt-1">Số TK: <strong>{card.groom_bank_account}</strong></p>
                  {getQR(card.groom_bank_name, card.groom_bank_account, card.groom_bank_holder) && (
                    <div className="qr-code mt-3 bg-white p-2 border border-slate-200 rounded-xl w-48 h-48 mx-auto flex items-center justify-center shadow-inner">
                      <img src={getQR(card.groom_bank_name, card.groom_bank_account, card.groom_bank_holder)} alt="Groom Bank QR" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              )}

              {card.bride_bank_account && (
                <div className="bank-card bg-slate-50 border border-[#c5a880]/30 rounded-2xl p-4 text-center">
                  <div className="bank-card-header bg-[#8a5a2a] text-white text-[10px] font-bold py-1 px-3 rounded-full inline-block mb-3">
                    CÔ DÂU
                  </div>
                  <h4 className="account-name font-serif font-bold text-[#8a5a2a] text-base">{card.bride_bank_holder}</h4>
                  <p className="bank-info text-xs text-slate-400 mt-1">{card.bride_bank_name}</p>
                  <p className="account-number font-mono text-sm font-bold text-slate-850 mt-1">Số TK: <strong>{card.bride_bank_account}</strong></p>
                  {getQR(card.bride_bank_name, card.bride_bank_account, card.bride_bank_holder) && (
                    <div className="qr-code mt-3 bg-white p-2 border border-slate-200 rounded-xl w-48 h-48 mx-auto flex items-center justify-center shadow-inner">
                      <img src={getQR(card.bride_bank_name, card.bride_bank_account, card.bride_bank_holder)} alt="Bride Bank QR" className="w-full h-full object-contain" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal Overlay */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
          id="lightbox"
          onClick={(e) => { if (e.target === e.currentTarget) setLightboxImg(null); }}
        >
          <button
            className="absolute right-5 top-5 z-[81] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-3xl leading-none text-white transition hover:bg-white/20"
            id="lightbox-close"
            onClick={() => setLightboxImg(null)}
          >
            ×
          </button>
          <div className="flex max-h-[90vh] max-w-[92vw] items-center justify-center">
            <img src={lightboxImg} alt="Photo Fullscreen" className="max-h-[90vh] max-w-full object-contain shadow-2xl" id="lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
}
