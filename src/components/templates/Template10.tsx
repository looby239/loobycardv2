'use client';

import React, { useState, useEffect } from 'react';
import { CardData } from '@/types/card';
import '@/styles/templates/template-10.css';

interface TemplateProps {
  card: CardData;
  previewMode?: boolean;
}

export default function Template10({ card, previewMode = false }: TemplateProps) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState('yes');
  const [rsvpCount, setRsvpCount] = useState(1);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);
  const [rsvpSuccess, setRsvpSuccess] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

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

  const mapIframeSrc = card.map_url && card.map_url.includes('google.com/maps') 
    ? card.map_url 
    : `https://maps.google.com/maps?q=${encodeURIComponent(card.venue_address || card.venue_name || '')}&t=&z=13&ie=UTF8&iwloc=&output=embed`;

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
            <div style={{ marginBottom: '2rem' }}>
              <img src={coverImage} alt="Ảnh cưới" style={{ width: '200px', height: '200px', objectFit: 'cover', borderRadius: '50%', border: '4px solid var(--color-gold)' }} />
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
            <div className="gallery-grid">
              {albumImages.map((imgUrl, i) => (
                <img key={i} src={imgUrl} alt={`Gallery image ${i + 1}`} className="gallery-img" onClick={() => setLightboxImg(imgUrl)} style={{ cursor: 'pointer' }} />
              ))}
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
      </div>

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
