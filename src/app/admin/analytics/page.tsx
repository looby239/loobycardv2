'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Heart, BarChart2, TrendingUp, Monitor, Smartphone, Tablet,
  Globe, ArrowLeft, RefreshCw, Eye, Calendar, Users, LogOut,
} from 'lucide-react';

interface AnalyticsData {
  total_views: number;
  today_views: number;
  last_7_days_views: number;
  last_30_days_views: number;
  top_cards: { slug: string; name: string; views: number }[];
  views_by_day: { date: string; views: number }[];
  views_by_device: { device_type: string; count: number }[];
  views_by_referrer: { referrer: string; count: number }[];
}

const DEVICE_COLORS: Record<string, string> = {
  mobile: '#f43f5e',
  tablet: '#8b5cf6',
  desktop: '#3b82f6',
  unknown: '#94a3b8',
};

const DEVICE_ICONS: Record<string, React.ReactNode> = {
  mobile: <Smartphone size={14} />,
  tablet: <Tablet size={14} />,
  desktop: <Monitor size={14} />,
};

const REFERRER_COLORS: Record<string, string> = {
  facebook: '#1877f2',
  zalo: '#0068ff',
  google: '#ea4335',
  instagram: '#e1306c',
  tiktok: '#010101',
  twitter: '#1da1f2',
  youtube: '#ff0000',
  direct: '#10b981',
  other: '#94a3b8',
};

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/50 p-6 shadow-sm flex items-center gap-5">
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-2xl font-extrabold text-slate-900 mt-0.5">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}

// Format short date label for charts
function fmtDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function AnalyticsPage() {
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (err) {
      console.error('Logout error:', err);
      alert('Không thể đăng xuất.');
    }
  };

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Lỗi tải dữ liệu analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <Link href="/admin" className="text-slate-400 hover:text-slate-700 transition">
                <ArrowLeft size={20} />
              </Link>
              <Link href="/" className="flex items-center gap-2 text-rose-600 font-bold text-xl sm:text-2xl">
                <Heart className="fill-rose-600 animate-pulse" size={24} />
                <span>LoobyCard Admin</span>
              </Link>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm pl-8">
              Dashboard thống kê lượt truy cập thiệp cưới
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm transition disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Tải lại
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-600 font-bold py-2 px-4 rounded-xl text-sm transition whitespace-nowrap border border-slate-200/50 cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Nav tabs */}
        <div className="flex gap-2 p-1.5 bg-white/85 rounded-2xl shadow-sm border border-slate-200/50 w-fit">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            Quản lý thiệp
          </Link>
          <Link
            href="/admin/customers"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            Khách hàng
          </Link>
          <span className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100/50">
            Analytics
          </span>
        </div>

        {/* Loading / Error states */}
        {loading && (
          <div className="bg-white rounded-3xl p-20 text-center shadow-sm border border-slate-200/50">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-rose-500 border-t-transparent mx-auto mb-4" />
            <p className="text-slate-400 text-sm">Đang tải dữ liệu thống kê...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-600 text-sm font-semibold text-center">
            ⚠️ {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={<Eye size={22} className="text-rose-600" />}
                label="Tổng lượt xem"
                value={data.total_views}
                color="bg-rose-50"
              />
              <StatCard
                icon={<TrendingUp size={22} className="text-emerald-600" />}
                label="Hôm nay"
                value={data.today_views}
                color="bg-emerald-50"
              />
              <StatCard
                icon={<Calendar size={22} className="text-blue-600" />}
                label="7 ngày gần nhất"
                value={data.last_7_days_views}
                color="bg-blue-50"
              />
              <StatCard
                icon={<Users size={22} className="text-violet-600" />}
                label="30 ngày gần nhất"
                value={data.last_30_days_views}
                color="bg-violet-50"
              />
            </div>

            {/* ── Line Chart: Views by Day ── */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/50">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-6">
                <TrendingUp size={18} className="text-rose-500" />
                Lượt xem theo ngày (30 ngày gần nhất)
              </h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.views_by_day} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtDate}
                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                    interval={4}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    labelFormatter={(v) => `Ngày: ${v}`}
                    formatter={(v: any) => [`${v} lượt`, 'Lượt xem']}
                    contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="views"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ── Bar Chart + Pie Chart row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top 10 thiệp */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/50">
                <h2 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-6">
                  <BarChart2 size={18} className="text-blue-500" />
                  Top 10 thiệp nhiều lượt xem
                </h2>
                {data.top_cards.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={data.top_cards}
                      layout="vertical"
                      margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                      <YAxis
                        dataKey="slug"
                        type="category"
                        width={100}
                        tick={{ fontSize: 10, fill: '#64748b' }}
                      />
                      <Tooltip
                        formatter={(v: any) => [`${v} lượt`, 'Lượt xem']}
                        contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                      />
                      <Bar dataKey="views" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Device Pie Chart */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/50">
                <h2 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-6">
                  <Monitor size={18} className="text-violet-500" />
                  Thiết bị truy cập
                </h2>
                {data.views_by_device.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu</p>
                ) : (
                  <div className="flex flex-col sm:flex-row items-center gap-6">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          data={data.views_by_device}
                          dataKey="count"
                          nameKey="device_type"
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={90}
                          paddingAngle={3}
                        >
                          {data.views_by_device.map((entry, idx) => (
                            <Cell
                              key={idx}
                              fill={DEVICE_COLORS[entry.device_type] || '#94a3b8'}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(v: any, name: any) => [`${v} lượt`, name]}
                          contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}
                        />
                        <Legend
                          formatter={(value) => (
                            <span style={{ fontSize: 12, color: '#475569' }}>
                              {value.charAt(0).toUpperCase() + value.slice(1)}
                            </span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Device breakdown summary */}
                <div className="flex gap-4 justify-center mt-2 flex-wrap">
                  {data.views_by_device.map((d) => {
                    const total = data.views_by_device.reduce((s, x) => s + x.count, 0);
                    const pct = total > 0 ? Math.round((d.count / total) * 100) : 0;
                    return (
                      <div key={d.device_type} className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span style={{ color: DEVICE_COLORS[d.device_type] || '#94a3b8' }}>
                          {DEVICE_ICONS[d.device_type] || <Globe size={14} />}
                        </span>
                        <span className="font-semibold capitalize">{d.device_type}</span>
                        <span className="text-slate-400">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Referrer Table ── */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/50">
              <h2 className="font-bold text-slate-800 text-base flex items-center gap-2 mb-6">
                <Globe size={18} className="text-emerald-500" />
                Nguồn truy cập (Referrer)
              </h2>
              {data.views_by_referrer.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">Chưa có dữ liệu</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                        <th className="pb-3 pr-4">Nguồn</th>
                        <th className="pb-3 pr-4">Lượt xem</th>
                        <th className="pb-3">Tỷ lệ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.views_by_referrer.map((row) => {
                        const total = data.views_by_referrer.reduce((s, x) => s + x.count, 0);
                        const pct = total > 0 ? Math.round((row.count / total) * 100) : 0;
                        const color = REFERRER_COLORS[row.referrer] || '#94a3b8';
                        return (
                          <tr key={row.referrer} className="hover:bg-slate-50/50 transition">
                            <td className="py-3 pr-4">
                              <span className="flex items-center gap-2 font-semibold text-slate-700">
                                <span
                                  className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0"
                                  style={{ backgroundColor: color }}
                                />
                                {row.referrer.charAt(0).toUpperCase() + row.referrer.slice(1)}
                              </span>
                            </td>
                            <td className="py-3 pr-4 font-bold text-slate-800">
                              {row.count.toLocaleString()}
                            </td>
                            <td className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-slate-100 rounded-full h-2 max-w-[120px]">
                                  <div
                                    className="h-2 rounded-full transition-all"
                                    style={{ width: `${pct}%`, backgroundColor: color }}
                                  />
                                </div>
                                <span className="text-xs text-slate-400 font-semibold w-8">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
