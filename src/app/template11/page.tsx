import React from 'react';
import Template11 from '@/components/templates/Template11';

// Static preview data to ensure the template preview is immune to database deletions.
const mockCardData = {
  id: 'static-template-11',
  slug: 'template11',
  template_id: 'template-11',
  groom_name: 'Minh Quân',
  bride_name: 'Phương Thảo',
  event_date: '2027-06-16T18:00:00.000Z',
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
      account_name: 'Nguyen Minh Quan',
      account_number: '0123456789',
      qr_url: '/assets/images/template-11/qr-sample.png'
    },
    {
      bank_name: 'Techcombank',
      account_name: 'Le Phuong Thao',
      account_number: '9876543210',
      qr_url: '/assets/images/template-11/qr-sample.png'
    }
  ],
  cover_image_url: '/assets/images/template-11/photo1.webp',
  album_images: [
    '/assets/images/template-11/photo2.webp',
    '/assets/images/template-11/photo3.webp',
    '/assets/images/template-11/photo4.webp',
    '/assets/images/template-11/photo5.webp'
  ],
  music_url: '' // optional
};

export default function Template11StaticPreview() {
  // Pass previewMode=false to simulate the real viewer experience
  return <Template11 card={mockCardData} previewMode={false} />;
}
