-- Admin Template Customizer migration for LoobyCard.
-- Existing project uses TEXT template ids ('template-10', custom UUID strings),
-- so base_template_id is TEXT instead of UUID.

ALTER TABLE templates
  ADD COLUMN IF NOT EXISTS base_template_id TEXT REFERENCES templates(id),
  ADD COLUMN IF NOT EXISTS base_template_key TEXT,
  ADD COLUMN IF NOT EXISTS config JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS is_custom_template BOOLEAN DEFAULT FALSE;

ALTER TABLE template_configs
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'thiep-cuoi',
  ADD COLUMN IF NOT EXISTS preview_url TEXT,
  ADD COLUMN IF NOT EXISTS base_template_id TEXT,
  ADD COLUMN IF NOT EXISTS base_template_key TEXT,
  ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_customizable BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS is_custom_template BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE template_configs
SET
  type = COALESCE(type, 'thiep-cuoi'),
  preview_url = COALESCE(preview_url, '/template-preview/' || id),
  base_template_key = COALESCE(base_template_key, id),
  is_customizable = COALESCE(is_customizable, TRUE),
  is_custom_template = COALESCE(is_custom_template, FALSE),
  config = COALESCE(config, '{}'::jsonb);

INSERT INTO templates (
  id,
  name,
  type,
  thumbnail_url,
  preview_url,
  is_active,
  base_template_id,
  base_template_key,
  config,
  is_customizable,
  is_custom_template
)
SELECT
  id,
  name,
  COALESCE(type, 'thiep-cuoi'),
  COALESCE(thumbnail_url, ''),
  COALESCE(preview_url, '/template-preview/' || id),
  is_enabled,
  base_template_id,
  COALESCE(base_template_key, id),
  COALESCE(config, '{}'::jsonb),
  COALESCE(is_customizable, TRUE),
  COALESCE(is_custom_template, FALSE)
FROM template_configs
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  type = EXCLUDED.type,
  thumbnail_url = EXCLUDED.thumbnail_url,
  preview_url = EXCLUDED.preview_url,
  is_active = EXCLUDED.is_active,
  base_template_id = EXCLUDED.base_template_id,
  base_template_key = EXCLUDED.base_template_key,
  config = EXCLUDED.config,
  is_customizable = EXCLUDED.is_customizable,
  is_custom_template = EXCLUDED.is_custom_template;

-- Create a public Supabase Storage bucket named "template-assets".
-- Use dashboard if this SQL is not available in your Supabase plan:
-- Storage > New bucket > template-assets > Public.
--
-- Paths used by the app:
-- template-assets/[template_id]/background/
-- template-assets/[template_id]/decorations/
-- template-assets/[template_id]/thumbnail/
