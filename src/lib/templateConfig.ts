import { z } from 'zod';

export const TEMPLATE_FONT_OPTIONS = [
  'Playfair Display',
  'Cormorant Garamond',
  'Great Vibes',
  'Dancing Script',
  'Be Vietnam Pro',
  'Inter',
  'Lora',
] as const;

export const TEMPLATE_GALLERY_LAYOUTS = ['grid', 'carousel', 'masonry', 'filmstrip'] as const;
export const TEMPLATE_DECORATION_SPEEDS = ['slow', 'medium', 'fast'] as const;

const hexColorSchema = z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}$/, 'Invalid hex color');
const optionalUrlSchema = z.string().trim().optional().default('');

const DEFAULT_THEME = {
  primaryColor: '#8B5E3C',
  secondaryColor: '#F8EDE3',
  backgroundColor: '#FFF9F3',
  textColor: '#3A2A1A',
  headingFont: 'Playfair Display',
  bodyFont: 'Be Vietnam Pro',
} as const;

const DEFAULT_BACKGROUND = {
  type: 'color',
  imageUrl: '',
  overlayOpacity: 0.2,
} as const;

const DEFAULT_FALLING_LEAVES = {
  enabled: true,
  imageUrl: '',
  count: 18,
  speed: 'medium',
  opacity: 0.7,
} as const;

const DEFAULT_FLOATING_FLOWERS = {
  enabled: false,
  imageUrl: '',
  count: 10,
  speed: 'slow',
  opacity: 0.7,
} as const;

const DEFAULT_CORNER_ORNAMENT = {
  enabled: true,
  topLeftUrl: '',
  topRightUrl: '',
  bottomLeftUrl: '',
  bottomRightUrl: '',
} as const;

const DEFAULT_GALLERY = {
  layout: 'grid',
  imageRadius: 'medium',
  spacing: 'medium',
} as const;

const decorationSchema = z.object({
  enabled: z.boolean().default(false),
  imageUrl: optionalUrlSchema,
  count: z.coerce.number().int().min(0).max(50).default(12),
  speed: z.enum(TEMPLATE_DECORATION_SPEEDS).default('medium'),
  opacity: z.coerce.number().min(0).max(1).default(0.7),
});

export const templateConfigSchema = z.object({
  theme: z.object({
    primaryColor: hexColorSchema.default('#8B5E3C'),
    secondaryColor: hexColorSchema.default('#F8EDE3'),
    backgroundColor: hexColorSchema.default('#FFF9F3'),
    textColor: hexColorSchema.default('#3A2A1A'),
    headingFont: z.enum(TEMPLATE_FONT_OPTIONS).default('Playfair Display'),
    bodyFont: z.enum(TEMPLATE_FONT_OPTIONS).default('Be Vietnam Pro'),
  }).default(DEFAULT_THEME),
  background: z.object({
    type: z.enum(['color', 'image']).default('color'),
    imageUrl: optionalUrlSchema,
    overlayOpacity: z.coerce.number().min(0).max(1).default(0.2),
  }).default(DEFAULT_BACKGROUND),
  decorations: z.object({
    fallingLeaves: decorationSchema.default(DEFAULT_FALLING_LEAVES),
    floatingFlowers: decorationSchema.default(DEFAULT_FLOATING_FLOWERS),
    cornerOrnament: z.object({
      enabled: z.boolean().default(true),
      topLeftUrl: optionalUrlSchema,
      topRightUrl: optionalUrlSchema,
      bottomLeftUrl: optionalUrlSchema,
      bottomRightUrl: optionalUrlSchema,
    }).default(DEFAULT_CORNER_ORNAMENT),
  }).default({
    fallingLeaves: DEFAULT_FALLING_LEAVES,
    floatingFlowers: DEFAULT_FLOATING_FLOWERS,
    cornerOrnament: DEFAULT_CORNER_ORNAMENT,
  }),
  gallery: z.object({
    layout: z.enum(TEMPLATE_GALLERY_LAYOUTS).default('grid'),
    imageRadius: z.enum(['none', 'small', 'medium', 'large', 'full']).default('medium'),
    spacing: z.enum(['tight', 'medium', 'relaxed']).default('medium'),
  }).default(DEFAULT_GALLERY),
});

export type TemplateConfig = z.infer<typeof templateConfigSchema>;
export type TemplateGalleryLayout = typeof TEMPLATE_GALLERY_LAYOUTS[number];

export const DEFAULT_TEMPLATE_CONFIG: TemplateConfig = templateConfigSchema.parse({});

export function normalizeTemplateConfig(value: unknown): TemplateConfig {
  return templateConfigSchema.parse(value || {});
}

export const templateUpsertSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().trim().min(1, 'Template name is required').optional(),
  description: z.string().trim().optional(),
  type: z.string().trim().min(1, 'Template type is required').optional(),
  thumbnail_url: z.string().nullable().optional(),
  preview_url: z.string().trim().optional(),
  is_enabled: z.boolean().optional(),
  sort_order: z.coerce.number().int().optional(),
  sample_data: z.record(z.string(), z.unknown()).optional(),
  css_override: z.string().optional(),
  base_template_id: z.string().nullable().optional(),
  base_template_key: z.string().nullable().optional(),
  config: templateConfigSchema.optional(),
  is_customizable: z.boolean().optional(),
  is_custom_template: z.boolean().optional(),
});

export const createTemplateSchema = z.object({
  action: z.enum(['create', 'duplicate']).default('create'),
  id: z.string().trim().regex(/^[a-z0-9-]+$/).optional(),
  base_template_id: z.string().trim().min(1, 'Base template is required'),
  name: z.string().trim().min(1, 'Template name is required'),
  thumbnail_url: z.string().trim().optional().default(''),
  is_enabled: z.boolean().default(true),
  config: templateConfigSchema.default(DEFAULT_TEMPLATE_CONFIG),
});
