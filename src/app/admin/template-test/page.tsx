'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Copy, ExternalLink, Loader2, Monitor, RefreshCw, Smartphone } from 'lucide-react';
import { TEST_PLAN_IDS, TEST_PLAN_LABELS, type TestPlanId } from '@/lib/templateTestMock';

interface TemplateOption {
  id: string;
  name: string;
  type: string;
  thumbnail_url?: string | null;
  is_active: boolean;
  base_template_id?: string | null;
  base_template_key?: string | null;
  is_custom_template?: boolean | null;
}

type ViewportMode = 'mobile' | 'desktop';

export default function AdminTemplateTestPage() {
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [viewport, setViewport] = useState<ViewportMode>('mobile');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedPlan, setCopiedPlan] = useState<TestPlanId | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadTemplates() {
      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/admin/template-test/templates', { cache: 'no-store' });
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Không thể tải danh sách template.');
        }

        if (!mounted) return;

        const nextTemplates = data.templates as TemplateOption[];
        setTemplates(nextTemplates);
        setSelectedTemplateId((current) => current || nextTemplates[0]?.id || '');
      } catch (err) {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách template.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadTemplates();

    return () => {
      mounted = false;
    };
  }, []);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [templates, selectedTemplateId],
  );

  const makePreviewUrl = (planId: TestPlanId) => {
    const params = new URLSearchParams({
      template_id: selectedTemplateId,
      plan: planId,
      viewport,
      r: String(refreshKey),
    });

    return `/admin/template-test/preview?${params.toString()}`;
  };

  const copyPreviewUrl = async (planId: TestPlanId) => {
    const url = `${window.location.origin}${makePreviewUrl(planId)}`;
    await navigator.clipboard.writeText(url);
    setCopiedPlan(planId);
    window.setTimeout(() => setCopiedPlan(null), 1600);
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-1">
              <Link href="/admin/templates" className="text-xs font-semibold text-rose-600 hover:text-rose-700">
                Quay lại quản lý template
              </Link>
              <h1 className="text-2xl font-bold tracking-tight text-slate-950">Test template nội bộ</h1>
              <p className="text-sm text-slate-500">
                Chọn một template để xem nhanh dữ liệu mock theo Basic, Premium và Luxury.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="min-w-[260px] text-sm font-semibold text-slate-700">
                Template
                <select
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
                  value={selectedTemplateId}
                  onChange={(event) => {
                    setSelectedTemplateId(event.target.value);
                    setRefreshKey((key) => key + 1);
                  }}
                  disabled={loading || templates.length === 0}
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name} ({template.id})
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => setViewport('mobile')}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                    viewport === 'mobile' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <Smartphone size={16} />
                  Xem mobile
                </button>
                <button
                  type="button"
                  onClick={() => setViewport('desktop')}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition ${
                    viewport === 'desktop' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  <Monitor size={16} />
                  Xem desktop
                </button>
              </div>

              <button
                type="button"
                onClick={() => setRefreshKey((key) => key + 1)}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <RefreshCw size={16} />
                Refresh preview
              </button>
            </div>
          </div>

          {selectedTemplate && (
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full bg-slate-100 px-3 py-1">Loại: {selectedTemplate.type}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1">
                Trạng thái: {selectedTemplate.is_active ? 'active' : 'inactive'}
              </span>
              {selectedTemplate.base_template_id && (
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  Base: {selectedTemplate.base_template_id}
                </span>
              )}
              {selectedTemplate.is_custom_template && (
                <span className="rounded-full bg-rose-50 px-3 py-1 text-rose-600">Custom template</span>
              )}
            </div>
          )}
        </section>

        {loading && (
          <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500">
            <Loader2 className="mr-2 animate-spin" size={18} />
            Đang tải template...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && selectedTemplateId && (
          <section className={viewport === 'desktop' ? 'grid grid-cols-1 gap-5' : 'grid grid-cols-1 gap-5 xl:grid-cols-3'}>
            {TEST_PLAN_IDS.map((planId) => {
              const previewUrl = makePreviewUrl(planId);

              return (
                <article key={planId} className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                    <div>
                      <h2 className="text-base font-bold text-slate-950">{TEST_PLAN_LABELS[planId]}</h2>
                      <p className="text-xs text-slate-500">
                        {planId === 'basic'
                          ? 'Có phong bao và lời cảm ơn, không nhạc, quote'
                          : planId === 'premium'
                            ? 'Có phong bao, nhạc, quote, RSVP, lời chúc'
                            : 'Có phong bao, tất cả tính năng và custom domain demo'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <ExternalLink size={14} />
                        Mở full screen
                      </a>
                      <button
                        type="button"
                        onClick={() => copyPreviewUrl(planId)}
                        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <Copy size={14} />
                        {copiedPlan === planId ? 'Đã copy' : 'Copy test URL'}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-200 p-3">
                    <div
                      className={`mx-auto overflow-hidden rounded-lg bg-white shadow-inner ${
                        viewport === 'mobile' ? 'max-w-[390px]' : 'w-full'
                      }`}
                    >
                      <iframe
                        key={previewUrl}
                        title={`Preview ${TEST_PLAN_LABELS[planId]}`}
                        src={previewUrl}
                        className="block w-full border-0"
                        style={{ height: viewport === 'mobile' ? 760 : 900 }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}
