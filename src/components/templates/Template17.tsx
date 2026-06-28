'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getMapIframeSrc } from '@/lib/mapUtils';
import { buildVietQrUrl } from '@/lib/vietqr';
import { supabase } from '@/lib/supabase';
import { CardData } from '@/types/card';
import '@/styles/templates/template-17.css';

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

export default function Template17({ card, previewMode = false }: TemplateProps) {
  const [opened, setOpened] = useState(false);
  const [musicPlaying, setMusicPlaying] = useState(false);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loadingWishes, setLoadingWishes] = useState(false);
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // RSVP Form state
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState('yes');
  const [rsvpCount, setRsvpCount] = useState(0);
  const [rsvpSubmitting, setRsvpSubmitting] = useState(false);

  // Guestbook Form state
  const [wishName, setWishName] = useState('');
  const [wishText, setWishText] = useState('');
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
        alert('Phản hồi RSVP của bạn đã được gửi thành công!');
        setRsvpName('');
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
      alert('Cảm ơn bạn đã gửi lời chúc!');
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
        alert('Cảm ơn bạn đã gửi lời chúc!');
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

  const getCalendar = () => {
    if (!card.event_date) return null;
    const date = new Date(card.event_date);
    const year = date.getFullYear();
    const month = date.getMonth();
    
    // 0 = Sunday, 1 = Monday... -> Need Monday start for this template
    let firstDayIndex = new Date(year, month, 1).getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6; // Sunday is 6 in Monday-start
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
  const eventDateObj = card.event_date ? new Date(card.event_date) : new Date('2026-02-01');

  const coverDateText = eventDateObj.toLocaleDateString('vi-VN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const ceremonyTime = card.ceremony_time || '09:00';
  const partyTime = card.ceremony_time || '10:30';

  const dayName = eventDateObj.toLocaleDateString('vi-VN', { weekday: 'long' }).toUpperCase();
  const dayNum = eventDateObj.getDate().toString().padStart(2, '0');
  const monthName = `THÁNG ${eventDateObj.getMonth() + 1}`;
  const yearNum = eventDateObj.getFullYear();

  const coverImage = card.cover_image_url || '/assets/images/template-17/photo1.jpg';
  const albumImages = card.album_images && card.album_images.length > 0 ? card.album_images : [
    '/assets/images/template-17/photo2.jpg',
    '/assets/images/template-17/photo3.jpg',
    '/assets/images/template-17/photo4.jpg',
    '/assets/images/template-17/photo5.jpg',
  ];

  const mapIframeSrc = getMapIframeSrc(card);

  return (
    <div className="t17-wrapper">
      {/* Background Music */}
      {card.music_url && (
        <audio id="bg-music" ref={audioRef} src={card.music_url} loop></audio>
      )}

      {/* Envelope Overlay Cover Screen */}
      <div className={`envelope-overlay ${opened ? 'open' : ''}`} id="envelope-overlay">
        {/* Ambient floating particles */}
        <div className="particles-container" id="particles-container">
          <div className="particle" style={{ left: '20%', animationDelay: '0s' }}>🌸</div>
          <div className="particle" style={{ left: '40%', animationDelay: '2s' }}>🌸</div>
          <div className="particle" style={{ left: '60%', animationDelay: '4s' }}>🌸</div>
          <div className="particle" style={{ left: '80%', animationDelay: '1s' }}>🌸</div>
        </div>

        <div className="envelope-card">
          <div className="envelope-seal">
            <i className="fas fa-heart"></i>
          </div>
          <div className="envelope-inner">
            {/* Watercolor flowers assets */}
            <img src="/assets/images/template-17/asset_1.webp" className="decor top-left" alt="" />
            <img src="/assets/images/template-17/asset_3.webp" className="decor bottom-right" alt="" />

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
        {/* Top-left background flower */}
        <img src="/assets/images/template-17/asset_1.webp" className="bg-decor-top" alt="" />

        {/* Header / Intro Section */}
        <header className="wedding-header">
          <div className="hero-frame-container">
            <div className="hero-frame">
              <img src={coverImage} alt="Ảnh cưới" className="hero-image" />
              <div className="polaroid-text">Nympholepsy</div>
            </div>
          </div>
          
          <div className="parents-info">
            {card.plan_id !== 'basic' && (
              <>
                <div className="section-title-wrapper">
                  <h2 className="section-title">THÔNG TIN LỄ CƯỚI</h2>
                </div>
                <div className="parents-grid">
                  <div className="family-column">
                    <span className="parent-label">Nhà Trai</span>
                    {card.groom_father_name && <h4 className="parent-name">Ông: {card.groom_father_name}</h4>}
                    {card.groom_mother_name && <h4 className="parent-name">Bà: {card.groom_mother_name}</h4>}
                    {card.groom_address && <p className="parent-address">{card.groom_address}</p>}
                  </div>
                  <div className="family-column">
                    <span className="parent-label">Nhà Gái</span>
                    {card.bride_father_name && <h4 className="parent-name">Ông: {card.bride_father_name}</h4>}
                    {card.bride_mother_name && <h4 className="parent-name">Bà: {card.bride_mother_name}</h4>}
                    {card.bride_address && <p className="parent-address">{card.bride_address}</p>}
                  </div>
                </div>

                <div className="ceremony-announcement">
                  <p className="announcement-text">TRÂN TRỌNG BÁO TIN<br/>LỄ THÀNH HÔN CỦA CON CHÚNG TÔI</p>
                  <div className="couple-names-vertical">
                    <div className="couple-name-box">
                      <h1 className="groom-name">{card.groom_name}</h1>
                      <span className="role-badge">{card.groom_role?.toUpperCase() || 'TRƯỞNG NAM'}</span>
                    </div>
                    <span className="and-symbol">&amp;</span>
                    <div className="couple-name-box">
                      <h1 className="bride-name">{card.bride_name}</h1>
                      <span className="role-badge">{card.bride_role?.toUpperCase() || 'ÚT NỮ'}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Home Ceremony Details */}
            <div className="ceremony-card">
              <p className="ceremony-desc">LỄ THÀNH HÔN ĐƯỢC CỬ HÀNH TẠI TƯ GIA VÀO LÚC</p>
              <h2 className="ceremony-time">{ceremonyTime}</h2>
              
              <div className="date-bar">
                <span className="date-part">{dayName}</span>
                <span className="date-day">{dayNum}</span>
                <span className="date-part">{monthName.padStart(2, '0')}</span>
              </div>
              <div className="ceremony-year">{yearNum}</div>
              <p className="lunar-date">{card.invitation_text}</p>
            </div>
          </div>
        </header>

        {/* Photo Album Section */}
        {albumImages.length > 0 && (
          <section className="gallery">
            <div className="section-title-wrapper">
              <h2 className="section-title">ALBUM ẢNH CƯỚI</h2>
            </div>
            <div className="gallery-grid">
              {albumImages.slice(0, 4).map((imgUrl, i) => {
                if (i === 3 && albumImages.length > 4) {
                  return (
                    <div key={i} className="gallery-item overlay-item" onClick={() => setLightboxImg(imgUrl)}>
                      <img src={imgUrl} alt={`Gallery ${i + 1}`} className="gallery-img" />
                      <div className="more-overlay">
                        <span>+{albumImages.length - 4}</span>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={i} className="gallery-item" onClick={() => setLightboxImg(imgUrl)}>
                    <img src={imgUrl} alt={`Gallery ${i + 1}`} className="gallery-img" />
                    {i === 1 && <div className="album-overlay-text">Symphonie</div>}
                    {i === 2 && <div className="album-overlay-text">OVERIC</div>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Wedding Party Info Section */}
        <section className="party-info">
          <div className="section-title-wrapper">
            <h2 className="section-title">THÔNG TIN TIỆC CƯỚI</h2>
          </div>
          <p className="party-intro-text">TIỆC CƯỚI SẼ DIỄN RA VÀO LÚC:</p>
          <h2 className="party-time">{partyTime}</h2>
          
          <div className="date-bar">
            <span className="date-part">{dayName}</span>
            <span className="date-day">{dayNum}</span>
            <span className="date-part">{monthName.padStart(2, '0')}</span>
          </div>
          <div className="party-year">{yearNum}</div>
          <p className="lunar-date">(Kính mời quý khách tới dự)</p>
          
          <div className="khai-tiec-badge">KHAI TIỆC {partyTime}</div>

          {/* Calendar Highlight */}
          {calData && (
            <div className="calendar-widget">
              <h3 className="calendar-month">Tháng {calData.month} / {calData.year}</h3>
              <table className="calendar-table">
                <thead>
                  <tr>
                    <th>T2</th>
                    <th>T3</th>
                    <th>T4</th>
                    <th>T5</th>
                    <th>T6</th>
                    <th>T7</th>
                    <th>CN</th>
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
                            {isWeddingDay && <div className="heart-indicator"><i className="fas fa-heart"></i></div>}
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
                    Xem Bản Đồ
                  </a>
                )}
                <a href="#rsvp-section" className="btn-rsvp-scroll">
                  XÁC NHẬN
                </a>
              </div>
            </div>
          )}

          {/* Venue details */}
          <div className="venue-details">
            <h3 className="venue-header">TIỆC CƯỚI SẼ TỔ CHỨC TẠI</h3>
            <p className="venue-name">{card.venue_name}</p>
            <p className="venue-address">{card.venue_address}</p>

            {/* Google Map Iframe */}
            {card.map_url && (
              <div className="map-container">
                <iframe src={mapIframeSrc} allowFullScreen loading="lazy" title="Bản đồ" style={{ width: '100%', height: '100%', border: 'none' }}>
                </iframe>
              </div>
            )}
          </div>
        </section>

        {/* Wedding Timeline Section */}
        {card.has_schedule && card.wedding_schedule && card.wedding_schedule.length > 0 && (
          <section className="timeline-section">
            <div className="section-title-wrapper">
              <h2 className="section-title">LỊCH TRÌNH NGÀY CƯỚI</h2>
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
              <h2 className="section-title">XÁC NHẬN THAM DỰ</h2>
            </div>
            <p className="section-subtitle">Vui lòng phản hồi trước ngày cưới để chúng tôi chuẩn bị đón tiếp chu đáo nhất</p>

            <form className="rsvp-form" id="rsvp-form" onSubmit={handleRsvpSubmit}>
              <div className="form-group">
                <input type="text" id="guest-name" placeholder="Nhập tên của bạn*" required value={rsvpName} onChange={(e) => setRsvpName(e.target.value)} />
              </div>
              <div className="form-group">
                <select id="guest-status" required value={rsvpStatus} onChange={(e) => setRsvpStatus(e.target.value)}>
                  <option value="yes">Tôi chắc chắn sẽ đến</option>
                  <option value="no">Tiếc quá, tôi không thể đến</option>
                </select>
              </div>
              <div className="form-group">
                <select id="guest-count" value={rsvpCount} onChange={(e) => setRsvpCount(Number(e.target.value))}>
                  <option value={0}>Đi một mình</option>
                  <option value={1}>1 người đi cùng</option>
                  <option value={2}>2 người đi cùng</option>
                  <option value={3}>3 người đi cùng</option>
                </select>
              </div>
              <button type="submit" className="btn-submit" disabled={rsvpSubmitting}>
                <span>{rsvpSubmitting ? 'ĐANG GỬI...' : 'GỬI PHẢN HỒI'}</span>
                <div className="btn-shine"></div>
              </button>
            </form>
          </section>
        )}

        {/* Guestbook Section */}
        {card.plan_id !== 'basic' && (
          <section className="guestbook">
            <div className="section-title-wrapper">
              <h2 className="section-title">SỔ LƯU BÚT</h2>
            </div>

            <form className="wish-form" id="wish-form" onSubmit={handleWishSubmit}>
              <div className="form-group">
                <input type="text" id="wish-name" placeholder="Nhập tên của bạn*" required value={wishName} onChange={(e) => setWishName(e.target.value)} />
              </div>
              <div className="form-group">
                <textarea id="wish-text" rows={3} placeholder="Nhập lời chúc của bạn*" required value={wishText} onChange={(e) => setWishText(e.target.value)}></textarea>
              </div>
              <div className="form-group">
                <button type="submit" className="btn-submit-wish" disabled={wishSubmitting}>{wishSubmitting ? 'ĐANG GỬI...' : 'GỬI LỜI CHÚC'}</button>
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
              <h2 className="section-title">PHONG BAO MỪNG CƯỚI</h2>
            </div>

            <div className="gift-registry-container">
              <div className="envelope-wrapper" id="gift-modal-trigger" onClick={() => setGiftModalOpen(true)}>
                <div className="envelope-body">
                  <div className="envelope-flap"></div>
                  <div className="double-happiness-seal">囍</div>
                  {/* Floating gold coins */}
                  <div className="floating-coin coin-1">🪙</div>
                  <div className="floating-coin coin-2">🪙</div>
                  <div className="floating-coin coin-3">🪙</div>
                  <div className="floating-coin coin-4">🪙</div>
                  <div className="floating-coin coin-5">🪙</div>
                </div>
                <span className="envelope-caption">Nhấn để mở</span>
              </div>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="wedding-footer">
          <p className="footer-thank">{card.thank_you_text || 'Sự hiện diện của quý khách là niềm vinh hạnh của gia đình chúng tôi!'}</p>
            <a href="https://loobycard.com" target="_blank" rel="noopener noreferrer" className="footer-link">❦ Loobycard.com</a>
        </footer>

        {/* Bottom-right background flower */}
        <img src="/assets/images/template-17/asset_3.webp" className="bg-decor-bottom" alt="" />
      </div>

      {/* Gift Registry Modal Overlay */}
      {giftModalOpen && (
        <div className="gift-modal-overlay open" id="gift-modal" onClick={(e) => { if (e.target === e.currentTarget) setGiftModalOpen(false); }}>
          <div className="gift-modal-card">
            <div className="gift-modal-header">
              <h3>PHONG BAO MỪNG CƯỚI</h3>
              <button className="gift-modal-close" id="gift-modal-close" onClick={() => setGiftModalOpen(false)}>&times;</button>
            </div>
            <div className="bank-accounts-grid">
              {card.groom_bank_account && (
                <div className="bank-card">
                  <div className="bank-card-header">{card.groom_role || 'Chú Rể'} - {card.groom_name}</div>
                  <div className="qr-code">
                    {getQR(card.groom_bank_name, card.groom_bank_account, card.groom_bank_holder) && (
                      <img
                        src={getQR(card.groom_bank_name, card.groom_bank_account, card.groom_bank_holder)}
                        alt="Groom QR"
                        onClick={() => setLightboxImg(getQR(card.groom_bank_name, card.groom_bank_account, card.groom_bank_holder))}
                        style={{ cursor: 'zoom-in' }}
                      />
                    )}
                  </div>
                  <p className="bank-info">{card.groom_bank_name}</p>
                  <p className="account-number">{card.groom_bank_account}</p>
                  <p className="account-name">{card.groom_bank_holder}</p>
                </div>
              )}

              {card.bride_bank_account && (
                <div className="bank-card">
                  <div className="bank-card-header">{card.bride_role || 'Cô Dâu'} - {card.bride_name}</div>
                  <div className="qr-code">
                    {getQR(card.bride_bank_name, card.bride_bank_account, card.bride_bank_holder) && (
                      <img
                        src={getQR(card.bride_bank_name, card.bride_bank_account, card.bride_bank_holder)}
                        alt="Bride QR"
                        onClick={() => setLightboxImg(getQR(card.bride_bank_name, card.bride_bank_account, card.bride_bank_holder))}
                        style={{ cursor: 'zoom-in' }}
                      />
                    )}
                  </div>
                  <p className="bank-info">{card.bride_bank_name}</p>
                  <p className="account-number">{card.bride_bank_account}</p>
                  <p className="account-name">{card.bride_bank_holder}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Photo Lightbox Modal Overlay */}
      {lightboxImg && (
        <div className="lightbox-overlay active open" id="lightbox" onClick={(e) => { if (e.target === e.currentTarget) setLightboxImg(null); }}>
          <button className="lightbox-close" id="lightbox-close" onClick={() => setLightboxImg(null)}>&times;</button>
          <div className="lightbox-content">
            <img src={lightboxImg} alt="Photo Fullscreen" className="lightbox-img" id="lightbox-img" />
          </div>
        </div>
      )}
    </div>
  );
}
