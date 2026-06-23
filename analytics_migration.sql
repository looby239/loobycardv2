-- ================================================================
-- ANALYTICS MIGRATION — Chạy SQL này trong Supabase SQL Editor
-- ================================================================

-- 1. Tạo bảng page_views
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

-- 2. Indexes cho hiệu suất query
CREATE INDEX IF NOT EXISTS idx_page_views_slug ON page_views(slug);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_page_views_card_id ON page_views(card_id);
CREATE INDEX IF NOT EXISTS idx_page_views_ip_hash_slug ON page_views(ip_hash, slug, created_at);

-- 3. Bật RLS và cho phép service role đầy đủ quyền
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow service role full access on page_views" ON page_views;
CREATE POLICY "Allow service role full access on page_views"
  ON page_views FOR ALL USING (true) WITH CHECK (true);

-- 4. (Optional) Thêm cột expires_at/deleted_at/archived_at vào cards nếu chưa có
ALTER TABLE cards ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
