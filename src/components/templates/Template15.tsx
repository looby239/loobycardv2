'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getMapIframeSrc } from '@/lib/mapUtils';
import { buildVietQrUrl } from '@/lib/vietqr';
import { Heart, Volume2, VolumeX, MailOpen, MapPin, Check, RefreshCw } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { CardData } from '@/types/card';
import '@/styles/templates/template-15.css';

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
    const name = holder || '';
    const memo = `Mung cuoi ${card.groom_name} ${card.bride_name}`;
    return buildVietQrUrl({ bank, account: acc, accountName: name, memo });
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
          className="music-toggle"
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
              <div className="hero-frame-container">
                <div className="hero-frame">
                  <img
                    src={card.cover_image_url}
                    alt="Cover image"
                    className="hero-image cursor-zoom-in"
                    onClick={() => setLightboxImg(card.cover_image_url)}
                  />
                </div>
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
          <section className="parents-info">
            <div className="section-title-wrapper">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title">THÔNG TIN LỄ CƯỚI</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <div className="parents-grid">
              <div className="family-column">
                <h3>Nhà Trai</h3>
                {card.groom_father_name && <p className="parent-name">Ông: {card.groom_father_name}</p>}
                {card.groom_mother_name && <p className="parent-name">Bà: {card.groom_mother_name}</p>}
                {card.groom_address && <p className="parent-address"><i className="fas fa-map-marker-alt"></i> {card.groom_address}</p>}
              </div>

              <div className="family-column">
                <h3>Nhà Gái</h3>
                {card.bride_father_name && <p className="parent-name">Ông: {card.bride_father_name}</p>}
                {card.bride_mother_name && <p className="parent-name">Bà: {card.bride_mother_name}</p>}
                {card.bride_address && <p className="parent-address"><i className="fas fa-map-marker-alt"></i> {card.bride_address}</p>}
              </div>
            </div>

            <div className="ceremony-announcement">
              <p className="announcement-text">Trân trọng báo tin lễ thành hôn của hai con</p>
              <h2 className="couple-names-vertical">
                {card.groom_name} <span className="and-symbol">&amp;</span> {card.bride_name}
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
        <section className="ceremony-details">
          <div className="ceremony-card">
            <h3>LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH</h3>
            <p className="ceremony-time">VÀO LÚC {card.ceremony_time || '09:00 SÁNG'}</p>
            <p className="ceremony-date">{formattedDate}</p>
            <p className="lunar-date">Mời quý khách đến chung vui cùng gia đình</p>
          </div>
        </section>

        {/* Gallery Album */}
        {card.album_images && card.album_images.length > 0 && (
          <section className="gallery">
            <div className="section-title-wrapper">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title">ALBUM ẢNH CƯỚI</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <p className="section-subtitle">Tình yêu ngọt ngào qua những khung hình</p>
            <div className="gallery-grid">
              {card.album_images.map((imgUrl, i) => (
                <div
                  key={i}
                  className="gallery-item cursor-zoom-in"
                  onClick={() => setLightboxImg(imgUrl)}
                >
                  <img
                    src={imgUrl}
                    alt={`Album wedding ${i + 1}`}
                    className="gallery-img"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Wedding Party Info Section */}
        <section className="party-info">
          <div className="section-title-wrapper">
            <span className="ornament-icon">❦</span>
            <h2 className="section-title">THÔNG TIN TIỆC CƯỚI</h2>
            <span className="ornament-icon">❦</span>
          </div>
          <p className="party-intro-text">Tiệc cưới được diễn ra tại:</p>
          
          <div className="party-time-badge">
            <span className="time">{card.ceremony_time || '11:30'}</span>
            <span className="divider">|</span>
            <span className="date">{card.event_date ? new Date(card.event_date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '00/00/0000'}</span>
          </div>

          {/* Countdown Widget */}
          <div className="countdown-section">
            <h3 className="widget-title">CÙNG ĐẾM NGƯỢC</h3>
            <div className="countdown-container">
              <div className="countdown-item">
                <span>{timeLeft.days.toString().padStart(2, '0')}</span>
                <small>Ngày</small>
              </div>
              <div className="countdown-item">
                <span>{timeLeft.hours.toString().padStart(2, '0')}</span>
                <small>Giờ</small>
              </div>
              <div className="countdown-item">
                <span>{timeLeft.minutes.toString().padStart(2, '0')}</span>
                <small>Phút</small>
              </div>
              <div className="countdown-item">
                <span>{timeLeft.seconds.toString().padStart(2, '0')}</span>
                <small>Giây</small>
              </div>
            </div>
          </div>

          {/* Venue details */}
          <div className="venue-details">
            <h3>ĐỊA ĐIỂM TIỆC CƯỚI</h3>
            <h2 className="venue-name">{card.venue_name}</h2>
            <p className="venue-address">{card.venue_address}</p>
            
            {card.map_url && (
              <div className="map-container">
                <iframe
                  src={getMapIframeSrc(card)}
                  allowFullScreen
                  loading="lazy"
                  title="Google Maps"
                />
              </div>
            )}
          </div>
        </section>

        {/* Dresscode suggestions */}
        {card.plan_id !== 'basic' && card.dress_code && (
          <section className="dress-code">
            <div className="section-title-wrapper">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title">DRESS CODE</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <p className="section-subtitle">Trang phục gợi ý dự tiệc</p>
            <div className="dress-colors">
              {card.dress_code.split(',').map((colorText, i) => {
                const cleanText = colorText.trim();
                let bgStyle = '#dfb279';
                if (cleanText.toLowerCase().includes('kem') || cleanText.toLowerCase().includes('be')) bgStyle = '#FAF9F6';
                else if (cleanText.toLowerCase().includes('gold') || cleanText.toLowerCase().includes('vàng')) bgStyle = '#dfb279';
                else if (cleanText.toLowerCase().includes('trắng')) bgStyle = '#FFFFFF';
                else if (cleanText.toLowerCase().includes('nâu')) bgStyle = '#8a5a2a';

                return (
                  <div key={i} className="color-item">
                    <div className="color-circle" style={{ backgroundColor: bgStyle }}></div>
                    <span>{cleanText}</span>
                  </div>
                );
              })}
            </div>
            <p className="dress-code-note">Tone trang phục đồng điệu mang đến những kỷ niệm hình ảnh đẹp nhất</p>
          </section>
        )}

        {/* Timeline details */}
        {card.has_schedule && card.wedding_schedule && card.wedding_schedule.length > 0 && (
          <section className="timeline-section">
            <div className="section-title-wrapper">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title">LỊCH TRÌNH TIỆC CƯỚI</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <div className="timeline-container">
              <div className="timeline-line"></div>
              {card.wedding_schedule.map((item, index) => (
                <div key={index} className="timeline-item">
                  <div className="timeline-time">{item.time}</div>
                  <div className="timeline-badge"></div>
                  <div className="timeline-content">
                    <h4>{item.title}</h4>
                    {item.description && <p>{item.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* RSVP Section */}
        {card.plan_id !== 'basic' && (
          <section className="rsvp" id="rsvp-section">
            <div className="section-title-wrapper">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title">XÁC NHẬN THAM DỰ</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <p className="section-subtitle">Vui lòng phản hồi trước để chúng tôi chuẩn bị đón tiếp chu đáo nhất</p>

            {rsvpSuccess ? (
              <div className="py-8 text-center text-green-600 font-bold text-sm bg-green-50 border border-green-200 rounded-2xl max-w-md mx-auto">
                <Check className="mx-auto" size={32} />
                <p>Cảm ơn bạn đã phản hồi tham dự!</p>
              </div>
            ) : (
              <form onSubmit={handleRsvpSubmit} className="rsvp-form">
                <div className="form-group">
                  <label>Họ và tên của bạn *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập họ tên..."
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Bạn sẽ tham dự chứ? *</label>
                  <select
                    value={rsvpStatus}
                    onChange={(e) => setRsvpStatus(e.target.value)}
                  >
                    <option value="yes">Chắc chắn tham gia</option>
                    <option value="no">Tiếc quá, vắng mặt</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Số người đi cùng</label>
                  <select
                    value={rsvpCount}
                    onChange={(e) => setRsvpCount(Number(e.target.value))}
                  >
                    <option value={0}>Đi một mình</option>
                    <option value={1}>1 người đi cùng</option>
                    <option value={2}>2 người đi cùng</option>
                    <option value={3}>3 người đi cùng</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={rsvpSubmitting}
                  className="btn-submit flex items-center justify-center gap-1.5"
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
          <section className="guestbook">
            <div className="section-title-wrapper">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title">GỬI LỜI CHÚC MỪNG</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <p className="section-subtitle">Để lại những lời chúc ngọt ngào nhất gửi đến cô dâu & chú rể</p>

            <div className="guestbook-list">
              {loadingWishes ? (
                <p className="text-center text-xs text-slate-400">Đang tải...</p>
              ) : wishes.length > 0 ? (
                wishes.map((wish) => (
                  <div key={wish.id} className="wish-item">
                    <strong>{wish.guest_name}</strong>
                    <p>{wish.message}</p>
                  </div>
                ))
              ) : (
                <p className="text-center text-xs text-slate-400 italic">Chưa có lời chúc nào.</p>
              )}
            </div>

            {wishSuccess ? (
              <div className="text-center py-4 bg-green-50 text-green-600 rounded-xl text-xs max-w-md mx-auto border border-green-200 mt-6">
                <p>✓ Cảm ơn bạn đã gửi lời chúc mừng!</p>
              </div>
            ) : (
              <form onSubmit={handleWishSubmit} className="wish-form mt-6">
                <div className="form-group">
                  <label>Tên của bạn *</label>
                  <input
                    type="text"
                    required
                    placeholder="Tên của bạn..."
                    value={wishName}
                    onChange={(e) => setWishName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Lời chúc *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Nhập lời chúc tốt đẹp nhất gửi đến cô dâu & chú rể..."
                    value={wishText}
                    onChange={(e) => setWishText(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={wishSubmitting}
                  className="btn-submit-wish"
                >
                  {wishSubmitting ? 'Đang gửi...' : 'Gửi Lời Chúc'}
                </button>
              </form>
            )}
          </section>
        )}

        {/* Gift registry Box mừng cưới Trigger Button */}
        {(card.groom_bank_account || card.bride_bank_account) && (
          <section className="gifts">
            <div className="section-title-wrapper">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title">PHONG BAO MỪNG CƯỚI</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <p className="section-subtitle">Mọi lời chúc mừng và quà tặng đều được trân quý ghi nhận</p>

            <div className="flex justify-center mt-6 w-full">
              <div className="max-w-xs w-full">
                <button
                  onClick={() => setShowGiftModal(true)}
                  className="gift-envelope-btn"
                >
                  <div className="envelope-character">
                    <Heart className="fill-current" size={24} />
                  </div>
                  <span>Nhấn để mở phong bao mừng cưới</span>
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="wedding-footer">
          <p className="footer-thank">
            {card.thank_you_text || 'Sự hiện diện của quý khách là niềm vinh hạnh lớn cho hai bên gia đình chúng tôi!'}
          </p>
          <a href="https://loobycard.com" target="_blank" rel="noopener noreferrer" className="footer-link">
            ❦ loobycard.com
          </a>
        </footer>

        <img src="/assets/images/template-15/hoa.webp" className="bg-decor-bottom" alt="" />
      </div>


      {/* Gift Registry Modal Overlay */}
      {showGiftModal && (
        <div className="gift-modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowGiftModal(false); }}>
          <div className="gift-modal-card">
            <button
              onClick={() => setShowGiftModal(false)}
              className="gift-modal-close"
            >
              ×
            </button>
            <h3 className="modal-title">Thông Tin Mừng Cưới</h3>
            
            <div className="bank-accounts-grid">
              {card.groom_bank_account && (
                <div className="bank-card">
                  <div className="bank-card-header">
                    CHÚ RỂ
                  </div>
                  <h4 className="account-name">{card.groom_bank_holder}</h4>
                  <p className="bank-info">{card.groom_bank_name}</p>
                  <p className="account-number">Số TK: {card.groom_bank_account}</p>
                  {getQR(card.groom_bank_name, card.groom_bank_account, card.groom_bank_holder) && (
                    <div className="qr-code">
                      <img
                        src={getQR(card.groom_bank_name, card.groom_bank_account, card.groom_bank_holder)}
                        alt="Groom Bank QR"
                        onClick={() => setLightboxImg(getQR(card.groom_bank_name, card.groom_bank_account, card.groom_bank_holder))}
                      />
                    </div>
                  )}
                </div>
              )}

              {card.bride_bank_account && (
                <div className="bank-card">
                  <div className="bank-card-header">
                    CÔ DÂU
                  </div>
                  <h4 className="account-name">{card.bride_bank_holder}</h4>
                  <p className="bank-info">{card.bride_bank_name}</p>
                  <p className="account-number">Số TK: {card.bride_bank_account}</p>
                  {getQR(card.bride_bank_name, card.bride_bank_account, card.bride_bank_holder) && (
                    <div className="qr-code">
                      <img
                        src={getQR(card.bride_bank_name, card.bride_bank_account, card.bride_bank_holder)}
                        alt="Bride Bank QR"
                        onClick={() => setLightboxImg(getQR(card.bride_bank_name, card.bride_bank_account, card.bride_bank_holder))}
                      />
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
          className="fixed inset-0 z-[100001] flex items-center justify-center bg-black/90 p-4"
          id="lightbox"
          onClick={(e) => { if (e.target === e.currentTarget) setLightboxImg(null); }}
        >
          <button
            className="absolute right-5 top-5 z-[100002] flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-3xl leading-none text-white transition hover:bg-white/20"
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
