import { CardData } from '@/types/card';

const TEMPLATE_IMAGE_FALLBACKS: Record<string, string[]> = {
  'template-10': ['/templates/template-10/assets/images/cover_photo.png'],
  'template-11': [
    '/assets/images/template-11/photo1.webp',
    '/assets/images/template-11/photo2.webp',
    '/assets/images/template-11/photo3.webp',
    '/assets/images/template-11/photo4.webp',
  ],
  'template-12': [
    '/assets/images/template-12/photo1.webp',
    '/assets/images/template-12/photo2.webp',
    '/assets/images/template-12/photo3.webp',
    '/assets/images/template-12/photo4.webp',
  ],
  'template-13': [
    '/assets/images/template-13/photo1.webp',
    '/assets/images/template-13/photo2.webp',
    '/assets/images/template-13/photo3.webp',
    '/assets/images/template-13/photo4.webp',
  ],
  'template-14': [
    '/assets/images/template-14/photo1.jpg',
    '/assets/images/template-14/photo2.jpg',
    '/assets/images/template-14/photo3.jpg',
    '/assets/images/template-14/photo4.jpg',
  ],
  'template-15': [
    '/assets/images/template-15/photo1.jpg',
    '/assets/images/template-15/photo2.jpg',
    '/assets/images/template-15/photo3.jpg',
    '/assets/images/template-15/photo4.jpg',
  ],
  'template-16': [
    '/assets/images/template-16/photo1.jpg',
    '/assets/images/template-16/photo2.jpg',
    '/assets/images/template-16/photo3.jpg',
    '/assets/images/template-16/photo4.jpg',
  ],
  'template-17': [
    '/assets/images/template-17/photo1.jpg',
    '/assets/images/template-17/photo2.jpg',
    '/assets/images/template-17/photo3.jpg',
    '/assets/images/template-17/photo4.jpg',
  ],
  'template-18': [
    '/assets/images/template-18/photo1.jpg',
    '/assets/images/template-18/photo2.jpg',
    '/assets/images/template-18/photo3.jpg',
    '/assets/images/template-18/photo4.jpg',
  ],
  'template-19': [
    '/assets/images/template-19/photo1.jpg',
    '/assets/images/template-19/photo2.jpg',
    '/assets/images/template-19/photo3.jpg',
    '/assets/images/template-19/photo4.jpg',
  ],
};

export function getDefaultTemplateSample(templateId: string): CardData {
  const albumImages = TEMPLATE_IMAGE_FALLBACKS[templateId] || TEMPLATE_IMAGE_FALLBACKS['template-10'];

  return {
    id: `sample-${templateId}`,
    template_id: templateId,
    plan_id: 'premium',
    slug: `${templateId}-sample`,
    amount: 0,
    customer_name: 'LoobyCard',
    customer_email: 'hello@loobycard.vn',
    customer_phone: '0900000000',
    groom_name: 'Thành Lộc',
    bride_name: 'Minh Thư',
    groom_role: 'Chú rể',
    bride_role: 'Cô dâu',
    groom_father_name: 'Ông Nguyễn Văn An',
    groom_mother_name: 'Bà Trần Thị Bình',
    bride_father_name: 'Ông Lê Văn Cường',
    bride_mother_name: 'Bà Phạm Thị Dung',
    groom_address: 'Tư gia nhà trai, Quận Tân Bình, TP. Hồ Chí Minh',
    bride_address: 'Tư gia nhà gái, Quận 3, TP. Hồ Chí Minh',
    event_date: '2027-11-20T18:00:00.000Z',
    reception_time: '17:30',
    ceremony_time: '18:00',
    venue_name: 'Trung tâm Tiệc cưới Grand Palace',
    venue_address: '142/18 Cộng Hòa, Phường 4, Tân Bình, TP. Hồ Chí Minh',
    map_url: 'https://maps.app.goo.gl/BLtnTZYSbvoEcGdH8',
    invitation_text: 'Trân trọng kính mời quý khách đến tham dự lễ thành hôn của chúng tôi. Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình.',
    quote_text: 'Tình yêu là hành trình hai người cùng chọn đi về một phía.',
    thank_you_text: 'Gia đình chúng tôi xin chân thành cảm ơn những lời chúc phúc và sự hiện diện yêu thương của quý khách.',
    cover_image_url: albumImages[0],
    album_images: albumImages,
    music_url: '',
    qr_code_url: null,
    status: 'published',
    payment_status: 'paid',
    manage_token: `sample-${templateId}`,
    groom_bank_name: 'Vietcombank',
    groom_bank_account: '0123456789',
    groom_bank_holder: 'NGUYEN THANH LOC',
    bride_bank_name: 'Techcombank',
    bride_bank_account: '9876543210',
    bride_bank_holder: 'LE MINH THU',
    dress_code: 'Hồng pastel, trắng',
    has_schedule: true,
    wedding_schedule: [
      { time: '17:30', title: 'Đón khách', description: 'Gia đình hân hoan đón tiếp quý khách.' },
      { time: '18:00', title: 'Lễ thành hôn', description: 'Nghi thức chính thức bắt đầu.' },
      { time: '19:00', title: 'Khai tiệc', description: 'Cùng nâng ly chúc mừng đôi uyên ương.' },
    ],
  };
}

export function mergeTemplateSample(templateId: string, sampleData?: Partial<CardData> | null): CardData {
  const defaults = getDefaultTemplateSample(templateId);
  return {
    ...defaults,
    ...(sampleData || {}),
    id: defaults.id,
    template_id: templateId,
    slug: defaults.slug,
    album_images: sampleData?.album_images && sampleData.album_images.length > 0
      ? sampleData.album_images
      : defaults.album_images,
    cover_image_url: sampleData?.cover_image_url || defaults.cover_image_url,
  };
}
