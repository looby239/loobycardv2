import type { CardData } from '@/types/card';

export type TestPlanId = 'basic' | 'premium' | 'luxury';

export const TEST_PLAN_IDS: TestPlanId[] = ['basic', 'premium', 'luxury'];

export const TEST_PLAN_LABELS: Record<TestPlanId, string> = {
  basic: 'Basic',
  premium: 'Premium',
  luxury: 'Luxury',
};

export const TEMPLATE_TEST_IMAGES = [
  '/assets/images/template-11/photo1.webp',
  '/assets/images/template-11/photo2.webp',
  '/assets/images/template-11/photo3.webp',
  '/assets/images/template-11/photo4.webp',
  '/assets/images/template-11/photo5.webp',
  '/assets/images/template-11/photo6.webp',
  '/assets/images/template-11/photo7.webp',
  '/assets/images/template-15/photo1.jpg',
  '/assets/images/template-15/photo2.jpg',
  '/assets/images/template-15/photo3.jpg',
];

const TEST_BANK_INFO = {
  groomBankName: 'Vietcombank',
  groomBankAccount: '0123456789',
  groomBankHolder: 'LE TUAN KIET',
  brideBankName: 'Techcombank',
  brideBankAccount: '9876543210',
  brideBankHolder: 'NGUYEN MINH ANH',
};

export function buildTemplateTestCard(
  templateId: string,
  planId: TestPlanId,
): CardData & { custom_domain?: string | null } {
  const isBasic = planId === 'basic';
  const isLuxury = planId === 'luxury';

  return {
    id: `template-test-${templateId}-${planId}`,
    template_id: templateId,
    plan_id: planId,
    slug: `template-test-${templateId}-${planId}`,
    amount: isBasic ? 99000 : planId === 'premium' ? 399000 : 1199000,
    customer_name: 'Looby Admin',
    customer_email: 'admin@loobycard.com',
    customer_phone: '0900000000',
    bride_name: 'Minh Anh',
    groom_name: 'Tuấn Kiệt',
    bride_role: 'Cô dâu',
    groom_role: 'Chú rể',
    bride_father_name: 'Ông Nguyễn Văn Minh',
    bride_mother_name: 'Bà Trần Thị Mai',
    groom_father_name: 'Ông Lê Văn Kiệt',
    groom_mother_name: 'Bà Phạm Thị Hoa',
    bride_address: 'Gia đình nhà gái, TP. Hồ Chí Minh',
    groom_address: 'Gia đình nhà trai, TP. Hồ Chí Minh',
    event_date: '2027-11-21T18:00:00.000Z',
    reception_time: '17:30',
    ceremony_time: '18:00',
    venue_name: 'White Palace',
    venue_address: 'TP. Hồ Chí Minh',
    map_url: 'https://maps.app.goo.gl/BLtnTZYSbvoEcGdH8',
    invitation_text: 'Trân trọng kính mời bạn đến dự lễ cưới của chúng tôi.',
    quote_text: isBasic ? null : 'Tình yêu là hành trình hai người cùng chọn đi về một phía.',
    thank_you_text: 'Gia đình chúng tôi xin chân thành cảm ơn sự hiện diện và lời chúc phúc của quý khách.',
    cover_image_url: TEMPLATE_TEST_IMAGES[0],
    album_images: TEMPLATE_TEST_IMAGES,
    music_url: isBasic ? null : '/assets/audio/wedding-piano.mp3',
    qr_code_url: null,
    status: 'published',
    payment_status: 'paid',
    manage_token: `template-test-${templateId}-${planId}`,
    groom_bank_name: TEST_BANK_INFO.groomBankName,
    groom_bank_account: TEST_BANK_INFO.groomBankAccount,
    groom_bank_holder: TEST_BANK_INFO.groomBankHolder,
    bride_bank_name: TEST_BANK_INFO.brideBankName,
    bride_bank_account: TEST_BANK_INFO.brideBankAccount,
    bride_bank_holder: TEST_BANK_INFO.brideBankHolder,
    dress_code: isBasic ? null : 'Pastel, trắng hoặc be',
    has_schedule: !isBasic,
    wedding_schedule: isBasic
      ? null
      : [
          { time: '17:30', title: 'Đón khách', description: 'Gia đình hân hoan đón tiếp quý khách.' },
          { time: '18:00', title: 'Lễ thành hôn', description: 'Nghi thức chính thức bắt đầu.' },
          { time: '19:00', title: 'Khai tiệc', description: 'Cùng nâng ly chúc mừng đôi uyên ương.' },
        ],
    custom_domain: isLuxury ? 'demo-loobycard.com' : null,
  };
}
