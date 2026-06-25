import React from 'react';
import Template10 from '@/components/templates/Template10';

// Static preview data to ensure the template preview is immune to database deletions.
const mockCardData = {
  id: 'static-template-10',
  slug: 'loc-thu',
  template_id: 'template-10',
  groom_name: 'Thành Lộc',
  bride_name: 'Minh Thư',
  event_date: '2027-11-20T18:00:00.000Z',
  event_time: '18:00',
  event_location: 'Trung tâm Tiệc cưới Grand Palace',
  event_address: '142/18 Cộng Hòa, Phường 4, Tân Bình, Hồ Chí Minh',
  map_url: 'https://maps.app.goo.gl/BLtnTZYSbvoEcGdH8',
  groom_father: 'Ông Nguyễn Văn A',
  groom_mother: 'Bà Trần Thị B',
  bride_father: 'Ông Lê Văn C',
  bride_mother: 'Bà Phạm Thị D',
  bank_accounts: [
    {
      bank_name: 'Vietcombank',
      account_name: 'Nguyen Thanh Loc',
      account_number: '0123456789',
      qr_url: '/assets/images/template-11/qr-sample.png'
    },
    {
      bank_name: 'Techcombank',
      account_name: 'Le Minh Thu',
      account_number: '9876543210',
      qr_url: '/assets/images/template-11/qr-sample.png'
    }
  ],
  cover_image_url: '/templates/template-10/assets/images/cover_photo.png',
  album_images: [
    '/templates/template-10/assets/images/cover_photo.png'
  ],
  music_url: '' // optional
};

export default function LocThuStaticPreview() {
  // Pass previewMode=false to simulate the real viewer experience
  return <Template10 card={mockCardData} previewMode={false} />;
}
