'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  Heart, Search, Users, FileSpreadsheet, RefreshCw,
  Mail, Phone, Calendar, ArrowLeft, BarChart2, Layers, LogOut
} from 'lucide-react';

interface CustomerRecord {
  name: string;
  email: string;
  phone: string;
  cards: { slug: string; plan_id: string; payment_status: string; amount: number }[];
  totalPaid: number;
  firstCreated: string;
}

export default function AdminCustomersPage() {
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (err) {
      console.error('Logout error:', err);
      alert('Không thể đăng xuất.');
    }
  };

  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('customer_name, customer_email, customer_phone, slug, plan_id, amount, payment_status, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Aggregate cards by customer email
      const customerMap: Record<string, CustomerRecord> = {};

      (data || []).forEach(card => {
        const email = (card.customer_email || '').trim().toLowerCase();
        if (!email) return;

        if (!customerMap[email]) {
          customerMap[email] = {
            name: card.customer_name,
            email: card.customer_email,
            phone: card.customer_phone || '—',
            cards: [],
            totalPaid: 0,
            firstCreated: card.created_at,
          };
        }

        customerMap[email].cards.push({
          slug: card.slug,
          plan_id: card.plan_id,
          payment_status: card.payment_status,
          amount: card.amount,
        });

        if (card.payment_status === 'paid') {
          customerMap[email].totalPaid += Number(card.amount);
        }

        if (new Date(card.created_at) < new Date(customerMap[email].firstCreated)) {
          customerMap[email].firstCreated = card.created_at;
        }
      });

      setCustomers(Object.values(customerMap));
    } catch (err) {
      console.error('Error fetching customers:', err);
      alert('Không thể kết nối tải danh sách khách hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  // CSV Export Utility
  const exportToCSV = () => {
    const BOM = '\uFEFF';
    const headers = ['Họ tên', 'Email', 'Số điện thoại', 'Tổng số thiệp', 'Tổng tiền đã thanh toán (VNĐ)', 'Các thiệp đã tạo', 'Ngày tham gia'];
    const rows = customers.map(c => [
      c.name,
      c.email,
      c.phone,
      c.cards.length,
      c.totalPaid,
      c.cards.map(x => `${x.slug} (${x.plan_id} - ${x.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'})`).join('; '),
      new Date(c.firstCreated).toLocaleDateString('vi-VN'),
    ]);

    const csvContent = BOM + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `loobycard_customers_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter records
  const filteredCustomers = customers.filter(c => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Navbar */}
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
              Danh sách thông tin khách hàng đăng ký trên hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={exportToCSV}
              disabled={filteredCustomers.length === 0}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-sm transition whitespace-nowrap cursor-pointer"
            >
              <FileSpreadsheet size={16} />
              <span>Xuất Excel</span>
            </button>
            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-800"
                placeholder="Tìm tên, email, sđt..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-rose-600 font-bold py-2.5 px-4 rounded-xl text-xs transition whitespace-nowrap border border-slate-200/50 cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Unified Nav tabs */}
        <div className="flex gap-2 p-1.5 bg-white/85 rounded-2xl shadow-sm border border-slate-200/50 w-fit">
          <Link
            href="/admin"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            Quản lý thiệp
          </Link>
          <span className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100/50">
            Khách hàng
          </span>
          <Link
            href="/admin/analytics"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            Analytics
          </Link>
        </div>

        {/* Customer List Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Users size={18} className="text-slate-500" />
              <span>Thông tin khách hàng ({filteredCustomers.length})</span>
            </h2>
            <button
              onClick={fetchCustomers}
              className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-slate-800"
              title="Tải lại danh sách"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {loading ? (
            <div className="p-20 text-center text-slate-400 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-rose-600 border-t-transparent mx-auto"></div>
              <p className="text-xs">Đang tải thông tin khách hàng...</p>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Số điện thoại</th>
                    <th className="p-4 text-center">Số thiệp tạo</th>
                    <th className="p-4 text-right">Đã thanh toán</th>
                    <th className="p-4">Ngày tham gia</th>
                    <th className="p-4">Danh sách thiệp cưới</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCustomers.map((cust, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="p-4">
                        <div className="font-semibold text-slate-900">{cust.name}</div>
                        <div className="text-xs text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                          <Mail size={12} className="text-slate-300" />
                          <span>{cust.email}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-600">
                        {cust.phone && cust.phone !== '—' ? (
                          <span className="flex items-center gap-1">
                            <Phone size={12} className="text-slate-300" />
                            <span>{cust.phone}</span>
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-800">
                        {cust.cards.length}
                      </td>
                      <td className="p-4 text-right font-extrabold text-slate-900">
                        {cust.totalPaid > 0 ? (
                          <span className="text-emerald-600">{cust.totalPaid.toLocaleString()}đ</span>
                        ) : (
                          <span className="text-slate-400">0đ</span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-300" />
                          <span>{new Date(cust.firstCreated).toLocaleDateString('vi-VN')}</span>
                        </div>
                      </td>
                      <td className="p-4 max-w-sm">
                        <div className="flex flex-wrap gap-1.5">
                          {cust.cards.map((c, i) => (
                            <Link
                              key={i}
                              href={`/${c.slug}`}
                              target="_blank"
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition ${
                                c.payment_status === 'paid'
                                  ? 'bg-rose-50 text-rose-600 border-rose-100 hover:bg-rose-100/50'
                                  : 'bg-amber-50 text-amber-600 border-amber-100 hover:bg-amber-100/50'
                              }`}
                              title={`${c.plan_id.toUpperCase()} - ${c.payment_status === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}`}
                            >
                              {c.slug}
                            </Link>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-20 text-center text-slate-400 italic">
              Không tìm thấy khách hàng nào phù hợp với tìm kiếm.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
