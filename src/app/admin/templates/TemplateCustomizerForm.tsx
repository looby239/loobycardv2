'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Eye, Loader2, Save, Upload, X } from 'lucide-react';
import {
  DEFAULT_TEMPLATE_CONFIG,
  TEMPLATE_DECORATION_SPEEDS,
  TEMPLATE_FONT_OPTIONS,
  TEMPLATE_GALLERY_LAYOUTS,
  normalizeTemplateConfig,
  type TemplateConfig,
} from '@/lib/templateConfig';

interface AdminTemplate {
  id: string;
  name: string;
  description?: string | null;
  type?: string | null;
  typeName?: string | null;
  thumbnail_url?: string | null;
  defaultThumbnail?: string | null;
  preview_url?: string | null;
  is_enabled: boolean;
  sort_order: number;
  base_template_id?: string | null;
  base_template_key?: string | null;
  config?: TemplateConfig | null;
  is_custom_template?: boolean | null;
}

type Mode = 'new' | 'edit';
type AssetType = 'background' | 'decorations' | 'thumbnail';
type TemplateConfigPatch = {
  theme?: Partial<TemplateConfig['theme']>;
  background?: Partial<TemplateConfig['background']>;
  decorations?: {
    fallingLeaves?: Partial<TemplateConfig['decorations']['fallingLeaves']>;
    floatingFlowers?: Partial<TemplateConfig['decorations']['floatingFlowers']>;
    cornerOrnament?: Partial<TemplateConfig['decorations']['cornerOrnament']>;
  };
  gallery?: Partial<TemplateConfig['gallery']>;
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #dbe3ef',
  borderRadius: 10,
  padding: '10px 12px',
  fontSize: 13,
  color: '#0f172a',
  background: '#fff',
};

const sectionStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 14,
  padding: 16,
  boxShadow: '0 4px 18px rgba(15,23,42,0.04)',
};

function createCustomId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `custom-${crypto.randomUUID()}`;
  }
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: 6, fontSize: 11, fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
      {children}
    </label>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        width: 48,
        height: 26,
        borderRadius: 999,
        border: 'none',
        padding: 3,
        background: checked ? '#4f46e5' : '#cbd5e1',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: checked ? 'flex-end' : 'flex-start',
      }}
    >
      <span style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

export default function TemplateCustomizerForm({
  mode,
  templateId,
  baseTemplateId,
}: {
  mode: Mode;
  templateId?: string;
  baseTemplateId?: string;
}) {
  const router = useRouter();
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [customId] = useState(() => templateId || createCustomId());
  const [name, setName] = useState('');
  const [type, setType] = useState('thiep-cuoi');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [config, setConfig] = useState<TemplateConfig>(DEFAULT_TEMPLATE_CONFIG);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3200);
  };

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Khong the tai template');
      setTemplates(data.templates || []);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Loi tai template', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void loadTemplates();
    });
  }, [loadTemplates]);

  const currentTemplate = useMemo(
    () => templates.find((template) => template.id === templateId),
    [templates, templateId]
  );

  const baseTemplate = useMemo(() => {
    if (mode === 'edit') {
      const baseId = currentTemplate?.base_template_id || currentTemplate?.base_template_key || currentTemplate?.id;
      return templates.find((template) => template.id === baseId) || currentTemplate;
    }
    return templates.find((template) => template.id === baseTemplateId);
  }, [baseTemplateId, currentTemplate, mode, templates]);

  useEffect(() => {
    if (loading) return;

    queueMicrotask(() => {
      if (mode === 'edit' && currentTemplate) {
        setName(currentTemplate.name || '');
        setType(currentTemplate.type || 'thiep-cuoi');
        setThumbnailUrl(currentTemplate.thumbnail_url || currentTemplate.defaultThumbnail || '');
        setIsEnabled(currentTemplate.is_enabled);
        setConfig(normalizeTemplateConfig(currentTemplate.config));
        return;
      }

      if (mode === 'new' && baseTemplate) {
        setName(`${baseTemplate.name} custom`);
        setType(baseTemplate.type || 'thiep-cuoi');
        setThumbnailUrl(baseTemplate.thumbnail_url || baseTemplate.defaultThumbnail || '');
        setIsEnabled(true);
        setConfig(normalizeTemplateConfig(baseTemplate.config));
      }
    });
  }, [baseTemplate, currentTemplate, loading, mode]);

  const patchConfig = (next: TemplateConfigPatch) => {
    setConfig((prev) => normalizeTemplateConfig({
      ...prev,
      ...next,
      theme: { ...prev.theme, ...next.theme },
      background: { ...prev.background, ...next.background },
      decorations: {
        ...prev.decorations,
        ...next.decorations,
        fallingLeaves: { ...prev.decorations.fallingLeaves, ...next.decorations?.fallingLeaves },
        floatingFlowers: { ...prev.decorations.floatingFlowers, ...next.decorations?.floatingFlowers },
        cornerOrnament: { ...prev.decorations.cornerOrnament, ...next.decorations?.cornerOrnament },
      },
      gallery: { ...prev.gallery, ...next.gallery },
    }));
  };

  const uploadAsset = (assetType: AssetType, applyUrl: (url: string) => void) => {
    return async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setUploading(assetType);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('templateId', customId);
        formData.append('assetType', assetType);

        const res = await fetch('/api/admin/templates/upload-asset', { method: 'POST', body: formData });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Upload that bai');
        applyUrl(data.url);
        showToast('Upload thanh cong');
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Upload that bai', 'error');
      } finally {
        setUploading(null);
        event.target.value = '';
      }
    };
  };

  const previewTemplateId = mode === 'new' ? baseTemplate?.id : customId;
  const previewSrc = previewTemplateId
    ? `/template-preview/${previewTemplateId}?adminPreview=1&config=${encodeURIComponent(JSON.stringify(config))}`
    : '';

  const saveTemplate = async () => {
    if (!name.trim()) {
      showToast('Ten template la bat buoc', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = mode === 'new'
        ? {
            action: 'create',
            id: customId,
            base_template_id: baseTemplate?.id,
            name,
            thumbnail_url: thumbnailUrl,
            is_enabled: isEnabled,
            config,
          }
        : {
            id: customId,
            name,
            type,
            thumbnail_url: thumbnailUrl,
            is_enabled: isEnabled,
            config,
          };

      const res = await fetch('/api/admin/templates', {
        method: mode === 'new' ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Khong the luu template');

      showToast('Da luu template');
      if (mode === 'new') {
        router.push(`/admin/templates/${data.template.id}/edit`);
      } else {
        void loadTemplates();
      }
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Khong the luu template', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4f46e5' }}>
        <Loader2 size={34} style={{ animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if ((mode === 'new' && !baseTemplate) || (mode === 'edit' && !currentTemplate)) {
    return (
      <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 32 }}>
        <Link href="/admin/templates">Quay lai danh sach template</Link>
        <p style={{ marginTop: 16, color: '#ef4444', fontWeight: 700 }}>Khong tim thay template.</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', color: '#0f172a' }}>
      {toast && (
        <div style={{ position: 'fixed', top: 18, right: 18, zIndex: 1000, padding: '12px 16px', borderRadius: 12, color: '#fff', background: toast.type === 'success' ? '#10b981' : '#ef4444', fontWeight: 800, fontSize: 13 }}>
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 1180px) {
          .template-customizer-layout { grid-template-columns: 1fr !important; }
          .template-customizer-preview { position: relative !important; top: auto !important; }
        }
      `}</style>

      <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1440, margin: '0 auto', minHeight: 64, padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link href="/admin/templates" style={{ width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', background: '#f1f5f9', color: '#475569' }}>
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>{mode === 'new' ? 'Tao template tu mau' : 'Chinh sua template'}</h1>
              <p style={{ margin: '3px 0 0', fontSize: 12, color: '#64748b' }}>
                Base: <strong>{baseTemplate?.name || currentTemplate?.base_template_key || currentTemplate?.id}</strong>
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={() => router.push('/admin/templates')}
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #e2e8f0', borderRadius: 12, background: '#fff', color: '#475569', padding: '10px 15px', fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer' }}
            >
              <X size={16} />
              Hủy
            </button>
            <button
              type="button"
              onClick={saveTemplate}
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', borderRadius: 12, background: saving ? '#a5b4fc' : '#4f46e5', color: '#fff', padding: '11px 16px', fontWeight: 900, cursor: saving ? 'wait' : 'pointer' }}
            >
              {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
              Lưu template
            </button>
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1440, margin: '0 auto', padding: 24 }}>
        <div className="template-customizer-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 430px', gap: 20, alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 16 }}>
            <section style={sectionStyle}>
              <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 900 }}>Thong tin template</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                <Field label="Ten template">
                  <input style={inputStyle} value={name} onChange={(event) => setName(event.target.value)} />
                </Field>
                <Field label="Loai template">
                  <input style={inputStyle} value={type} onChange={(event) => setType(event.target.value)} />
                </Field>
                <Field label="Thumbnail URL">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input style={inputStyle} value={thumbnailUrl} onChange={(event) => setThumbnailUrl(event.target.value)} />
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 12px', borderRadius: 10, background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <Upload size={14} />
                      {uploading === 'thumbnail' ? 'Dang tai' : 'Upload'}
                      <input type="file" accept="image/*" hidden onChange={uploadAsset('thumbnail', setThumbnailUrl)} />
                    </label>
                  </div>
                </Field>
                <Field label="Trang thai">
                  <div style={{ height: 42, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Toggle checked={isEnabled} onChange={setIsEnabled} />
                    <span style={{ fontSize: 13, fontWeight: 800, color: isEnabled ? '#059669' : '#64748b' }}>{isEnabled ? 'Active' : 'Inactive'}</span>
                  </div>
                </Field>
              </div>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 900 }}>Mau sac</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 12 }}>
                {[
                  ['Primary', 'primaryColor'],
                  ['Secondary', 'secondaryColor'],
                  ['Background', 'backgroundColor'],
                  ['Text', 'textColor'],
                ].map(([label, key]) => (
                  <Field key={key} label={label}>
                    <input
                      type="color"
                      style={{ ...inputStyle, height: 42, padding: 4 }}
                      value={config.theme[key as keyof TemplateConfig['theme']] as string}
                      onChange={(event) => patchConfig({ theme: { [key]: event.target.value } as Partial<TemplateConfig['theme']> })}
                    />
                  </Field>
                ))}
              </div>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 900 }}>Font chu</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
                <Field label="Heading font">
                  <select style={inputStyle} value={config.theme.headingFont} onChange={(event) => patchConfig({ theme: { headingFont: event.target.value as TemplateConfig['theme']['headingFont'] } })}>
                    {TEMPLATE_FONT_OPTIONS.map((font) => <option key={font} value={font}>{font}</option>)}
                  </select>
                </Field>
                <Field label="Body font">
                  <select style={inputStyle} value={config.theme.bodyFont} onChange={(event) => patchConfig({ theme: { bodyFont: event.target.value as TemplateConfig['theme']['bodyFont'] } })}>
                    {TEMPLATE_FONT_OPTIONS.map((font) => <option key={font} value={font}>{font}</option>)}
                  </select>
                </Field>
              </div>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 900 }}>Hinh nen</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
                <Field label="Kieu nen">
                  <select style={inputStyle} value={config.background.type} onChange={(event) => patchConfig({ background: { type: event.target.value as TemplateConfig['background']['type'] } })}>
                    <option value="color">Color</option>
                    <option value="image">Image</option>
                  </select>
                </Field>
                <Field label="Overlay opacity">
                  <input type="range" min={0} max={1} step={0.05} style={{ width: '100%' }} value={config.background.overlayOpacity} onChange={(event) => patchConfig({ background: { overlayOpacity: Number(event.target.value) } })} />
                </Field>
                <Field label="Upload background">
                  <label style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 42, borderRadius: 10, background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                    <Upload size={14} />
                    {uploading === 'background' ? 'Dang tai' : 'Upload'}
                    <input type="file" accept="image/*" hidden onChange={uploadAsset('background', (url) => patchConfig({ background: { imageUrl: url, type: 'image' } }))} />
                  </label>
                </Field>
              </div>
              <input style={{ ...inputStyle, marginTop: 12 }} value={config.background.imageUrl} onChange={(event) => patchConfig({ background: { imageUrl: event.target.value } })} placeholder="Background image URL" />
            </section>

            <DecorationSection
              title="La roi"
              enabled={config.decorations.fallingLeaves.enabled}
              imageUrl={config.decorations.fallingLeaves.imageUrl}
              count={config.decorations.fallingLeaves.count}
              speed={config.decorations.fallingLeaves.speed}
              opacity={config.decorations.fallingLeaves.opacity}
              uploading={uploading === 'decorations'}
              onUpload={uploadAsset('decorations', (url) => patchConfig({ decorations: { fallingLeaves: { imageUrl: url } } }))}
              onChange={(value) => patchConfig({ decorations: { fallingLeaves: value } })}
            />

            <DecorationSection
              title="Hoa bay"
              enabled={config.decorations.floatingFlowers.enabled}
              imageUrl={config.decorations.floatingFlowers.imageUrl}
              count={config.decorations.floatingFlowers.count}
              speed={config.decorations.floatingFlowers.speed}
              opacity={config.decorations.floatingFlowers.opacity}
              uploading={uploading === 'decorations'}
              onUpload={uploadAsset('decorations', (url) => patchConfig({ decorations: { floatingFlowers: { imageUrl: url } } }))}
              onChange={(value) => patchConfig({ decorations: { floatingFlowers: value } })}
            />

            <section style={sectionStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>Ornament goc</h2>
                <Toggle checked={config.decorations.cornerOrnament.enabled} onChange={(checked) => patchConfig({ decorations: { cornerOrnament: { enabled: checked } } })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                {[
                  ['Top left', 'topLeftUrl'],
                  ['Top right', 'topRightUrl'],
                  ['Bottom left', 'bottomLeftUrl'],
                  ['Bottom right', 'bottomRightUrl'],
                ].map(([label, key]) => (
                  <Field key={key} label={label}>
                    <input
                      style={inputStyle}
                      value={config.decorations.cornerOrnament[key as keyof TemplateConfig['decorations']['cornerOrnament']] as string}
                      onChange={(event) => patchConfig({ decorations: { cornerOrnament: { [key]: event.target.value } as Partial<TemplateConfig['decorations']['cornerOrnament']> } })}
                    />
                  </Field>
                ))}
              </div>
            </section>

            <section style={sectionStyle}>
              <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 900 }}>Kieu hien thi anh cuoi</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}>
                <Field label="Layout">
                  <select style={inputStyle} value={config.gallery.layout} onChange={(event) => patchConfig({ gallery: { layout: event.target.value as TemplateConfig['gallery']['layout'] } })}>
                    {TEMPLATE_GALLERY_LAYOUTS.map((layout) => <option key={layout} value={layout}>{layout}</option>)}
                  </select>
                </Field>
                <Field label="Image radius">
                  <select style={inputStyle} value={config.gallery.imageRadius} onChange={(event) => patchConfig({ gallery: { imageRadius: event.target.value as TemplateConfig['gallery']['imageRadius'] } })}>
                    {['none', 'small', 'medium', 'large', 'full'].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </Field>
                <Field label="Spacing">
                  <select style={inputStyle} value={config.gallery.spacing} onChange={(event) => patchConfig({ gallery: { spacing: event.target.value as TemplateConfig['gallery']['spacing'] } })}>
                    {['tight', 'medium', 'relaxed'].map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </Field>
              </div>
            </section>
          </div>

          <aside className="template-customizer-preview" style={{ ...sectionStyle, position: 'sticky', top: 84, padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: 14, borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 14, fontWeight: 900 }}>Live preview</h2>
                <p style={{ margin: '4px 0 0', fontSize: 11, color: '#64748b' }}>{previewTemplateId || customId}</p>
              </div>
              {previewTemplateId && (
                <a href={previewSrc} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 800, color: '#4f46e5', textDecoration: 'none' }}>
                  <Eye size={14} /> Mo
                </a>
              )}
            </div>
            <div style={{ height: 720, background: '#020617' }}>
              {previewSrc && (
                <iframe
                  key={previewSrc}
                  src={previewSrc}
                  title="Template live preview"
                  style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }}
                />
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

function DecorationSection({
  title,
  enabled,
  imageUrl,
  count,
  speed,
  opacity,
  uploading,
  onUpload,
  onChange,
}: {
  title: string;
  enabled: boolean;
  imageUrl: string;
  count: number;
  speed: TemplateConfig['decorations']['fallingLeaves']['speed'];
  opacity: number;
  uploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onChange: (value: Partial<TemplateConfig['decorations']['fallingLeaves']>) => void;
}) {
  return (
    <section style={sectionStyle}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>{title}</h2>
        <Toggle checked={enabled} onChange={(checked) => onChange({ enabled: checked })} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 12 }}>
        <Field label="Image URL">
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={inputStyle} value={imageUrl} onChange={(event) => onChange({ imageUrl: event.target.value })} />
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '0 12px', borderRadius: 10, background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
              <Upload size={14} />
              {uploading ? 'Dang tai' : 'Upload'}
              <input type="file" accept="image/*" hidden onChange={onUpload} />
            </label>
          </div>
        </Field>
        <Field label="So luong">
          <input type="number" min={0} max={50} style={inputStyle} value={count} onChange={(event) => onChange({ count: Number(event.target.value) })} />
        </Field>
        <Field label="Toc do">
          <select style={inputStyle} value={speed} onChange={(event) => onChange({ speed: event.target.value as typeof speed })}>
            {TEMPLATE_DECORATION_SPEEDS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </Field>
        <Field label="Opacity">
          <input type="number" min={0} max={1} step={0.05} style={inputStyle} value={opacity} onChange={(event) => onChange({ opacity: Number(event.target.value) })} />
        </Field>
      </div>
    </section>
  );
}
