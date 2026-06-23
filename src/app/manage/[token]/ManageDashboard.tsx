'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Download, Users, CheckCircle2, XCircle, Search, MessageSquare, Heart, FileSpreadsheet, ArrowLeft } from 'lucide-react';

interface RsvpResponse {
  id: number;
  guest_name: string;
  phone: string | null;
  attend_status: string;
  guests_count: number;
  message: string | null;
  created_at: string;
}

interface GuestWish {
  id: number;
  guest_name: string;
  message: string;
  created_at: string;
}

interface CardInfo {
  id: string;
  slug: string;
  customer_name: string;
  bride_name: string;
  groom_name: string;
  plan_id: string;
  rsvp_limit: number;
}

interface DashboardProps {
  card: CardInfo;
  initialRsvps: RsvpResponse[];
  initialWishes: GuestWish[];
  manageToken: string;
}

export default function ManageDashboard({ card, initialRsvps, initialWishes, manageToken }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'rsvp' | 'wishes'>('rsvp');
  const [searchTerm, setSearchTerm] = useState('');
  
  const rsvps = initialRsvps;
  const wishes = initialWishes;

  // Compute metrics
  const totalRsvps = rsvps.length;
  const attendingRsvps = rsvps.filter(r => r.attend_status === 'yes');
  const declinedRsvps = rsvps.filter(r => r.attend_status === 'no');
  
  const totalAttendingGuests = attendingRsvps.reduce(
    (sum, r) => sum + 1 + (r.guests_count || 0), 
    0
  );

  // Filter lists based on search
  const filteredRsvps = rsvps.filter(r => 
    r.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.phone && r.phone.includes(searchTerm)) ||
    (r.message && r.message.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredWishes = wishes.filter(w =>
    w.guest_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // CSV Export utility
  const exportToCSV = () => {
    // UTF-8 BOM to display Vietnamese characters correctly in Excel
    const BOM = '\uFEFF';
    const headers = ['Họ tên', 'Số điện thoại', 'Trạng thái tham dự', 'Số người đi cùng', 'Lời nhắn', 'Ngày gửi'];
    const rows = rsvps.map(r => [
      r.guest_name,
      r.phone || '',
      r.attend_status === 'yes' ? 'Chắc chắn tham gia' : 'Rất tiếc không thể',
      r.guests_count,
      r.message ? r.message.replace(/[\n\r,]/g, ' ') : '',
      new Date(r.created_at).toLocaleString('vi-VN'),
    ]);

    const csvContent = BOM + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `rsvp_report_${card.slug}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-rose-600 font-semibold text-sm">
              <Heart size={16} className="fill-rose-500" />
              <span>Quản lý phản hồi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Đám cưới {card.groom_name} &amp; {card.bride_name}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm">
              Gói dịch vụ: <strong className="text-rose-600 font-semibold">{card.plan_id.toUpperCase()}</strong> • 
              Link thiệp:{' '}
              <a 
                href={`/${card.slug}`} 
                target="_blank" 
                className="underline text-blue-600 hover:text-blue-800"
              >
                loobycard.com/{card.slug}
              </a>
            </p>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={exportToCSV}
              disabled={rsvps.length === 0}
              className="flex-1 md:flex-initial bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-xl text-sm flex items-center justify-center gap-2 transition"
            >
              <FileSpreadsheet size={16} />
              <span>Xuất Excel (CSV)</span>
            </button>
            <Link
              href={`/${card.slug}`}
              className="flex-1 md:flex-initial bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-5 rounded-xl text-sm text-center transition"
            >
              Xem thiệp
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-rose-50 rounded-xl flex items-center justify-center text-rose-600 shrink-0">
              <Users size={24} />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Tổng lượt RSVP</span>
              <strong className="text-2xl font-bold text-slate-900">{totalRsvps}</strong>
              {card.plan_id === 'basic' && (
                <span className="text-[10px] text-slate-400 block">Giới hạn gói: {card.rsvp_limit}</span>
              )}
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center text-green-600 shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Tổng khách tham dự</span>
              <strong className="text-2xl font-bold text-green-600">{totalAttendingGuests}</strong>
              <span className="text-[10px] text-slate-400 block">{attendingRsvps.length} lời phản hồi đồng ý</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 shrink-0">
              <XCircle size={24} />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Từ chối tham dự</span>
              <strong className="text-2xl font-bold text-slate-500">{declinedRsvps.length}</strong>
              <span className="text-[10px] text-slate-400 block">Không thể tham gia lễ cưới</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 shrink-0">
              <MessageSquare size={24} />
            </div>
            <div>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider block">Lời chúc đã nhận</span>
              <strong className="text-2xl font-bold text-amber-600">{wishes.length}</strong>
              <span className="text-[10px] text-slate-400 block">Lời chúc từ Sổ lưu bút</span>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs & Search */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Tabs bar */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-b border-slate-100 p-4 gap-4">
            <div className="flex bg-slate-100 p-1 rounded-xl self-start">
              <button
                onClick={() => setActiveTab('rsvp')}
                className={`py-2 px-6 rounded-lg font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 ${
                  activeTab === 'rsvp' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Users size={16} />
                <span>Danh sách RSVP ({rsvps.length})</span>
              </button>
              
              {card.plan_id !== 'basic' && (
                <button
                  onClick={() => setActiveTab('wishes')}
                  className={`py-2 px-6 rounded-lg font-semibold text-xs sm:text-sm transition flex items-center gap-1.5 ${
                    activeTab === 'wishes' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <MessageSquare size={16} />
                  <span>Lời chúc cưới ({wishes.length})</span>
                </button>
              )}
            </div>

            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="w-full sm:w-64 pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="Tìm kiếm khách mời..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tab 1: RSVP list */}
          {activeTab === 'rsvp' && (
            <div className="overflow-x-auto">
              {filteredRsvps.length > 0 ? (
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      <th className="p-4">Khách mời</th>
                      <th className="p-4">Số điện thoại</th>
                      <th className="p-4">Trạng thái</th>
                      <th className="p-4">Số người đi cùng</th>
                      <th className="p-4">Lời nhắn</th>
                      <th className="p-4">Ngày gửi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredRsvps.map((rsvp) => (
                      <tr key={rsvp.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4 font-semibold text-slate-900">{rsvp.guest_name}</td>
                        <td className="p-4 font-mono text-xs">{rsvp.phone || '—'}</td>
                        <td className="p-4">
                          {rsvp.attend_status === 'yes' ? (
                            <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                              Có tham dự
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 rounded-full text-xs font-semibold">
                              Không tham dự
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center font-semibold">{rsvp.guests_count}</td>
                        <td className="p-4 max-w-xs truncate text-xs text-slate-500" title={rsvp.message || ''}>
                          {rsvp.message || '—'}
                        </td>
                        <td className="p-4 text-xs text-slate-400">
                          {new Date(rsvp.created_at).toLocaleString('vi-VN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-8 text-center text-slate-400 italic">
                  Chưa nhận được phản hồi RSVP nào khớp với từ khóa tìm kiếm.
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Guestbook wishes */}
          {activeTab === 'wishes' && (
            <div className="p-6">
              {filteredWishes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredWishes.map((w) => (
                    <div key={w.id} className="bg-slate-50 border border-slate-200/50 rounded-2xl p-5 space-y-3 relative hover:shadow-sm transition">
                      <div className="flex justify-between items-start">
                        <h4 className="font-bold text-slate-900 text-sm font-serif">{w.guest_name}</h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(w.created_at).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed italic bg-white p-3 rounded-xl border border-slate-100">
                        "{w.message}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-slate-400 italic py-8">
                  Chưa nhận được lời chúc nào khớp với từ khóa tìm kiếm.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
