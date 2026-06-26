'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  LayoutTemplate, Eye, EyeOff, Upload, Palette, Save, RotateCcw,
  ArrowLeft, ChevronUp, ChevronDown, Check, X, AlertCircle, Loader2,
  Image as ImageIcon, Code2, Grid3X3, LogOut, Home, Settings
} from 'lucide-react';

interface TemplateConfig {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string | null;
  defaultThumbnail: string;
  is_enabled: boolean;
  css_override: string;
  sort_order: number;
  updated_at: string;
}

// Default CSS variables for quick editor (per template)
const TEMPLATE_CSS_VARS: Record<string, { label: string; variable: string; type: 'color' | 'text' }[]> = {
  default: [
    { label: 'Màu chính', variable: '--color-primary', type: 'color' },
    { label: 'Màu vàng', variable: '--color-gold', type: 'color' },
    { label: 'Màu nền', variable: '--color-bg', type: 'color' },
    { label: 'Màu chữ', variable: '--color-text', type: 'color' },
  ],
};

export default function AdminTemplatesPage() {
  const [templates, setTemplates] = useState<TemplateConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'css' | 'thumbnails'>('overview');
  const [saving, setSaving] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // CSS Editor state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('template-10');
  const [cssEditorValue, setCssEditorValue] = useState('');
  const [cssPreviewKey, setCssPreviewKey] = useState(0);
  const [savingCss, setSavingCss] = useState(false);
  const cssPreviewRef = useRef<HTMLIFrameElement>(null);

  // Thumbnail upload state
  const [uploadingThumbnail, setUploadingThumbnail] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/templates');
      const data = await res.json();
      if (data.success) {
        setTemplates(data.templates);
        // Init CSS editor with first template
        if (data.templates.length > 0) {
          const first = data.templates.find((t: TemplateConfig) => t.id === 'template-10') || data.templates[0];
          setSelectedTemplateId(first.id);
          setCssEditorValue(first.css_override || '');
        }
      }
    } catch (e) {
      showToast('Lỗi tải danh sách template', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // When selected template changes, update CSS editor
  useEffect(() => {
    const tmpl = templates.find(t => t.id === selectedTemplateId);
    if (tmpl) setCssEditorValue(tmpl.css_override || '');
  }, [selectedTemplateId, templates]);

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
        setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, is_enabled: !currentValue } : t));
        showToast(!currentValue ? 'Đã bật template' : 'Đã tắt template');
      } else {
        showToast(data.error || 'Lỗi cập nhật', 'error');
      }
    } catch (e) {
      showToast('Lỗi kết nối', 'error');
    } finally {
      setSaving(null);
    }
  };

  const moveSortOrder = async (templateId: string, direction: 'up' | 'down') => {
    const idx = templates.findIndex(t => t.id === templateId);
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === templates.length - 1) return;

    const newTemplates = [...templates];
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    [newTemplates[idx], newTemplates[swapIdx]] = [newTemplates[swapIdx], newTemplates[idx]];
    const updated = newTemplates.map((t, i) => ({ ...t, sort_order: i }));
    setTemplates(updated);

    // Save both reordered templates
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
  };

  const saveCssOverride = async () => {
    setSavingCss(true);
    try {
      const res = await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTemplateId, css_override: cssEditorValue }),
      });
      const data = await res.json();
      if (data.success) {
        setTemplates(prev => prev.map(t => t.id === selectedTemplateId ? { ...t, css_override: cssEditorValue } : t));
        showToast('Đã lưu CSS thành công! Áp dụng vào tất cả thiệp dùng mẫu này.');
        setCssPreviewKey(k => k + 1);
      } else {
        showToast(data.error || 'Lỗi lưu CSS', 'error');
      }
    } catch (e) {
      showToast('Lỗi kết nối', 'error');
    } finally {
      setSavingCss(false);
    }
  };

  const resetCss = async () => {
    if (!confirm('Xóa toàn bộ CSS tùy chỉnh và trở về giao diện mặc định?')) return;
    setCssEditorValue('');
    setSavingCss(true);
    try {
      await fetch('/api/admin/templates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedTemplateId, css_override: '' }),
      });
      setTemplates(prev => prev.map(t => t.id === selectedTemplateId ? { ...t, css_override: '' } : t));
      showToast('Đã reset CSS về mặc định');
      setCssPreviewKey(k => k + 1);
    } finally {
      setSavingCss(false);
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
        setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, thumbnail_url: data.url } : t));
        showToast('Đã cập nhật ảnh thumbnail');
      } else {
        showToast(data.error || 'Lỗi upload', 'error');
      }
    } catch (e) {
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
      setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, thumbnail_url: null } : t));
      showToast('Đã xóa thumbnail, hiển thị ảnh mặc định');
    } finally {
      setSaving(null);
    }
  };

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  const tabStyle = (active: boolean) =>
    `flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 ${
      active
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
        : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'
    }`;

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          padding: '12px 20px', borderRadius: 12,
          background: toast.type === 'success' ? '#10b981' : '#ef4444',
          color: '#fff', fontWeight: 600, fontSize: 14,
          boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'slideInRight 0.3s ease',
        }}>
          {toast.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .template-card { animation: fadeIn 0.4s ease both; }
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
        .css-editor {
          width: 100%; height: 380px; padding: 16px;
          font-family: 'Fira Code', 'Cascadia Code', 'Courier New', monospace;
          font-size: 13px; line-height: 1.7; border-radius: 12px;
          border: 1.5px solid #e0e7ff; background: #1e1e2e; color: #cdd6f4;
          resize: vertical; outline: none; tab-size: 2;
        }
        .css-editor:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
        .upload-zone {
          border: 2px dashed #c7d2fe; border-radius: 12px; padding: 24px 16px;
          text-align: center; cursor: pointer; transition: all 0.2s;
          background: #f8f9ff;
        }
        .upload-zone:hover { border-color: #6366f1; background: #eef2ff; }
      `}</style>

      {/* Header */}
      <div style={{
        background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(99,102,241,0.12)', padding: '0 24px',
        position: 'sticky', top: 0, zIndex: 100,
        boxShadow: '0 2px 20px rgba(99,102,241,0.08)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutTemplate size={20} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 800, color: '#1e1b4b', margin: 0, lineHeight: 1.2 }}>Template Manager</h1>
              <p style={{ fontSize: 11, color: '#6366f1', margin: 0, fontWeight: 500 }}>Quản lý giao diện thiệp cưới</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Link href="/admin" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderRadius: 10, textDecoration: 'none',
              background: '#f1f5f9', color: '#475569', fontSize: 13, fontWeight: 600,
              border: '1px solid #e2e8f0',
            }}>
              <Home size={14} /> Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28, background: '#fff', padding: 6, borderRadius: 16, width: 'fit-content', boxShadow: '0 2px 12px rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.1)' }}>
          <button className={tabStyle(activeTab === 'overview')} onClick={() => setActiveTab('overview')}>
            <Grid3X3 size={15} /> Tổng Quan
          </button>
          <button className={tabStyle(activeTab === 'thumbnails')} onClick={() => setActiveTab('thumbnails')}>
            <ImageIcon size={15} /> Hình Thumbnail
          </button>
          <button className={tabStyle(activeTab === 'css')} onClick={() => setActiveTab('css')}>
            <Code2 size={15} /> CSS Editor
          </button>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: '#6366f1' }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: 15, fontWeight: 500 }}>Đang tải danh sách template...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            {/* ===== TAB: OVERVIEW ===== */}
            {activeTab === 'overview' && (
              <div>
                <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e1b4b', margin: 0 }}>Danh sách Template</h2>
                    <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                      {templates.filter(t => t.is_enabled).length}/{templates.length} template đang bật
                    </p>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                  {templates.map((tmpl, idx) => (
                    <div key={tmpl.id} className="template-card" style={{
                      background: '#fff', borderRadius: 18, overflow: 'hidden',
                      border: `1.5px solid ${tmpl.is_enabled ? 'rgba(99,102,241,0.15)' : '#e2e8f0'}`,
                      boxShadow: tmpl.is_enabled ? '0 4px 20px rgba(99,102,241,0.08)' : '0 2px 8px rgba(0,0,0,0.04)',
                      opacity: tmpl.is_enabled ? 1 : 0.65,
                      transition: 'all 0.2s',
                      animationDelay: `${idx * 0.05}s`,
                    }}>
                      {/* Template preview thumbnail */}
                      <div style={{ height: 160, background: 'linear-gradient(135deg, #f0f4ff, #faf5ff)', position: 'relative', overflow: 'hidden' }}>
                        {tmpl.thumbnail_url || tmpl.defaultThumbnail ? (
                          <img
                            src={tmpl.thumbnail_url || tmpl.defaultThumbnail}
                            alt={tmpl.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: '#94a3b8' }}>
                            <ImageIcon size={32} />
                            <span style={{ fontSize: 12 }}>Chưa có thumbnail</span>
                          </div>
                        )}
                        {/* Status badge */}
                        <div style={{
                          position: 'absolute', top: 10, right: 10,
                          padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                          background: tmpl.is_enabled ? 'rgba(16,185,129,0.9)' : 'rgba(100,116,139,0.85)',
                          color: '#fff', backdropFilter: 'blur(8px)',
                        }}>
                          {tmpl.is_enabled ? '● Đang bật' : '● Tắt'}
                        </div>
                        {/* Order badge */}
                        <div style={{
                          position: 'absolute', top: 10, left: 10,
                          width: 28, height: 28, borderRadius: '50%',
                          background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: '#6366f1',
                        }}>
                          {idx + 1}
                        </div>
                      </div>

                      {/* Card body */}
                      <div style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1e1b4b', margin: 0 }}>{tmpl.name}</h3>
                            <p style={{ fontSize: 11, color: '#64748b', margin: '2px 0 0', lineHeight: 1.4 }}>{tmpl.id}</p>
                          </div>
                          {/* Toggle */}
                          <label className="toggle-switch" title={tmpl.is_enabled ? 'Tắt template' : 'Bật template'}>
                            <input
                              type="checkbox"
                              checked={tmpl.is_enabled}
                              onChange={() => toggleEnabled(tmpl.id, tmpl.is_enabled)}
                              disabled={saving === tmpl.id}
                            />
                            <span className="toggle-slider" />
                          </label>
                        </div>

                        <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>{tmpl.description}</p>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              onClick={() => moveSortOrder(tmpl.id, 'up')}
                              disabled={idx === 0}
                              title="Di chuyển lên"
                              style={{
                                width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0',
                                background: '#f8fafc', cursor: idx === 0 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: idx === 0 ? 0.4 : 1, transition: 'all 0.15s',
                              }}
                            >
                              <ChevronUp size={14} color="#475569" />
                            </button>
                            <button
                              onClick={() => moveSortOrder(tmpl.id, 'down')}
                              disabled={idx === templates.length - 1}
                              title="Di chuyển xuống"
                              style={{
                                width: 30, height: 30, borderRadius: 8, border: '1px solid #e2e8f0',
                                background: '#f8fafc', cursor: idx === templates.length - 1 ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                opacity: idx === templates.length - 1 ? 0.4 : 1, transition: 'all 0.15s',
                              }}
                            >
                              <ChevronDown size={14} color="#475569" />
                            </button>
                          </div>

                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => { setSelectedTemplateId(tmpl.id); setActiveTab('css'); }}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px',
                                borderRadius: 8, border: '1px solid #e0e7ff', background: '#f8f9ff',
                                color: '#6366f1', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                              }}
                            >
                              <Code2 size={12} /> CSS
                            </button>
                            <Link
                              href={`/preview/dasd`}
                              target="_blank"
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px',
                                borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc',
                                color: '#475569', fontSize: 11, fontWeight: 600, textDecoration: 'none',
                              }}
                            >
                              <Eye size={12} /> Preview
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===== TAB: THUMBNAILS ===== */}
            {activeTab === 'thumbnails' && (
              <div>
                <div style={{ marginBottom: 20 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1e1b4b', margin: 0 }}>Quản lý Thumbnail</h2>
                  <p style={{ fontSize: 13, color: '#64748b', margin: '4px 0 0' }}>
                    Upload ảnh thumbnail hiển thị trên trang chọn template. Kích thước đề xuất: 480×640px.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                  {templates.map((tmpl, idx) => (
                    <div key={tmpl.id} className="template-card" style={{
                      background: '#fff', borderRadius: 16, overflow: 'hidden',
                      border: '1px solid #e2e8f0', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                      animationDelay: `${idx * 0.04}s`,
                    }}>
                      {/* Current thumbnail */}
                      <div style={{ height: 180, background: '#f8f9ff', position: 'relative', overflow: 'hidden' }}>
                        {tmpl.thumbnail_url || tmpl.defaultThumbnail ? (
                          <img
                            src={tmpl.thumbnail_url || tmpl.defaultThumbnail}
                            alt={tmpl.name}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 8, color: '#94a3b8' }}>
                            <ImageIcon size={36} />
                            <span style={{ fontSize: 12 }}>Chưa có thumbnail</span>
                          </div>
                        )}
                        {tmpl.thumbnail_url && (
                          <div style={{ position: 'absolute', top: 8, right: 8 }}>
                            <span style={{ background: 'rgba(16,185,129,0.9)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                              Custom
                            </span>
                          </div>
                        )}
                        {uploadingThumbnail === tmpl.id && (
                          <div style={{
                            position: 'absolute', inset: 0, background: 'rgba(99,102,241,0.7)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Loader2 size={32} color="white" style={{ animation: 'spin 1s linear infinite' }} />
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '12px 14px' }}>
                        <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', margin: '0 0 2px' }}>{tmpl.name}</h3>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 10px' }}>{tmpl.id}</p>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <label style={{
                            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                            padding: '7px', borderRadius: 8, border: '1px solid #c7d2fe',
                            background: '#f0f4ff', color: '#6366f1', fontSize: 12, fontWeight: 600,
                            cursor: 'pointer', transition: 'all 0.15s',
                          }}>
                            <Upload size={13} />
                            {tmpl.thumbnail_url ? 'Đổi ảnh' : 'Upload'}
                            <input
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => {
                                const file = e.target.files?.[0];
                                if (file) handleThumbnailUpload(tmpl.id, file);
                                e.target.value = '';
                              }}
                            />
                          </label>
                          {tmpl.thumbnail_url && (
                            <button
                              onClick={() => removeThumbnail(tmpl.id)}
                              style={{
                                padding: '7px 10px', borderRadius: 8, border: '1px solid #fecaca',
                                background: '#fff5f5', color: '#ef4444', fontSize: 12, cursor: 'pointer',
                              }}
                              title="Xóa thumbnail, dùng ảnh mặc định"
                            >
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

            {/* ===== TAB: CSS EDITOR ===== */}
            {activeTab === 'css' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }}>
                {/* Left: Editor panel */}
                <div style={{ background: '#fff', borderRadius: 20, padding: 24, border: '1px solid rgba(99,102,241,0.12)', boxShadow: '0 4px 20px rgba(99,102,241,0.06)' }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e1b4b', margin: '0 0 16px' }}>
                    <Code2 size={18} style={{ verticalAlign: 'middle', marginRight: 8, color: '#6366f1' }} />
                    CSS Editor
                  </h2>

                  {/* Template selector */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>Chọn Template</label>
                    <select
                      value={selectedTemplateId}
                      onChange={e => setSelectedTemplateId(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', borderRadius: 10,
                        border: '1.5px solid #e0e7ff', background: '#f8f9ff',
                        fontSize: 14, fontWeight: 600, color: '#1e1b4b',
                        outline: 'none', cursor: 'pointer',
                      }}
                    >
                      {templates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.id})</option>
                      ))}
                    </select>
                  </div>

                  {/* Quick color pickers */}
                  <div style={{ marginBottom: 16, padding: '14px', background: '#f8f9ff', borderRadius: 12, border: '1px solid #e0e7ff' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: '#475569', margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      🎨 Chèn nhanh biến CSS
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Màu chính (primary)', snippet: '.t10-wrapper { --color-primary: #a31d16; }' },
                        { label: 'Màu vàng (gold)', snippet: '.t10-wrapper { --color-gold: #f0d497; }' },
                        { label: 'Màu nền (bg)', snippet: '.t10-wrapper { --color-bg: #fffbf5; }' },
                        { label: 'Font tiêu đề', snippet: '.t10-wrapper { --font-serif: \'Playfair Display\', serif; }' },
                        { label: 'Ẩn footer', snippet: '.t10-wrapper .footer { display: none !important; }' },
                        { label: 'Border radius card', snippet: '.t10-wrapper .event-card { border-radius: 20px; }' },
                      ].map(({ label, snippet }) => (
                        <button
                          key={label}
                          onClick={() => setCssEditorValue(prev => prev ? prev + '\n\n' + snippet : snippet)}
                          style={{
                            padding: '6px 10px', borderRadius: 8, border: '1px solid #c7d2fe',
                            background: '#f0f4ff', color: '#4338ca', fontSize: 11, fontWeight: 600,
                            cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                          }}
                        >
                          + {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Code textarea */}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                      CSS tùy chỉnh — áp dụng cho tất cả thiệp dùng mẫu <strong>{selectedTemplateId}</strong>
                    </label>
                    <textarea
                      className="css-editor"
                      value={cssEditorValue}
                      onChange={e => setCssEditorValue(e.target.value)}
                      placeholder={`/* Ví dụ: thay đổi màu chính của template-10 */
.t10-wrapper {
  --color-primary: #c2185b;
  --color-gold: #ffd54f;
}

/* Ẩn phần footer watermark */
.t10-wrapper .footer {
  display: none !important;
}
`}
                      spellCheck={false}
                    />
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 6 }}>
                      💡 Mỗi template có class wrapper riêng: <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>.t10-wrapper</code>, <code style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: 4 }}>.t11-wrapper</code>, v.v.
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={saveCssOverride}
                      disabled={savingCss}
                      style={{
                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '11px', borderRadius: 10,
                        background: savingCss ? '#c7d2fe' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        color: '#fff', fontWeight: 700, fontSize: 14, border: 'none',
                        cursor: savingCss ? 'wait' : 'pointer',
                        boxShadow: savingCss ? 'none' : '0 4px 14px rgba(99,102,241,0.35)',
                      }}
                    >
                      {savingCss ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={15} />}
                      {savingCss ? 'Đang lưu...' : 'Lưu & Áp dụng'}
                    </button>
                    <button
                      onClick={resetCss}
                      disabled={savingCss}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '11px 16px', borderRadius: 10,
                        border: '1.5px solid #fecaca', background: '#fff5f5',
                        color: '#ef4444', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={14} /> Reset
                    </button>
                  </div>

                  {selectedTemplate?.css_override && (
                    <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: '#f0fdf4', border: '1px solid #bbf7d0', fontSize: 12, color: '#166534' }}>
                      ✅ Template này đang có CSS tùy chỉnh ({selectedTemplate.css_override.length} ký tự)
                    </div>
                  )}
                </div>

                {/* Right: Live preview */}
                <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(99,102,241,0.12)', boxShadow: '0 4px 20px rgba(99,102,241,0.06)' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Eye size={16} color="#6366f1" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#1e1b4b' }}>Live Preview</span>
                      <span style={{ fontSize: 11, color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: 20 }}>loobycard.com/preview/dasd</span>
                    </div>
                    <button
                      onClick={() => setCssPreviewKey(k => k + 1)}
                      style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#f8fafc', color: '#475569', fontSize: 12, cursor: 'pointer' }}
                    >
                      <RotateCcw size={12} /> Refresh
                    </button>
                  </div>
                  <div style={{ height: 600, overflow: 'hidden', position: 'relative', background: '#f8f9ff' }}>
                    <div style={{ width: '133%', marginLeft: '-16.5%', height: '800px', transform: 'scale(0.75)', transformOrigin: 'top center' }}>
                      <iframe
                        key={cssPreviewKey}
                        ref={cssPreviewRef}
                        src="/preview/dasd"
                        style={{ width: '100%', height: '100%', border: 'none' }}
                        title="Template Preview"
                      />
                    </div>
                  </div>
                  <div style={{ padding: '10px 16px', background: '#f8f9ff', borderTop: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, textAlign: 'center' }}>
                      ⚠️ Preview dùng card demo &quot;dasd&quot;. Nhấn <strong>Lưu &amp; Áp dụng</strong> rồi <strong>Refresh</strong> để xem kết quả.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
