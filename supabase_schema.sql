-- Create pricing_plans table
CREATE TABLE IF NOT EXISTS pricing_plans (
  id TEXT PRIMARY KEY, -- 'basic', 'premium', 'luxury'
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  album_image_limit INTEGER NOT NULL,
  rsvp_limit INTEGER NOT NULL, -- -1 for unlimited, or numerical limit
  has_music BOOLEAN NOT NULL DEFAULT FALSE,
  has_custom_domain BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default pricing plans
INSERT INTO pricing_plans (id, name, price, album_image_limit, rsvp_limit, has_music, has_custom_domain)
VALUES 
  ('basic', 'Gói Cơ Bản', 99000, 10, 100, FALSE, FALSE),
  ('premium', 'Gói Premium', 399000, 20, -1, TRUE, FALSE),
  ('luxury', 'Gói Luxury', 1199000, 50, -1, TRUE, TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  album_image_limit = EXCLUDED.album_image_limit,
  rsvp_limit = EXCLUDED.rsvp_limit,
  has_music = EXCLUDED.has_music,
  has_custom_domain = EXCLUDED.has_custom_domain;

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id TEXT PRIMARY KEY, -- 'template-10', 'template-11', etc.
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'thiep-cuoi', 'thiep-sinh-nhat', 'thiep-thoi-noi', 'thiep-khac'
  thumbnail_url TEXT NOT NULL,
  preview_url TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert templates 10 through 19
INSERT INTO templates (id, name, type, thumbnail_url, preview_url, is_active)
VALUES
  ('template-10', 'Lời Hứa Vĩnh Cửu', 'thiep-cuoi', '/assets/images/template-promise.png', '/templates/template-10/index.html', TRUE),
  ('template-11', 'Mai Lan Trắng', 'thiep-cuoi', '/assets/images/template-11/preview.png', '/templates/template-11/index.html', TRUE),
  ('template-12', 'Song Hỷ Xanh', 'thiep-cuoi', '/assets/images/template-12/preview.png', '/templates/template-12/index.html', TRUE),
  ('template-13', 'Vườn Xuân Xanh', 'thiep-cuoi', '/assets/images/template-13/preview.png', '/templates/template-13/index.html', TRUE),
  ('template-14', 'Vườn Xuân Xanh Premium', 'thiep-cuoi', '/assets/images/template-14/preview.png', '/templates/template-14/index.html', TRUE),
  ('template-15', 'Thành Lộc & Minh Thư', 'thiep-cuoi', '/assets/images/template-15/preview.png', '/templates/template-15/index.html', TRUE),
  ('template-16', 'Thanh Diệp Xanh', 'thiep-cuoi', '/assets/images/template-16/preview.png', '/templates/template-16/index.html', TRUE),
  ('template-17', 'Hoa Mộc Hồng', 'thiep-cuoi', '/assets/images/template-17/photo1.jpg', '/templates/template-17/index.html', TRUE),
  ('template-18', 'Vườn Xuân Đỏ', 'thiep-cuoi', '/assets/images/template-18/photo1.jpg', '/templates/template-18/index.html', TRUE),
  ('template-19', 'Minimalism Đỏ', 'thiep-cuoi', '/assets/images/template-19/photo1.jpg', '/templates/template-19/index.html', TRUE)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  thumbnail_url = EXCLUDED.thumbnail_url,
  preview_url = EXCLUDED.preview_url,
  is_active = EXCLUDED.is_active;

-- Create cards table
CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id TEXT REFERENCES templates(id) ON DELETE RESTRICT,
  plan_id TEXT REFERENCES pricing_plans(id) ON DELETE RESTRICT,
  amount NUMERIC NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  custom_domain TEXT UNIQUE,
  domain_status TEXT DEFAULT 'inactive', -- 'inactive', 'active'
  domain_activated_at TIMESTAMP WITH TIME ZONE,
  manage_token TEXT UNIQUE NOT NULL,
  
  -- Customer Details
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,

  -- Bride & Groom Details
  bride_name TEXT NOT NULL,
  groom_name TEXT NOT NULL,
  bride_father_name TEXT,
  bride_mother_name TEXT,
  groom_father_name TEXT,
  groom_mother_name TEXT,
  bride_address TEXT,
  groom_address TEXT,

  -- Event Details
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  reception_time TEXT NOT NULL,
  ceremony_time TEXT NOT NULL,
  venue_name TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  map_url TEXT,
  invitation_text TEXT NOT NULL,
  quote_text TEXT,
  thank_you_text TEXT,

  -- Media & Assets
  cover_image_url TEXT NOT NULL,
  music_url TEXT,
  qr_code_url TEXT,

  -- Custom Roles, Bank details, and Dress Code
  groom_role TEXT DEFAULT 'Chú rể',
  bride_role TEXT DEFAULT 'Cô dâu',
  groom_bank_name TEXT,
  groom_bank_account TEXT,
  groom_bank_holder TEXT,
  bride_bank_name TEXT,
  bride_bank_account TEXT,
  bride_bank_holder TEXT,
  dress_code TEXT,

  -- Administrative Statuses
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'pending', 'published'
  payment_status TEXT NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'paid'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Indexing for quick lookups
CREATE INDEX IF NOT EXISTS idx_cards_slug ON cards(slug);
CREATE INDEX IF NOT EXISTS idx_cards_custom_domain ON cards(custom_domain);
CREATE INDEX IF NOT EXISTS idx_cards_manage_token ON cards(manage_token);

-- Create card_images table
CREATE TABLE IF NOT EXISTS card_images (
  id BIGSERIAL PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Create rsvp_responses table
CREATE TABLE IF NOT EXISTS rsvp_responses (
  id BIGSERIAL PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  phone TEXT,
  attend_status TEXT NOT NULL, -- 'yes', 'no'
  guests_count INTEGER NOT NULL DEFAULT 1,
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guest_messages table
CREATE TABLE IF NOT EXISTS guest_messages (
  id BIGSERIAL PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ALTER TABLE statements for existing databases (Run this section in SQL Editor to migrate)
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS groom_role TEXT DEFAULT 'Chú rể';
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS bride_role TEXT DEFAULT 'Cô dâu';
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS groom_bank_name TEXT;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS groom_bank_account TEXT;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS groom_bank_holder TEXT;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS bride_bank_name TEXT;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS bride_bank_account TEXT;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS bride_bank_holder TEXT;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS dress_code TEXT;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS has_schedule BOOLEAN NOT NULL DEFAULT FALSE;
-- ALTER TABLE cards ADD COLUMN IF NOT EXISTS wedding_schedule JSONB DEFAULT '[]'::jsonb;

-- ============================================================
-- ANALYTICS: page_views table (Run to create analytics tracking)
-- ============================================================
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
  slug TEXT,
  page_url TEXT,
  referrer TEXT,
  user_agent TEXT,
  device_type TEXT, -- 'mobile' | 'tablet' | 'desktop'
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for analytics query performance
CREATE INDEX IF NOT EXISTS idx_page_views_slug ON page_views(slug);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_card_id ON page_views(card_id);
CREATE INDEX IF NOT EXISTS idx_page_views_ip_hash_slug ON page_views(ip_hash, slug, created_at);

-- RLS: Allow anonymous inserts (for tracking), but only service role can read
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access on page_views"
  ON page_views FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- TEMPLATE CONFIGS: per-template admin settings
-- Run in Supabase SQL Editor to enable /admin/templates page
-- ============================================================
CREATE TABLE IF NOT EXISTS template_configs (
  id TEXT PRIMARY KEY,                   -- 'template-10' ... 'template-19'
  name TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  thumbnail_url TEXT,                    -- Custom uploaded thumbnail URL
  is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  css_override TEXT NOT NULL DEFAULT '', -- Admin CSS injected into live render
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE template_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access on template_configs"
  ON template_configs FOR ALL USING (true) WITH CHECK (true);

-- NOTE: Also create a Storage bucket named "template-thumbnails"
-- with Public access enabled via Supabase dashboard > Storage.
