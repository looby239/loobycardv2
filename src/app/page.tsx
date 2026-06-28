'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, Check, X, ArrowRight, Menu, X as CloseIcon, Laptop, Star } from 'lucide-react';
import { SpeedInsights } from "@vercel/speed-insights/next"

function TypingText({ text, speed = 120, delay = 500 }: { text: string; speed?: number; delay?: number }) {
  const [started, setStarted] = useState(false);
  const [count, setCount] = useState(0);
  const chars = React.useMemo(() => Array.from(text.normalize('NFC')), [text]);

  useEffect(() => {
    const startTimer = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (started && count < chars.length) {
      const typingTimer = setTimeout(() => {
        setCount((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(typingTimer);
    }
  }, [started, count, chars.length, speed]);

  const displayedText = chars.slice(0, count).join('');
  const isTypingComplete = started && count >= chars.length;

  return (
    <span className="inline-flex items-center">
      {displayedText}
      {!isTypingComplete ? (
        <span className="ml-1 inline-block w-[2.5px] h-[1.1em] bg-white animate-pulse" />
      ) : (
        <span className="ml-1.5 inline-block animate-heartbeat text-white select-none">❤︎</span>
      )}
    </span>
  );
}

function ScrollReveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px -80px 0px',
      }
    );

    const currentRef = ref.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-1000 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function HomePage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const [highlightThumbnails, setHighlightThumbnails] = useState<Array<{ id: string; name: string; image: string }>>([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetch('/api/admin/templates')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.templates?.length > 0) {
          const sorted = [...data.templates]
            .sort((a, b) => b.sort_order - a.sort_order)
            .slice(0, 5)
            .map(t => ({
              id: t.id,
              name: t.name || 'Mẫu thiệp',
              image: t.thumbnail_url || t.defaultThumbnail || `/assets/images/${t.id}/preview.png`
            }));
          setHighlightThumbnails(sorted);
        } else {
          throw new Error('No templates');
        }
      })
      .catch(() => {
        setHighlightThumbnails([
          { id: 'template-19', name: 'Minimalism Đỏ (Template 19)', image: '/assets/images/template-19/photo1.jpg' },
          { id: 'template-18', name: 'Vườn Xuân Đỏ (Template 18)', image: '/assets/images/template-18/photo1.jpg' },
          { id: 'template-17', name: 'Hoa Mộc Hồng (Template 17)', image: '/assets/images/template-17/photo1.jpg' },
          { id: 'template-16', name: 'Thanh Diệp Xanh (Template 16)', image: '/assets/images/template-16/preview.png' },
          { id: 'template-15', name: 'Thành Lộc & Minh Thư (Template 15)', image: '/assets/images/template-15/preview.png' }
        ]);
      });
  }, []);

  useEffect(() => {
    if (highlightThumbnails.length === 0) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % highlightThumbnails.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [highlightThumbnails.length]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white text-brand-text font-sans antialiased">
      {/* Navigation */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur shadow-sm border-b border-brand-border' : 'bg-white/95 backdrop-blur'
          }`}
        style={{ height: scrolled ? '70px' : '80px', display: 'flex', alignItems: 'center' }}
      >
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-primary font-extrabold text-xl sm:text-2xl tracking-tight">
            <i className="fa-solid fa-ring text-primary text-xl"></i>
            <span className="text-primary">Looby</span><span className="text-secondary font-extrabold"> - Thiệp mời điện tử</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-text">
            <a href="#features" className="hover:text-primary transition">Tính năng</a>
            <a href="#templates" className="hover:text-primary transition">Mẫu thiệp</a>
            <a href="#how-it-works" className="hover:text-primary transition">Hướng dẫn</a>
            <a href="#pricing" className="hover:text-primary transition">Bảng giá</a>
          </nav>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-secondary hover:text-primary transition p-2"
          >
            {mobileMenuOpen ? <CloseIcon size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-brand-border shadow-xl py-4 flex flex-col items-center gap-4 font-semibold text-brand-text">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary py-1 transition w-full text-center">Tính năng</a>
            <a href="#templates" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary py-1 transition w-full text-center">Mẫu thiệp</a>
            <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary py-1 transition w-full text-center">Hướng dẫn</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-primary py-1 transition w-full text-center">Bảng giá</a>
            <Link href="/templates" onClick={() => setMobileMenuOpen(false)} className="bg-primary hover:bg-primary-hover text-white font-semibold py-2 px-6 rounded-lg shadow transition w-4/5 text-center">
              Tạo thiệp ngay
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-visible text-center" style={{ paddingTop: 'calc(80px + 5rem)', paddingBottom: '6rem', background: 'linear-gradient(135deg, #EBF3FC 0%, #FFFFFF 100%)' }}>
        {/* Background radial blob */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] rounded-full pointer-events-none" style={{ background: 'radial-gradient(circle, #8FB8ED 0%, rgba(255,255,255,0) 70%)', opacity: 0.15, filter: 'blur(50px)', zIndex: 0 }}></div>

        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center" style={{ zIndex: 1 }}>
          {/* Heading */}
          <h1 className="font-extrabold text-secondary tracking-tight mb-6" style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)', lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            <span className="font-serif font-light italic block mb-3">Bắt đầu khoảnh khắc đặc biệt bằng một</span>
            <span className="text-white px-3 py-1 rounded-lg font-bold not-italic" style={{ backgroundColor: '#8FB8ED', display: 'inline-block' }}>
              <TypingText text="lời mời tinh tế" />
            </span>
          </h1>

          {/* Description */}
          <p className="text-brand-text-light leading-relaxed mb-10" style={{ fontSize: '1.2rem', maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
            Thay thế thiệp giấy truyền thống bằng một trang web hiện đại, lưu giữ mọi khoảnh khắc và dễ dàng nhận phản hồi tham dự (RSVP) từ khách mời.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/templates" className="bg-primary hover:bg-primary-hover text-white font-semibold transition-all hover:-translate-y-0.5" style={{ padding: '1rem 2rem', fontSize: '1.1rem', borderRadius: '10px', boxShadow: '0 4px 12px rgba(143,184,237,0.4)' }}>
              Bắt đầu ngay
            </Link>
          </div>

          {/* Hero Image Mockup — centered floating */}
          <div className="relative w-full mx-auto animate-float" style={{ maxWidth: '700px', zIndex: 2, transform: 'translateY(2rem)' }}>
            <img
              src="/assets/images/hero-mockup.png"
              alt="Mockup trang web thiệp cưới trên điện thoại"
              style={{ borderRadius: '24px', boxShadow: '0 30px 60px -12px rgba(0,0,0,0.25)', border: '6px solid #FFFFFF', maxHeight: '70vh', objectFit: 'contain', background: '#fff', margin: '0 auto', display: 'block', width: '100%' }}
            />

            {/* Floating stat card — top right */}
            <div className="absolute bg-white/90 backdrop-blur flex items-center gap-3 select-none" style={{ top: '10%', right: '-20px', padding: '1rem', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.5)', animation: 'float 6s ease-in-out infinite' }}>
              <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#EBF3FC', color: '#8FB8ED' }}>
                <Heart className="fill-current animate-pulse" size={20} />
              </div>
              <div className="text-left">
                <strong className="block text-secondary" style={{ fontSize: '1.1rem' }}>+10,000</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Cặp đôi tin dùng</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Zigzag */}
      <section id="features" className="py-20 bg-brand-bg-alt">
        <ScrollReveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary tracking-tight">Mọi tính năng bạn cần cho một đám cưới hoàn hảo</h2>
            <p className="text-brand-text-light mt-4 text-base sm:text-lg">Từ khâu thiết kế đến quản lý phản hồi, hệ thống loobycard tự động hóa giúp giảm bớt gánh nặng chuẩn bị.</p>
          </div>

          <div className="space-y-16">
            {/* Feature 1 */}
            <div className="flex flex-col md:flex-row items-center gap-12 bg-white p-8 sm:p-12 rounded-2xl border border-brand-border/60 shadow-sm">
              <div className="flex-1 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary-light flex items-center justify-center text-primary font-bold text-lg">
                  <Check size={20} />
                </div>
                <h3 className="text-2xl font-bold text-secondary">Xác nhận tham dự trực tuyến (RSVP)</h3>
                <p className="text-brand-text leading-relaxed">
                  Khách mời của bạn có thể xác nhận tham dự đám cưới trực tiếp ngay trên thiệp. Hệ thống tự động thu thập số lượng khách mời, món ăn (nếu có), số điện thoại và lời nhắn, giúp bạn thống kê số lượng bàn tiệc chính xác nhất.
                </p>
                <ul className="space-y-2 pt-2">
                  <li className="flex items-center gap-2 text-sm text-brand-text font-medium">
                    <Check size={16} className="text-primary" /> Không giới hạn lượt phản hồi (gói Premium & Luxury)
                  </li>
                  <li className="flex items-center gap-2 text-sm text-brand-text font-medium">
                    <Check size={16} className="text-primary" /> Gửi thông tin lời chúc lưu lại sổ lưu bút
                  </li>
                  <li className="flex items-center gap-2 text-sm text-brand-text font-medium">
                    <Check size={16} className="text-primary" /> Export danh sách ra CSV nhanh chóng
                  </li>
                </ul>
              </div>
              <div className="flex-1 bg-brand-bg-alt rounded-2xl p-4 sm:p-6 border border-brand-border">
                <img src="/assets/images/feature-rsvp.png" alt="Phản hồi RSVP" className="rounded-xl shadow-sm w-full max-h-[300px] object-cover" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center gap-12 bg-white p-8 sm:p-12 rounded-2xl border border-brand-border/60 shadow-sm">
              <div className="flex-1 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary-light flex items-center justify-center text-primary font-bold text-lg">
                  <i className="fa-solid fa-map-location-dot"></i>
                </div>
                <h3 className="text-2xl font-bold text-secondary">Dễ dàng tìm vị trí & Đếm ngược</h3>
                <p className="text-brand-text leading-relaxed">
                  Hiển thị địa điểm trên Google Maps giúp tìm đường nhanh chóng. Đồng hồ đếm ngược sinh động tạo sự mong đợi, cho biết chính xác thời gian còn lại cho đến ngày tiệc.
                </p>
                <ul className="space-y-2 pt-2">
                  <li className="flex items-center gap-2 text-sm text-brand-text font-medium">
                    <Check size={16} className="text-primary" /> Nút chỉ đường Google Maps độ chính xác cao
                  </li>
                  <li className="flex items-center gap-2 text-sm text-brand-text font-medium">
                    <Check size={16} className="text-primary" /> Đồng hồ đếm ngược chạy theo giây thực tế
                  </li>
                </ul>
              </div>
              <div className="flex-1 bg-brand-bg-alt rounded-2xl p-4 sm:p-6 border border-brand-border">
                <img src="/assets/images/feature-map.png" alt="Google Map chỉ đường" className="rounded-xl shadow-sm w-full max-h-[300px] object-cover" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col md:flex-row items-center gap-12 bg-white p-8 sm:p-12 rounded-2xl border border-brand-border/60 shadow-sm">
              <div className="flex-1 space-y-4">
                <div className="h-12 w-12 rounded-xl bg-primary-light flex items-center justify-center text-primary font-bold text-lg">
                  <i className="fa-solid fa-gift"></i>
                </div>
                <h3 className="text-2xl font-bold text-secondary">Hộp mừng cưới & Tên miền riêng đẳng cấp</h3>
                <p className="text-brand-text leading-relaxed">
                  Gửi lời cám ơn tinh tế đến khách mời và tạo phong bao mừng cưới trực tuyến qua mã QR tài khoản ngân hàng. Gói Luxury cho phép cấu hình tên miền riêng chuyên nghiệp, tạo dấu ấn cá nhân độc bản.
                </p>
              </div>
              <div className="flex-1 bg-brand-bg-alt rounded-2xl p-4 sm:p-6 border border-brand-border">
                <img src="/assets/images/feature-countdown.png" alt="Hộp mừng cưới" className="rounded-xl shadow-sm w-full max-h-[300px] object-cover" />
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Featured Template Highlight */}
      <section id="templates" className="py-20 bg-white border-t border-b border-brand-border">
        <ScrollReveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-extrabold text-secondary tracking-tight">Mẫu thiệp cưới nổi bật</h2>
              <p className="text-brand-text-light mt-2">Mẫu thiệp hiện đại, tinh tế được các cặp đôi ưa thích nhất</p>
            </div>
            <Link href="/templates" className="hidden sm:flex items-center gap-1 text-primary font-bold text-sm hover:gap-2 transition-all">
              Xem tất cả mẫu <ArrowRight size={16} />
            </Link>
          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-brand-border p-8 md:p-12 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <span className="bg-primary-light text-primary-hover text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Khuyên dùng
              </span>
              <h3 className="text-3xl font-serif font-bold text-secondary">Hạnh Phúc Ngọt Ngào</h3>
              <p className="text-brand-text leading-relaxed">
                Mẫu thiệp cưới mang phong cách lãng mạn với hiệu ứng mở bao thư độc đáo, kết hợp giữa tông màu hồng phấn dịu dàng và họa tiết hoa anh đào ngọt ngào. Tích hợp đầy đủ tính năng hiện đại nhất cho ngày vui của bạn.
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-brand-text font-medium">
                <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-primary" /> Hiệu ứng bao thư độc bản</li>
                <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-primary" /> Đồng hồ đếm ngược thời gian</li>
                <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-primary" /> Bản đồ sự kiện Google Maps</li>
                <li className="flex items-center gap-2 text-sm"><Check size={16} className="text-primary" /> RSVP & Gửi lời chúc mừng</li>
              </ul>
              <div className="pt-4 flex flex-col sm:flex-row items-center gap-4">
                <Link href="/templates" className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-8 rounded-lg shadow-sm text-center w-full sm:w-auto transition">
                  Xem chi tiết mẫu thiệp
                </Link>
              </div>
            </div>

            <div className="flex-1 flex justify-center">
              <div className="phone-mockup border-[12px] border-secondary rounded-[2.5rem] h-[500px] w-[260px] shadow-xl overflow-hidden bg-slate-900 relative">
                {/* Speaker / Camera notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 h-4 w-28 bg-secondary rounded-b-xl z-20"></div>
                
                {/* Slideshow container */}
                <div className="relative w-full h-full">
                  {highlightThumbnails.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                        index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                      }`}
                    >
                      <img
                        src={slide.image}
                        alt={slide.name}
                        className="w-full h-full object-cover animate-fade-in"
                      />
                      {/* Name tag at bottom */}
                      <div className="absolute bottom-6 left-0 right-0 text-center z-20 px-2">
                        <span className="bg-black/75 text-white text-[10px] font-bold px-3 py-1.5 rounded-full inline-block shadow backdrop-blur-sm tracking-wide">
                          {slide.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Link href="/templates" className="inline-flex items-center gap-1 text-primary font-bold text-sm">
              Xem tất cả mẫu <ArrowRight size={16} />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Guide / How it Works */}
      <section id="how-it-works" className="py-20 bg-secondary text-white relative">
        <ScrollReveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white font-serif">Chỉ 3 bước đơn giản</h2>
            <p className="text-slate-400 mt-4">Tạo trang web thiệp cưới chưa bao giờ dễ dàng đến thế.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl space-y-4 relative">
              <div className="absolute -top-4 left-6 bg-primary text-white font-bold h-10 w-10 rounded-full flex items-center justify-center shadow-[0_0_0_8px_rgba(143,184,237,0.15)]">1</div>
              <h3 className="text-xl font-bold pt-2 text-white">Chọn mẫu thiết kế</h3>
              <p className="text-slate-350 text-sm leading-relaxed">
                Lướt xem bộ sưu tập và chọn một mẫu thiệp cưới phù hợp với concept đám cưới của bạn.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl space-y-4 relative">
              <div className="absolute -top-4 left-6 bg-primary text-white font-bold h-10 w-10 rounded-full flex items-center justify-center shadow-[0_0_0_8px_rgba(143,184,237,0.15)]">2</div>
              <h3 className="text-xl font-bold pt-2 text-white">Cập nhật thông tin</h3>
              <p className="text-slate-350 text-sm leading-relaxed">
                Nhập thông tin cô dâu chú rể, tải lên hình ảnh nếu có và thiết lập demo thiệp cưới.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-2xl space-y-4 relative">
              <div className="absolute -top-4 left-6 bg-primary text-white font-bold h-10 w-10 rounded-full flex items-center justify-center shadow-[0_0_0_8px_rgba(143,184,237,0.15)]">3</div>
              <h3 className="text-xl font-bold pt-2 text-white">Gửi lời mời ngay</h3>
              <p className="text-slate-350 text-sm leading-relaxed">
                Kích hoạt thiệp, nhận liên kết (Link) gửi cho bạn bè qua Zalo, Facebook Messenger chỉ với 1 cú click.
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-brand-bg-alt">
        <ScrollReveal className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary tracking-tight">Bảng giá minh bạch</h2>
            <p className="text-brand-text-light mt-4 text-base sm:text-lg">Gói cước linh hoạt phù hợp với mọi nhu cầu.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-5xl mx-auto">
            {/* Basic Gói */}
            <div className="bg-white rounded-2xl border border-brand-border p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition">
              <div>
                <h3 className="text-lg font-bold text-secondary">Gói Cơ Bản</h3>
                <p className="text-brand-text-light text-xs mt-1">Trải nghiệm thiệp cưới online cơ bản</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-secondary">99.000</span>
                  <span className="text-brand-text-light font-semibold text-sm">VNĐ</span>
                </div>

                <hr className="my-6 border-brand-border" />

                <ul className="space-y-3 text-sm text-brand-text">
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Sử dụng các mẫu</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Bản đồ đến sự kiện</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Link có đuôi loobycard.com/tên</li>
                  <li className="flex items-center gap-2 text-slate-300 line-through"><X size={16} className="text-slate-300" /> Đồng hồ đếm ngược</li>
                  <li className="flex items-center gap-2 text-slate-300 line-through"><X size={16} className="text-slate-300" /> Nhận RSVP (tối đa 100 khách)</li>
                  <li className="flex items-center gap-2 text-slate-300 line-through"><X size={16} className="text-slate-300" /> Nhạc nền tự chọn</li>
                  <li className="flex items-center gap-2 text-slate-300 line-through"><X size={16} className="text-slate-300" /> Tên miền riêng (.com / .vn)</li>
                </ul>
              </div>
              <div className="pt-8">
                <Link href="/templates" className="block w-full bg-brand-bg-alt hover:bg-brand-border text-secondary text-center font-bold py-3 px-4 rounded-lg transition">
                  Chọn Basic
                </Link>
              </div>
            </div>

            {/* Premium Gói (Dark theme premium layout matching loobywedding/style.css) */}
            <div className="bg-secondary text-white rounded-2xl border-2 border-secondary p-8 flex flex-col justify-between shadow-xl relative overflow-hidden transform md:scale-105">
              <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl uppercase tracking-wider">
                Phổ biến nhất
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Gói Premium</h3>
                <p className="text-slate-400 text-xs mt-1">Hoàn hảo để tạo dấu ấn cá nhân sang trọng</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-white">399.000</span>
                  <span className="text-slate-350 font-semibold text-sm">VNĐ</span>
                </div>

                <hr className="my-6 border-white/10" />

                <ul className="space-y-3 text-sm text-slate-200">
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> <strong>Sử dụng tất cả các mẫu</strong></li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Bản đồ đến sự kiện</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Link có đuôi loobycard.com/tên</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Không giới hạn số lượng RSVP</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Tải lên nhạc nền tùy thích</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> <strong>Lưu lại lời chúc từ khách mời</strong></li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Loại bỏ quảng cáo LoobyCard</li>
                </ul>
              </div>
              <div className="pt-8">
                <Link href="/templates" className="block w-full bg-primary hover:bg-primary-hover text-white text-center font-bold py-3.5 px-4 rounded-lg shadow-sm transition">
                  Chọn Premium
                </Link>
              </div>
            </div>

            {/* Luxury Gói */}
            <div className="bg-white rounded-2xl border border-brand-border p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition">
              <div>
                <h3 className="text-lg font-bold text-secondary">Gói Luxury</h3>
                <p className="text-brand-text-light text-xs mt-1">Đẳng cấp vượt trội với dịch vụ hoàn hảo</p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-secondary">1.199.000</span>
                  <span className="text-brand-text-light font-semibold text-sm">VNĐ</span>
                </div>

                <hr className="my-6 border-brand-border" />

                <ul className="space-y-3 text-sm text-brand-text">
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> <strong>Sử dụng tất cả các mẫu</strong></li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Bản đồ đến sự kiện</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Không giới hạn số lượng RSVP</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Tải lên nhạc nền tùy thích</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> <strong>Lưu lại lời chúc từ khách mời</strong></li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> Loại bỏ quảng cáo LoobyCard</li>
                  <li className="flex items-center gap-2"><Check size={16} className="text-primary" /> <strong>Sử dụng tên miền riêng</strong></li>
                </ul>
              </div>
              <div className="pt-8">
                <Link href="/templates" className="block w-full bg-secondary hover:bg-secondary-hover text-white text-center font-bold py-3 px-4 rounded-lg transition">
                  Chọn Luxury
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-light/40 border-t border-brand-border center text-center">
        <ScrollReveal className="max-w-4xl mx-auto px-4 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-secondary tracking-tight">Bạn đã sẵn sàng tạo bất ngờ cho khách mời?</h2>
          <p className="text-brand-text-light text-base sm:text-lg">
            Hàng ngàn thiệp cưới độc đáo đã được tạo ra. Đến lượt bạn rồi!
          </p>
          <div className="pt-4">
            <Link href="/templates" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-4 px-10 rounded-lg shadow hover:shadow-md transition-all hover:-translate-y-0.5">
              Chọn thiệp ngay <ArrowRight size={20} />
            </Link>
          </div>
        </ScrollReveal>
      </section>

      {/* Footer (Premium matching original website layout) */}
      <footer className="bg-white border-t border-brand-border py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <Link href="/" className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight">
                <i className="fa-solid fa-ring text-primary"></i>
                <span className="text-secondary font-extrabold">LoobyCard</span>
              </Link>
              <p className="text-brand-text-light text-sm max-w-xs leading-relaxed">
                Mang công nghệ vào ngày vui của bạn. Tạo thiệp điện tử tự động nhanh chóng và tinh tế.
              </p>
              <div className="flex gap-3 pt-2">
                <a href="#" className="w-10 h-10 rounded-full bg-brand-bg-alt flex items-center justify-center text-secondary hover:bg-primary hover:text-white transition shadow-sm"><i className="fa-brands fa-facebook-f"></i></a>
                <a href="#" className="w-10 h-10 rounded-full bg-brand-bg-alt flex items-center justify-center text-secondary hover:bg-primary hover:text-white transition shadow-sm"><i className="fa-brands fa-instagram"></i></a>
                <a href="#" className="w-10 h-10 rounded-full bg-brand-bg-alt flex items-center justify-center text-secondary hover:bg-primary hover:text-white transition shadow-sm"><i className="fa-brands fa-tiktok"></i></a>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-secondary text-base">Sản phẩm</h4>
              <ul className="space-y-2 text-sm text-brand-text-light">
                <li><a href="#templates" className="hover:text-primary transition">Mẫu thiệp</a></li>
                <li><a href="#features" className="hover:text-primary transition">Tính năng</a></li>
                <li><a href="#pricing" className="hover:text-primary transition">Bảng giá</a></li>
                <li><a href="#" className="hover:text-primary transition">Cập nhật mới</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-secondary text-base">Hỗ trợ</h4>
              <ul className="space-y-2 text-sm text-brand-text-light">
                <li><a href="#" className="hover:text-primary transition">Hướng dẫn sử dụng</a></li>
                <li><a href="#" className="hover:text-primary transition">Câu hỏi thường gặp (FAQ)</a></li>
                <li><a href="#" className="hover:text-primary transition">Liên hệ CSKH</a></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-secondary text-base">Pháp lý</h4>
              <ul className="space-y-2 text-sm text-brand-text-light">
                <li><a href="#" className="hover:text-primary transition">Điều khoản sử dụng</a></li>
                <li><a href="#" className="hover:text-primary transition">Bảo mật thông tin</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-brand-border pt-8 text-center text-sm text-brand-text-light">
            <p>&copy; 2026 LoobyCard.com. Tự hào phát triển tại Việt Nam.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
