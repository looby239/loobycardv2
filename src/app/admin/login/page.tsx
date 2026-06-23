'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Lock, User, AlertCircle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        // Successful login, redirect to admin page
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.error || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi kết nối mạng. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden py-12 px-4 sm:px-6 lg:px-8">
      {/* Decorative blurred backgrounds */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main glassmorphic card */}
      <div className="relative max-w-md w-full space-y-8 bg-slate-950/80 backdrop-blur-xl border border-slate-800 p-8 sm:p-10 rounded-3xl shadow-2xl">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-rose-950/40 border border-rose-500/30 rounded-2xl flex items-center justify-center shadow-inner">
              <Heart className="fill-rose-500 text-rose-500 animate-pulse" size={32} />
            </div>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            LoobyCard Admin
          </h2>
          <p className="text-sm text-slate-400">
            Hệ thống quản trị và kiểm soát dịch vụ
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="bg-red-950/40 border border-red-500/30 text-red-200 px-4 py-3 rounded-2xl text-xs flex items-center gap-3">
            <AlertCircle className="text-red-400 flex-shrink-0" size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Login form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                Tên đăng nhập
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <User size={18} />
                </span>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-800 hover:border-slate-700 focus:border-rose-500 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 text-white placeholder-slate-550 transition-all"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 pl-1">
                Mật khẩu
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  required
                  autoComplete="current-password"
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-800 hover:border-slate-700 focus:border-rose-500 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 text-white placeholder-slate-550 transition-all"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-2xl text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rose-500 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-rose-950/20 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 className="animate-spin text-white" size={20} />
              ) : (
                'Đăng nhập quản trị'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
