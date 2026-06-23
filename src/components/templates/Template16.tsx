'use client';

import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { CardData } from '@/types/card';
import '@/styles/templates/template-16.css';

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

export default function Template16({ card, previewMode = false }: TemplateProps) {
  const [opened, setOpened] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loadingWishes, setLoadingWishes] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
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
      setWishes([
        { id: 1, guest_name: 'Minh Tuấn', message: 'Chúc mừng hạnh phúc hai em! Chúc gia đình nhỏ luôn rộn rã tiếng cười, trăm năm bạc đầu nghĩa tình.', created_at: new Date().toISOString() },
        { id: 2, guest_name: 'Bích Trâm', message: 'Tiệc cưới đẹp và ý nghĩa quá. Chúc hai bạn luôn yêu thương và cùng nhau nắm tay đi hết đoạn đường đời nhé!', created_at: new Date().toISOString() },
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
        alert('Phản hồi RSVP của bạn đã được gửi thành công!');
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

  const getCalendar = () => {
    if (!card.event_date) return null;
    const date = new Date(card.event_date);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // 0 = Sunday, 1 = Monday...
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const blanks = Array(firstDayIndex).fill(null);
    const days = Array.from({ length: totalDays }, (_, i) => i + 1);
    const allDays = [...blanks, ...days];
    
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < allDays.length; i += 7) {
      weeks.push(allDays.slice(i, i + 7));
    }
    
    return {
      year,
      month: month + 1,
      weeks,
      targetDay: date.getDate()
    };
  };

  const calData = getCalendar();

  const formattedDate = card.event_date
    ? new Date(card.event_date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'Thứ Bảy, 07 Tháng 02, 2026';

  const longDate = card.event_date
    ? new Date(card.event_date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).toUpperCase()
    : 'THỨ BẢY, 07 THÁNG 02, 2026';

  const coverDateText = card.event_date
    ? new Date(card.event_date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    : '07 tháng 02, 2026';

  const coverImage = card.cover_image_url || '/assets/images/template-16/photo1.jpg';
  const albumImages = card.album_images && card.album_images.length > 0 ? card.album_images : [
    '/assets/images/template-16/photo2.jpg',
    '/assets/images/template-16/photo3.jpg',
    '/assets/images/template-16/photo4.jpg',
    '/assets/images/template-16/photo5.jpg',
  ];

  const mapIframeSrc = card.map_url && card.map_url.includes('google.com/maps') 
    ? card.map_url 
    : `https://maps.google.com/maps?q=${encodeURIComponent(card.venue_address || card.venue_name || '')}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

  return (
    <div className="t16-wrapper">
      {/* Background Music */}
      {card.music_url && (
        <audio id="bg-music" ref={audioRef} src={card.music_url} loop></audio>
      )}

      {/* Envelope Overlay Screen */}
      <div className={`envelope-overlay ${opened ? 'open' : ''}`} id="envelope-overlay">
        {/* Ambient floating particles */}
        <div className="particles-container" id="particles-container">
          <div className="particle" style={{ left: '20%', animationDelay: '0s' }}>🌿</div>
          <div className="particle" style={{ left: '40%', animationDelay: '2s' }}>🌿</div>
          <div className="particle" style={{ left: '60%', animationDelay: '4s' }}>🌿</div>
          <div className="particle" style={{ left: '80%', animationDelay: '1s' }}>🌿</div>
        </div>

        <div className="envelope-card">
          <div className="envelope-seal">
            <i className="fas fa-heart"></i>
          </div>
          <div className="envelope-inner">
            {/* Elegant teal leaf decorations */}
            <img src="/assets/images/template-16/la1.webp" className="decor top-left" alt="" />
            <img src="/assets/images/template-16/la2.webp" className="decor bottom-right" alt="" />

            <div className="envelope-content">
              <h1 className="couple-names-cover">{card.groom_name} <span>&amp;</span> {card.bride_name}</h1>
              <div className="divider">❦</div>
              <div className="wedding-date-cover">{coverDateText}</div>
              <p className="envelope-invite">Thân Mời</p>
              <button className="btn-open-card" id="btn-open-card" onClick={handleOpenEnvelope}>
                <span>Mở thiệp</span>
                <div className="btn-shine"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Music toggle button */}
      {card.music_url && (
        <button className={`music-toggle ${musicPlaying ? 'playing' : ''}`} id="music-toggle" style={{ display: opened ? 'flex' : 'none' }} onClick={toggleMusic}>
          <i className={musicPlaying ? "fas fa-volume-up" : "fas fa-volume-mute"}></i>
          {musicPlaying && (
            <div className="music-waves">
              <span></span>
              <span></span>
              <span></span>
              <span></span>
            </div>
          )}
        </button>
      )}

      {/* Main Invitation Content */}
      <div className="template-container" id="main-container" style={{ display: opened ? 'block' : 'none' }}>
        {/* Top elegant leaf */}
        <img src="/assets/images/template-16/la1.webp" className="bg-decor-top" alt="" />

        {/* Header / Intro Section */}
        <header className="wedding-header">
          <div className="header-intro">
            <div className="intro-column">
              <span className="role">{card.groom_role || 'Trưởng Nam'}</span>
              <span className="name">{card.groom_name}</span>
            </div>
            <div className="intro-divider">
              <span className="divider-char">❦</span>
            </div>
            <div className="intro-column">
              <span className="role">{card.bride_role || 'Út Nữ'}</span>
              <span className="name">{card.bride_name}</span>
            </div>
          </div>
          <div className="hero-frame-container">
            <div className="hero-frame">
              <img src={coverImage} alt="Ảnh cưới" className="hero-image" />
            </div>
          </div>
          <div className="hero-names-section">
            <h1 className="hero-couple-names">{card.groom_name} &amp; {card.bride_name}</h1>
            <div className="hero-date">{formattedDate}</div>
            <div className="hero-invite-badge">THÂN MỜI</div>
          </div>
        </header>

        {/* Parents Info Section */}
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
              <div className="title-divider"></div>
              <p className="announcement-text">TRÂN TRỌNG BÁO TIN LỄ THÀNH HÔN CỦA CON CHÚNG TÔI</p>
              <h1 className="couple-names-vertical">
                <span className="groom-name">{card.groom_name}</span>
                <span className="and-symbol">&amp;</span>
                <span className="bride-name">{card.bride_name}</span>
              </h1>
              <div className="title-divider"></div>
            </div>

            {/* Home Ceremony Details */}
            <div className="ceremony-card">
              <h3>LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI TƯ GIA</h3>
              <p className="ceremony-time">VÀO LÚC {card.ceremony_time || '09:00 SÁNG'}</p>
              <p className="ceremony-date">{longDate}</p>
              <p className="lunar-date">{card.invitation_text}</p>
            </div>
          </section>
        )}

        {/* Photo Album Section */}
        {albumImages.length > 0 && (
          <section className="gallery">
            <div className="section-title-wrapper">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title">ALBUM ẢNH CƯỚI</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <p className="section-subtitle">Tình yêu ngọt ngào qua những khung hình</p>
            <div className="gallery-grid">
              {albumImages.slice(0, 4).map((imgUrl, i) => {
                if (i === 3 && albumImages.length > 4) {
                  return (
                    <div key={i} className="gallery-item overlay-item" onClick={() => setLightboxImg(imgUrl)} style={{ cursor: 'pointer' }}>
                      <img src={imgUrl} alt={`Gallery ${i + 1}`} className="gallery-img" />
                      <div className="more-overlay">
                        <span>+{albumImages.length - 4} ảnh</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className="gallery-item" onClick={() => setLightboxImg(imgUrl)} style={{ cursor: 'pointer' }}>
                    <img src={imgUrl} alt={`Gallery ${i + 1}`} className="gallery-img" />
                  </div>
                );
              })}
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
          <p className="party-intro-text">Tiệc cưới được diễn ra vào lúc:</p>
          <div className="party-time-badge">
            <span className="time">{card.ceremony_time || '18:00'}</span>
            <span className="divider">|</span>
            <span className="date">{card.event_date ? new Date(card.event_date).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }) : '00/00/0000'}</span>
          </div>
          <p className="lunar-date">(Kính mời quý khách tới dự)</p>

          {/* Countdown Widget */}
          <div className="countdown-section">
            <h3 className="widget-title">CÙNG ĐẾM NGƯỢC</h3>
            <div className="countdown-container" id="countdown">
              <div className="countdown-item">
                <span id="days">{timeLeft.days.toString().padStart(2, '0')}</span>
                <small>Ngày</small>
              </div>
              <div className="countdown-item">
                <span id="hours">{timeLeft.hours.toString().padStart(2, '0')}</span>
                <small>Giờ</small>
              </div>
              <div className="countdown-item">
                <span id="mins">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                <small>Phút</small>
              </div>
              <div className="countdown-item">
                <span id="secs">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                <small>Giây</small>
              </div>
            </div>
          </div>

          {/* Calendar Highlight */}
          {calData && (
            <div className="calendar-widget">
              <h3 className="calendar-month">Tháng {calData.month.toString().padStart(2, '0')} / {calData.year}</h3>
              <table className="calendar-table">
                <thead>
                  <tr>
                    <th>CN</th>
                    <th>T2</th>
                    <th>T3</th>
                    <th>T4</th>
                    <th>T5</th>
                    <th>T6</th>
                    <th>T7</th>
                  </tr>
                </thead>
                <tbody>
                  {calData.weeks.map((week, wi) => (
                    <tr key={wi}>
                      {week.map((day, di) => {
                        const isWeddingDay = day === calData.targetDay;
                        return (
                          <td key={di} className={isWeddingDay ? "wedding-highlight" : ""}>
                            {day || ''}
                            {isWeddingDay && <div className="teal-indicator">🌿</div>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="calendar-actions">
                {card.map_url && (
                  <a href={card.map_url} target="_blank" rel="noopener noreferrer" className="btn-add-calendar">
                    <i className="far fa-map"></i> Xem Google Maps
                  </a>
                )}
                <a href="#rsvp-section" className="btn-rsvp-scroll">
                  <i className="far fa-check-circle"></i> Xác nhận RSVP
                </a>
              </div>
            </div>
          )}

          {/* Venue details */}
          <div className="venue-details">
            <h3>ĐỊA ĐIỂM TỔ CHỨC TIỆC CƯỚI</h3>
            <p className="venue-name">{card.venue_name}</p>
            <p className="venue-address"><i className="fas fa-map-marker-alt"></i> {card.venue_address}</p>

            {/* Google Map Iframe */}
            {card.map_url && (
              <div className="map-container">
                <iframe
                  src={mapIframeSrc}
                  allowFullScreen
                  loading="lazy"
                  title="Bản đồ"
                  style={{ width: '100%', height: '100%', border: 'none' }}
                >
                </iframe>
              </div>
            )}
          </div>
        </section>

        {/* Dress Code Section */}
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
                let bgStyle = '#72a89f';
                if (cleanText.toLowerCase().includes('kem') || cleanText.toLowerCase().includes('be') || cleanText.toLowerCase().includes('trắng kem')) bgStyle = '#FAF9F6';
                else if (cleanText.toLowerCase().includes('teal') || cleanText.toLowerCase().includes('xanh') || cleanText.toLowerCase().includes('light teal')) bgStyle = '#72a89f';
                else if (cleanText.toLowerCase().includes('đậm') || cleanText.toLowerCase().includes('teal đậm')) bgStyle = '#1e5b53';
                else if (cleanText.toLowerCase().includes('trắng')) bgStyle = '#FFFFFF';
                else if (cleanText.toLowerCase().includes('đen')) bgStyle = '#1A1A1A';

                return (
                  <div key={i} className="color-item">
                    <div className="color-circle" style={{ backgroundColor: bgStyle, border: bgStyle === '#FAF9F6' || bgStyle === '#FFFFFF' ? '1px solid rgba(46, 125, 112, 0.4)' : 'none' }}></div>
                    <span>{cleanText}</span>
                  </div>
                );
              })}
            </div>
            <p className="dress-code-note">Tone trang phục đồng điệu mang đến những kỷ niệm hình ảnh tự nhiên nhất</p>
          </section>
        )}

        {/* Wedding Timeline Section */}
        {card.plan_id !== 'basic' && (
          <section className="timeline-section">
            <div className="section-title-wrapper">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title">LỊCH TRÌNH TIỆC CƯỚI</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <div className="timeline-container">
              <div className="timeline-line"></div>

              <div className="timeline-item">
                <div className="timeline-time">17:00</div>
                <div className="timeline-badge"></div>
                <div className="timeline-content">
                  <h4>ĐÓN KHÁCH</h4>
                  <p>Đón tiếp khách mời chụp ảnh lưu niệm cùng Cô dâu &amp; Chú rể tại sảnh tiệc</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-time">18:00</div>
                <div className="timeline-badge"></div>
                <div className="timeline-content">
                  <h4>KHAI TIỆC</h4>
                  <p>MC tuyên bố bắt đầu, tiết mục múa khai vị chào mừng quan khách</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-time">18:15</div>
                <div className="timeline-badge"></div>
                <div className="timeline-content">
                  <h4>NGHI THỨC HÔN LỄ</h4>
                  <p>Rót rượu hồng chúc mừng, cắt bánh cưới và đại diện gia đình cảm ơn</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-time">18:30</div>
                <div className="timeline-badge"></div>
                <div className="timeline-content">
                  <h4>NHẬP TIỆC ĐÃI KHÁCH</h4>
                  <p>Dùng tiệc đãi khách ấm cúng, ban nhạc Acoustic phục vụ văn nghệ chúc mừng</p>
                </div>
              </div>

              <div className="timeline-item">
                <div className="timeline-time">21:00</div>
                <div className="timeline-badge"></div>
                <div className="timeline-content">
                  <h4>CẢM ƠN TIỄN KHÁCH</h4>
                  <p>Cô dâu, chú rể chụp hình lưu niệm cùng các khách mời trước khi ra về</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* RSVP Section */}
        <section className="rsvp" id="rsvp-section">
          <div className="section-title-wrapper">
            <span className="ornament-icon">❦</span>
            <h2 className="section-title">XÁC NHẬN THAM DỰ</h2>
            <span className="ornament-icon">❦</span>
          </div>
          <p className="section-subtitle">Vui lòng xác nhận sự hiện diện của bạn để chúng tôi chuẩn bị tốt nhất</p>

          <form className="rsvp-form" id="rsvp-form" onSubmit={handleRsvpSubmit}>
            <div className="form-group">
              <label htmlFor="guest-name">Họ và tên của bạn *</label>
              <input type="text" id="guest-name" placeholder="Nhập tên của bạn" required value={rsvpName} onChange={(e) => setRsvpName(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="guest-status">Bạn có thể tham dự không? *</label>
              <select id="guest-status" required value={rsvpStatus} onChange={(e) => setRsvpStatus(e.target.value)}>
                <option value="yes">Tôi chắc chắn sẽ đến</option>
                <option value="no">Tiếc quá, tôi không thể đến</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="guest-count">Số người tham dự đi cùng</label>
              <select id="guest-count" value={rsvpCount} onChange={(e) => setRsvpCount(Number(e.target.value))}>
                <option value={0}>Đi một mình</option>
                <option value={1}>1 người đi cùng</option>
                <option value={2}>2 người đi cùng</option>
                <option value={3}>3 người đi cùng</option>
              </select>
            </div>
            <button type="submit" className="btn-submit" disabled={rsvpSubmitting}>
              <span>{rsvpSubmitting ? 'Đang Gửi...' : 'Gửi Xác Nhận'}</span>
              <div className="btn-shine"></div>
            </button>
          </form>
        </section>

        {/* Guestbook Section */}
        {card.plan_id !== 'basic' && (
          <section className="guestbook">
            <div className="section-title-wrapper">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title">GỬI LỜI CHÚC MỪNG</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <p className="section-subtitle">Để lại những kỷ niệm ngọt ngào nhất cùng cặp đôi</p>

            <form className="wish-form" id="wish-form" onSubmit={handleWishSubmit}>
              <div className="form-group">
                <input type="text" id="wish-name" placeholder="Nhập tên của bạn *" required value={wishName} onChange={(e) => setWishName(e.target.value)} />
              </div>
              <div className="form-group">
                <textarea id="wish-text" rows={3} placeholder="Gửi lời chúc tốt đẹp nhất tới cô dâu &amp; chú rể... *" required value={wishText} onChange={(e) => setWishText(e.target.value)}></textarea>
              </div>
              <div className="form-group">
                <button type="submit" className="btn-submit-wish" disabled={wishSubmitting}>{wishSubmitting ? 'Đang gửi...' : 'Gửi Lời Chúc'}</button>
              </div>
            </form>

            <div className="guestbook-list" id="wishes-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {loadingWishes ? (
                <p style={{ textAlign: 'center', opacity: 0.7 }}>Đang tải lời chúc...</p>
              ) : wishes.length > 0 ? (
                wishes.map((wish) => (
                  <div key={wish.id} className="wish-item">
                    <strong>{wish.guest_name}</strong>
                    <p>{wish.message}</p>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', opacity: 0.7 }}>Chưa có lời chúc nào.</p>
              )}
            </div>
          </section>
        )}

        {/* Gift Registry Section */}
        {(card.groom_bank_account || card.bride_bank_account) && (
          <section className="gifts">
            <div className="section-title-wrapper">
              <span className="ornament-icon">❦</span>
              <h2 className="section-title">PHONG BAO MỪNG CƯỚI</h2>
              <span className="ornament-icon">❦</span>
            </div>
            <p className="section-subtitle">Mọi lời chúc mừng và quà tặng đều được trân quý ghi nhận</p>

            <div className="gift-registry-trigger-container">
              <button className="gift-envelope-btn" id="gift-modal-trigger" onClick={() => setGiftModalOpen(true)}>
                <div className="envelope-character"><i className="fas fa-gift"></i></div>
                <span>Nhấn để mở phong bao mừng cưới</span>
              </button>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="wedding-footer">
          <p className="footer-thank">{card.thank_you_text || 'Sự hiện diện của bạn là món quà ý nghĩa nhất đối với chúng tôi!'}</p>
          <a href="https://loobycard.com" target="_blank" rel="noopener noreferrer" className="footer-link">❦ Loobycard.com</a>
        </footer>

        {/* Bottom elegant leaf */}
        <img src="/assets/images/template-16/la2.webp" className="bg-decor-bottom" alt="" />
      </div>

      {/* Gift Registry Modal Overlay */}
      {giftModalOpen && (
        <div className="gift-modal-overlay active" id="gift-modal">
          <div className="gift-modal-card">
            <button className="gift-modal-close" id="gift-modal-close" onClick={() => setGiftModalOpen(false)}>×</button>
            <h3 className="modal-title">Thông Tin Mừng Cưới</h3>
            <div className="bank-accounts-grid">
              {card.groom_bank_account && (
                <div className="bank-card">
                  <div className="bank-card-header">{card.groom_role || 'Chú Rể'}</div>
                  <h4 className="account-name">{card.groom_bank_holder}</h4>
                  <p className="bank-info">{card.groom_bank_name}</p>
                  <p className="account-number">Số TK: <strong>{card.groom_bank_account}</strong></p>
                  <div className="qr-code">
                    {getQR(card.groom_bank_name, card.groom_bank_account, card.groom_bank_holder) && (
                      <img src={getQR(card.groom_bank_name, card.groom_bank_account, card.groom_bank_holder)} alt="Groom QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    )}
                  </div>
                </div>
              )}

              {card.bride_bank_account && (
                <div className="bank-card">
                  <div className="bank-card-header">{card.bride_role || 'Cô Dâu'}</div>
                  <h4 className="account-name">{card.bride_bank_holder}</h4>
                  <p className="bank-info">{card.bride_bank_name}</p>
                  <p className="account-number">Số TK: <strong>{card.bride_bank_account}</strong></p>
                  <div className="qr-code">
                    {getQR(card.bride_bank_name, card.bride_bank_account, card.bride_bank_holder) && (
                      <img src={getQR(card.bride_bank_name, card.bride_bank_account, card.bride_bank_holder)} alt="Bride QR" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal Overlay */}
      {lightboxImg && (
        <div className="lightbox-overlay active" id="lightbox" onClick={(e) => { if (e.target === e.currentTarget) setLightboxImg(null); }}>
          <button className="lightbox-close" id="lightbox-close" onClick={() => setLightboxImg(null)}>×</button>
          <div className="lightbox-content">
            <img src={lightboxImg} alt="Photo Fullscreen" className="lightbox-img" id="lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
}
