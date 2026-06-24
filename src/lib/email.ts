import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || '');
const emailFrom = process.env.EMAIL_FROM || '"LoobyCard" <hotro@loobycard.com>';

interface CardInfo {
  customerName: string;
  customerEmail: string;
  slug: string;
  manageToken: string;
  planId: string;
  customDomain?: string;
  standardQrUrl: string;
  transparentQrUrl: string;
  publishedAt?: string;
  expiresAt?: string;
}

export interface DemoEmailInfo {
  customerName: string;
  customerEmail: string;
  slug: string;
  planId: string;
}

/**
 * Sends a notification email to the customer when their card is published.
 */
export async function sendPublishEmail(card: CardInfo) {
  try {
    // 1. Fetch QR codes as buffers for attachments
    const standardQrRes = await fetch(card.standardQrUrl);
    const standardBuffer = Buffer.from(await standardQrRes.arrayBuffer());

    const transparentQrRes = await fetch(card.transparentQrUrl);
    const transparentBuffer = Buffer.from(await transparentQrRes.arrayBuffer());

    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loobycard.com';
    if (siteUrl.includes('loobycard.com')) siteUrl = 'https://loobycard.com';
    const cardLink = `${siteUrl}/${card.slug}`;
    const manageLink = `${siteUrl}/manage/${card.manageToken}`;

    const rsvpText = card.planId !== 'basic' || true
      ? `<p><strong>Link quản lý RSVP (Không cần đăng nhập):</strong><br>
         <a href="${manageLink}" style="color: #2563eb; font-weight: bold; text-decoration: underline;">${manageLink}</a></p>
         <p>Tại trang quản lý RSVP, bạn có thể xem danh sách phản hồi tham dự, xem lời chúc mừng và xuất dữ liệu ra file CSV.</p>`
      : '';

    const publishedDateText = card.publishedAt
      ? new Date(card.publishedAt).toLocaleDateString('vi-VN')
      : new Date().toLocaleDateString('vi-VN');
    const expiresDateText = card.expiresAt
      ? new Date(card.expiresAt).toLocaleDateString('vi-VN')
      : '';

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
        <h2 style="color: #a31d16; text-align: center; border-bottom: 2px solid #f0d497; padding-bottom: 10px;">THIỆP CỦA BẠN ĐÃ ĐƯỢC XUẤT BẢN</h2>
        <p>Xin chào <strong>${card.customerName}</strong>,</p>
        <p>Chúc mừng! Thiệp điện tử của bạn đã được duyệt và xuất bản thành công trên LoobyCard.</p>
        
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin-top: 0;"><strong>Thông tin thiệp của bạn:</strong></p>
          <p><strong>Đường dẫn truy cập:</strong><br>
             <a href="${cardLink}" style="color: #a31d16; font-weight: bold; text-decoration: underline;">${cardLink}</a></p>
          <p><strong>Thời hạn hiển thị:</strong> Từ ${publishedDateText} đến ${expiresDateText}</p>
          <p style="font-size: 12px; color: #4b5563; margin-top: 5px; margin-bottom: 15px;">Sau thời gian này, thiệp sẽ tạm ngưng hiển thị. Nếu muốn gia hạn, vui lòng liên hệ LoobyCard.</p>
          ${rsvpText}
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p><strong>Mã QR Code quét trực tiếp để mở thiệp:</strong></p>
          <img src="cid:standard_qr" alt="QR Code" style="width: 200px; height: 200px; border: 1px solid #e5e7eb; border-radius: 8px;" />
        </div>

        <p>Chúng tôi đã đính kèm file ảnh QR Code gốc và file QR Code nền trong suốt (phục vụ in ấn/thiết kế phông nền) trong email này.</p>
        <p>Cảm ơn bạn đã tin dùng dịch vụ của LoobyCard. Chúc ngày trọng đại của bạn diễn ra tốt đẹp nhất!</p>
        <p><strong>Liên hệ hỗ trợ 0844444913 (call/zalo)</strong></p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0 15px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động từ hệ thống LoobyCard.com. Vui lòng không phản hồi email này.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: [card.customerEmail],
      subject: 'Thiệp của bạn đã được xuất bản',
      html: htmlContent,
      attachments: [
        {
          filename: 'qr_code.png',
          content: standardBuffer,
        },
        {
          filename: 'qr_code_transparent.png',
          content: transparentBuffer,
        },
        {
          filename: 'qr_code.png',
          content: standardBuffer,
          contentId: 'standard_qr',
        },
      ],
    });

    if (error) {
      console.error('Error sending publish email via Resend:', error);
      throw new Error(error.message);
    }

    console.log('Publish email sent via Resend:', data?.id);
    return data;
  } catch (error) {
    console.error('Error sending publish email:', error);
    throw error;
  }
}

/**
 * Sends a notification email to the customer when their custom domain is activated.
 */
export async function sendDomainActivationEmail(card: CardInfo) {
  try {
    const standardQrRes = await fetch(card.standardQrUrl);
    const standardBuffer = Buffer.from(await standardQrRes.arrayBuffer());

    const transparentQrRes = await fetch(card.transparentQrUrl);
    const transparentBuffer = Buffer.from(await transparentQrRes.arrayBuffer());

    const customDomainLink = `https://${card.customDomain}`;
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loobycard.com';
    if (siteUrl.includes('loobycard.com')) siteUrl = 'https://loobycard.com';
    const fallbackLink = `${siteUrl}/${card.slug}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
        <h2 style="color: #a31d16; text-align: center; border-bottom: 2px solid #f0d497; padding-bottom: 10px;">TÊN MIỀN RIÊNG ĐÃ ĐƯỢC KÍCH HOẠT</h2>
        <p>Xin chào <strong>${card.customerName}</strong>,</p>
        <p>Tên miền riêng cho gói Luxury của bạn đã được kích hoạt thành công.</p>
        
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin-top: 0;"><strong>Thông tin đường dẫn:</strong></p>
          <p><strong>Đường dẫn tên miền riêng:</strong><br>
             <a href="${customDomainLink}" style="color: #a31d16; font-weight: bold; text-decoration: underline;">${customDomainLink}</a></p>
          <p><strong>Đường dẫn dự phòng (LoobyCard):</strong><br>
             <a href="${fallbackLink}" style="color: #6b7280; text-decoration: underline;">${fallbackLink}</a></p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <p><strong>Mã QR Code MỚI (được tạo theo tên miền riêng):</strong></p>
          <img src="cid:standard_qr" alt="New QR Code" style="width: 200px; height: 200px; border: 1px solid #e5e7eb; border-radius: 8px;" />
        </div>

        <p>Lưu ý: Mã QR Code này đã được tạo lại theo tên miền riêng mới của bạn. Vui lòng sử dụng mã QR Code đính kèm dưới đây để in ấn hoặc chia sẻ.</p>
        <p>Cảm ơn bạn đã tin dùng dịch vụ của LoobyCard. Chúc ngày trọng đại của bạn diễn ra tốt đẹp nhất!</p>
        <p><strong>Liên hệ hỗ trợ 0844444913 (call/zalo)</strong></p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0 15px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động từ hệ thống LoobyCard.com. Vui lòng không phản hồi email này.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: [card.customerEmail],
      subject: 'Tên miền riêng của bạn đã được kích hoạt',
      html: htmlContent,
      attachments: [
        {
          filename: 'qr_code_domain.png',
          content: standardBuffer,
        },
        {
          filename: 'qr_code_domain_transparent.png',
          content: transparentBuffer,
        },
        {
          filename: 'qr_code_domain.png',
          content: standardBuffer,
          contentId: 'standard_qr',
        },
      ],
    });

    if (error) {
      console.error('Error sending domain activation email via Resend:', error);
      throw new Error(error.message);
    }

    console.log('Domain activation email sent via Resend:', data?.id);
    return data;
  } catch (error) {
    console.error('Error sending domain activation email:', error);
    throw error;
  }
}

/**
 * Sends a notification email to the customer when their demo is created.
 */
export async function sendDemoEmail(demo: DemoEmailInfo) {
  try {
    let siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://loobycard.com';
    if (siteUrl.includes('loobycard.com')) siteUrl = 'https://loobycard.com';
    const previewLink = `${siteUrl}/preview/${demo.slug}`;
    
    let planName = 'Gói Cơ Bản';
    let durationText = '1 tháng';
    let planPrice = 99000;
    if (demo.planId === 'premium') {
      planName = 'Gói Premium';
      durationText = '3 tháng';
      planPrice = 399000;
    } else if (demo.planId === 'luxury') {
      planName = 'Gói Luxury';
      durationText = '6 tháng';
      planPrice = 1199000;
    }

    const bankId = 'TPB';
    const accountNumber = '03878504601';
    const accountName = 'NGUYEN THANH LOC';
    const memo = `LOOBYCARD-${demo.slug}`;
    const qrUrl = `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png?amount=${planPrice}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName)}`;

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
        <h2 style="color: #a31d16; text-align: center; border-bottom: 2px solid #f0d497; padding-bottom: 10px;">DEMO THIỆP CỦA BẠN ĐÃ ĐƯỢC TẠO</h2>
        <p>Xin chào <strong>${demo.customerName}</strong>,</p>
        <p>Demo thiệp của bạn đã được tạo thành công trên LoobyCard.</p>
        
        <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Link xem demo:</strong><br>
             <a href="${previewLink}" style="color: #a31d16; font-weight: bold; text-decoration: underline;">${previewLink}</a></p>
          <p style="color: #ef4444; font-size: 13px; font-weight: bold; margin: 15px 0;">
            Lưu ý: Link demo chỉ được lưu trong 24 giờ. Nếu bạn chưa thanh toán trong thời gian này, hệ thống sẽ tự động xóa demo và toàn bộ dữ liệu đã tải lên.
          </p>
          <p><strong>Gói bạn đã chọn:</strong> ${planName}</p>
          <p><strong>Thời hạn hiển thị sau khi thanh toán:</strong> ${durationText}</p>
          
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 15px 0;" />
          <h3 style="color: #a31d16; font-size: 16px; margin-top: 0;">THÔNG TIN CHUYỂN KHOẢN THANH TOÁN</h3>
          <div style="text-align: center; margin: 15px 0;">
            <img src="${qrUrl}" alt="Mã QR Thanh Toán" style="width: 250px; height: 250px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; background-color: #ffffff;" />
          </div>
          <p><strong>Ngân hàng:</strong> Ngân hàng Tiên Phong (TPBank)</p>
          <p><strong>Số tài khoản:</strong> 03878504601</p>
          <p><strong>Chủ tài khoản:</strong> NGUYEN THANH LOC</p>
          <p><strong>Số tiền:</strong> <span style="color: #ef4444; font-weight: bold;">${planPrice.toLocaleString('vi-VN')} VNĐ</span></p>
          <p><strong>Nội dung chuyển khoản:</strong> <span style="font-family: monospace; font-size: 14px; font-weight: bold; background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px;">${memo}</span></p>
          <p style="font-size: 13px; color: #4b5563; font-style: italic; margin-bottom: 0;">(Vui lòng chuyển khoản đúng nội dung để hệ thống ghi nhận và duyệt thiệp nhanh nhất)</p>
        </div>

        <p>Cảm ơn bạn đã sử dụng LoobyCard. Chúc ngày trọng đại của bạn diễn ra tốt đẹp nhất!</p>
        <p><strong>Liên hệ hỗ trợ 0844444913 (call/zalo)</strong></p>
        <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0 15px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">Đây là email tự động từ hệ thống LoobyCard.com. Vui lòng không phản hồi email này.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: [demo.customerEmail],
      subject: 'Demo thiệp của bạn đã được tạo',
      html: htmlContent,
    });

    if (error) {
      console.error('Error sending demo email via Resend:', error);
      throw new Error(error.message);
    }

    console.log('Demo email sent via Resend:', data?.id);
    return data;
  } catch (error) {
    console.error('Error sending demo email:', error);
    throw error;
  }
}
