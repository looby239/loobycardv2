'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  CreditCard,
  Eye,
  FileText,
  Grid3X3,
  Home,
  Image as ImageIcon,
  LayoutTemplate,
  Loader2,
  MapPin,
  Music,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Upload,
  Users,
  X,
} from 'lucide-react';
import { CardData } from '@/types/card';
import { mergeTemplateSample } from '@/lib/templateSampleData';

interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  type?: string;
  typeName?: string;
  thumbnail_url: string | null;
  defaultThumbnail: string;
  preview_url?: string | null;
  is_enabled: boolean;
  css_override?: string;
  sample_data?: Partial<CardData> | null;
  sort_order: number;
  updated_at: string;
  base_template_id?: string | null;
  base_template_key?: string | null;
  config?: unknown;
  is_custom_template?: boolean;
  is_customizable?: boolean;
}

type AdminTab = 'overview' | 'thumbnails' | 'sample';
type SampleTab = 'couple' | 'event' | 'content' | 'media' | 'bank';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 10,
  border: '1px solid #dbe3ef',
  background: '#f8fafc',
  color: '#0f172a',
  fontSize: 13,
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: 6,
  color: '#64748b',
  fontSize: 11,
  fontWeight: 800,
  letterSpacing: 0,
  textTransform: 'uppercase',
};

const panelStyle: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  border: '1px solid rgba(99,102,241,0.12)',
  boxShadow: '0 4px 20px rgba(99,102,241,0.06)',
};

function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div style={{ gridColumn: wide ? '1 / -1' : undefined }}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

function toDateInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function formatSchedule(schedule?: CardData['wedding_schedule']) {
  return (schedule || [])
    .map((item) => [item.time, item.title, item.description || ''].join(' | '))
    .join('\n');
}

function parseSchedule(value: string): NonNullable<CardData['wedding_schedule']> {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [time = '', title = '', description = ''] = line.split('|').map((part) => part.trim());
      return { time, title, description: description || undefined };
    })
    .filter((item) => item.time && item.title);
}

function getThumbnailSrc(template: TemplateConfig) {
  const src = template.thumbnail_url || template.defaultThumbnail;
  if (!src || !template.thumbnail_url) return src;
  const separator = src.includes('?') ? '&' : '?';
  const version = encodeURIComponent(template.updated_at || '');
  return version ? `${src}${separator}v=${version}` : src;
}

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [sampleTab, setSampleTab] = useState<SampleTab>('couple');
  const [selectedTemplateId, setSelectedTemplateId] = useState('template-10');
  const [sampleForm, setSampleForm] = useState<Partial<CardData>>({});
  const [scheduleText, setScheduleText] = useState('');
  const [previewKey, setPreviewKey] = useState(0);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingSample, setSavingSample] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState<string | null>(null);
  const [uploadingSampleFile, setUploadingSampleFile] = useState<'cover' | 'album' | 'music' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const didLoadInitialSample = useRef(false);

  const selectedTemplate = templates.find((template) => template.id === selectedTemplateId);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadSampleForTemplate = useCallback((template: TemplateConfig) => {
    const merged = mergeTemplateSample(template.id, template.sample_data);
    setSelectedTemplateId(template.id);
    setSampleForm(merged);
    setScheduleText(formatSchedule(merged.wedding_schedule));
  }, []);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      if (data.success) {
        const loadedTemplates = data.templates as TemplateConfig[];
        setTemplates(loadedTemplates);
        if (!didLoadInitialSample.current) {
          const selected = loadedTemplates.find((template) => template.id === 'template-10') || loadedTemplates[0];
          if (selected) {
            loadSampleForTemplate(selected);
            didLoadInitialSample.current = true;
          }
        }
      } else {
        showToast(data.error || 'Không thể tải danh sách template', 'error');
      }
    } catch {
      showToast('Lỗi tải danh sách template', 'error');
    } finally {
      setLoading(false);
    }
  }, [loadSampleForTemplate]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchTemplates();
    });
  }, [fetchTemplates]);

  const updateSample = <K extends keyof CardData>(field: K, value: CardData[K]) => {
    setSampleForm((prev) => ({ ...prev, [field]: value }));
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: 12,
    border: 'none',
    fontWeight: 800,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: active ? '#4f46e5' : 'transparent',
    color: active ? '#fff' : '#64748b',
    boxShadow: active ? '0 4px 12px rgba(79,70,229,0.25)' : 'none',
  });

  const sampleTabStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 10px',
    borderRadius: 10,
    border: `1px solid ${active ? '#c7d2fe' : '#e2e8f0'}`,
    background: active ? '#eef2ff' : '#fff',
    color: active ? '#4338ca' : '#64748b',
    fontSize: 12,
    fontWeight: 800,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  });

  const toggleEnabled = async (templateId: string, currentValue: boolean) => {
    setSaving(templateId);
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateId, is_enabled: !currentValue }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates((prev) => prev.map((template) => (
          template.id === templateId ? { ...template, is_enabled: !currentValue } : template
        )));
        showToast(!currentValue ? 'Đã bật template' : 'Đã tắt template');
      } else {
        showToast(data.error || 'Lỗi cập nhật', 'error');
      }
    } catch {
      showToast('Lỗi kết nối', 'error');
    } finally {
      setSaving(null);
    }
  };

  const moveSortOrder = async (templateId: string, direction: 'up' | 'down') => {
    const idx = templates.findIndex((template) => template.id === templateId);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === templates.length - 1) return;

    const reordered = [...templates];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];
    const updated = reordered.map((template, index) => ({ ...template, sort_order: index }));
    setTemplates(updated);

    try {
      await Promise.all([
        fetch('/api/admin/templates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: updated[idx].id, sort_order: idx }),
        }),
        fetch('/api/admin/templates', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: updated[swapIdx].id, sort_order: swapIdx }),
        }),
      ]);
      showToast('Đã cập nhật thứ tự');
    } catch {
      showToast('Không thể cập nhật thứ tự', 'error');
      void fetchTemplates();
    }
  };

  const handleThumbnailUpload = async (templateId: string, file: File) => {
    setUploadingThumbnail(templateId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('templateId', templateId);

      const res = await fetch('/api/admin/templates/upload-thumbnail', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setTemplates((prev) => prev.map((template) => (
          template.id === templateId
            ? { ...template, thumbnail_url: data.url, updated_at: data.updated_at || new Date().toISOString() }
            : template
        )));
        showToast('Đã cập nhật ảnh thumbnail');
      } else {
        showToast(data.error || 'Lỗi upload', 'error');
      }
    } catch {
      showToast('Lỗi upload', 'error');
    } finally {
      setUploadingThumbnail(null);
    }
  };

  const removeThumbnail = async (templateId: string) => {
    setSaving(templateId);
    try {
      await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: templateId, thumbnail_url: null }),
      });
      setTemplates((prev) => prev.map((template) => (
        template.id === templateId ? { ...template, thumbnail_url: null } : template
      )));
      showToast('Đã xóa thumbnail, hiển thị ảnh mặc định');
    } catch {
      showToast('Không thể xóa thumbnail', 'error');
    } finally {
      setSaving(null);
    }
  };

  const duplicateTemplate = async (template: TemplateConfig) => {
    setSaving(template.id);
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'duplicate',
          base_template_id: template.id,
          name: `${template.name} copy`,
          thumbnail_url: template.thumbnail_url || template.defaultThumbnail || '',
          is_enabled: false,
          config: template.config || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Khong the duplicate template');
      showToast('Da duplicate template');
      await fetchTemplates();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Khong the duplicate template', 'error');
    } finally {
      setSaving(null);
    }
  };

  const saveSampleData = async () => {
    const weddingSchedule = parseSchedule(scheduleText);
    const sample_data: Partial<CardData> = {
      ...sampleForm,
      template_id: selectedTemplateId,
      wedding_schedule: weddingSchedule,
      has_schedule: weddingSchedule.length > 0,
    };

    setSavingSample(true);
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTemplateId, sample_data }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates((prev) => prev.map((template) => (
          template.id === selectedTemplateId ? { ...template, sample_data } : template
        )));
        setSampleForm(sample_data);
        setPreviewKey((key) => key + 1);
        showToast('Đã lưu thông tin thiệp mẫu');
      } else {
        showToast(data.error || 'Không thể lưu thông tin mẫu', 'error');
      }
    } catch {
      showToast('Lỗi kết nối khi lưu thông tin mẫu', 'error');
    } finally {
      setSavingSample(false);
    }
  };

  const uploadSampleFile = async (event: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'album' | 'music') => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploadingSampleFile(type);
    try {
      const uploadOne = async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('bucket', type === 'music' ? 'card-music' : 'card-images');
        formData.append('folder', `template-samples/${selectedTemplateId}`);

        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        const data = await res.json();
        if (!res.ok || !data.url) {
          throw new Error(data.error || 'Upload thất bại');
        }
        return data.url as string;
      };

      if (type === 'cover') {
        updateSample('cover_image_url', await uploadOne(files[0]));
      } else if (type === 'music') {
        updateSample('music_url', await uploadOne(files[0]));
      } else {
        const uploadedUrls = await Promise.all(Array.from(files).map(uploadOne));
        updateSample('album_images', [...(sampleForm.album_images || []), ...uploadedUrls]);
      }
      showToast('Upload thành công');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Lỗi upload file';
      showToast(message, 'error');
    } finally {
      setUploadingSampleFile(null);
      event.target.value = '';
    }
  };

  const renderSampleEditor = () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 420px', gap: 20, alignItems: 'start' }} className="sample-editor-grid">
      <div style={{ ...panelStyle, overflow: 'hidden' }}>
        <div style={{ padding: 18, borderBottom: '1px solid #eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, color: '#1e1b4b', fontSize: 18, fontWeight: 800 }}>Thông tin thiệp mẫu</h2>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 12 }}>
              Đang sửa mẫu: <strong>{selectedTemplate?.name || selectedTemplateId}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setPreviewKey((key) => key + 1)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 12px', borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}
            >
              <RefreshCw size={14} /> Refresh preview
            </button>
            <button
              type="button"
              onClick={saveSampleData}
              disabled={savingSample}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: 'none', background: savingSample ? '#c7d2fe' : '#4f46e5', color: '#fff', fontSize: 12, fontWeight: 800, cursor: savingSample ? 'wait' : 'pointer' }}
            >
              {savingSample ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
              {savingSample ? 'Đang lưu' : 'Lưu mẫu'}
            </button>
          </div>
        </div>

        <div style={{ padding: '12px 18px', borderBottom: '1px solid #eef2ff', display: 'flex', gap: 6, overflowX: 'auto' }}>
          {[
            ['couple', 'Tên & gia đình', <Users size={14} key="users" />],
            ['event', 'Địa điểm & bản đồ', <MapPin size={14} key="map" />],
            ['content', 'Lời mời', <FileText size={14} key="text" />],
            ['media', 'Ảnh & nhạc', <ImageIcon size={14} key="image" />],
            ['bank', 'Mừng cưới', <CreditCard size={14} key="card" />],
          ].map(([value, label, icon]) => (
            <button key={value as string} type="button" onClick={() => setSampleTab(value as SampleTab)} style={sampleTabStyle(sampleTab === value)}>
              {icon}
              {label as string}
            </button>
          ))}
        </div>

        <div style={{ padding: 18 }}>
          {sampleTab === 'couple' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
              <Field label="Tên chú rể">
                <input style={inputStyle} value={sampleForm.groom_name || ''} onChange={(event) => updateSample('groom_name', event.target.value)} />
              </Field>
              <Field label="Vai trò chú rể">
                <input style={inputStyle} value={sampleForm.groom_role || ''} onChange={(event) => updateSample('groom_role', event.target.value)} />
              </Field>
              <Field label="Tên cô dâu">
                <input style={inputStyle} value={sampleForm.bride_name || ''} onChange={(event) => updateSample('bride_name', event.target.value)} />
              </Field>
              <Field label="Vai trò cô dâu">
                <input style={inputStyle} value={sampleForm.bride_role || ''} onChange={(event) => updateSample('bride_role', event.target.value)} />
              </Field>
              <Field label="Tên bố chú rể">
                <input style={inputStyle} value={sampleForm.groom_father_name || ''} onChange={(event) => updateSample('groom_father_name', event.target.value)} />
              </Field>
              <Field label="Tên mẹ chú rể">
                <input style={inputStyle} value={sampleForm.groom_mother_name || ''} onChange={(event) => updateSample('groom_mother_name', event.target.value)} />
              </Field>
              <Field label="Địa chỉ nhà chú rể" wide>
                <input style={inputStyle} value={sampleForm.groom_address || ''} onChange={(event) => updateSample('groom_address', event.target.value)} />
              </Field>
              <Field label="Tên bố cô dâu">
                <input style={inputStyle} value={sampleForm.bride_father_name || ''} onChange={(event) => updateSample('bride_father_name', event.target.value)} />
              </Field>
              <Field label="Tên mẹ cô dâu">
                <input style={inputStyle} value={sampleForm.bride_mother_name || ''} onChange={(event) => updateSample('bride_mother_name', event.target.value)} />
              </Field>
              <Field label="Địa chỉ nhà cô dâu" wide>
                <input style={inputStyle} value={sampleForm.bride_address || ''} onChange={(event) => updateSample('bride_address', event.target.value)} />
              </Field>
            </div>
          )}

          {sampleTab === 'event' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
              <Field label="Ngày tổ chức">
                <input type="date" style={inputStyle} value={toDateInput(sampleForm.event_date)} onChange={(event) => updateSample('event_date', event.target.value)} />
              </Field>
              <Field label="Giờ đón khách">
                <input style={inputStyle} value={sampleForm.reception_time || ''} onChange={(event) => updateSample('reception_time', event.target.value)} />
              </Field>
              <Field label="Giờ làm lễ">
                <input style={inputStyle} value={sampleForm.ceremony_time || ''} onChange={(event) => updateSample('ceremony_time', event.target.value)} />
              </Field>
              <Field label="Dress code">
                <input style={inputStyle} value={sampleForm.dress_code || ''} onChange={(event) => updateSample('dress_code', event.target.value)} />
              </Field>
              <Field label="Tên nơi tổ chức" wide>
                <input style={inputStyle} value={sampleForm.venue_name || ''} onChange={(event) => updateSample('venue_name', event.target.value)} />
              </Field>
              <Field label="Địa chỉ nơi tổ chức" wide>
                <input style={inputStyle} value={sampleForm.venue_address || ''} onChange={(event) => updateSample('venue_address', event.target.value)} />
              </Field>
              <Field label="Google Maps URL hoặc iframe" wide>
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }} value={sampleForm.map_url || ''} onChange={(event) => updateSample('map_url', event.target.value)} />
              </Field>
              <Field label="Lịch trình cưới" wide>
                <textarea
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
                  value={scheduleText}
                  onChange={(event) => setScheduleText(event.target.value)}
                  placeholder="17:30 | Đón khách | Gia đình hân hoan đón tiếp quý khách"
                />
                <p style={{ margin: '6px 0 0', color: '#94a3b8', fontSize: 11 }}>Mỗi dòng: giờ | tiêu đề | mô tả</p>
              </Field>
            </div>
          )}

          {sampleTab === 'content' && (
            <div style={{ display: 'grid', gap: 14 }}>
              <Field label="Lời mời" wide>
                <textarea rows={5} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} value={sampleForm.invitation_text || ''} onChange={(event) => updateSample('invitation_text', event.target.value)} />
              </Field>
              <Field label="Câu trích dẫn" wide>
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} value={sampleForm.quote_text || ''} onChange={(event) => updateSample('quote_text', event.target.value)} />
              </Field>
              <Field label="Lời cảm ơn" wide>
                <textarea rows={3} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} value={sampleForm.thank_you_text || ''} onChange={(event) => updateSample('thank_you_text', event.target.value)} />
              </Field>
            </div>
          )}

          {sampleTab === 'media' && (
            <div style={{ display: 'grid', gap: 18 }}>
              <Field label="Ảnh bìa" wide>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input style={inputStyle} value={sampleForm.cover_image_url || ''} onChange={(event) => updateSample('cover_image_url', event.target.value)} />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 10, background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <Upload size={14} />
                    {uploadingSampleFile === 'cover' ? 'Đang tải' : 'Upload'}
                    <input type="file" accept="image/*" hidden disabled={uploadingSampleFile !== null} onChange={(event) => uploadSampleFile(event, 'cover')} />
                  </label>
                </div>
                {sampleForm.cover_image_url && (
                  <img src={sampleForm.cover_image_url} alt="Ảnh bìa mẫu" style={{ marginTop: 10, width: 140, height: 180, objectFit: 'cover', borderRadius: 12, border: '1px solid #e2e8f0' }} />
                )}
              </Field>

              <Field label="Album ảnh" wide>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 10, background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', marginBottom: 10 }}>
                  <Upload size={14} />
                  {uploadingSampleFile === 'album' ? 'Đang tải ảnh' : 'Upload thêm ảnh'}
                  <input type="file" accept="image/*" multiple hidden disabled={uploadingSampleFile !== null} onChange={(event) => uploadSampleFile(event, 'album')} />
                </label>
                <textarea
                  rows={4}
                  style={{ ...inputStyle, resize: 'vertical', fontFamily: 'monospace', fontSize: 12 }}
                  value={(sampleForm.album_images || []).join('\n')}
                  onChange={(event) => updateSample('album_images', event.target.value.split('\n').map((url) => url.trim()).filter(Boolean))}
                  placeholder="Mỗi URL một dòng"
                />
              </Field>

              <Field label="Nhạc nền" wide>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input style={inputStyle} value={sampleForm.music_url || ''} onChange={(event) => updateSample('music_url', event.target.value)} />
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 12px', borderRadius: 10, background: '#0f172a', color: '#fff', fontSize: 12, fontWeight: 800, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    <Music size={14} />
                    {uploadingSampleFile === 'music' ? 'Đang tải' : 'Upload mp3'}
                    <input type="file" accept=".mp3,audio/*" hidden disabled={uploadingSampleFile !== null} onChange={(event) => uploadSampleFile(event, 'music')} />
                  </label>
                </div>
                {sampleForm.music_url && <audio controls src={sampleForm.music_url} style={{ marginTop: 10, width: '100%' }} />}
              </Field>
            </div>
          )}

          {sampleTab === 'bank' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 14 }}>
              <Field label="Ngân hàng chú rể">
                <input style={inputStyle} value={sampleForm.groom_bank_name || ''} onChange={(event) => updateSample('groom_bank_name', event.target.value)} />
              </Field>
              <Field label="Số tài khoản chú rể">
                <input style={inputStyle} value={sampleForm.groom_bank_account || ''} onChange={(event) => updateSample('groom_bank_account', event.target.value)} />
              </Field>
              <Field label="Chủ tài khoản chú rể" wide>
                <input style={inputStyle} value={sampleForm.groom_bank_holder || ''} onChange={(event) => updateSample('groom_bank_holder', event.target.value)} />
              </Field>
              <Field label="Ngân hàng cô dâu">
                <input style={inputStyle} value={sampleForm.bride_bank_name || ''} onChange={(event) => updateSample('bride_bank_name', event.target.value)} />
              </Field>
              <Field label="Số tài khoản cô dâu">
                <input style={inputStyle} value={sampleForm.bride_bank_account || ''} onChange={(event) => updateSample('bride_bank_account', event.target.value)} />
              </Field>
              <Field label="Chủ tài khoản cô dâu" wide>
                <input style={inputStyle} value={sampleForm.bride_bank_holder || ''} onChange={(event) => updateSample('bride_bank_holder', event.target.value)} />
              </Field>
            </div>
          )}
        </div>
      </div>

      <div style={{ ...panelStyle, overflow: 'hidden', position: 'sticky', top: 92 }}>
        <div style={{ padding: 14, borderBottom: '1px solid #eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <h3 style={{ margin: 0, color: '#1e1b4b', fontSize: 14, fontWeight: 800 }}>Preview thiệp mẫu</h3>
            <p style={{ margin: '3px 0 0', color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}>/template-preview/{selectedTemplateId}</p>
          </div>
          <a href={`/template-preview/${selectedTemplateId}`} target="_blank" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: '#4f46e5', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
            <Eye size={14} /> Mở
          </a>
        </div>
        <div style={{ height: 680, background: '#f8fafc', overflow: 'hidden' }}>
          <iframe
            key={`${selectedTemplateId}-${previewKey}`}
            src={`/template-preview/${selectedTemplateId}?adminPreview=1`}
            title="Template sample preview"
            style={{ width: '100%', height: '100%', border: 'none' }}
          />
        </div>
      </div>
    </div>
  );

  const renderTemplateCard = (tmpl: TemplateConfig, idx: number) => (
    <div key={tmpl.id} className="template-card" style={{
      background: '#fff',
      borderRadius: 16,
      overflow: 'hidden',
      border: `1.5px solid ${tmpl.is_enabled ? 'rgba(99,102,241,0.15)' : '#e2e8f0'}`,
      boxShadow: tmpl.is_enabled ? '0 4px 20px rgba(99,102,241,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
      opacity: tmpl.is_enabled ? 1 : 0.65,
      transition: 'all 0.2s',
      animationDelay: `${idx * 0.04}s`,
    }}>
      <div style={{ height: 160, background: 'linear-gradient(135deg, #f0f4ff, #faf5ff)', position: 'relative', overflow: 'hidden' }}>
        {getThumbnailSrc(tmpl) ? (
          <img src={getThumbnailSrc(tmpl)} alt={tmpl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: '#94a3b8' }}>
            <ImageIcon size={32} />
            <span style={{ fontSize: 12 }}>Chưa có thumbnail</span>
          </div>
        )}
        <div style={{
          position: 'absolute',
          top: 10,
          right: 10,
          padding: '3px 10px',
          borderRadius: 20,
          fontSize: 11,
          fontWeight: 800,
          background: tmpl.is_enabled ? 'rgba(16,185,129,0.9)' : 'rgba(100,116,139,0.85)',
          color: '#fff',
        }}>
          {tmpl.is_enabled ? 'Đang bật' : 'Tắt'}
        </div>
        <div style={{ position: 'absolute', top: 10, left: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#6366f1' }}>
          {idx + 1}
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 10 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: '#1e1b4b', margin: 0 }}>{tmpl.name}</h3>
            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0', lineHeight: 1.4 }}>{tmpl.id}</p>
          </div>
          <label className="toggle-switch" title={tmpl.is_enabled ? 'Tắt template' : 'Bật template'}>
            <input type="checkbox" checked={tmpl.is_enabled} onChange={() => toggleEnabled(tmpl.id, tmpl.is_enabled)} disabled={saving === tmpl.id} />
            <span className="toggle-slider" />
          </label>
        </div>

        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>{tmpl.description}</p>
        <div style={{ display: 'grid', gap: 5, marginBottom: 12, padding: 10, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <span style={{ fontSize: 11, color: '#64748b' }}>Loại: <strong style={{ color: '#334155' }}>{tmpl.typeName || tmpl.type || 'Thiệp cưới'}</strong></span>
          <span style={{ fontSize: 11, color: '#64748b' }}>
            Base: <strong style={{ color: '#334155' }}>{tmpl.base_template_key || tmpl.base_template_id || (tmpl.is_custom_template ? 'Custom' : 'Template gốc')}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4 }}>
            <button type="button" onClick={() => moveSortOrder(tmpl.id, 'up')} disabled={idx === 0} title="Di chuyển lên" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: idx === 0 ? 'not-allowed' : 'pointer', opacity: idx === 0 ? 0.4 : 1 }}>
              <ChevronUp size={14} color="#475569" />
            </button>
            <button type="button" onClick={() => moveSortOrder(tmpl.id, 'down')} disabled={idx === templates.length - 1} title="Di chuyển xuống" style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: idx === templates.length - 1 ? 'not-allowed' : 'pointer', opacity: idx === templates.length - 1 ? 0.4 : 1 }}>
              <ChevronDown size={14} color="#475569" />
            </button>
          </div>
          <a
            href={tmpl.preview_url || `/template-preview/${tmpl.id}`}
            target="_blank"
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 9px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}
          >
            <Eye size={12} /> Preview
          </a>
          <Link
            href={`/admin/templates/${tmpl.id}/edit`}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 9px', borderRadius: 8, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4f46e5', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}
          >
            <Pencil size={12} /> Chỉnh sửa
          </Link>
          <button
            type="button"
            onClick={() => void duplicateTemplate(tmpl)}
            disabled={saving === tmpl.id}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 9px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 11, fontWeight: 800, cursor: saving === tmpl.id ? 'wait' : 'pointer' }}
          >
            <Copy size={12} /> Duplicate
          </button>
          <Link
            href={`/admin/templates/new?base_template_id=${encodeURIComponent(tmpl.id)}`}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 9px', borderRadius: 8, border: '1px solid #bbf7d0', background: '#f0fdf4', color: '#15803d', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}
          >
            <Plus size={12} /> Tạo template từ mẫu này
          </Link>
          <button
            type="button"
            onClick={() => {
              loadSampleForTemplate(tmpl);
              setActiveTab('sample');
            }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 10px', borderRadius: 8, border: '1px solid #c7d2fe', background: '#eef2ff', color: '#4f46e5', fontSize: 11, fontWeight: 800, cursor: 'pointer' }}
          >
            <Settings size={12} /> Sửa mẫu
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)', fontFamily: 'Inter, system-ui, sans-serif' }}>
      {toast && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          padding: '12px 18px',
          borderRadius: 12,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff',
          fontWeight: 700,
          fontSize: 13,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: 420,
        }}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .template-card { animation: fadeIn 0.35s ease both; }
        .toggle-switch { position: relative; display: inline-block; width: 48px; height: 26px; }
        .toggle-switch input { opacity: 0; width: 0; height: 0; }
        .toggle-slider {
          position: absolute; cursor: pointer; inset: 0; background: #cbd5e1;
          border-radius: 26px; transition: 0.3s;
        }
        .toggle-slider::before {
          content: ''; position: absolute; height: 20px; width: 20px;
          left: 3px; bottom: 3px; background: white;
          border-radius: 50%; transition: 0.3s;
          box-shadow: 0 1px 3px rgba(0,0,0,0.2);
        }
        input:checked + .toggle-slider { background: #6366f1; }
        input:checked + .toggle-slider::before { transform: translateX(22px); }
        @media (max-width: 1080px) {
          .sample-editor-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(99,102,241,0.12)', padding: '0 24px', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 20px rgba(99,102,241,0.08)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutTemplate size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b', margin: 0, lineHeight: 1.2 }}>Template Manager</h1>
              <p style={{ fontSize: 11, color: '#6366f1', margin: 0, fontWeight: 600 }}>Quản lý template và thiệp mẫu</p>
            </div>
          </div>
          <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, textDecoration: 'none', background: '#f1f5f9', color: '#475569', fontSize: 13, fontWeight: 700, border: '1px solid #e2e8f0' }}>
            <Home size={14} /> Dashboard
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, background: '#fff', padding: 6, borderRadius: 16, width: 'fit-content', maxWidth: '100%', overflowX: 'auto', boxShadow: '0 2px 12px rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.1)' }}>
          <button type="button" style={tabStyle(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>
            <Grid3X3 size={15} /> Tổng quan
          </button>
          <button type="button" style={tabStyle(activeTab === 'thumbnails')} onClick={() => setActiveTab('thumbnails')}>
            <ImageIcon size={15} /> Hình thumbnail
          </button>
          <button type="button" style={tabStyle(activeTab === 'sample')} onClick={() => setActiveTab('sample')}>
            <FileText size={15} /> Thông tin thiệp mẫu
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#6366f1' }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 15, fontWeight: 600 }}>Đang tải danh sách template...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e1b4b', margin: 0 }}>Danh sách Template</h2>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>{templates.filter((template) => template.is_enabled).length}/{templates.length} template đang bật</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {templates.map(renderTemplateCard)}
                </div>
              </div>
            )}

            {activeTab === 'thumbnails' && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1e1b4b', margin: 0 }}>Quản lý Thumbnail</h2>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>Upload ảnh thumbnail hiển thị trên trang chọn template. Kích thước đề xuất: 480x640px.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {templates.map((tmpl, idx) => (
                    <div key={tmpl.id} className="template-card" style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', animationDelay: `${idx * 0.04}s` }}>
                      <div style={{ height: 180, background: '#f8f9ff', position: 'relative', overflow: 'hidden' }}>
                        {getThumbnailSrc(tmpl) ? (
                          <img src={getThumbnailSrc(tmpl)} alt={tmpl.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: '#94a3b8' }}>
                            <ImageIcon size={36} />
                            <span style={{ fontSize: 12 }}>Chưa có thumbnail</span>
                          </div>
                        )}
                        {uploadingThumbnail === tmpl.id && (
                          <div style={{ position: 'absolute', inset: 0, background: 'rgba(99,102,241,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Loader2 size={32} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '12px 14px' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 800, color: '#1e1b4b', margin: '0 0 2px' }}>{tmpl.name}</h3>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 10px' }}>{tmpl.id}</p>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <label style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: 8, borderRadius: 8, border: '1px solid #c7d2fe', background: '#f0f4ff', color: '#6366f1', fontSize: 12, fontWeight: 800, cursor: 'pointer' }}>
                            <Upload size={13} />
                            {tmpl.thumbnail_url ? 'Đổi ảnh' : 'Upload'}
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) void handleThumbnailUpload(tmpl.id, file);
                              event.target.value = '';
                            }} />
                          </label>
                          {tmpl.thumbnail_url && (
                            <button type="button" onClick={() => removeThumbnail(tmpl.id)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #fecaca', background: '#fff5f5', color: '#ef4444', cursor: 'pointer' }} title="Xóa thumbnail, dùng ảnh mặc định">
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'sample' && renderSampleEditor()}
          </>
        )}
      </div>
    </div>
  );
}
