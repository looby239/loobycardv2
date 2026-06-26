export interface CardData {
  id: string;
  template_id: string;
  plan_id: string;
  slug: string;
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  bride_name: string;
  groom_name: string;
  bride_father_name?: string | null;
  bride_mother_name?: string | null;
  groom_father_name?: string | null;
  groom_mother_name?: string | null;
  bride_address?: string | null;
  groom_address?: string | null;
  event_date: string;
  reception_time: string;
  ceremony_time: string;
  venue_name: string;
  venue_address: string;
  map_url?: string | null;
  invitation_text: string;
  quote_text?: string | null;
  thank_you_text?: string | null;
  cover_image_url: string;
  music_url?: string | null;
  qr_code_url?: string | null;
  status: string;
  payment_status: string;
  created_at?: string | null;
  published_at?: string | null;
  manage_token: string;
  album_images?: string[];

  // Custom Roles, Bank details, and Dress Code
  groom_role?: string | null;
  bride_role?: string | null;
  groom_bank_name?: string | null;
  groom_bank_account?: string | null;
  groom_bank_holder?: string | null;
  bride_bank_name?: string | null;
  bride_bank_account?: string | null;
  bride_bank_holder?: string | null;
  dress_code?: string | null;

  // Auto expiry and cleanup fields
  expires_at?: string | null;
  deleted_at?: string | null;
  archived_at?: string | null;

  // Wedding Schedule
  has_schedule?: boolean;
  wedding_schedule?: { time: string; title: string; description?: string }[] | null;
}


