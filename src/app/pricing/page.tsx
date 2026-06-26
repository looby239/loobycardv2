'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Check, ArrowLeft, Heart, Sparkles, Trophy, Award } from 'lucide-react';

function PricingContent() {
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template_id');
  const isPremiumTemplate = templateId === 'template-14';

  if (!templateId) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center space-y-6">
          <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mx-auto">
            <Heart size={32} className="fill-rose-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Thiếu Mẫu Thiết Kế</h2>
          <p className="text-slate-500 text-sm">
            Vui lòng chọn một mẫu thiệp cưới trước khi tiến hành chọn gói cước phù hợp.
          </p>
          <Link href="/templates" className="block w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition">
            Chọn mẫu thiệp ngay
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-rose-50/30 py-16 px-4">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col items-center text-center space-y-4">
          <Link href={`/templates`} className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 transition font-medium text-sm self-start mb-4">
            <ArrowLeft size={16} />
            <span>Quay lại chọn mẫu</span>
          </Link>
          <span className="text-rose-600 font-bold uppercase tracking-wider text-xs bg-rose-100 px-3 py-1 rounded-full">
            Bước 2: Chọn gói cước
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-950">Chọn Gói Dịch Vụ Của Bạn</h1>
          <p className="text-slate-500 text-sm sm:text-base max-w-xl">
            Các gói cước được thiết kế linh hoạt đáp ứng mọi nhu cầu từ cơ bản đến cao cấp nhất. Mẫu thiết kế đã chọn: <strong className="text-rose-600">{templateId}</strong>
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-4">
          
          {/* Basic Plan */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col justify-between shadow-sm relative transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-slate-800 font-bold text-lg">CƠ BẢN (BASIC)</span>
                <Award size={24} className="text-slate-400" />
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-950">99.000</span>
                <span className="text-slate-500 text-sm font-semibold">VNĐ</span>
              </div>
              <p className="text-slate-400 text-xs mt-2">Dành cho nhu cầu tạo thiệp điện tử đơn giản nhanh chóng</p>
              
              <hr className="my-6 border-slate-100" />
              
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>1 ảnh bìa</strong> chất lượng cao</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>Tải lên tối đa <strong>10 ảnh album</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>Xác nhận RSVP tối đa <strong>100 khách</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>Đồng hồ đếm ngược ngày cưới</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>Link chỉ đường Google Maps</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              {isPremiumTemplate ? (
                <div className="text-center p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <p className="text-xs text-slate-400 font-medium">Mẫu thiệp này không áp dụng cho Gói Cơ Bản</p>
                </div>
              ) : (
                <Link
                  href={`/create?template_id=${templateId}&plan=basic`}
                  className="block w-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-center font-bold py-3.5 px-4 rounded-xl transition-all hover:scale-[1.02]"
                >
                  Chọn Gói Basic
                </Link>
              )}
            </div>
          </div>

          {/* Premium Plan */}
          <div className="bg-white rounded-[2rem] border-2 border-rose-500 p-8 flex flex-col justify-between shadow-xl relative transition-all hover:scale-[1.02]">
            <div className="absolute top-0 right-0 bg-rose-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-2xl uppercase tracking-wider">
              Khuyên dùng
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-rose-600 font-extrabold text-lg flex items-center gap-1">
                  <Sparkles size={18} className="fill-rose-500 text-rose-500" />
                  PREMIUM
                </span>
                <Trophy size={24} className="text-rose-500" />
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-950">399.000</span>
                <span className="text-slate-500 text-sm font-semibold">VNĐ</span>
              </div>
              <p className="text-slate-400 text-xs mt-2">Dấu ấn cá nhân trọn vẹn, không giới hạn phản hồi</p>
              
              <hr className="my-6 border-slate-100" />
              
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>1 ảnh bìa</strong> + tối đa <strong>20 ảnh album</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>Nhận phản hồi <strong>RSVP không giới hạn</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Tải lên nhạc nền</strong> yêu thích</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>Sổ lưu bút lời chúc</strong> từ khách mời</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>Cập nhật <strong>thông tin cha mẹ hai bên</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>Đồng hồ đếm ngược & Google Maps chỉ đường</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href={`/create?template_id=${templateId}&plan=premium`}
                className="block w-full bg-rose-600 hover:bg-rose-700 text-white text-center font-bold py-3.5 px-4 rounded-xl shadow-lg transition-all hover:scale-[1.02]"
              >
                Chọn Gói Premium
              </Link>
            </div>
          </div>

          {/* Luxury Plan */}
          <div className="bg-white rounded-[2rem] border border-slate-200 p-8 flex flex-col justify-between shadow-sm relative transition hover:shadow-md">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-amber-600 font-bold text-lg">SANG TRỌNG (LUXURY)</span>
                <Sparkles size={24} className="text-amber-500 fill-amber-500" />
              </div>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-slate-950">1.199.000</span>
                <span className="text-slate-500 text-sm font-semibold">VNĐ</span>
              </div>
              <p className="text-slate-400 text-xs mt-2">Nâng tầm đẳng cấp tuyệt đối với tên miền riêng độc lập</p>
              
              <hr className="my-6 border-slate-100" />
              
              <ul className="space-y-4 text-sm text-slate-600">
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>Cấu hình <strong>Tên miền riêng (.com / .vn)</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span><strong>1 ảnh bìa</strong> + tối đa <strong>50 ảnh album</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>Nhận phản hồi <strong>RSVP không giới hạn</strong></span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>Tải lên nhạc nền & Sổ lưu bút lời chúc</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>Thông tin cha mẹ & hai bên gia đình</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <span>Đồng hồ đếm ngược & Bản đồ chỉ đường</span>
                </li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href={`/create?template_id=${templateId}&plan=luxury`}
                className="block w-full bg-slate-900 hover:bg-slate-800 text-white text-center font-bold py-3.5 px-4 rounded-xl transition-all hover:scale-[1.02]"
              >
                Chọn Gói Luxury
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-rose-600 border-t-transparent"></div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
}
