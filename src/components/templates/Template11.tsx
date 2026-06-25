'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getMapIframeSrc } from '@/lib/mapUtils';
import { supabase } from '@/lib/supabase';
import { CardData } from '@/types/card';
import '@/styles/templates/template-11.css';

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

export default function Template11({ card, previewMode = false }: TemplateProps) {
  const [opened, setOpened] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loadingWishes, setLoadingWishes] = useState(false);
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
        { id: 1, guest_name: 'Chị Phương Linh', message: 'Chúc hai em trăm năm hạnh phúc, mãi mãi bên nhau đầu bạc răng long nhé! Chúc mừng hạnh phúc gia đình mới.', created_at: new Date().toISOString() },
        { id: 2, guest_name: 'Anh Tiến Đạt', message: 'Chúc mừng ngày trọng đại của cô dâu chú rể! Chúc cuộc sống hôn nhân luôn tràn đầy tiếng cười.', created_at: new Date().toISOString() },
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

  const formattedDate = card.event_date
    ? new Date(card.event_date).toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Ngày Lễ Thành Hôn';

  const shortDate = card.event_date
    ? new Date(card.event_date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).replace(/\//g, ' • ')
    : '00 • 00 • 0000';

  const longDate = card.event_date
    ? new Date(card.event_date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Chủ Nhật, 25 Tháng 10 Năm 2026';

  const coverImage = card.cover_image_url || '/assets/images/template-11/photo1.webp';
  const albumImages = card.album_images && card.album_images.length > 0 ? card.album_images : [
    '/assets/images/template-11/photo2.webp',
    '/assets/images/template-11/photo3.webp',
    '/assets/images/template-11/photo4.webp',
    '/assets/images/template-11/photo5.webp',
    '/assets/images/template-11/photo6.webp',
    '/assets/images/template-11/photo7.webp',
  ];

  const mapIframeSrc = getMapIframeSrc(card);

  return (
    <div className="t11-wrapper">
      {/* Background Music */}
      {card.music_url && (
        <audio id="bg-music" ref={audioRef} src={card.music_url} loop></audio>
      )}

      {/* Envelope Overlay Screen */}
      <div className={`envelope-overlay ${opened ? 'open' : ''}`} id="envelope-overlay">
        {/* Ambient flower fall particles */}
        <div className="particles-container">
          <div className="particle" style={{ left: '10%', animationDelay: '0s' }}>🌸</div>
          <div className="particle" style={{ left: '30%', animationDelay: '2s' }}>🌸</div>
          <div className="particle" style={{ left: '50%', animationDelay: '4s' }}>🌸</div>
          <div className="particle" style={{ left: '70%', animationDelay: '1s' }}>🌸</div>
          <div className="particle" style={{ left: '90%', animationDelay: '3s' }}>🌸</div>
          <div className="particle" style={{ left: '20%', animationDelay: '5s' }}>🌸</div>
        </div>
        
        <div className="envelope-card">
          <div className="envelope-seal">
            <i className="fas fa-heart"></i>
          </div>
          <div className="envelope-inner">
            {/* Corner decorations */}
            <img src="/assets/images/template-11/hoa.webp" className="decor top-left" alt="" />
            <img src="/assets/images/template-11/hoa.webp" className="decor bottom-right" alt="" />
            
            <div className="envelope-content">
              <h1 className="couple-names-cover">{card.groom_name} <span>&amp;</span> {card.bride_name}</h1>
              <div className="divider">❦</div>
              <div className="wedding-date-cover">{formattedDate}</div>
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
        </button>
      )}

      {/* Main Invitation Content */}
      <div className="template-container" id="main-container" style={{ display: opened ? 'block' : 'none' }}>
        {/* Top floral decorations */}
        <img src="/assets/images/template-11/hoa.webp" className="bg-decor-top" alt="" />

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-frame">
            <img src={coverImage} alt="Ảnh cưới" className="hero-image" />
          </div>
          <h1 className="couple-names">{card.groom_name} &amp; {card.bride_name}</h1>
          <div className="date-badge">{shortDate}</div>
          <p className="invitation-text">{card.invitation_text || 'Trân trọng kính mời quý khách đến dự buổi tiệc chung vui cùng gia đình chúng tôi'}</p>
        </section>

        {/* Parents Info Section */}
        {card.plan_id !== 'basic' && (
          <section className="parents-info">
            <div className="parents-grid">
              <div className="family-column">
                <h3>Nhà Trai</h3>
                {card.groom_father_name && <p className="parent-name">Ông: {card.groom_father_name}</p>}
                {card.groom_mother_name && <p className="parent-name">Bà: {card.groom_mother_name}</p>}
                <p className="couple-role">{card.groom_role || 'Chú rể'}: <strong>{card.groom_name}</strong></p>
              </div>
              <div className="family-column">
                <h3>Nhà Gái</h3>
                {card.bride_father_name && <p className="parent-name">Ông: {card.bride_father_name}</p>}
                {card.bride_mother_name && <p className="parent-name">Bà: {card.bride_mother_name}</p>}
                <p className="couple-role">{card.bride_role || 'Cô dâu'}: <strong>{card.bride_name}</strong></p>
              </div>
            </div>
          </section>
        )}

        {/* Event Details & Timeline Section */}
        <section className="events">
          <h2 className="section-title">Sự Kiện Trọng Đại</h2>
          <div className="event-card">
            <h3>Lễ Thành Hôn</h3>
            <p className="event-detail"><i className="far fa-calendar-alt"></i> {longDate}</p>
            <p className="event-detail"><i className="far fa-clock"></i> Đón khách: {card.reception_time} | Khai tiệc: {card.ceremony_time}</p>
            <p className="event-detail"><i className="fas fa-map-marker-alt"></i> {card.venue_name}<br />{card.venue_address}</p>
            {card.map_url && (
              <a href={card.map_url} target="_blank" rel="noopener noreferrer" className="btn-map"><i className="fas fa-map-marked-alt"></i> Chỉ đường qua Bản đồ</a>
            )}
            {/* Map iframe inline for display purpose matching original template behavior */}
            {card.map_url && (
              <div style={{ marginTop: '20px', borderRadius: '15px', overflow: 'hidden', height: '250px' }}>
                <iframe src={mapIframeSrc} style={{ width: '100%', height: '100%', border: 'none' }} title="Bản đồ"></iframe>
              </div>
            )}
          </div>

          {/* Time Countdown Widget */}
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

          {/* Detail Timeline (Static visual component like original) */}
          <div className="timeline-box">
            <h3>Chương Trình Tiệc Cưới</h3>
            <div className="timeline-item">
              <span className="time">17:30</span>
              <span className="detail">Đón khách &amp; Chụp ảnh lưu niệm</span>
            </div>
            <div className="timeline-item">
              <span className="time">18:30</span>
              <span className="detail">Khai mạc lễ cưới &amp; Làm lễ thành hôn</span>
            </div>
            <div className="timeline-item">
              <span className="time">18:45</span>
              <span className="detail">Nghi thức rót rượu, cắt bánh kem</span>
            </div>
            <div className="timeline-item">
              <span className="time">19:00</span>
              <span className="detail">Nhập tiệc đãi khách &amp; Chương trình văn nghệ</span>
            </div>
            <div className="timeline-item">
              <span className="time">21:00</span>
              <span className="detail">Kết thúc tiệc cưới &amp; Cảm ơn khách mời</span>
            </div>
          </div>
        </section>

        {/* Photo Album Section */}
        {albumImages.length > 0 && (
          <section className="gallery">
            <h2 className="section-title">Khoảnh Khắc Hạnh Phúc</h2>
            <p className="section-subtitle">Tình yêu ngọt ngào qua những khung hình</p>
            <div className="gallery-grid">
              {albumImages.map((imgUrl, i) => (
                <img key={i} src={imgUrl} alt={`Gallery ${i + 1}`} className="gallery-img" onClick={() => setLightboxImg(imgUrl)} />
              ))}
            </div>
          </section>
        )}

        {/* RSVP Section */}
        <section className="rsvp">
          <h2 className="section-title">Xác Nhận Tham Dự</h2>
          <p className="section-subtitle">Để gia đình chuẩn bị đón tiếp một cách chu đáo nhất</p>
          
          <form className="rsvp-form" id="rsvp-form" onSubmit={handleRsvpSubmit}>
            <div className="form-group">
              <label htmlFor="guest-name">Tên của bạn</label>
              <input type="text" id="guest-name" placeholder="Nhập họ tên của bạn" required value={rsvpName} onChange={(e) => setRsvpName(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="guest-status">Khả năng tham dự</label>
              <select id="guest-status" required value={rsvpStatus} onChange={(e) => setRsvpStatus(e.target.value)}>
                <option value="yes">Chắc chắn tham dự</option>
                <option value="no">Rất tiếc không thể đến</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="guest-count">Số người tham dự đi cùng</label>
              <select id="guest-count" value={rsvpCount} onChange={(e) => setRsvpCount(Number(e.target.value))}>
                <option value={0}>Đi một mình</option>
                <option value={1}>1 người đi cùng</option>
                <option value={2}>2 người đi cùng</option>
              </select>
            </div>
            <button type="submit" className="btn-submit" disabled={rsvpSubmitting}>{rsvpSubmitting ? 'Đang gửi...' : 'Gửi Phản Hồi RSVP'}</button>
          </form>
        </section>

        {/* Guestbook Section */}
        {card.plan_id !== 'basic' && (
          <section className="guestbook">
            <h2 className="section-title">Lời Chúc Từ Khách Mời</h2>
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
            
            <form className="wish-form" id="wish-form" onSubmit={handleWishSubmit}>
              <div className="form-group">
                <input type="text" id="wish-name" placeholder="Tên của bạn" required value={wishName} onChange={(e) => setWishName(e.target.value)} />
              </div>
              <div className="form-group">
                <textarea id="wish-text" rows={3} placeholder="Viết lời chúc tốt đẹp gửi đến cô dâu &amp; chú rể..." required value={wishText} onChange={(e) => setWishText(e.target.value)}></textarea>
              </div>
              <button type="submit" className="btn-submit-wish" disabled={wishSubmitting}>{wishSubmitting ? 'Đang gửi...' : 'Gửi Lời Chúc'}</button>
            </form>
          </section>
        )}

        {/* Gift Section */}
        {(card.groom_bank_account || card.bride_bank_account) && (
          <section className="gifts">
            <h2 className="section-title">Hộp Mừng Cưới</h2>
            <p className="section-subtitle">Mọi lời chúc mừng và quà tặng đều được trân trọng và ghi nhận</p>
            
            <div className="bank-accounts">
              {card.groom_bank_account && (
                <div className="bank-card">
                  <h4>{card.groom_role || 'Chú rể'} {card.groom_name}</h4>
                  <p>Ngân hàng: {card.groom_bank_name}</p>
                  <p>Số tài khoản: <strong>{card.groom_bank_account}</strong></p>
                  <p className="text-[12px] uppercase">{card.groom_bank_holder}</p>
                  <div className="qr-code">
                    {getQR(card.groom_bank_name, card.groom_bank_account, card.groom_bank_holder) ? (
                      <img src={getQR(card.groom_bank_name, card.groom_bank_account, card.groom_bank_holder)} alt="QR" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
                    ) : (
                      <>
                        <i className="fas fa-qrcode"></i>
                        <span>{card.groom_bank_name} QR</span>
                      </>
                    )}
                  </div>
                </div>
              )}
              {card.bride_bank_account && (
                <div className="bank-card">
                  <h4>{card.bride_role || 'Cô dâu'} {card.bride_name}</h4>
                  <p>Ngân hàng: {card.bride_bank_name}</p>
                  <p>Số tài khoản: <strong>{card.bride_bank_account}</strong></p>
                  <p className="text-[12px] uppercase">{card.bride_bank_holder}</p>
                  <div className="qr-code">
                    {getQR(card.bride_bank_name, card.bride_bank_account, card.bride_bank_holder) ? (
                      <img src={getQR(card.bride_bank_name, card.bride_bank_account, card.bride_bank_holder)} alt="QR" style={{ width: '150px', height: '150px', objectFit: 'contain' }} />
                    ) : (
                      <>
                        <i className="fas fa-qrcode"></i>
                        <span>{card.bride_bank_name} QR</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Bottom decor image */}
        <img src="/assets/images/template-11/hoa.webp" className="bg-decor-bottom" alt="" />
      </div>

      {/* Photo Lightbox Modal Overlay (For Album click) */}
      {lightboxImg && (
        <div className="lightbox-overlay" id="lightbox" style={{ display: 'flex', position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1000, justifyContent: 'center', alignItems: 'center' }}>
          <button className="lightbox-close" id="lightbox-close" onClick={() => setLightboxImg(null)} style={{ position: 'absolute', top: '20px', right: '20px', color: 'white', fontSize: '30px', background: 'transparent', border: 'none', cursor: 'pointer' }}>×</button>
          <div className="lightbox-content" style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={lightboxImg} alt="Photo Fullscreen" className="lightbox-img" id="lightbox-img" style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain' }} />
          </div>
        </div>
      )}
    </div>
  );
}
