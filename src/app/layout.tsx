import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-serif',
  display: 'swap',
});

const sans = Plus_Jakarta_Sans({
  subsets: ['latin', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LoobyCard - Hệ Thống Tạo Thiệp Điện Tử Tự Động',
  description: 'Tạo trang web đám cưới của riêng bạn chỉ trong 10 phút. Kho mẫu thiệp đa dạng, hỗ trợ RSVP, đếm ngược ngày cưới, album ảnh và nhiều tính năng hấp dẫn khác.',
  keywords: 'thiệp cưới online, thiệp cưới điện tử, tạo thiệp cưới, rsvp đám cưới, loobycard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${playfair.variable} ${sans.variable} scroll-smooth`}
      suppressHydrationWarning
    >
      <head>
        {/* Google Fonts for templates */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Alex+Brush&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&family=Montserrat:wght@300;400;500;600;700;800&family=Pattaya&family=Pinyon+Script&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Quicksand:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* FontAwesome CDN for templates */}
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body className="font-sans antialiased text-gray-800 bg-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
