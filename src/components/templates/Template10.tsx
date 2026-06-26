'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getMapIframeSrc } from '@/lib/mapUtils';
import { supabase } from '@/lib/supabase';
import { CardData } from '@/types/card';
import '@/styles/templates/template-10.css';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

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

export default function Template10({ card, previewMode = false }: TemplateProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState('yes');
  const [rsvpCount, setRsvpCount] = useState(1);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loadingWishes, setLoadingWishes] = useState(false);
  const [wishName, setWishName] = useState('');
  const [wishText, setWishText] = useState('');
  const [wishSubmitting, setWishSubmitting] = useState(false);

  const [musicPlaying, setMusicPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleMusic = () => {
    if (!audioRef.current) return;
    if (musicPlaying) {
      audioRef.current.pause();
      setMusicPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setMusicPlaying(true);
      }).catch(err => console.log(err));
    }
  };

  useEffect(() => {
    if (!card.music_url) return;
    const playAudio = () => {
      if (audioRef.current && !musicPlaying) {
        audioRef.current.play().then(() => {
          setMusicPlaying(true);
          removeListeners();
        }).catch(err => console.log(err));
      }
    };
    const removeListeners = () => {
      window.removeEventListener('click', playAudio);
      window.removeEventListener('touchstart', playAudio);
    };
    window.addEventListener('click', playAudio);
    window.addEventListener('touchstart', playAudio);
    return () => removeListeners();
  }, [card.music_url, musicPlaying]);

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

  useEffect(() => {
    if (previewMode) {
      setWishes([
        { id: 1, guest_name: 'Chị Phương Linh', message: 'Chúc hai em trăm năm hạnh phúc, mãi mãi bên nhau đầu bạc răng long nhé!', created_at: new Date().toISOString() },
        { id: 2, guest_name: 'Anh Tiến Đạt', message: 'Chúc mừng ngày trọng đại của hai bạn! Chúc cuộc sống hôn nhân luôn tràn đầy tiếng cười.', created_at: new Date().toISOString() },
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

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (previewMode) {
      alert('Tính năng RSVP đang ở chế độ xem trước (Preview).');
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
          message: `Gửi từ thiệp cưới của ${card.groom_name} & ${card.bride_name}`,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setRsvpSuccess(true);
        alert('Cảm ơn bạn đã phản hồi tham dự!');
      } else {
        alert(data.error || 'Gửi phản hồi thất bại.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi gửi xác nhận RSVP.');
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

  const formattedDate = card.event_date
    ? new Date(card.event_date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Chưa cập nhật';

  const formattedDateNum = card.event_date
    ? new Date(card.event_date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).replace(/\//g, ' • ')
    : '01 • 06 • 2026';

  // Dynamic VietQR generator
  const getGroomQR = () => {
    const bank = card.groom_bank_name || 'TPB';
    const acc = card.groom_bank_account || '';
    const name = card.groom_bank_holder || card.groom_name;
    const memo = `Mung cuoi ${card.groom_name} ${card.bride_name}`;
    if (!acc) return '';
    return `https://img.vietqr.io/image/${bank}-${acc}-compact2.png?amount=0&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(name)}`;
  };

  const coverImage = card.cover_image_url || '/templates/template-10/assets/images/cover_photo.png';
  const albumImages = card.album_images && card.album_images.length > 0 ? card.album_images : ['/templates/template-10/assets/images/cover_photo.png'];

  const mapIframeSrc = getMapIframeSrc(card);

  return (
    <div className="t10-wrapper">
      <div className="template-container" id="hy-container">
        {/* Floating double happiness animation helper (from original css floating-hy) */}
        <div className="floating-hy" style={{ left: '15%', animationDelay: '0s', fontSize: '24px' }}>囍</div>
        <div className="floating-hy" style={{ left: '45%', animationDelay: '2s', fontSize: '18px' }}>囍</div>
        <div className="floating-hy" style={{ left: '75%', animationDelay: '5s', fontSize: '32px' }}>囍</div>

        {/* Hero Section */}
        <section className="hero">
          <div className="hero-content">
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'center' }}>
              <img src={coverImage} alt="Ảnh cưới" style={{ width: '280px', height: '280px', objectFit: 'cover', borderRadius: '50%', border: '4px solid var(--color-gold)' }} />
            </div>
            <h1 className="names">
              {card.bride_name} 
              <span className="ampersand">&amp;</span> 
              {card.groom_name}
            </h1>
            <div className="date">{formattedDateNum}</div>
            <p className="invitation-text">{card.invitation_text || 'Trân trọng kính mời quý khách đến dự buổi tiệc chung vui cùng gia đình chúng tôi'}</p>
          </div>
        </section>

        {/* Album Section */}
        {albumImages.length > 0 && (
          <section className="album">
            <h2 className="section-title">Khoảnh Khắc</h2>
            <p>Nhìn lại những kỷ niệm ngọt ngào của chúng mình</p>
            <div style={{ marginTop: '2rem', padding: '0 10px' }}>
              <Swiper
                modules={[Pagination, Autoplay]}
                spaceBetween={15}
                slidesPerView={1.5}
                centeredSlides={true}
                loop={true}
                pagination={{ clickable: true }}
                autoplay={{ delay: 3000, disableOnInteraction: false }}
                className="album-swiper"
              >
                {albumImages.map((imgUrl, i) => (
                  <SwiperSlide key={i}>
                    <div style={{ paddingBottom: '30px' }}>
                      <img 
                        src={imgUrl} 
                        alt={`Gallery image ${i + 1}`} 
                        onClick={() => setLightboxImg(imgUrl)} 
                        style={{ 
                          cursor: 'pointer', 
                          width: '100%', 
                          height: '350px', 
                          objectFit: 'cover', 
                          borderRadius: '15px',
                          boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                        }} 
                      />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </section>
        )}

        {/* Event Details Section */}
        <section className="events">
          <h2 className="section-title">Sự Kiện</h2>
          
          <div className="event-card">
            <h3>Lễ Thành Hôn</h3>
            <p><i className="far fa-calendar-alt"></i> {formattedDate}</p>
            <p><i className="far fa-clock"></i> Đón khách: {card.reception_time} | Khai tiệc: {card.ceremony_time}</p>
            <p><i className="fas fa-map-marker-alt"></i> <strong>{card.venue_name}</strong><br />{card.venue_address}</p>
            {card.map_url && (
              <a href={card.map_url} target="_blank" rel="noopener noreferrer" className="btn"><i className="fas fa-map"></i> Chỉ đường</a>
            )}
            {/* Map iframe if available */}
            {card.map_url && (
              <div style={{ marginTop: '20px', borderRadius: '10px', overflow: 'hidden', height: '250px' }}>
                <iframe src={mapIframeSrc} style={{ width: '100%', height: '100%', border: 'none' }} title="Bản đồ"></iframe>
              </div>
            )}
          </div>
          
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
        </section>

        {/* RSVP Section */}
        {card.plan_id !== 'basic' && (
          <section className="rsvp" style={{ background: 'rgba(255,255,255,0.8)' }}>
            <h2 className="section-title">Xác Nhận Tham Dự</h2>
            <p style={{ marginBottom: '2rem' }}>Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi.</p>
            
            <form onSubmit={handleRsvpSubmit} style={{ background: '#fff', padding: '2rem', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <div className="form-group">
                <label htmlFor="name">Tên của bạn</label>
                <input type="text" id="name" className="form-control" placeholder="Nhập tên của bạn" required value={rsvpName} onChange={(e) => setRsvpName(e.target.value)} />
              </div>
              <div className="form-group">
                <label htmlFor="attendance">Bạn sẽ tham dự chứ?</label>
                <select id="attendance" className="form-control" required value={rsvpStatus} onChange={(e) => setRsvpStatus(e.target.value)}>
                  <option value="yes">Chắc chắn rồi!</option>
                  <option value="no">Rất tiếc, tôi không thể tham gia</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="guests">Số người đi cùng</label>
                <select id="guests" className="form-control" value={rsvpCount} onChange={(e) => setRsvpCount(Number(e.target.value))}>
                  <option value={0}>Đi một mình</option>
                  <option value={1}>1 người</option>
                  <option value={2}>2 người</option>
                  <option value={3}>3 người</option>
                </select>
              </div>
              <button type="submit" className="btn" style={{ width: '100%' }} disabled={rsvpSubmitting}>{rsvpSubmitting ? 'Đang gửi...' : 'Gửi xác nhận'}</button>
            </form>
          </section>
        )}

        {/* Guestbook Section */}
        {card.plan_id !== 'basic' && (
          <section className="guestbook" style={{ background: '#fef7ec', padding: '4rem 10%', textAlign: 'center' }}>
            <h2 className="section-title">Sổ Lưu Bút</h2>
            <p style={{ marginBottom: '2rem' }}>Hãy để lại những lời chúc tốt đẹp nhất dành cho chúng mình nhé.</p>
            
            <div style={{ background: '#fff', borderRadius: '15px', padding: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '2rem', maxHeight: '300px', overflowY: 'auto' }}>
              {loadingWishes ? (
                <p style={{ textAlign: 'center', opacity: 0.7 }}>Đang tải lời chúc...</p>
              ) : wishes.length > 0 ? (
                wishes.map((wish) => (
                  <div key={wish.id} style={{ borderBottom: '1px solid #f1f1f1', paddingBottom: '1rem', marginBottom: '1rem', textAlign: 'left' }}>
                    <strong style={{ color: 'var(--color-primary)', display: 'block', marginBottom: '0.3rem' }}>{wish.guest_name}</strong>
                    <p style={{ margin: 0, fontSize: '0.95rem', color: '#555' }}>{wish.message}</p>
                  </div>
                ))
              ) : (
                <p style={{ textAlign: 'center', opacity: 0.7 }}>Chưa có lời chúc nào. Hãy là người đầu tiên gửi lời chúc nhé!</p>
              )}
            </div>
            
            <form onSubmit={handleWishSubmit} style={{ background: '#fff', padding: '1.5rem', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}>
              <div className="form-group">
                <input type="text" className="form-control" placeholder="Tên của bạn" required value={wishName} onChange={(e) => setWishName(e.target.value)} />
              </div>
              <div className="form-group">
                <textarea className="form-control" rows={3} placeholder="Viết lời chúc tốt đẹp gửi đến cô dâu chú rể..." required value={wishText} onChange={(e) => setWishText(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'inherit' }}></textarea>
              </div>
              <button type="submit" className="btn" style={{ width: '100%' }} disabled={wishSubmitting}>{wishSubmitting ? 'Đang gửi...' : 'Gửi Lời Chúc'}</button>
            </form>
          </section>
        )}

        {/* Gift Section */}
        {card.groom_bank_account && (
          <section className="gift">
            <h2 className="section-title">Gửi Lời Chúc</h2>
            <p style={{ marginBottom: '2rem' }}>Nếu không thể tham dự, bạn có thể gửi tiền mừng cưới qua mã QR dưới đây.</p>
            <div style={{ background: '#fff', padding: '2rem', borderRadius: '15px', border: '2px dashed var(--color-primary)', display: 'inline-block' }}>
              <i className="fas fa-qrcode" style={{ fontSize: '5rem', color: 'var(--color-primary)', marginBottom: '1rem' }}></i>
              <h4 style={{ color: 'var(--color-primary)' }}>{card.groom_bank_name}</h4>
              <p>{card.groom_bank_account}</p>
              <p><strong>{card.groom_bank_holder}</strong></p>
              {getGroomQR() && (
                <div style={{ marginTop: '1rem' }}>
                  <img src={getGroomQR()} alt="QR" style={{ width: '200px', height: '200px', objectFit: 'contain' }} />
                </div>
              )}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="wedding-footer" style={{ textAlign: 'center', padding: '3rem 1rem', marginTop: '2rem' }}>
          <p className="footer-thank" style={{ fontStyle: 'italic', opacity: 0.8, fontSize: '0.9rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
            {card.thank_you_text || 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!'}
          </p>
          {(!card.plan_id || card.plan_id === 'basic') && (
            <a href="https://loobycard.com" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ fontSize: '0.8rem', opacity: 0.6, textDecoration: 'none', color: 'inherit', display: 'block', marginTop: '0.5rem' }}>
              ❦ loobycard.com
            </a>
          )}
        </footer>
      </div>

      {/* Background Music */}
      {card.music_url && (
        <>
          <audio id="bg-music" ref={audioRef} src={card.music_url} loop></audio>
          <button 
            className="music-toggle-btn"
            onClick={toggleMusic}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              border: '1px solid rgba(0, 0, 0, 0.1)',
              boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 999,
              color: '#333',
            }}
            title="Bật/Tắt nhạc nền"
          >
            <i className={musicPlaying ? "fas fa-volume-up" : "fas fa-volume-mute"}></i>
          </button>
        </>
      )}

      {/* Photo Lightbox Modal Overlay */}
      <div className={`lightbox-overlay ${lightboxImg ? 'active' : ''}`} id="lightbox" onClick={(e) => { if (e.target === e.currentTarget) setLightboxImg(null); }}>
        <button className="lightbox-close" onClick={() => setLightboxImg(null)}>×</button>
        <div className="lightbox-content">
          {lightboxImg && <img src={lightboxImg} alt="Photo Fullscreen" className="lightbox-img" id="lightbox-img" />}
        </div>
      </div>
    </div>
  );
}
