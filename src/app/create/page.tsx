'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Upload,
  Music,
  Trash2,
  ChevronUp,
  ChevronDown,
  Coins,
  QrCode,
  Sparkles,
  Link as LinkIcon,
  Save,
  Check
} from 'lucide-react';
import Link from 'next/link';

import imageCompression from 'browser-image-compression';

interface DraftData {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;

  bride_name: string;
  groom_name: string;
  bride_father_name: string;
  bride_mother_name: string;
  groom_father_name: string;
  groom_mother_name: string;
  bride_address: string;
  groom_address: string;

  event_date: string;
  reception_time: string;
  ceremony_time: string;
  venue_name: string;
  venue_address: string;
  map_url: string;
  invitation_text: string;
  quote_text: string;
  thank_you_text: string;

  cover_image_url: string;
  album_images: string[];
  music_url: string;
  slug: string;
  manage_token: string;

  // New fields
  groom_role: string;
  bride_role: string;
  groom_bank_name: string;
  groom_bank_account: string;
  groom_bank_holder: string;
  bride_bank_name: string;
  bride_bank_account: string;
  bride_bank_holder: string;
  dress_code: string;
  has_schedule: boolean;
  wedding_schedule: { time: string; title: string; description?: string }[];
}

const DEFAULT_DRAFT = (): DraftData => ({
  id: typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15),
  customer_name: '',
  customer_email: '',
  customer_phone: '',
  bride_name: '',
  groom_name: '',
  bride_father_name: '',
  bride_mother_name: '',
  groom_father_name: '',
  groom_mother_name: '',
  bride_address: '',
  groom_address: '',
  event_date: '',
  reception_time: '17:30',
  ceremony_time: '18:30',
  venue_name: '',
  venue_address: '',
  map_url: '',
  invitation_text: 'Trân trọng kính mời quý khách đến dự buổi tiệc chung vui cùng gia đình chúng tôi',
  quote_text: '',
  thank_you_text: 'Sự hiện diện của quý khách là niềm vinh hạnh cho gia đình chúng tôi',
  cover_image_url: '',
  album_images: [],
  music_url: '',
  slug: '',
  manage_token: Math.random().toString(36).substring(2, 13).toUpperCase(),
  groom_role: '',
  bride_role: '',
  groom_bank_name: '',
  groom_bank_account: '',
  groom_bank_holder: '',
  bride_bank_name: '',
  bride_bank_account: '',
  bride_bank_holder: '',
  dress_code: '',
  has_schedule: false,
  wedding_schedule: [],
});

const PLAN_PRICES: Record<string, number> = {
  basic: 99000,
  premium: 399000,
  luxury: 1199000,
};

const PLAN_NAMES: Record<string, string> = {
  basic: 'Gói Cơ Bản',
  premium: 'Gói Premium',
  luxury: 'Gói Luxury',
};

const capitalizeWords = (str: string) => {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
};

const AVAILABLE_SONGS = [
  { name: 'Phím Dương Cầm Đón Dâu (Wedding Piano)', url: '/assets/audio/wedding-piano.mp3' },
  { name: 'Beautiful In White (Piano Instrumental)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: 'A Thousand Years (Violin & Cello)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { name: 'Marry You (Acoustic Guitar)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { name: 'Perfect (Romantic Piano Solo)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { name: 'Until I Found You (Dreamy Instrumental)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' }
];

function CreateWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateId = searchParams.get('template_id');
  const plan = searchParams.get('plan')?.toLowerCase();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<DraftData>(DEFAULT_DRAFT());

  // Checking states
  const [slugChecking, setSlugChecking] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugError, setSlugError] = useState<string | null>(null);

  // Uploading states
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAlbum, setUploadingAlbum] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);

  // General validation errors for current step
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Local schedule item inputs
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleTitle, setScheduleTitle] = useState('');
  const [scheduleDesc, setScheduleDesc] = useState('');

  const addScheduleItem = () => {
    if (!scheduleTime.trim() || !scheduleTitle.trim()) {
      alert('Vui lòng nhập Giờ và Tiêu đề sự kiện');
      return;
    }
    const newItem = {
      time: scheduleTime.trim(),
      title: scheduleTitle.trim(),
      description: scheduleDesc.trim() || undefined
    };
    const newList = [...(formData.wedding_schedule || []), newItem];
    saveDraft({ ...formData, wedding_schedule: newList });
    setScheduleTime('');
    setScheduleTitle('');
    setScheduleDesc('');
  };

  const removeScheduleItem = (index: number) => {
    const newList = [...(formData.wedding_schedule || [])];
    newList.splice(index, 1);
    saveDraft({ ...formData, wedding_schedule: newList });
  };

  const moveScheduleItem = (index: number, direction: 'up' | 'down') => {
    const list = [...(formData.wedding_schedule || [])];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    saveDraft({ ...formData, wedding_schedule: list });
  };

  // Submission
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  // Check inputs
  if (!templateId || !plan || !['basic', 'premium', 'luxury'].includes(plan)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center space-y-6">
          <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mx-auto">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-serif">Lỗi Truy Cập</h2>
          <p className="text-slate-500 text-sm">
            Thông tin về mẫu thiệp (template_id) hoặc gói cước (plan) bị thiếu hoặc không hợp lệ. Vui lòng chọn lại mẫu thiết kế.
          </p>
          <Link href="/templates" className="block w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition">
            Quay lại Danh sách mẫu
          </Link>
        </div>
      </div>
    );
  }

  // Check premium template constraints
  const isPremiumTemplate = templateId === 'template-14';
  if (isPremiumTemplate && plan === 'basic') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center space-y-6">
          <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-500 mx-auto">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-serif">Mẫu Thiệp Hạn Chế</h2>
          <p className="text-slate-500 text-sm">
            Mẫu thiệp Premium không thể sử dụng với Gói Cơ Bản. Vui lòng chọn Gói Premium hoặc Luxury.
          </p>
          <Link href={`/pricing?template_id=${templateId}`} className="block w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition">
            Chọn gói cước khác
          </Link>
        </div>
      </div>
    );
  }
  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`looby_draft_${templateId}_${plan}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure id exists
        if (!parsed.id) parsed.id = crypto.randomUUID();
        setFormData(parsed);
      } catch (err) {
        console.error('Failed to parse saved draft:', err);
      }
    }
  }, [templateId, plan]);

  // Save draft to localStorage on form changes
  const saveDraft = (data: DraftData) => {
    setFormData(data);
    localStorage.setItem(`looby_draft_${templateId}_${plan}`, JSON.stringify(data));
  };

  // Check slug uniqueness with API
  const handleCheckSlug = async (slugVal: string) => {
    const cleanSlug = slugVal.toLowerCase().trim().replace(/[^a-z0-9-]/g, '');
    saveDraft({ ...formData, slug: cleanSlug });

    if (cleanSlug.length < 3) {
      setSlugAvailable(null);
      setSlugError('Đường dẫn phải có ít nhất 3 ký tự');
      return;
    }

    const regex = /^[a-z0-9-]+$/;
    if (!regex.test(cleanSlug)) {
      setSlugAvailable(null);
      setSlugError('Đường dẫn chỉ được chứa chữ thường (a-z), số (0-9) và dấu gạch nối (-)');
      return;
    }

    setSlugChecking(true);
    setSlugError(null);
    setSlugAvailable(null);

    try {
      const res = await fetch(`/api/check-slug?slug=${cleanSlug}&card_id=${formData.id}`);
      const data = await res.json();
      if (data.available) {
        setSlugAvailable(true);
      } else {
        setSlugAvailable(false);
        setSlugError(data.error || 'Đường dẫn này đã được sử dụng. Vui lòng chọn đường dẫn khác.');
      }
    } catch (err) {
      console.error('Error checking slug:', err);
      setSlugError('Lỗi kiểm tra đường dẫn. Vui lòng thử lại.');
    } finally {
      setSlugChecking(false);
    }
  };

  // Upload handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'album' | 'music') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let processedFiles: File[] = Array.from(files);

    if (type === 'cover' || type === 'album') {
      const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
      };

      try {
        const compressedPromises = processedFiles.map(async (file) => {
          if (file.size > 2 * 1024 * 1024) {
            return await imageCompression(file, options);
          }
          return file;
        });
        processedFiles = await Promise.all(compressedPromises);
      } catch (error) {
        console.error('Error compressing image:', error);
        alert('Có lỗi xảy ra khi nén ảnh, vui lòng thử lại.');
        e.target.value = '';
        return;
      }
    }

    if (type === 'cover') {
      setUploadingCover(true);
      const file = processedFiles[0];
      const data = new FormData();
      data.append('file', file);
      data.append('bucket', 'card-images');
      data.append('folder', formData.id);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: data });
        const resJson = await res.json();
        if (resJson.url) {
          saveDraft({ ...formData, cover_image_url: resJson.url });
        }
      } catch (err) {
        console.error('Upload cover error:', err);
      } finally {
        setUploadingCover(false);
      }
    } else if (type === 'album') {
      const albumLimit = plan === 'basic' ? 10 : plan === 'premium' ? 20 : 50;
      const spaceLeft = albumLimit - formData.album_images.length;
      if (spaceLeft <= 0) {
        alert(`Bạn đã đạt giới hạn tối đa ${albumLimit} ảnh album cho gói ${PLAN_NAMES[plan]}`);
        return;
      }

      setUploadingAlbum(true);
      const uploadPromises = processedFiles.slice(0, spaceLeft).map(async (file) => {
        const data = new FormData();
        data.append('file', file);
        data.append('bucket', 'card-images');
        data.append('folder', formData.id);

        try {
          const res = await fetch('/api/upload', { method: 'POST', body: data });
          const resJson = await res.json();
          return resJson.url || null;
        } catch (err) {
          console.error(err);
          return null;
        }
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      const validUrls = uploadedUrls.filter((url): url is string => url !== null);
      saveDraft({ ...formData, album_images: [...formData.album_images, ...validUrls] });
      setUploadingAlbum(false);
    } else if (type === 'music') {
      setUploadingMusic(true);
      const file = processedFiles[0];
      const data = new FormData();
      data.append('file', file);
      data.append('bucket', 'card-music');
      data.append('folder', formData.id);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: data });
        if (!res.ok) {
          throw new Error(res.status === 413 ? 'Kích thước file nhạc quá lớn (tối đa 4.5MB)' : 'Lỗi tải lên từ máy chủ');
        }
        const resJson = await res.json();
        if (resJson.url) {
          saveDraft({ ...formData, music_url: resJson.url });
        } else {
          throw new Error(resJson.error || 'Không nhận được URL nhạc');
        }
      } catch (err: any) {
        console.error('Upload music error:', err);
        alert(err.message || 'Lỗi tải lên mp3');
      } finally {
        setUploadingMusic(false);
      }
    }
  };

  // Sort album images
  const moveImage = (index: number, direction: 'up' | 'down') => {
    const list = [...formData.album_images];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    saveDraft({ ...formData, album_images: list });
  };

  const removeAlbumImage = (index: number) => {
    const list = [...formData.album_images];
    list.splice(index, 1);
    saveDraft({ ...formData, album_images: list });
  };

  // Validate step details
  const validateStep = (): boolean => {
    const stepErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.customer_name.trim()) stepErrors.customer_name = 'Họ tên là bắt buộc';
      if (!formData.customer_email.trim()) {
        stepErrors.customer_email = 'Email là bắt buộc';
      } else if (!/\S+@\S+\.\S+/.test(formData.customer_email)) {
        stepErrors.customer_email = 'Email không đúng định dạng';
      }
    } else if (step === 2) {
      if (!formData.bride_name.trim()) stepErrors.bride_name = 'Tên cô dâu là bắt buộc';
      if (!formData.groom_name.trim()) stepErrors.groom_name = 'Tên chú rể là bắt buộc';
      if (!formData.groom_role.trim()) stepErrors.groom_role = 'Vai vế chú rể là bắt buộc';
      if (!formData.bride_role.trim()) stepErrors.bride_role = 'Vai vế cô dâu là bắt buộc';
    } else if (step === 3) {
      if (!formData.event_date) {
        stepErrors.event_date = 'Ngày tổ chức là bắt buộc';
      } else {
        const year = new Date(formData.event_date).getFullYear();
        if (year < 2000 || year > 2099) {
          stepErrors.event_date = 'Năm tổ chức không hợp lệ (phải từ năm 2000 đến 2099)';
        }
      }
      if (!formData.venue_name.trim()) stepErrors.venue_name = 'Địa điểm là bắt buộc';
      if (!formData.venue_address.trim()) stepErrors.venue_address = 'Địa chỉ địa điểm là bắt buộc';
      if (!formData.slug.trim()) {
        stepErrors.slug = 'Đường dẫn thiệp là bắt buộc';
      } else if (slugAvailable === false) {
        stepErrors.slug = 'Đường dẫn đã trùng hoặc không hợp lệ';
      }
    } else if (step === 4) {
      if (!formData.cover_image_url) stepErrors.cover = 'Ảnh bìa là bắt buộc';
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  // Submit and show VietQR payment code
  const handleSubmitCard = async () => {
    setSaving(true);
    try {
      const saveResponse = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          template_id: templateId,
          plan_id: plan,
          amount: PLAN_PRICES[plan],
        }),
      });

      const result = await saveResponse.json();

      if (result.success) {
        setSaveSuccess(true);
        // Clear local storage draft after successful submission
        localStorage.removeItem(`looby_draft_${templateId}_${plan}`);
      } else {
        alert(result.error || 'Lỗi khi lưu thiệp. Vui lòng kiểm tra lại thông tin.');
      }
    } catch (err) {
      console.error(err);
      alert('Đã xảy ra lỗi hệ thống khi lưu thiệp.');
    } finally {
      setSaving(false);
    }
  };

  // VietQR Code Generator URL builder
  const getVietQRUrl = () => {
    const bankId = 'TPB'; // TPBank
    const accountNumber = '03878504601'; // Default account number
    const accountName = 'NGUYEN THANH LOC';
    const amount = PLAN_PRICES[plan];
    const memo = `LOOBYCARD-${formData.slug}`;

    return `https://img.vietqr.io/image/${bankId}-${accountNumber}-compact2.png?amount=${amount}&addInfo=${encodeURIComponent(memo)}&accountName=${encodeURIComponent(accountName)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Top Banner */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 py-4 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center">
          <Link href="/templates" className="flex items-center gap-1.5 text-slate-500 hover:text-rose-600 transition text-sm font-medium">
            <ArrowLeft size={16} />
            <span>Danh sách mẫu</span>
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="font-bold text-slate-900 font-serif text-lg">Tạo Thiệp Điện Tử</h1>
            <span className="text-slate-400 text-xs">{PLAN_NAMES[plan]} • {templateId}</span>
          </div>
          <div className="w-20"></div> {/* spacer */}
        </div>
      </header>

      {/* Main wizard area */}
      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8">

        {/* Progress indicator */}
        {!saveSuccess && (
          <div className="mb-8">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              <span>Bước {step} / 6</span>
              <span>{Math.round((step / 6) * 100)}% Hoàn tất</span>
            </div>
            <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-rose-600 rounded-full transition-all duration-300"
                style={{ width: `${(step / 6) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Card Body */}
        <div className="bg-white rounded-3xl shadow-md border border-slate-100 p-6 md:p-8 space-y-6">

          {saveSuccess ? (
            /* Thank you & Payment screen */
            <div className="text-center space-y-8 py-4">
              <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center text-rose-600 mx-auto">
                <CheckCircle size={36} />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-900 font-serif">Đăng Ký Thành Công!</h2>
                <p className="text-slate-500 text-sm max-w-md mx-auto">
                  Thông tin thiệp của bạn đã được ghi nhận trên hệ thống. Vui lòng chuyển khoản thanh toán để kích hoạt thiệp.
                </p>
              </div>

              {/* VietQR display */}
              <div className="bg-slate-50 rounded-2xl border border-slate-100 p-6 max-w-md mx-auto space-y-4">
                <h3 className="font-bold text-slate-900 text-base">Thông Tin Chuyển Khoản</h3>
                <div className="flex justify-center">
                  <img
                    src={getVietQRUrl()}
                    alt="VietQR Code"
                    className="border border-slate-200 rounded-xl w-60 h-60 object-contain shadow bg-white p-2"
                  />
                </div>
                <div className="text-left text-sm space-y-2 text-slate-700 bg-white p-4 rounded-xl border border-slate-100">
                  <p><strong>Ngân hàng:</strong> Ngân hàng Tiên Phong (TPBank)</p>
                  <p><strong>Số tài khoản:</strong> 03878504601</p>
                  <p><strong>Chủ tài khoản:</strong> NGUYEN THANH LOC</p>
                  <p><strong>Số tiền:</strong> <span className="text-rose-600 font-bold">{PLAN_PRICES[plan].toLocaleString()} VNĐ</span></p>
                  <p className="bg-amber-50 text-amber-800 p-2.5 rounded-lg text-xs border border-amber-100 font-mono">
                    <strong>Nội dung:</strong> LOOBYCARD-{formData.slug}
                  </p>
                </div>

                <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-rose-800 text-xs text-left space-y-1">
                  <p className="font-bold">Lưu ý thanh toán:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-700">
                    <li>Demo của bạn sẽ hết hạn sau 24 giờ nếu chưa thanh toán.</li>
                    <li>Vui lòng chuyển khoản đúng nội dung để LoobyCard xác nhận nhanh hơn.</li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center">
                <a
                  href={`/preview/${formData.slug}`}
                  target="_blank"
                  className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition"
                >
                  <LinkIcon size={16} />
                  <span>Xem thiệp nháp (Demo)</span>
                </a>
                <Link
                  href="/"
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-6 rounded-xl transition"
                >
                  Về Trang chủ
                </Link>
              </div>
              <p className="text-xs text-slate-400">
                * Sau khi nhận được thanh toán, Admin sẽ duyệt và gửi email đính kèm QR Code & Link quản lý RSVP cho bạn trong vòng 5-10 phút.
              </p>
            </div>
          ) : (
            /* Wizard Steps Content */
            <div>
              {/* Step 1: Customer Details */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 font-serif">Bước 1: Thông tin khách hàng</h2>
                  <p className="text-slate-400 text-xs">Chúng tôi sẽ sử dụng email này để gửi link quản lý thiệp, quản lý RSVP và ảnh QR code sau khi duyệt.</p>

                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Họ tên của bạn *</label>
                      <input
                        type="text"
                        className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 ${errors.customer_name ? 'border-red-500' : 'border-slate-200'
                          }`}
                        placeholder="Nhập họ và tên..."
                        value={formData.customer_name}
                        onChange={(e) => saveDraft({ ...formData, customer_name: e.target.value })}
                      />
                      {errors.customer_name && <span className="text-xs text-red-500 mt-1 block">{errors.customer_name}</span>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ Email nhận thiệp *</label>
                      <input
                        type="email"
                        className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 ${errors.customer_email ? 'border-red-500' : 'border-slate-200'
                          }`}
                        placeholder="ten-cua-ban@gmail.com"
                        value={formData.customer_email}
                        onChange={(e) => saveDraft({ ...formData, customer_email: e.target.value })}
                      />
                      {errors.customer_email && <span className="text-xs text-red-500 mt-1 block">{errors.customer_email}</span>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại liên hệ</label>
                      <input
                        type="tel"
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                        placeholder="09xx xxx xxx"
                        value={formData.customer_phone}
                        onChange={(e) => saveDraft({ ...formData, customer_phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Groom & Bride Names */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 font-serif">Bước 2: Cô dâu & Chú rể</h2>
                  <p className="text-slate-400 text-xs">Cập nhật thông tin tên cô dâu chú rể và thông tin gia đình.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Chú Rể *</label>
                      <input
                        type="text"
                        className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 ${errors.groom_name ? 'border-red-500' : 'border-slate-200'
                          }`}
                        placeholder="Tên Chú rể"
                        value={formData.groom_name}
                        onChange={(e) => saveDraft({ ...formData, groom_name: capitalizeWords(e.target.value) })}
                      />
                      {errors.groom_name && <span className="text-xs text-red-500 mt-1 block">{errors.groom_name}</span>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Tên Cô Dâu *</label>
                      <input
                        type="text"
                        className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 ${errors.bride_name ? 'border-red-500' : 'border-slate-200'
                          }`}
                        placeholder="Tên Cô dâu"
                        value={formData.bride_name}
                        onChange={(e) => saveDraft({ ...formData, bride_name: capitalizeWords(e.target.value) })}
                      />
                      {errors.bride_name && <span className="text-xs text-red-500 mt-1 block">{errors.bride_name}</span>}
                    </div>
                  </div>

                  {/* Groom & Bride Roles Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Vai vế Chú Rể *</label>
                      <input
                        type="text"
                        className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 text-sm ${errors.groom_role ? 'border-red-500' : 'border-slate-200'
                          }`}
                        placeholder="Ví dụ: Trưởng Nam, Thứ Nam, Chú rể"
                        value={formData.groom_role}
                        onChange={(e) => saveDraft({ ...formData, groom_role: capitalizeWords(e.target.value) })}
                      />
                      {errors.groom_role && <span className="text-xs text-red-500 mt-1 block">{errors.groom_role}</span>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Vai vế Cô Dâu *</label>
                      <input
                        type="text"
                        className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-rose-500 text-sm ${errors.bride_role ? 'border-red-500' : 'border-slate-200'
                          }`}
                        placeholder="Ví dụ: Út Nữ, Trưởng Nữ, Cô dâu"
                        value={formData.bride_role}
                        onChange={(e) => saveDraft({ ...formData, bride_role: capitalizeWords(e.target.value) })}
                      />
                      {errors.bride_role && <span className="text-xs text-red-500 mt-1 block">{errors.bride_role}</span>}
                    </div>
                  </div>

                  {/* Fields hidden for basic plan */}
                  {plan !== 'basic' ? (
                    <div className="space-y-4 border-t border-slate-100 pt-4 mt-2">
                      <h3 className="font-bold text-sm text-slate-800">Thông tin phụ huynh (Gói Premium & Luxury)</h3>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nhà Trai</h4>
                          <div>
                            <input
                              type="text"
                              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                              placeholder="Tên Cha Chú Rể"
                              value={formData.groom_father_name}
                              onChange={(e) => saveDraft({ ...formData, groom_father_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                              placeholder="Tên Mẹ Chú Rể"
                              value={formData.groom_mother_name}
                              onChange={(e) => saveDraft({ ...formData, groom_mother_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                              placeholder="Địa chỉ nhà chú rể"
                              value={formData.groom_address}
                              onChange={(e) => saveDraft({ ...formData, groom_address: e.target.value })}
                            />
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nhà Gái</h4>
                          <div>
                            <input
                              type="text"
                              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                              placeholder="Tên Cha Cô Dâu"
                              value={formData.bride_father_name}
                              onChange={(e) => saveDraft({ ...formData, bride_father_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                              placeholder="Tên Mẹ Cô Dâu"
                              value={formData.bride_mother_name}
                              onChange={(e) => saveDraft({ ...formData, bride_mother_name: e.target.value })}
                            />
                          </div>
                          <div>
                            <input
                              type="text"
                              className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs"
                              placeholder="Địa chỉ nhà cô dâu"
                              value={formData.bride_address}
                              onChange={(e) => saveDraft({ ...formData, bride_address: e.target.value })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-400 flex items-center gap-1.5 border border-slate-200/50 mt-4">
                      <Coins size={14} />
                      <span>Nâng cấp gói cước Premium hoặc Luxury để điền thêm thông tin cha mẹ và địa chỉ nhà.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Event details */}
              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-slate-900 font-serif">Bước 3: Sự kiện & Đường dẫn thiệp</h2>

                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày tổ chức *</label>
                        <input
                          type="date"
                          className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-800 focus:outline-none text-sm ${errors.event_date ? 'border-red-500' : 'border-slate-200'
                            }`}
                          value={formData.event_date}
                          onChange={(e) => saveDraft({ ...formData, event_date: e.target.value })}
                        />
                        {errors.event_date && <span className="text-xs text-red-500 mt-1 block">{errors.event_date}</span>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Giờ đón khách *</label>
                        <input
                          type="text"
                          className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none"
                          placeholder="Ví dụ: 17:30"
                          value={formData.reception_time}
                          onChange={(e) => saveDraft({ ...formData, reception_time: e.target.value })}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Giờ khai tiệc *</label>
                        <input
                          type="text"
                          className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none"
                          placeholder="Ví dụ: 18:30"
                          value={formData.ceremony_time}
                          onChange={(e) => saveDraft({ ...formData, ceremony_time: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Địa điểm tổ chức *</label>
                        <input
                          type="text"
                          className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-800 focus:outline-none ${errors.venue_name ? 'border-red-500' : 'border-slate-200'
                            }`}
                          placeholder="Ví dụ: Golden Palace"
                          value={formData.venue_name}
                          onChange={(e) => saveDraft({ ...formData, venue_name: e.target.value })}
                        />
                        {errors.venue_name && <span className="text-xs text-red-500 mt-1 block">{errors.venue_name}</span>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ chi tiết *</label>
                        <input
                          type="text"
                          className={`w-full p-3 rounded-xl border bg-slate-50 text-slate-800 focus:outline-none ${errors.venue_address ? 'border-red-500' : 'border-slate-200'
                            }`}
                          placeholder="Ví dụ: 333 Võ Thị Sáu, Liên Hương, Lâm Đồng"
                          value={formData.venue_address}
                          onChange={(e) => saveDraft({ ...formData, venue_address: e.target.value })}
                        />
                        {errors.venue_address && <span className="text-xs text-red-500 mt-1 block">{errors.venue_address}</span>}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Link bản đồ Google Maps</label>
                      <input
                        type="url"
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none text-sm"
                        placeholder="https://maps.google.com/..."
                        value={formData.map_url}
                        onChange={(e) => saveDraft({ ...formData, map_url: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Lời mời khách</label>
                      <textarea
                        rows={2}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none text-sm"
                        value={formData.invitation_text}
                        onChange={(e) => saveDraft({ ...formData, invitation_text: e.target.value })}
                      />
                    </div>

                    {/* Premium only fields */}
                    {plan !== 'basic' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Lời quote tình yêu</label>
                          <input
                            type="text"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none"
                            placeholder="Ví dụ: Yêu là cùng nhau nhìn về một hướng"
                            value={formData.quote_text}
                            onChange={(e) => saveDraft({ ...formData, quote_text: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1">Lời cảm ơn khách mời</label>
                          <input
                            type="text"
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none"
                            placeholder="Ví dụ: Rất vinh hạnh được đón tiếp..."
                            value={formData.thank_you_text}
                            onChange={(e) => saveDraft({ ...formData, thank_you_text: e.target.value })}
                          />
                        </div>
                      </div>
                    ) : null}

                    {/* Slug selection */}
                    <div className="border-t border-slate-100 pt-4">
                      <label className="block text-sm font-semibold text-slate-700 mb-1">Đường dẫn thiệp mong muốn (Slug) *</label>
                      <div className="flex rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
                        <span className="bg-slate-200 text-slate-600 px-3 py-3 text-xs sm:text-sm font-medium flex items-center select-none">
                          loobycard.com/
                        </span>
                        <input
                          type="text"
                          className="flex-1 p-3 bg-slate-50 text-slate-800 focus:outline-none font-mono text-xs sm:text-sm"
                          placeholder="duong-dan"
                          value={formData.slug}
                          onChange={(e) => handleCheckSlug(e.target.value)}
                        />
                      </div>

                      {slugChecking && <p className="text-xs text-slate-400 mt-1">Đang kiểm tra đường dẫn...</p>}
                      {slugAvailable === true && <p className="text-xs text-green-600 mt-1 font-semibold">✓ Đường dẫn này hợp lệ và khả dụng</p>}
                      {slugError && <p className="text-xs text-red-500 mt-1">{slugError}</p>}
                      {errors.slug && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.slug}</p>}
                    </div>

                    {/* Wedding Schedule Input Section */}
                    <div className="border-t border-slate-100 pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700">Lịch trình cưới</label>
                          <p className="text-slate-400 text-xs">Thêm các sự kiện chính trong ngày trọng đại của bạn.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={formData.has_schedule}
                            onChange={(e) => saveDraft({ ...formData, has_schedule: e.target.checked })}
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                      </div>

                      {formData.has_schedule && (
                        <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/50">
                          {/* Schedule Items List */}
                          {formData.wedding_schedule && formData.wedding_schedule.length > 0 ? (
                            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                              {formData.wedding_schedule.map((item, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 shadow-sm gap-4"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md font-mono shrink-0">
                                        {item.time}
                                      </span>
                                      <h5 className="text-sm font-bold text-slate-800 truncate">
                                        {item.title}
                                      </h5>
                                    </div>
                                    {item.description && (
                                      <p className="text-xs text-slate-500 mt-1 truncate">
                                        {item.description}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => moveScheduleItem(index, 'up')}
                                      disabled={index === 0}
                                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition"
                                    >
                                      <ChevronUp size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveScheduleItem(index, 'down')}
                                      disabled={index === formData.wedding_schedule.length - 1}
                                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition"
                                    >
                                      <ChevronDown size={16} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeScheduleItem(index)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic text-center py-4 bg-white rounded-xl border border-slate-200">
                              Chưa có mốc sự kiện nào. Hãy thêm mốc sự kiện đầu tiên!
                            </p>
                          )}

                          {/* Add New Item Form */}
                          <div className="bg-white p-3 rounded-xl border border-slate-100 space-y-3">
                            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Thêm mốc sự kiện</h5>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Giờ</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-800 font-mono"
                                  placeholder="Ví dụ: 17:30"
                                  value={scheduleTime}
                                  onChange={(e) => setScheduleTime(e.target.value)}
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Tiêu đề *</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-800"
                                  placeholder="Ví dụ: Đón khách"
                                  value={scheduleTitle}
                                  onChange={(e) => setScheduleTitle(e.target.value)}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-0.5">Mô tả ngắn</label>
                              <input
                                type="text"
                                className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-800"
                                placeholder="Ví dụ: Chụp ảnh lưu niệm tại Backdrop"
                                value={scheduleDesc}
                                onChange={(e) => setScheduleDesc(e.target.value)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={addScheduleItem}
                              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-3 rounded-lg text-xs transition"
                            >
                              Thêm vào lịch trình
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Custom domain notice for Luxury */}
                    {plan === 'luxury' && (
                      <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-xs space-y-1">
                        <p className="font-bold flex items-center gap-1"><Sparkles size={14} /> Tên miền riêng độc quyền</p>
                        <p>Tên miền riêng sẽ được LoobyCard cấu hình thủ công sau khi bạn hoàn tất thanh toán.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 4: Photo uploads */}
              {step === 4 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-900 font-serif">Bước 4: Tải lên hình ảnh</h2>
                    <p className="text-slate-400 text-xs">Cập nhật ảnh bìa (bắt buộc) và album ảnh cưới.</p>
                  </div>

                  {/* 1. Cover Photo */}
                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-slate-700">Ảnh bìa (Bắt buộc, 1 ảnh) *</label>
                    <div className="flex items-center gap-6">
                      <div className="h-28 w-28 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 relative flex items-center justify-center text-slate-400 shrink-0">
                        {formData.cover_image_url ? (
                          <img
                            src={formData.cover_image_url}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Upload size={28} />
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs inline-flex items-center gap-1.5 transition">
                          <Upload size={14} />
                          <span>{uploadingCover ? 'Đang tải lên...' : 'Chọn ảnh bìa'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'cover')}
                            disabled={uploadingCover}
                          />
                        </label>
                        <p className="text-slate-400 text-[10px]">Tải lên file PNG, JPG, WEBP. Hệ thống sẽ tự nén nếu ảnh &gt; 2MB.</p>
                        {errors.cover && <span className="text-xs text-red-500 font-semibold block">{errors.cover}</span>}
                      </div>
                    </div>
                  </div>

                  {/* 2. Gallery Album */}
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <label className="block text-sm font-bold text-slate-700">Album ảnh cưới ({formData.album_images.length} ảnh)</label>
                        <p className="text-slate-400 text-[10px]">
                          Giới hạn: Gói {PLAN_NAMES[plan]} cho phép tải lên tối đa{' '}
                          <strong>{plan === 'basic' ? 10 : plan === 'premium' ? 20 : 50}</strong> ảnh.
                        </p>
                      </div>
                      <label className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-xl text-xs inline-flex items-center gap-1.5 transition">
                        <Upload size={14} />
                        <span>{uploadingAlbum ? 'Đang tải lên...' : 'Thêm nhiều ảnh'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'album')}
                          disabled={uploadingAlbum}
                        />
                      </label>
                    </div>

                    {formData.album_images.length > 0 ? (
                      /* Sortable List */
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {formData.album_images.map((imgUrl, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/50 gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-bold text-slate-400 w-4">{index + 1}</span>
                              <img
                                src={imgUrl}
                                alt={`Album item ${index + 1}`}
                                className="h-12 w-12 object-cover rounded-lg border border-slate-200"
                              />
                              <span className="text-xs text-slate-500 truncate max-w-[200px]">{imgUrl.split('/').pop()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => moveImage(index, 'up')}
                                disabled={index === 0}
                                className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition"
                              >
                                <ChevronUp size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => moveImage(index, 'down')}
                                disabled={index === formData.album_images.length - 1}
                                className="p-1.5 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition"
                              >
                                <ChevronDown size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeAlbumImage(index)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 rounded-2xl py-8 text-center text-slate-400 text-xs space-y-2">
                        <Upload className="mx-auto" size={24} />
                        <p>Kéo thả hoặc click "Thêm nhiều ảnh" để chọn album ảnh của bạn.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 5: Mừng cưới, Dresscode & Nhạc nền */}
              {step === 5 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-900 font-serif">Bước 5: Mừng cưới, Dresscode & Nhạc nền</h2>
                    <p className="text-slate-400 text-xs">Cập nhật tài khoản mừng cưới, trang phục gợi ý và nhạc nền cho thiệp cưới.</p>
                  </div>

                  {/* Gift registry Bank Accounts */}
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><QrCode size={16} className="text-rose-600" /> Tài khoản nhận phong bao mừng cưới</h3>
                    <p className="text-slate-400 text-[10px]">Thông tin tài khoản và mã QR sẽ tự động hiển thị trên thiệp.</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Groom Bank */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tài khoản Chú Rể</h4>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase">Ngân hàng</label>
                          <input
                            type="text"
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                            placeholder="Ví dụ: Techcombank, Vietcombank"
                            value={formData.groom_bank_name}
                            onChange={(e) => saveDraft({ ...formData, groom_bank_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase">Số tài khoản</label>
                          <input
                            type="text"
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                            placeholder="Nhập số tài khoản..."
                            value={formData.groom_bank_account}
                            onChange={(e) => saveDraft({ ...formData, groom_bank_account: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase">Tên chủ tài khoản</label>
                          <input
                            type="text"
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs uppercase focus:outline-none focus:ring-1 focus:ring-rose-500"
                            placeholder="Ví dụ: NGUYEN THANH LOC"
                            value={formData.groom_bank_holder}
                            onChange={(e) => saveDraft({ ...formData, groom_bank_holder: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Bride Bank */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/50 space-y-3">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tài khoản Cô Dâu</h4>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase">Ngân hàng</label>
                          <input
                            type="text"
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                            placeholder="Ví dụ: Vietcombank, BIDV"
                            value={formData.bride_bank_name}
                            onChange={(e) => saveDraft({ ...formData, bride_bank_name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase">Số tài khoản</label>
                          <input
                            type="text"
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-mono focus:outline-none focus:ring-1 focus:ring-rose-500"
                            placeholder="Nhập số tài khoản..."
                            value={formData.bride_bank_account}
                            onChange={(e) => saveDraft({ ...formData, bride_bank_account: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase">Tên chủ tài khoản</label>
                          <input
                            type="text"
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs uppercase focus:outline-none focus:ring-1 focus:ring-rose-500"
                            placeholder="Ví dụ: NGUYEN THI MINH THU"
                            value={formData.bride_bank_holder}
                            onChange={(e) => saveDraft({ ...formData, bride_bank_holder: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dress Code (Only editable for Premium & Luxury) */}
                  <div className="space-y-2 border-t border-slate-100 pt-4">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Sparkles size={16} className="text-rose-600" /> Dress Code gợi ý</h3>
                    {plan === 'basic' ? (
                      <div className="p-3 bg-slate-50 border border-slate-200/50 rounded-xl">
                        <p className="text-xs text-slate-400">Nâng cấp lên gói Premium hoặc Luxury để hiển thị gợi ý màu sắc trang phục dự tiệc cho khách mời.</p>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="text"
                          className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-1 focus:ring-rose-500"
                          placeholder="Ví dụ: Kem, Be, Trắng, Xanh Rêu..."
                          value={formData.dress_code}
                          onChange={(e) => saveDraft({ ...formData, dress_code: e.target.value })}
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Các màu gợi ý cách nhau bởi dấu phẩy.</p>
                      </div>
                    )}
                  </div>

                  {/* Background Music */}
                  <div className="space-y-4 border-t border-slate-100 pt-4">
                    <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5"><Music size={16} className="text-rose-600" /> Nhạc nền tự động phát</h3>

                    {plan === 'basic' ? (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <p className="text-xs text-slate-400">Gói Cơ Bản không hỗ trợ tự chọn nhạc nền. Nâng cấp lên gói Premium hoặc Luxury để sử dụng tính năng này.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700">Chọn nhạc nền có sẵn</label>
                          <select
                            className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                            value={formData.music_url}
                            onChange={(e) => saveDraft({ ...formData, music_url: e.target.value })}
                          >
                            <option value="">-- Chọn bài nhạc có sẵn --</option>
                            {AVAILABLE_SONGS.map((song) => (
                              <option key={song.url} value={song.url}>
                                {song.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="relative flex py-2 items-center">
                          <div className="flex-grow border-t border-slate-200"></div>
                          <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-semibold uppercase">Hoặc</span>
                          <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-bold text-slate-700">Tải lên file nhạc MP3 mới</label>
                          <div className="flex items-center gap-4">
                            <label className="cursor-pointer bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded-xl text-xs inline-flex items-center gap-1.5 transition">
                              <Upload size={12} />
                              <span>{uploadingMusic ? 'Đang tải lên...' : 'Chọn file MP3'}</span>
                              <input
                                type="file"
                                accept=".mp3,audio/*"
                                className="hidden"
                                onChange={(e) => {
                                  try {
                                    handleFileUpload(e, 'music');
                                  } catch (error) {
                                    alert('Có lỗi xảy ra khi tải nhạc lên. Vui lòng thử lại.');
                                  }
                                }}
                                disabled={uploadingMusic}
                              />
                            </label>
                            {formData.music_url && (
                              <span className="text-xs text-green-600 font-semibold flex items-center gap-1">
                                <Check size={12} /> Đã tải nhạc nền lên
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="relative flex py-2 items-center">
                          <div className="flex-grow border-t border-slate-200"></div>
                          <span className="flex-shrink mx-4 text-slate-400 text-[10px] font-semibold uppercase">Hoặc</span>
                          <div className="flex-grow border-t border-slate-200"></div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Nhập đường dẫn liên kết nhạc nền (URL MP3)</label>
                          <input
                            type="url"
                            className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-rose-500"
                            placeholder="https://example.com/wedding-song.mp3"
                            value={formData.music_url}
                            onChange={(e) => saveDraft({ ...formData, music_url: e.target.value })}
                          />
                        </div>

                        {formData.music_url && (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                            <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                              <Music size={14} /> Nghe thử
                            </p>
                            <audio
                              src={formData.music_url}
                              controls
                              className="w-full h-8"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 6: Review & Finalize */}
              {step === 6 && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-xl font-bold text-slate-900 font-serif">Bước 6: Kiểm tra & Xác nhận</h2>
                    <p className="text-slate-400 text-xs">Vui lòng kiểm tra lại toàn bộ thông tin trước khi hoàn tất đăng ký.</p>
                  </div>

                  <div className="space-y-4 text-sm text-slate-700 bg-slate-50 p-4 sm:p-6 rounded-2xl border border-slate-100">
                    <h3 className="font-bold text-slate-950 border-b border-slate-200 pb-2 mb-3">Tóm tắt thông tin</h3>
                    <p><strong>Khách hàng:</strong> {formData.customer_name} ({formData.customer_email})</p>
                    <p><strong>Mẫu thiệp:</strong> {templateId} | <strong>Gói cước:</strong> {PLAN_NAMES[plan]}</p>
                    <p><strong>Cô dâu chú rể:</strong> {formData.groom_name} & {formData.bride_name}</p>
                    <p><strong>Ngày cưới:</strong> {formData.event_date} | Khai tiệc: {formData.ceremony_time}</p>
                    <p><strong>Địa điểm:</strong> {formData.venue_name} ({formData.venue_address})</p>
                    <p><strong>Đường dẫn:</strong> loobycard.com/<strong className="text-rose-600 font-mono">{formData.slug}</strong></p>
                    {formData.cover_image_url ? (
                      <p className="text-green-600 font-semibold flex items-center gap-1">✓ Đã tải ảnh bìa lên</p>
                    ) : (
                      <p className="text-red-500 font-semibold flex items-center gap-1">✗ Chưa tải ảnh bìa</p>
                    )}
                    <p><strong>Số lượng ảnh album:</strong> {formData.album_images.length} ảnh</p>
                    <p><strong>Lịch trình cưới:</strong> {formData.has_schedule ? `Có hiển thị (${formData.wedding_schedule?.length || 0} mốc sự kiện)` : 'Không hiển thị'}</p>
                  </div>

                  <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl space-y-2">
                    <h4 className="font-bold text-rose-800 flex items-center gap-1">
                      <Coins size={16} /> Tổng số tiền thanh toán:
                    </h4>
                    <p className="text-3xl font-extrabold text-rose-600">
                      {PLAN_PRICES[plan].toLocaleString()} VNĐ
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-between pt-6 border-t border-slate-100 mt-8">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center gap-1.5 text-slate-600 hover:text-slate-800 font-bold py-3 px-6 rounded-xl border border-slate-200 bg-white transition"
                  >
                    <ArrowLeft size={16} />
                    <span>Quay lại</span>
                  </button>
                ) : (
                  <div></div> // spacer
                )}

                {step < 6 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transition-all hover:scale-102"
                  >
                    <span>Tiếp tục</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitCard}
                    disabled={saving}
                    className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-rose-950/20 transition-all hover:scale-102 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    ) : (
                      <>
                        <QrCode size={16} />
                        <span>Xác nhận &amp; Xem demo</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 flex justify-between items-center text-xs text-slate-400">
          <p>&copy; 2026 LoobyCard.com</p>
          <div className="flex items-center gap-1 text-rose-500 font-semibold bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
            <Save size={12} />
            <span>Tự động lưu bản nháp</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-rose-600 border-t-transparent"></div>
      </div>
    }>
      <CreateWizard />
    </Suspense>
  );
}
