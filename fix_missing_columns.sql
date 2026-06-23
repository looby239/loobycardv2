-- ====================================================================
-- SQL MIGRATION - Cập nhật các cột còn thiếu cho bảng cards và page_views
-- Chạy toàn bộ script này trong SQL Editor của Supabase
-- ====================================================================

-- 1. Thêm các cột tuỳ chỉnh (Custom roles, bank details, dress code) vào bảng cards nếu chưa có
ALTER TABLE cards ADD COLUMN IF NOT EXISTS groom_role TEXT DEFAULT 'Chú rể';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS bride_role TEXT DEFAULT 'Cô dâu';
ALTER TABLE cards ADD COLUMN IF NOT EXISTS groom_bank_name TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS groom_bank_account TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS groom_bank_holder TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS bride_bank_name TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS bride_bank_account TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS bride_bank_holder TEXT;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS dress_code TEXT;

-- 2. Thêm các cột thời hạn hiển thị (Expiry / Soft Delete) vào bảng cards nếu chưa có
ALTER TABLE cards ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

-- 3. Tạo bảng page_views nếu chưa có (để theo dõi lượt truy cập)
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

-- 4. Tạo các indexes cho page_views để tối ưu hóa hiệu suất truy vấn
CREATE INDEX IF NOT EXISTS idx_page_views_slug ON page_views(slug);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_card_id ON page_views(card_id);
CREATE INDEX IF NOT EXISTS idx_page_views_ip_hash_slug ON page_views(ip_hash, slug, created_at);

-- 5. Bật Row Level Security (RLS) cho page_views và cho phép Service Role truy cập đầy đủ
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role full access on page_views" ON page_views;
CREATE POLICY "Allow service role full access on page_views"
  ON page_views FOR ALL USING (true) WITH CHECK (true);
