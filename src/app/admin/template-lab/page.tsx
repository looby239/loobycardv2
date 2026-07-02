'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { 
  Laptop, 
  Smartphone, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Download, 
  Upload, 
  Camera, 
  Trash2, 
  Check, 
  Copy, 
  Sparkles, 
  Settings, 
  Edit3, 
  Database,
  FileCode2,
  X,
  ArrowLeft
} from 'lucide-react';
import { TEMPLATE_CATALOG, type TemplateCatalogItem } from '@/lib/templateCatalog';
import { 
  DEFAULT_TEMPLATE_CONFIG, 
  TEMPLATE_DECORATION_SPEEDS, 
  TEMPLATE_FONT_OPTIONS, 
  TEMPLATE_GALLERY_LAYOUTS, 
  normalizeTemplateConfig, 
  type TemplateConfig 
} from '@/lib/templateConfig';
import { mergeTemplateSample } from '@/lib/templateSampleData';
import type { CardData } from '@/types/card';

interface Snapshot {
  id: string;
  name: string;
  timestamp: string;
  templateId: string;
  config: TemplateConfig;
  customStyles: Record<string, Record<string, string>>;
  card: CardData;
}

export default function TemplateLabPage() {
  const [selectedTemplateId, setSelectedTemplateId] = useState('template-10');
  const [templates, setTemplates] = useState<TemplateCatalogItem[]>(TEMPLATE_CATALOG);
  const [cardMockData, setCardMockData] = useState<CardData>(() => mergeTemplateSample('template-10'));
  const [templateConfig, setTemplateConfig] = useState<TemplateConfig>(DEFAULT_TEMPLATE_CONFIG);
  const [customStyles, setCustomStyles] = useState<Record<string, Record<string, string>>>({});
  
  // Editor panel state
  const [activeSelector, setActiveSelector] = useState('');
  const [activeElementInfo, setActiveElementInfo] = useState<{ tagName: string; className: string; id: string } | null>(null);
  const [activeStyles, setActiveStyles] = useState<Record<string, string>>({});
  
  // App UI states
  const [inspectMode, setInspectMode] = useState(false);
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'visual' | 'global' | 'mock' | 'snapshots' | 'json'>('visual');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [snapshotName, setSnapshotName] = useState('');
  const [importJsonText, setImportJsonText] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // Show Toast feedback
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Fetch actual templates database config (optional fallback)
  useEffect(() => {
    async function loadDbTemplates() {
      try {
        const res = await fetch('/api/admin/templates', { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.templates && data.templates.length > 0) {
          // Map backend templates to Catalog format
          const dbItems = data.templates.map((t: any) => ({
            id: t.id,
            key: t.base_template_key || t.id,
            name: t.name,
            description: t.description || '',
            type: t.type || 'thiep-cuoi',
            typeName: t.typeName || 'Thiep cuoi',
            defaultThumbnail: t.thumbnail_url || t.defaultThumbnail || '/templates/template-10/assets/images/cover_photo.png',
            previewUrl: t.preview_url || `/template-preview/${t.id}`,
            config: t.config
          }));
          setTemplates(dbItems);
        }
      } catch (err) {
        console.warn('Could not fetch template configs database, falling back to static catalog:', err);
      }
    }
    loadDbTemplates();
  }, []);

  // Load snapshots from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('looby_lab_snapshots');
    if (saved) {
      try {
        setSnapshots(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved snapshots:', e);
      }
    }
  }, []);

  // Set card mock and config on template change
  useEffect(() => {
    const foundTemplate = templates.find(t => t.id === selectedTemplateId) as any;
    const initialConfig = foundTemplate?.config ? normalizeTemplateConfig(foundTemplate.config) : DEFAULT_TEMPLATE_CONFIG;
    
    setCardMockData(mergeTemplateSample(selectedTemplateId));
    setTemplateConfig(initialConfig);
    setCustomStyles({});
    setActiveSelector('');
    setActiveElementInfo(null);
    setActiveStyles({});
  }, [selectedTemplateId, templates]);

  // Compile customStyles record into CSS text
  const compiledCss = useMemo(() => {
    return Object.entries(customStyles)
      .map(([selector, styles]) => {
        const declarations = Object.entries(styles)
          .map(([prop, val]) => `  ${prop}: ${val} !important;`)
          .join('\n');
        return `${selector} {\n${declarations}\n}`;
      })
      .join('\n\n');
  }, [customStyles]);

  // Send update message to iframe
  const updateIframe = useCallback(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'UPDATE_PREVIEW',
        templateId: selectedTemplateId,
        card: cardMockData,
        config: templateConfig,
        cssOverride: compiledCss
      }, '*');
    }
  }, [selectedTemplateId, cardMockData, templateConfig, compiledCss]);

  // Push updates to iframe whenever state changes
  useEffect(() => {
    updateIframe();
  }, [updateIframe]);

  // Push inspect mode toggle to iframe
  useEffect(() => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage({
        type: 'SET_INSPECT_MODE',
        enabled: inspectMode
      }, '*');
    }
  }, [inspectMode, selectedTemplateId]);

  // Handle postMessage communication from the preview iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || typeof data !== 'object') return;

      if (data.type === 'INSPECT_ELEMENT') {
        setActiveSelector(data.selector);
        setActiveElementInfo({
          tagName: data.tagName,
          className: data.className,
          id: data.elementId
        });
        setActiveStyles(data.styles || {});
        // Auto-switch to visual tab if inside inspector mode
        setActiveTab('visual');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Update styles helper
  const patchCustomStyle = (property: string, value: string) => {
    if (!activeSelector) return;
    setCustomStyles(prev => {
      const next = { ...prev };
      if (!next[activeSelector]) {
        next[activeSelector] = {};
      }
      if (value === '') {
        delete next[activeSelector][property];
        if (Object.keys(next[activeSelector]).length === 0) {
          delete next[activeSelector];
        }
      } else {
        next[activeSelector][property] = value;
      }
      return next;
    });
  };

  // Convert CSS value to numeric slider input
  const getNumericValue = (val: string | undefined, defaultValue = 0) => {
    if (!val) return defaultValue;
    const num = parseFloat(val);
    return isNaN(num) ? defaultValue : num;
  };

  // Get active value combining current element CSS and overridden stylesheet
  const getActiveStyle = (property: string) => {
    if (customStyles[activeSelector]?.[property] !== undefined) {
      return customStyles[activeSelector][property];
    }
    return activeStyles[property] || '';
  };

  // Handle client-side Base64 asset upload simulator
  const handleLocalImageUpload = (event: React.ChangeEvent<HTMLInputElement>, target: 'backgroundImage' | 'decorationImage' | 'themeBackground') => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      if (target === 'backgroundImage') {
        patchCustomStyle('background-image', `url("${base64}")`);
      } else if (target === 'decorationImage') {
        patchCustomStyle('background-image', `url("${base64}")`);
        patchCustomStyle('width', '100px');
        patchCustomStyle('height', '100px');
        patchCustomStyle('background-size', 'contain');
        patchCustomStyle('background-repeat', 'no-repeat');
      } else if (target === 'themeBackground') {
        setTemplateConfig(prev => ({
          ...prev,
          background: {
            ...prev.background,
            type: 'image',
            imageUrl: base64
          }
        }));
      }
      showToast('Ảnh được mã hóa Base64 và tải vào bộ nhớ live!');
    };
    reader.readAsDataURL(file);
    event.target.value = '';
  };

  // Save current design snapshot in localStorage
  const handleTakeSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!snapshotName.trim()) {
      showToast('Vui lòng nhập tên Snapshot!', 'error');
      return;
    }

    const newSnapshot: Snapshot = {
      id: Math.random().toString(36).substring(2, 9),
      name: snapshotName.trim(),
      timestamp: new Date().toLocaleString(),
      templateId: selectedTemplateId,
      config: templateConfig,
      customStyles,
      card: cardMockData
    };

    const nextList = [newSnapshot, ...snapshots];
    setSnapshots(nextList);
    localStorage.setItem('looby_lab_snapshots', JSON.stringify(nextList));
    setSnapshotName('');
    showToast('Đã chụp Snapshot vào localStorage!');
  };

  // Restore snapshot
  const loadSnapshot = (snap: Snapshot) => {
    setSelectedTemplateId(snap.templateId);
    setTemplateConfig(snap.config);
    setCustomStyles(snap.customStyles);
    setCardMockData(snap.card);
    setActiveSelector('');
    setActiveElementInfo(null);
    showToast(`Đã khôi phục thiết kế: ${snap.name}`);
  };

  // Delete snapshot
  const deleteSnapshot = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextList = snapshots.filter(s => s.id !== id);
    setSnapshots(nextList);
    localStorage.setItem('looby_lab_snapshots', JSON.stringify(nextList));
    showToast('Đã xóa Snapshot.');
  };

  // Reset design configurations
  const handleReset = () => {
    if (confirm('Bạn có chắc chắn muốn khôi phục thiết kế gốc của Template này?')) {
      setCustomStyles({});
      const foundTemplate = templates.find(t => t.id === selectedTemplateId) as any;
      setTemplateConfig(foundTemplate?.config ? normalizeTemplateConfig(foundTemplate.config) : DEFAULT_TEMPLATE_CONFIG);
      setCardMockData(mergeTemplateSample(selectedTemplateId));
      setActiveSelector('');
      setActiveElementInfo(null);
      setActiveStyles({});
      showToast('Đã reset thiết kế.');
    }
  };

  // Export JSON generator
  const exportedConfigJson = useMemo(() => {
    return JSON.stringify({
      templateId: selectedTemplateId,
      config: templateConfig,
      elements: customStyles,
      cssOverride: compiledCss
    }, null, 2);
  }, [selectedTemplateId, templateConfig, customStyles, compiledCss]);

  // Copy JSON to clipboard
  const handleCopyJson = () => {
    navigator.clipboard.writeText(exportedConfigJson);
    setIsCopied(true);
    showToast('Đã sao chép JSON cấu hình!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Import JSON configurations
  const handleImportJson = () => {
    if (!importJsonText.trim()) {
      showToast('Nhập JSON trước khi apply!', 'error');
      return;
    }
    try {
      const parsed = JSON.parse(importJsonText.trim());
      if (parsed.templateId) {
        setSelectedTemplateId(parsed.templateId);
      }
      if (parsed.config) {
        setTemplateConfig(normalizeTemplateConfig(parsed.config));
      }
      if (parsed.elements) {
        setCustomStyles(parsed.elements);
      }
      setActiveSelector('');
      setActiveElementInfo(null);
      showToast('Đã áp dụng JSON cấu hình!');
      setImportJsonText('');
    } catch (e) {
      showToast('JSON không hợp lệ. Vui lòng kiểm tra lại!', 'error');
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-100 font-sans overflow-hidden">
      {/* Dynamic Toast Feedback */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-xl font-semibold text-sm transition-all duration-300 ${
          toast.type === 'success' ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* TOP HEADER CONTROLS */}
      <header className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-lg text-xs font-semibold border border-slate-700 transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Dashboard</span>
          </Link>
          <div className="h-6 w-px bg-slate-800"></div>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight flex items-center gap-2">
                LoobyCard Template Lab
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Sandbox
                </span>
              </h1>
              <p className="text-xs text-slate-400">Môi trường tùy biến template cô lập, không lưu database</p>
            </div>
          </div>
        </div>

        {/* TOOLBAR CONTROLS */}
        <div className="flex items-center gap-4">
          {/* Inspect Mode Toggle */}
          <button
            onClick={() => setInspectMode(!inspectMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors border ${
              inspectMode 
                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
            }`}
            title="Bật/Tắt chế độ click chuột trực tiếp vào phần tử trên màn hình để chọn style"
          >
            {inspectMode ? <Eye size={16} /> : <EyeOff size={16} />}
            {inspectMode ? 'Inspect: ON' : 'Inspect Mode'}
          </button>

          {/* Device Size Switch */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-750">
            <button
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 rounded-md transition-all ${
                deviceMode === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Xem giao diện Máy tính"
            >
              <Laptop size={16} />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 rounded-md transition-all ${
                deviceMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Xem giao diện Điện thoại"
            >
              <Smartphone size={16} />
            </button>
          </div>

          {/* Reset Action */}
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white rounded-lg text-sm border border-slate-700 font-medium transition-all"
            title="Reset toàn bộ thay đổi thiết kế trên template này"
          >
            <RefreshCw size={15} />
            Reset Design
          </button>
        </div>
      </header>

      {/* CORE WORKSPACE */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT COLUMN: CATALOGUE & SNAPSHOTS */}
        <aside className="w-72 bg-slate-950/80 border-r border-slate-800 flex flex-col overflow-y-auto">
          {/* Templates Catalogue Section */}
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Danh sách Templates</h2>
            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplateId(template.id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg text-left transition-all border ${
                    selectedTemplateId === template.id
                      ? 'bg-slate-800 border-indigo-500/50 text-white'
                      : 'bg-transparent border-transparent hover:bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="relative w-12 h-12 bg-slate-800 rounded border border-slate-700 overflow-hidden flex-shrink-0">
                    {template.defaultThumbnail ? (
                      <img 
                        src={template.defaultThumbnail} 
                        alt={template.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // fallback placeholder if local asset fails
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%231E293B"/><text x="50" y="50" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="10" fill="%2364748B">Template</text></svg>';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-500">No Img</div>
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-sm font-semibold truncate text-slate-200">{template.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{template.type.replace('-', ' ')}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Local Snapshots Section */}
          <div className="p-4 flex-1 flex flex-col">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Snapshots (Local)</h2>
            
            {/* Snapshot Form */}
            <form onSubmit={handleTakeSnapshot} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tên snapshot..."
                  value={snapshotName}
                  onChange={(e) => setSnapshotName(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors"
                  title="Chụp lại trạng thái hiện tại"
                >
                  <Camera size={15} />
                </button>
              </div>
            </form>

            {/* Snapshots Scrollable List */}
            <div className="space-y-2 overflow-y-auto flex-1 pr-1 max-h-[350px]">
              {snapshots.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-500 italic">
                  Chưa có snapshot nào được lưu
                </div>
              ) : (
                snapshots.map((snap) => (
                  <div
                    key={snap.id}
                    onClick={() => loadSnapshot(snap)}
                    className="group flex items-center justify-between p-2.5 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 rounded-lg cursor-pointer transition-all hover:border-slate-700"
                  >
                    <div className="overflow-hidden pr-2">
                      <div className="text-xs font-semibold truncate text-slate-300">{snap.name}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <span>{snap.templateId}</span>
                        <span>•</span>
                        <span>{snap.timestamp}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteSnapshot(snap.id, e)}
                      className="p-1 hover:bg-slate-800 rounded text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Xóa snapshot"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>

        {/* MIDDLE COLUMN: LIVE PREVIEW CANVAS */}
        <main className="flex-1 bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* Status Indicators overlay */}
          {inspectMode && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-indigo-600/90 text-white backdrop-blur border border-indigo-500 px-4 py-1.5 rounded-full text-xs font-semibold shadow-lg z-10 animate-bounce flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
              Đang bật Inspect: Click trực tiếp vào phần tử trên template để chọn sửa!
            </div>
          )}

          {/* Iframe Frame Sizer */}
          <div 
            className="bg-white shadow-2xl rounded-2xl overflow-hidden border border-slate-800 transition-all duration-350 flex flex-col"
            style={{
              width: deviceMode === 'mobile' ? '375px' : '100%',
              height: '100%',
              maxWidth: deviceMode === 'mobile' ? '375px' : '100%',
            }}
          >
            {/* Mock browser header */}
            <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs text-slate-400 select-none">
              <div className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-slate-350"></span>
                <span className="w-3 h-3 rounded-full bg-slate-350"></span>
                <span className="w-3 h-3 rounded-full bg-slate-350"></span>
              </div>
              <div className="bg-white/80 border border-slate-200 rounded-md px-16 py-0.5 text-[10px] font-mono text-slate-500">
                localhost:3000/admin/template-lab/preview?template_id={selectedTemplateId}
              </div>
              <div className="w-8"></div>
            </div>

            {/* Preview Frame */}
            <div className="flex-1 bg-slate-50 relative">
              <iframe
                ref={iframeRef}
                src={`/admin/template-lab/preview?template_id=${selectedTemplateId}`}
                title="Live Template Render Frame"
                className="w-full h-full border-none"
                onLoad={() => {
                  // Wait slightly for iframe load and post updates
                  setTimeout(updateIframe, 150);
                }}
              />
            </div>
          </div>
        </main>

        {/* RIGHT COLUMN: EDITOR CONTROL PANEL */}
        <aside className="w-[450px] bg-slate-900 border-l border-slate-800 flex flex-col overflow-hidden">
          {/* Editor Header Navigation Tabs */}
          <nav className="flex bg-slate-950 border-b border-slate-800 text-xs font-semibold select-none shrink-0 overflow-x-auto">
            {[
              { id: 'visual', label: 'Inspector', icon: Edit3 },
              { id: 'global', label: 'Global', icon: Settings },
              { id: 'mock', label: 'Mock Data', icon: Database },
              { id: 'snapshots', label: 'Import/Export', icon: FileCode2 },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-3 border-b-2 text-center transition-all ${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-400 bg-slate-900/50'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/20'
                  }`}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Tabs Content scrollable area */}
          <div className="flex-grow overflow-y-auto p-5 space-y-5">
            
            {/* TAB 1: VISUAL INSPECTOR (ELEMENT STYLER) */}
            {activeTab === 'visual' && (
              <div className="space-y-4">
                <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Đang chỉnh sửa phần tử</h3>
                  
                  {activeSelector ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] bg-indigo-500/25 border border-indigo-500/30 text-indigo-300 font-bold px-2 py-0.5 rounded uppercase">
                          Selector
                        </span>
                        <input
                          type="text"
                          value={activeSelector}
                          onChange={(e) => setActiveSelector(e.target.value)}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      
                      {activeElementInfo && (
                        <div className="text-[11px] text-slate-500 font-mono space-y-1 bg-slate-900/55 p-2.5 rounded border border-slate-850/50">
                          <div><span className="text-slate-400 font-semibold">Tag:</span> &lt;{activeElementInfo.tagName}&gt;</div>
                          {activeElementInfo.id && <div><span className="text-slate-400 font-semibold">ID:</span> #{activeElementInfo.id}</div>}
                          {activeElementInfo.className && (
                            <div className="break-all">
                              <span className="text-slate-400 font-semibold">Classes:</span>{' '}
                              <span className="text-slate-400 text-[10px]">{activeElementInfo.className}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 leading-relaxed py-2">
                      💡 <strong>Chưa chọn phần tử nào.</strong> Bật <strong>Inspect Mode</strong> ở thanh công cụ phía trên và nhấp chuột trực tiếp vào bất kỳ tiêu đề, nút bấm, hay vùng nào trong thiệp cưới để chỉnh sửa style live.
                      <div className="mt-3">
                        Hoặc nhập selector CSS thủ công để tự tay định nghĩa:
                        <input
                          type="text"
                          placeholder="ví dụ: .wedding-template h1"
                          value={activeSelector}
                          onChange={(e) => setActiveSelector(e.target.value)}
                          className="w-full mt-1.5 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {activeSelector && (
                  <div className="space-y-4">
                    {/* SECTION 1.1: TEXT EDITING */}
                    <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-900/25">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1.5">1. Định dạng văn bản (Text)</h4>
                      
                      {/* Font Family */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Font chữ</label>
                        <select
                          value={getActiveStyle('font-family').replace(/['"]/g, '')}
                          onChange={(e) => patchCustomStyle('font-family', e.target.value ? `"${e.target.value}", sans-serif` : '')}
                          className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="">-- Mặc định --</option>
                          {TEMPLATE_FONT_OPTIONS.map(font => (
                            <option key={font} value={font}>{font}</option>
                          ))}
                          <option value="Arial">Arial</option>
                          <option value="Times New Roman">Times New Roman</option>
                        </select>
                      </div>

                      {/* Font Size */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Cỡ chữ (px)</label>
                        <div className="col-span-2 flex items-center gap-2">
                          <input
                            type="range"
                            min="8"
                            max="120"
                            value={getNumericValue(getActiveStyle('font-size'), 16)}
                            onChange={(e) => patchCustomStyle('font-size', `${e.target.value}px`)}
                            className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                          <input
                            type="text"
                            value={getActiveStyle('font-size')}
                            onChange={(e) => patchCustomStyle('font-size', e.target.value)}
                            className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Font Weight */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Độ đậm</label>
                        <select
                          value={getActiveStyle('font-weight')}
                          onChange={(e) => patchCustomStyle('font-weight', e.target.value)}
                          className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="">-- Mặc định --</option>
                          <option value="100">Thin (100)</option>
                          <option value="300">Light (300)</option>
                          <option value="400">Normal (400)</option>
                          <option value="500">Medium (500)</option>
                          <option value="600">Semibold (600)</option>
                          <option value="700">Bold (700)</option>
                          <option value="900">Black (900)</option>
                        </select>
                      </div>

                      {/* Text Color */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Màu chữ</label>
                        <div className="col-span-2 flex gap-2">
                          <input
                            type="color"
                            value={getActiveStyle('color').startsWith('#') ? getActiveStyle('color').substring(0,7) : '#ffffff'}
                            onChange={(e) => patchCustomStyle('color', e.target.value)}
                            className="w-10 h-7 bg-transparent border-0 cursor-pointer rounded"
                          />
                          <input
                            type="text"
                            placeholder="Màu hex (vd: #8B5E3C)"
                            value={getActiveStyle('color')}
                            onChange={(e) => patchCustomStyle('color', e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Line height */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Giãn dòng</label>
                        <input
                          type="text"
                          placeholder="ví dụ: 1.5, 24px"
                          value={getActiveStyle('line-height')}
                          onChange={(e) => patchCustomStyle('line-height', e.target.value)}
                          className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* SECTION 1.2: BUTTON / BOX STYLES */}
                    <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-900/25">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1.5">2. Hộp & Nút bấm (Box/Button)</h4>
                      
                      {/* Box Background color */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Màu nền</label>
                        <div className="col-span-2 flex gap-2">
                          <input
                            type="color"
                            value={getActiveStyle('background-color').startsWith('#') ? getActiveStyle('background-color').substring(0,7) : '#4f46e5'}
                            onChange={(e) => patchCustomStyle('background-color', e.target.value)}
                            className="w-10 h-7 bg-transparent border-0 cursor-pointer rounded"
                          />
                          <input
                            type="text"
                            placeholder="Màu hex/rgba"
                            value={getActiveStyle('background-color')}
                            onChange={(e) => patchCustomStyle('background-color', e.target.value)}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Border Radius */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Bo góc (radius)</label>
                        <div className="col-span-2 flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={getNumericValue(getActiveStyle('border-radius'), 8)}
                            onChange={(e) => patchCustomStyle('border-radius', `${e.target.value}px`)}
                            className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                          <input
                            type="text"
                            value={getActiveStyle('border-radius')}
                            onChange={(e) => patchCustomStyle('border-radius', e.target.value)}
                            className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Box Shadow */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Độ đổ bóng</label>
                        <select
                          value={getActiveStyle('box-shadow')}
                          onChange={(e) => patchCustomStyle('box-shadow', e.target.value)}
                          className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="">-- Mặc định --</option>
                          <option value="none">None</option>
                          <option value="0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)">Small shadow</option>
                          <option value="0 3px 6px rgba(0,0,0,0.16), 0 3px 6px rgba(0,0,0,0.23)">Medium shadow</option>
                          <option value="0 10px 20px rgba(0,0,0,0.19), 0 6px 6px rgba(0,0,0,0.23)">Large shadow</option>
                          <option value="0 19px 38px rgba(0,0,0,0.30), 0 15px 12px rgba(0,0,0,0.22)">Very large shadow</option>
                        </select>
                      </div>
                    </div>

                    {/* SECTION 1.3: CONTAINER / SECTION EDITING */}
                    <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-900/25">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1.5">3. Khoảng cách & Nền vùng (Section)</h4>

                      {/* Padding vertical */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Đệm trên (Padding T)</label>
                        <input
                          type="text"
                          placeholder="ví dụ: 20px, 4rem"
                          value={getActiveStyle('padding-top')}
                          onChange={(e) => patchCustomStyle('padding-top', e.target.value)}
                          className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Đệm dưới (Padding B)</label>
                        <input
                          type="text"
                          placeholder="ví dụ: 20px, 4rem"
                          value={getActiveStyle('padding-bottom')}
                          onChange={(e) => patchCustomStyle('padding-bottom', e.target.value)}
                          className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono"
                        />
                      </div>

                      {/* Padding horizontal */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Đệm trái/phải</label>
                        <div className="col-span-2 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Trái (L)"
                            value={getActiveStyle('padding-left')}
                            onChange={(e) => patchCustomStyle('padding-left', e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-center"
                          />
                          <input
                            type="text"
                            placeholder="Phải (R)"
                            value={getActiveStyle('padding-right')}
                            onChange={(e) => patchCustomStyle('padding-right', e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono text-center"
                          />
                        </div>
                      </div>

                      {/* Margins */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Margin trên/dưới</label>
                        <div className="col-span-2 grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Margin Top"
                            value={getActiveStyle('margin-top')}
                            onChange={(e) => patchCustomStyle('margin-top', e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-center"
                          />
                          <input
                            type="text"
                            placeholder="Margin Bottom"
                            value={getActiveStyle('margin-bottom')}
                            onChange={(e) => patchCustomStyle('margin-bottom', e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-center"
                          />
                        </div>
                      </div>

                      {/* Custom background image */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Ảnh nền vùng</label>
                        <div className="col-span-2 flex gap-2">
                          <input
                            type="text"
                            placeholder="URL hình ảnh"
                            value={getActiveStyle('background-image').replace(/^url\(['"]?|['"]?\)$/g, '')}
                            onChange={(e) => patchCustomStyle('background-image', e.target.value ? `url("${e.target.value}")` : '')}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs font-mono"
                          />
                          <label className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer transition-colors flex items-center justify-center shrink-0">
                            <Upload size={14} />
                            <input 
                              type="file" 
                              accept="image/*" 
                              hidden 
                              onChange={(e) => handleLocalImageUpload(e, 'backgroundImage')} 
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* SECTION 1.4: DECORATIONS & TRANSFORM */}
                    <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-900/25">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1.5">4. Trang trí & Xoay (Decoration/Transform)</h4>
                      
                      {/* Upload new decoration simulation */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Đè ảnh trang trí mới</label>
                        <label className="col-span-2 flex items-center justify-center gap-2 py-1.5 bg-slate-850 hover:bg-slate-800 border border-dashed border-slate-700 rounded-lg text-xs font-semibold text-slate-300 cursor-pointer hover:text-white transition-all">
                          <Upload size={14} />
                          <span>Tải ảnh trang trí lên lab</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            hidden 
                            onChange={(e) => handleLocalImageUpload(e, 'decorationImage')} 
                          />
                        </label>
                      </div>

                      {/* Opacity */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Độ đục (opacity)</label>
                        <div className="col-span-2 flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={getNumericValue(getActiveStyle('opacity'), 1)}
                            onChange={(e) => patchCustomStyle('opacity', e.target.value)}
                            className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                          <input
                            type="text"
                            value={getActiveStyle('opacity')}
                            onChange={(e) => patchCustomStyle('opacity', e.target.value)}
                            className="w-16 bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-center text-xs font-mono"
                          />
                        </div>
                      </div>

                      {/* Rotation */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Góc xoay (độ)</label>
                        <div className="col-span-2 flex items-center gap-2">
                          <input
                            type="range"
                            min="-180"
                            max="180"
                            // extract rotate number from transform "rotate(Xdeg)"
                            value={(() => {
                              const match = getActiveStyle('transform').match(/rotate\((-?\d+)deg\)/);
                              return match ? parseInt(match[1]) : 0;
                            })()}
                            onChange={(e) => patchCustomStyle('transform', `rotate(${e.target.value}deg)`)}
                            className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                          <span className="w-16 text-center text-xs font-mono bg-slate-950 border border-slate-800 rounded py-0.5">
                            {(() => {
                              const match = getActiveStyle('transform').match(/rotate\((-?\d+)deg\)/);
                              return match ? `${match[1]}°` : '0°';
                            })()}
                          </span>
                        </div>
                      </div>

                      {/* Position */}
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Position</label>
                        <select
                          value={getActiveStyle('position')}
                          onChange={(e) => patchCustomStyle('position', e.target.value)}
                          className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                        >
                          <option value="">-- Mặc định --</option>
                          <option value="static">Static</option>
                          <option value="relative">Relative</option>
                          <option value="absolute">Absolute</option>
                          <option value="fixed">Fixed</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: GLOBAL CONFIG */}
            {activeTab === 'global' && (
              <div className="space-y-4">
                {/* 2.1 Color & Font Themes */}
                <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-900/25">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">1. Chủ đề màu & Phông (Theme)</h4>
                  
                  {[
                    ['Màu chủ đạo (Primary)', 'primaryColor'],
                    ['Màu phụ (Secondary)', 'secondaryColor'],
                    ['Màu nền (Background)', 'backgroundColor'],
                    ['Màu văn bản (Text)', 'textColor'],
                  ].map(([label, key]) => (
                    <div key={key} className="grid grid-cols-3 items-center gap-2">
                      <label className="text-xs text-slate-400">{label}</label>
                      <div className="col-span-2 flex gap-2">
                        <input
                          type="color"
                          value={templateConfig.theme[key as keyof typeof templateConfig.theme] as string}
                          onChange={(e) => setTemplateConfig(prev => ({
                            ...prev,
                            theme: { ...prev.theme, [key]: e.target.value }
                          }))}
                          className="w-10 h-7 bg-transparent border-0 cursor-pointer rounded"
                        />
                        <input
                          type="text"
                          value={templateConfig.theme[key as keyof typeof templateConfig.theme] as string}
                          onChange={(e) => setTemplateConfig(prev => ({
                            ...prev,
                            theme: { ...prev.theme, [key]: e.target.value }
                          }))}
                          className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-0.5 font-mono text-xs"
                        />
                      </div>
                    </div>
                  ))}

                  <div className="grid grid-cols-3 items-center gap-2 pt-2 border-t border-slate-800/50">
                    <label className="text-xs text-slate-400">Heading Font</label>
                    <select
                      value={templateConfig.theme.headingFont}
                      onChange={(e) => setTemplateConfig(prev => ({
                        ...prev,
                        theme: { ...prev.theme, headingFont: e.target.value as any }
                      }))}
                      className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      {TEMPLATE_FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="text-xs text-slate-400">Body Font</label>
                    <select
                      value={templateConfig.theme.bodyFont}
                      onChange={(e) => setTemplateConfig(prev => ({
                        ...prev,
                        theme: { ...prev.theme, bodyFont: e.target.value as any }
                      }))}
                      className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      {TEMPLATE_FONT_OPTIONS.map(font => <option key={font} value={font}>{font}</option>)}
                    </select>
                  </div>
                </div>

                {/* 2.2 Global Page Background */}
                <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-900/25">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">2. Hình nền bao phủ (Background)</h4>
                  
                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="text-xs text-slate-400">Kiểu nền</label>
                    <select
                      value={templateConfig.background.type}
                      onChange={(e) => setTemplateConfig(prev => ({
                        ...prev,
                        background: { ...prev.background, type: e.target.value as any }
                      }))}
                      className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      <option value="color">Màu sắc chủ đề</option>
                      <option value="image">Hình ảnh (Image)</option>
                    </select>
                  </div>

                  {templateConfig.background.type === 'image' && (
                    <>
                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Ảnh nền chính</label>
                        <div className="col-span-2 flex gap-2">
                          <input
                            type="text"
                            placeholder="URL hình ảnh"
                            value={templateConfig.background.imageUrl}
                            onChange={(e) => setTemplateConfig(prev => ({
                              ...prev,
                              background: { ...prev.background, imageUrl: e.target.value }
                            }))}
                            className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono"
                          />
                          <label className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 hover:text-white cursor-pointer transition-colors flex items-center justify-center shrink-0">
                            <Upload size={14} />
                            <input 
                              type="file" 
                              accept="image/*" 
                              hidden 
                              onChange={(e) => handleLocalImageUpload(e, 'themeBackground')} 
                            />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 items-center gap-2">
                        <label className="text-xs text-slate-400">Mờ phủ (Overlay)</label>
                        <div className="col-span-2 flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.05"
                            value={templateConfig.background.overlayOpacity}
                            onChange={(e) => setTemplateConfig(prev => ({
                              ...prev,
                              background: { ...prev.background, overlayOpacity: parseFloat(e.target.value) }
                            }))}
                            className="flex-1 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                          <span className="w-12 text-center text-xs font-mono bg-slate-950 border border-slate-800 rounded py-0.5">
                            {templateConfig.background.overlayOpacity}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 2.3 Floating Animations */}
                <div className="border border-slate-800 rounded-xl p-4 space-y-4 bg-slate-900/25">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">3. Hiệu ứng bay bổng (Decorations)</h4>
                  
                  {/* Falling Leaves */}
                  <div className="space-y-2.5 pb-3 border-b border-slate-800/50">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Hiệu ứng Lá Rơi</label>
                      <input 
                        type="checkbox"
                        checked={templateConfig.decorations.fallingLeaves.enabled}
                        onChange={(e) => setTemplateConfig(prev => ({
                          ...prev,
                          decorations: {
                            ...prev.decorations,
                            fallingLeaves: { ...prev.decorations.fallingLeaves, enabled: e.target.checked }
                          }
                        }))}
                        className="w-4 h-4 text-indigo-600 bg-slate-950 border-slate-800 rounded focus:ring-indigo-500 focus:ring-2"
                      />
                    </div>
                    {templateConfig.decorations.fallingLeaves.enabled && (
                      <div className="grid grid-cols-3 gap-2 bg-slate-950/45 p-2 rounded-lg border border-slate-850">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Số lượng</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="50"
                            value={templateConfig.decorations.fallingLeaves.count}
                            onChange={(e) => setTemplateConfig(prev => ({
                              ...prev,
                              decorations: {
                                ...prev.decorations,
                                fallingLeaves: { ...prev.decorations.fallingLeaves, count: parseInt(e.target.value) || 12 }
                              }
                            }))}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center text-white" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Tốc độ</label>
                          <select
                            value={templateConfig.decorations.fallingLeaves.speed}
                            onChange={(e) => setTemplateConfig(prev => ({
                              ...prev,
                              decorations: {
                                ...prev.decorations,
                                fallingLeaves: { ...prev.decorations.fallingLeaves, speed: e.target.value as any }
                              }
                            }))}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200"
                          >
                            {TEMPLATE_DECORATION_SPEEDS.map(speed => <option key={speed} value={speed}>{speed}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Opacity</label>
                          <input 
                            type="number" 
                            min="0.1" 
                            max="1" 
                            step="0.1"
                            value={templateConfig.decorations.fallingLeaves.opacity}
                            onChange={(e) => setTemplateConfig(prev => ({
                              ...prev,
                              decorations: {
                                ...prev.decorations,
                                fallingLeaves: { ...prev.decorations.fallingLeaves, opacity: parseFloat(e.target.value) || 0.7 }
                              }
                            }))}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center text-white" 
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Floating Flowers */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-300">Hiệu ứng Hoa Bay</label>
                      <input 
                        type="checkbox"
                        checked={templateConfig.decorations.floatingFlowers.enabled}
                        onChange={(e) => setTemplateConfig(prev => ({
                          ...prev,
                          decorations: {
                            ...prev.decorations,
                            floatingFlowers: { ...prev.decorations.floatingFlowers, enabled: e.target.checked }
                          }
                        }))}
                        className="w-4 h-4 text-indigo-600 bg-slate-950 border-slate-800 rounded focus:ring-indigo-500 focus:ring-2"
                      />
                    </div>
                    {templateConfig.decorations.floatingFlowers.enabled && (
                      <div className="grid grid-cols-3 gap-2 bg-slate-950/45 p-2 rounded-lg border border-slate-850">
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Số lượng</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="50"
                            value={templateConfig.decorations.floatingFlowers.count}
                            onChange={(e) => setTemplateConfig(prev => ({
                              ...prev,
                              decorations: {
                                ...prev.decorations,
                                floatingFlowers: { ...prev.decorations.floatingFlowers, count: parseInt(e.target.value) || 12 }
                              }
                            }))}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center text-white" 
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Tốc độ</label>
                          <select
                            value={templateConfig.decorations.floatingFlowers.speed}
                            onChange={(e) => setTemplateConfig(prev => ({
                              ...prev,
                              decorations: {
                                ...prev.decorations,
                                floatingFlowers: { ...prev.decorations.floatingFlowers, speed: e.target.value as any }
                              }
                            }))}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-200"
                          >
                            {TEMPLATE_DECORATION_SPEEDS.map(speed => <option key={speed} value={speed}>{speed}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 block mb-1">Opacity</label>
                          <input 
                            type="number" 
                            min="0.1" 
                            max="1" 
                            step="0.1"
                            value={templateConfig.decorations.floatingFlowers.opacity}
                            onChange={(e) => setTemplateConfig(prev => ({
                              ...prev,
                              decorations: {
                                ...prev.decorations,
                                floatingFlowers: { ...prev.decorations.floatingFlowers, opacity: parseFloat(e.target.value) || 0.7 }
                              }
                            }))}
                            className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-center text-white" 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2.4 Photo Album & Gallery */}
                <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-900/25">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">4. Album hình cưới (Gallery)</h4>
                  
                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="text-xs text-slate-400">Layout</label>
                    <select
                      value={templateConfig.gallery.layout}
                      onChange={(e) => setTemplateConfig(prev => ({
                        ...prev,
                        gallery: { ...prev.gallery, layout: e.target.value as any }
                      }))}
                      className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      {TEMPLATE_GALLERY_LAYOUTS.map(layout => (
                        <option key={layout} value={layout}>{layout.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="text-xs text-slate-400">Bo ảnh (Radius)</label>
                    <select
                      value={templateConfig.gallery.imageRadius}
                      onChange={(e) => setTemplateConfig(prev => ({
                        ...prev,
                        gallery: { ...prev.gallery, imageRadius: e.target.value as any }
                      }))}
                      className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      <option value="none">None (0px)</option>
                      <option value="small">Small (8px)</option>
                      <option value="medium">Medium (16px)</option>
                      <option value="large">Large (24px)</option>
                      <option value="full">Full (Tròn)</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-3 items-center gap-2">
                    <label className="text-xs text-slate-400">Khoảng cách</label>
                    <select
                      value={templateConfig.gallery.spacing}
                      onChange={(e) => setTemplateConfig(prev => ({
                        ...prev,
                        gallery: { ...prev.gallery, spacing: e.target.value as any }
                      }))}
                      className="col-span-2 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      <option value="tight">Chật (Tight)</option>
                      <option value="medium">Vừa (Medium)</option>
                      <option value="relaxed">Rộng (Relaxed)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MOCK DATA */}
            {activeTab === 'mock' && (
              <div className="space-y-4">
                <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-900/25">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider border-b border-slate-800 pb-1.5">Thông tin thử nghiệm (Mock Card)</h4>
                  
                  {/* Bride & Groom Name */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">Chú rể</label>
                      <input 
                        type="text"
                        value={cardMockData.groom_name}
                        onChange={(e) => setCardMockData(prev => ({ ...prev, groom_name: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">Cô dâu</label>
                      <input 
                        type="text"
                        value={cardMockData.bride_name}
                        onChange={(e) => setCardMockData(prev => ({ ...prev, bride_name: e.target.value }))}
                        className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Event venue name */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">Địa điểm cưới (Venue)</label>
                    <input 
                      type="text"
                      value={cardMockData.venue_name || ''}
                      onChange={(e) => setCardMockData(prev => ({ ...prev, venue_name: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs text-slate-200 font-medium"
                    />
                  </div>

                  {/* Wedding date */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">Ngày cưới (ISO Date)</label>
                    <input 
                      type="datetime-local"
                      // Format ISO event_date "2027-11-20T18:00:00.000Z" to datetime-local friendly format
                      value={cardMockData.event_date ? new Date(cardMockData.event_date).toISOString().substring(0,16) : ''}
                      onChange={(e) => setCardMockData(prev => ({ ...prev, event_date: new Date(e.target.value).toISOString() }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-xs font-mono text-slate-200"
                    />
                  </div>

                  {/* Invitation Text */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">Lời mời (Invitation text)</label>
                    <textarea 
                      rows={3}
                      value={cardMockData.invitation_text || ''}
                      onChange={(e) => setCardMockData(prev => ({ ...prev, invitation_text: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200"
                    />
                  </div>

                  {/* Dress Code */}
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase tracking-wide block mb-1">Dress Code</label>
                    <input 
                      type="text"
                      value={cardMockData.dress_code || ''}
                      onChange={(e) => setCardMockData(prev => ({ ...prev, dress_code: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200"
                    />
                  </div>
                </div>

                {/* Raw JSON Mock Data Editor */}
                <div className="border border-slate-800 rounded-xl p-4 space-y-2 bg-slate-900/25">
                  <h4 className="text-xs font-bold text-slate-350 uppercase tracking-wide">Chỉnh sửa JSON thô (Card JSON)</h4>
                  <p className="text-[10px] text-slate-500">Xem và sửa trực tiếp toàn bộ dữ liệu Mock Card dạng JSON</p>
                  <textarea
                    rows={8}
                    value={JSON.stringify(cardMockData, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setCardMockData(parsed);
                      } catch (err) {
                        // ignore syntax errors during typing
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[10px] font-mono text-slate-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SNAPSHOTS & EXPORT/IMPORT JSON */}
            {activeTab === 'snapshots' && (
              <div className="space-y-4">
                {/* 4.1 Export configurations */}
                <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-900/25">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Export cấu hình JSON</h4>
                    <button
                      onClick={handleCopyJson}
                      className="flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-medium transition-colors"
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      {isCopied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    Xuất các tùy chỉnh (bao gồm element styles và config) ra JSON. Dùng để nạp lại vào lab hoặc lưu trữ mẫu thiết kế.
                  </p>
                  <textarea
                    readOnly
                    rows={8}
                    value={exportedConfigJson}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[10px] font-mono text-slate-300 focus:outline-none"
                    onClick={(e) => (e.target as HTMLTextAreaElement).select()}
                  />
                </div>

                {/* 4.2 Import configurations */}
                <div className="border border-slate-800 rounded-xl p-4 space-y-3 bg-slate-900/25">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Import cấu hình JSON</h4>
                  <p className="text-[10px] text-slate-500">
                    Dán chuỗi JSON đã export trước đây vào đây để khôi phục nhanh thiết kế của bạn.
                  </p>
                  <textarea
                    rows={5}
                    placeholder='Dán đoạn JSON config đã xuất vào đây...'
                    value={importJsonText}
                    onChange={(e) => setImportJsonText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-[10px] font-mono text-slate-300 placeholder-slate-650 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleImportJson}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 text-white text-xs font-bold rounded-lg transition-all"
                  >
                    Apply Config JSON
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Style compiling info footer */}
          <div className="bg-slate-950 p-4 border-t border-slate-800 shrink-0 text-[10px] font-mono text-slate-500 max-h-36 overflow-y-auto">
            <div className="text-slate-400 font-semibold mb-1 flex items-center justify-between">
              <span>CSS Override Compiler:</span>
              <span className="text-[9px] bg-slate-900 px-1 py-0.2 rounded text-slate-500 border border-slate-800">
                {Object.keys(customStyles).length} selectors
              </span>
            </div>
            {compiledCss ? (
              <pre className="whitespace-pre-wrap select-all">{compiledCss}</pre>
            ) : (
              <div className="italic text-slate-600 text-center py-2">Không có style CSS custom nào được định nghĩa</div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
