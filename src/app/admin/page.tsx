'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Heart, Search, CheckCircle, ShieldAlert, Sparkles, Check, Globe, RefreshCw, Layers, BarChart2, Edit2, Trash2, X, LogOut, Upload, ChevronUp, ChevronDown } from 'lucide-react';
import imageCompression from 'browser-image-compression';

interface CardRecord {
  id: string;
  template_id: string;
  plan_id: string;
  amount: number;
  slug: string;
  custom_domain: string | null;
  domain_status: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string | null;
  bride_name: string;
  groom_name: string;
  status: string;
  payment_status: string;
  created_at: string;
  expires_at?: string | null;
  deleted_at?: string | null;
  archived_at?: string | null;
  
  // Additional event/custom details
  event_date?: string | null;
  reception_time?: string | null;
  ceremony_time?: string | null;
  venue_name?: string | null;
  venue_address?: string | null;
  map_url?: string | null;
  invitation_text?: string | null;
  quote_text?: string | null;
  thank_you_text?: string | null;
  groom_role?: string | null;
  bride_role?: string | null;
  groom_bank_name?: string | null;
  groom_bank_account?: string | null;
  groom_bank_holder?: string | null;
  bride_bank_name?: string | null;
  bride_bank_account?: string | null;
  bride_bank_holder?: string | null;
  dress_code?: string | null;
  cover_image_url?: string | null;
  album_images?: string[];
  card_images?: { image_url: string; sort_order: number }[];
  has_schedule?: boolean;
}

const AVAILABLE_SONGS = [
  { name: 'Phím Dương Cầm Đón Dâu (Wedding Piano)', url: '/assets/audio/wedding-piano.mp3' },
  { name: 'Beautiful In White (Piano Instrumental)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: 'A Thousand Years (Violin & Cello)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { name: 'Marry You (Acoustic Guitar)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { name: 'Perfect (Romantic Piano Solo)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { name: 'Until I Found You (Dreamy Instrumental)', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' }
];



export default function AdminCardsPage() {
  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (err) {
      console.error('Logout error:', err);
      alert('Không thể đăng xuất.');
    }
  };

  const [cards, setCards] = useState<CardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'draft' | 'published' | 'expired' | 'archived' | 'deleted'>('all');
  
  // Custom Domain inputs state mapping cardId -> domain string
  const [domainInputs, setDomainInputs] = useState<Record<string, string>>({});
  
  // Loading state for triggers
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Edit modal states
  const [editingCard, setEditingCard] = useState<CardRecord | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTab, setEditTab] = useState<'customer' | 'couple' | 'event' | 'content' | 'images'>('customer');
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAlbum, setUploadingAlbum] = useState(false);
  const [uploadingMusic, setUploadingMusic] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  // Local schedule states for admin editing
  const [adminScheduleTime, setAdminScheduleTime] = useState('');
  const [adminScheduleTitle, setAdminScheduleTitle] = useState('');
  const [adminScheduleDesc, setAdminScheduleDesc] = useState('');

  const addAdminScheduleItem = () => {
    if (!adminScheduleTime.trim() || !adminScheduleTitle.trim()) {
      alert('Vui lòng nhập Giờ và Tiêu đề sự kiện');
      return;
    }
    const newItem = {
      time: adminScheduleTime.trim(),
      title: adminScheduleTitle.trim(),
      description: adminScheduleDesc.trim() || undefined
    };
    const currentList = editFormData.wedding_schedule || [];
    setEditFormData({
      ...editFormData,
      wedding_schedule: [...currentList, newItem]
    });
    setAdminScheduleTime('');
    setAdminScheduleTitle('');
    setAdminScheduleDesc('');
  };

  const removeAdminScheduleItem = (index: number) => {
    const currentList = [...(editFormData.wedding_schedule || [])];
    currentList.splice(index, 1);
    setEditFormData({
      ...editFormData,
      wedding_schedule: currentList
    });
  };

  const moveAdminScheduleItem = (index: number, direction: 'up' | 'down') => {
    const list = [...(editFormData.wedding_schedule || [])];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setEditFormData({
      ...editFormData,
      wedding_schedule: list
    });
  };

  // Custom Confirm Modal states
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void | Promise<void>) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: async () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        await onConfirm();
      }
    });
  };

  const openEditModal = (card: CardRecord) => {
    setEditingCard(card);
    setEditFormData({
      ...card,
      event_date: card.event_date ? new Date(card.event_date).toISOString().slice(0, 10) : '',
    });
    setEditTab('customer');
    setIsEditModalOpen(true);
  };


  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard) return;

    setSavingEdit(true);
    try {
      const res = await fetch('/api/admin/cards/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: editingCard.id,
          action: 'edit',
          editData: editFormData,
        }),
      });
      const data = await res.json();

      if (data.success) {
        alert('Cập nhật thiệp cưới thành công!');
        setIsEditModalOpen(false);
        setEditingCard(null);
        fetchCards();
      } else {
        alert(data.error || 'Cập nhật thất bại.');
      }
    } catch (err) {
      console.error(err);
      alert('Lỗi kết nối khi cập nhật thiệp cưới.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'cover' | 'album' | 'music') => {
    if (!editingCard) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let processedFiles: File[] = Array.from(files);

    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
    };

    try {
      const compressedPromises = processedFiles.map(async (file) => {
        if ((type === 'cover' || type === 'album') && file.size > 2 * 1024 * 1024) {
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

    if (type === 'cover') {
      setUploadingCover(true);
      const file = processedFiles[0];
      const data = new FormData();
      data.append('file', file);
      data.append('bucket', 'card-images');
      data.append('folder', editingCard.id);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: data });
        const resJson = await res.json();
        if (resJson.url) {
          setEditFormData({ ...editFormData, cover_image_url: resJson.url });
        }
      } catch (err) {
        console.error('Upload cover error:', err);
      } finally {
        setUploadingCover(false);
      }
    } else if (type === 'album') {
      setUploadingAlbum(true);
      const uploadPromises = processedFiles.map(async (file) => {
        const data = new FormData();
        data.append('file', file);
        data.append('bucket', 'card-images');
        data.append('folder', editingCard.id);

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
      setEditFormData({ 
        ...editFormData, 
        album_images: [...(editFormData.album_images || []), ...validUrls] 
      });
      setUploadingAlbum(false);
    } else if (type === 'music') {
      setUploadingMusic(true);
      const file = processedFiles[0];
      const data = new FormData();
      data.append('file', file);
      data.append('bucket', 'card-music');
      data.append('folder', editingCard.id);

      try {
        const res = await fetch('/api/upload', { method: 'POST', body: data });
        if (!res.ok) {
          throw new Error(res.status === 413 ? 'Kích thước file nhạc quá lớn (tối đa 4.5MB)' : 'Lỗi tải lên từ máy chủ');
        }
        const resJson = await res.json();
        if (resJson.url) {
          setEditFormData({ ...editFormData, music_url: resJson.url });
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

  const moveAlbumImage = (index: number, direction: 'up' | 'down') => {
    const list = [...(editFormData.album_images || [])];
    if (direction === 'up' && index > 0) {
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === 'down' && index < list.length - 1) {
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    }
    setEditFormData({ ...editFormData, album_images: list });
  };

  const removeAlbumImage = (index: number) => {
    const list = [...(editFormData.album_images || [])];
    list.splice(index, 1);
    setEditFormData({ ...editFormData, album_images: list });
  };


  const handleCardAction = async (cardId: string, action: 'renew' | 'archive' | 'permanent_delete' | 'soft_delete') => {
    let confirmMsg = '';
    let confirmTitle = 'Xác nhận thao tác';
    if (action === 'renew') {
      confirmTitle = 'Gia hạn thiệp cưới';
      confirmMsg = 'Gia hạn thêm 1 tháng hiển thị cho thiệp này?';
    }
    if (action === 'archive') {
      confirmTitle = 'Lưu trữ thiệp';
      confirmMsg = 'Lưu trữ thiệp này? Thiệp sẽ không hiển thị công khai.';
    }
    if (action === 'permanent_delete') {
      confirmTitle = 'CẢNH BÁO XÓA VĨNH VIỄN';
      confirmMsg = 'Hành động này sẽ xóa vĩnh viễn thiệp, tất cả phản hồi RSVP, hình ảnh album và các file liên quan trên storage. Bạn có chắc chắn muốn tiếp tục?';
    }
    if (action === 'soft_delete') {
      confirmTitle = 'Xóa tạm thời';
      confirmMsg = 'Xóa tạm thời thiệp này? Bạn có thể khôi phục lại từ tab Đã xóa.';
    }

    showConfirm(confirmTitle, confirmMsg, async () => {
      setActionLoading(prev => ({ ...prev, [cardId + '-' + action]: true }));
      try {
        const res = await fetch('/api/admin/cards/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardId, action }),
        });
        const data = await res.json();

        if (data.success) {
          alert(data.message || 'Thực hiện thao tác thành công!');
          fetchCards();
        } else {
          alert(data.error || 'Thực hiện thao tác thất bại.');
        }
      } catch (err) {
        console.error(err);
        alert('Lỗi kết nối khi thực hiện thao tác.');
      } finally {
        setActionLoading(prev => ({ ...prev, [cardId + '-' + action]: false }));
      }
    });
  };

  const getCardCategory = (card: CardRecord) => {
    if (card.deleted_at) return 'deleted';
    if (card.archived_at || card.status === 'archived') return 'archived';
    
    // Check if expired
    const isExpired = card.status === 'expired' || (card.expires_at && new Date(card.expires_at) <= new Date());
    if (isExpired) return 'expired';
    
    if (card.status === 'published') return 'published';
    if (card.status === 'draft') return 'draft';
    
    return 'draft';
  };

  const fetchCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*, card_images(image_url, sort_order)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const formattedData = data.map(card => {
          let albumImages: string[] = [];
          if (card.card_images && card.card_images.length > 0) {
            const sortedImages = [...card.card_images].sort((a, b) => a.sort_order - b.sort_order);
            albumImages = sortedImages.map(img => img.image_url);
          }
          return {
            ...card,
            album_images: albumImages
          };
        });
        setCards(formattedData);
      }
    } catch (err) {
      console.error('Error fetching cards:', err);
      alert('Không thể kết nối tải danh sách thiệp cưới.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
    fetch('/api/admin/templates')
      .then(r => r.json())
      .then(data => {
        if (data.success && data.templates) {
          setTemplates(data.templates.filter((t: any) => t.is_enabled));
        }
      })
      .catch(err => console.error('Error fetching templates:', err));
  }, []);

  // Card payment & publish approval trigger
  const handleApprove = async (cardId: string) => {
    showConfirm(
      'Duyệt & Xuất bản thiệp',
      'Xác nhận đã nhận thanh toán và xuất bản thiệp này?',
      async () => {
        setActionLoading(prev => ({ ...prev, [cardId + '-approve']: true }));
        try {
          const res = await fetch('/api/admin/approve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardId }),
          });
          const data = await res.json();

          if (data.success) {
            alert('Đã duyệt thanh toán & xuất bản thiệp thành công! Email đã được gửi.');
            fetchCards();
          } else {
            alert(data.error || 'Duyệt thiệp thất bại.');
          }
        } catch (err) {
          console.error(err);
          alert('Lỗi kết nối khi duyệt thiệp.');
        } finally {
          setActionLoading(prev => ({ ...prev, [cardId + '-approve']: false }));
        }
      }
    );
  };

  // Custom domain activation trigger
  const handleActivateDomain = async (cardId: string) => {
    const domain = domainInputs[cardId]?.trim();
    if (!domain) {
      alert('Vui lòng nhập tên miền riêng (ví dụ: thiepcuoi-locthu.com)');
      return;
    }

    showConfirm(
      'Kích hoạt tên miền riêng',
      `Xác nhận kích hoạt tên miền riêng "${domain}" cho thiệp này?`,
      async () => {
        setActionLoading(prev => ({ ...prev, [cardId + '-domain']: true }));
        try {
          const res = await fetch('/api/admin/domain', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cardId, customDomain: domain }),
          });
          const data = await res.json();

          if (data.success) {
            alert(`Kích hoạt tên miền "${domain}" thành công! Email thông báo & QR mới đã được gửi.`);
            fetchCards();
          } else {
            alert(data.error || 'Kích hoạt tên miền thất bại.');
          }
        } catch (err) {
          console.error(err);
          alert('Lỗi kết nối khi kích hoạt tên miền.');
        } finally {
          setActionLoading(prev => ({ ...prev, [cardId + '-domain']: false }));
        }
      }
    );
  };

  const handleDomainInputChange = (cardId: string, value: string) => {
    setDomainInputs(prev => ({ ...prev, [cardId]: value }));
  };

  // Filter records
  const filteredCards = cards.filter(card => {
    const matchesSearch = 
      card.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.bride_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      card.groom_name.toLowerCase().includes(searchTerm.toLowerCase());
      
    if (!matchesSearch) return false;
    if (activeTab === 'all') return true;
    return getCardCategory(card) === activeTab;
  });

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Navbar */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <Link href="/" className="flex items-center gap-2 text-rose-600 font-bold text-xl sm:text-2xl">
              <Heart className="fill-rose-600 animate-pulse" size={24} />
              <span>LoobyCard Admin</span>
            </Link>
            <p className="text-slate-400 text-xs sm:text-sm">Trang quản trị phê duyệt thanh toán & kích hoạt tên miền riêng.</p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50"
                placeholder="Tìm kiếm thiệp, khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-slate-100 hover:bg-slate-250 hover:bg-slate-200 text-slate-600 hover:text-red-650 hover:text-rose-600 font-bold py-2.5 px-4 rounded-2xl text-xs transition whitespace-nowrap border border-slate-200/50 cursor-pointer"
              title="Đăng xuất"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Unified Nav tabs */}
        <div className="flex gap-2 p-1.5 bg-white/85 rounded-2xl shadow-sm border border-slate-200/50 w-fit">
          <span className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 border border-rose-100/50">
            Quản lý thiệp
          </span>
          <Link
            href="/admin/customers"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            Khách hàng
          </Link>
          <Link
            href="/admin/analytics"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            Analytics
          </Link>
          <Link
            href="/admin/templates"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
          >
            Templates
          </Link>
          <Link
            href="/admin/template-test"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition"
          >
            Test template
          </Link>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-white/85 rounded-3xl shadow-sm border border-slate-200/50 backdrop-blur w-fit">
          {(['all', 'draft', 'published', 'expired', 'archived', 'deleted'] as const).map((tab) => {
            const tabLabels: Record<string, string> = {
              all: 'Tất cả',
              draft: 'Nháp / Chờ duyệt',
              published: 'Đang chạy',
              expired: 'Hết hạn',
              archived: 'Lưu trữ',
              deleted: 'Đã xóa'
            };
            const count = cards.filter(c => tab === 'all' || getCardCategory(c) === tab).length;
            
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-rose-50 text-rose-600 shadow-sm border border-rose-100/50'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span>{tabLabels[tab]}</span>
                <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  activeTab === tab ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dashboard Grid list */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/50 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <Layers size={18} className="text-slate-500" />
              <span>Danh sách thiệp đã đăng ký ({cards.length})</span>
            </h2>
            <button
              onClick={fetchCards}
              className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500 hover:text-slate-800"
              title="Tải lại danh sách"
            >
              <RefreshCw size={18} />
            </button>
          </div>

          {loading ? (
            <div className="p-20 text-center text-slate-400 space-y-3">
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-rose-600 border-t-transparent mx-auto"></div>
              <p className="text-xs">Đang tải danh sách thiệp cưới...</p>
            </div>
          ) : filteredCards.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Đường dẫn / Slug</th>
                    <th className="p-4">Khách hàng</th>
                    <th className="p-4">Cô dâu & Chú rể</th>
                    <th className="p-4">Gói cước / Giá</th>
                    <th className="p-4">Trạng thái</th>
                    <th className="p-4">Hành động duyệt</th>
                    <th className="p-4">Tên miền (Luxury)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCards.map((card) => {
                    const isLuxury = card.plan_id === 'luxury';
                    const isPaid = card.payment_status === 'paid';
                    const isPublished = card.status === 'published';
                    const canActivateDomain = isPaid && isPublished;

                    return (
                      <tr key={card.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-4">
                          <a
                            href={`/${card.slug}`}
                            target="_blank"
                            className="font-mono font-bold text-rose-600 hover:underline"
                          >
                            {card.slug}
                          </a>
                          <span className="block text-[10px] text-slate-400">
                            Tạo lúc: {new Date(card.created_at).toLocaleDateString('vi-VN')}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="font-semibold text-slate-900">{card.customer_name}</div>
                          <div className="text-xs text-slate-400 font-medium">{card.customer_email}</div>
                        </td>
                        <td className="p-4 text-xs font-medium">
                          {card.groom_name} 🤵 <strong>&amp;</strong> <br />
                          {card.bride_name} 👰
                        </td>
                        <td className="p-4">
                          <span className="inline-block bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-md uppercase">
                            {card.plan_id}
                          </span>
                          <span className="block text-xs font-semibold text-slate-500 mt-1">
                            {card.amount.toLocaleString()}đ
                          </span>
                        </td>
                        <td className="p-4 space-y-1">
                          {/* Payment status badge */}
                          <div>
                            {isPaid ? (
                              <span className="inline-flex items-center gap-0.5 bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <Check size={10} /> Đã trả phí
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <ShieldAlert size={10} /> Chưa trả phí
                              </span>
                            )}
                          </div>
                          {/* Public status badge */}
                          <div>
                            {card.deleted_at ? (
                              <span className="inline-flex items-center gap-0.5 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                Đã xóa
                              </span>
                            ) : card.archived_at || card.status === 'archived' ? (
                              <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                Đã lưu trữ
                              </span>
                            ) : getCardCategory(card) === 'expired' ? (
                              <span className="inline-flex items-center gap-0.5 bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                Hết hạn
                              </span>
                            ) : isPublished ? (
                              <span className="inline-flex items-center gap-0.5 bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                <Check size={10} /> Đang hiển thị
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                Nháp / Chờ duyệt
                              </span>
                            )}
                          </div>
                          {card.expires_at && (
                            <div className="text-[10px] text-slate-400 font-medium mt-1">
                              Hết hạn: {new Date(card.expires_at).toLocaleDateString('vi-VN')}
                            </div>
                          )}
                        </td>
                        <td className="p-4 space-y-1.5 min-w-[160px]">
                          {/* Approve Action for drafts */}
                          {(!isPublished || !isPaid) && !card.deleted_at && !card.archived_at && (
                            <button
                              onClick={() => handleApprove(card.id)}
                              disabled={actionLoading[card.id + '-approve']}
                              className="w-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-1.5 px-3 rounded-xl text-xs shadow flex items-center justify-center gap-1.5 transition"
                            >
                              {actionLoading[card.id + '-approve'] ? (
                                <RefreshCw className="animate-spin" size={12} />
                              ) : (
                                <>
                                  <CheckCircle size={12} />
                                  <span>Duyệt &amp; Public</span>
                                </>
                              )}
                            </button>
                          )}

                          {/* Published Active Actions Status Banner */}
                          {getCardCategory(card) === 'published' && (
                            <div className="text-xs text-green-600 font-semibold flex items-center gap-1 justify-center py-1 bg-green-50 rounded-lg border border-green-100">
                              <CheckCircle size={12} />
                              <span>Hoạt động</span>
                            </div>
                          )}

                          {/* Action panel for non-deleted cards (Edit, Archive, Soft Delete, etc.) */}
                          {!card.deleted_at && (
                            <div className="space-y-1">
                              <button
                                onClick={() => openEditModal(card)}
                                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-slate-200/50"
                              >
                                <Edit2 size={12} />
                                <span>Chỉnh sửa</span>
                              </button>

                              {getCardCategory(card) === 'published' && (
                                <button
                                  onClick={() => handleCardAction(card.id, 'archive')}
                                  disabled={actionLoading[card.id + '-archive']}
                                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                                >
                                  Lưu trữ
                                </button>
                              )}

                              {getCardCategory(card) === 'expired' && (
                                <>
                                  <button
                                    onClick={() => handleCardAction(card.id, 'renew')}
                                    disabled={actionLoading[card.id + '-renew']}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                                  >
                                    Gia hạn 1 tháng
                                  </button>
                                  <button
                                    onClick={() => handleCardAction(card.id, 'archive')}
                                    disabled={actionLoading[card.id + '-archive']}
                                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                                  >
                                    Lưu trữ
                                  </button>
                                </>
                              )}

                              {getCardCategory(card) === 'archived' && (
                                <button
                                  onClick={() => handleCardAction(card.id, 'renew')}
                                  disabled={actionLoading[card.id + '-renew']}
                                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                                >
                                  Khôi phục &amp; Gia hạn
                                </button>
                              )}

                              {/* Soft delete action for drafts/active/expired/archived */}
                              <button
                                onClick={() => handleCardAction(card.id, 'soft_delete')}
                                disabled={actionLoading[card.id + '-soft_delete']}
                                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition border border-red-100"
                              >
                                <Trash2 size={12} />
                                <span>Xóa tạm thời</span>
                              </button>
                            </div>
                          )}

                          {/* Deleted Card Actions (Restore or Permanent Delete) */}
                          {getCardCategory(card) === 'deleted' && (
                            <div className="space-y-1">
                              <button
                                onClick={() => handleCardAction(card.id, 'renew')}
                                disabled={actionLoading[card.id + '-renew']}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                              >
                                Khôi phục hoạt động
                              </button>
                              <button
                                onClick={() => handleCardAction(card.id, 'permanent_delete')}
                                disabled={actionLoading[card.id + '-permanent_delete']}
                                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-sm"
                              >
                                <Trash2 size={12} />
                                <span>Xóa vĩnh viễn</span>
                              </button>
                            </div>
                          )}

                          {/* Option to bypass trash and permanently delete for drafts, expired or archived */}
                          {!card.deleted_at && (getCardCategory(card) === 'draft' || getCardCategory(card) === 'expired' || getCardCategory(card) === 'archived') && (
                            <button
                              onClick={() => handleCardAction(card.id, 'permanent_delete')}
                              disabled={actionLoading[card.id + '-permanent_delete']}
                              className="w-full text-slate-400 hover:text-red-600 text-[10px] font-semibold text-center transition block pt-1 hover:underline"
                            >
                              Xóa vĩnh viễn
                            </button>
                          )}
                        </td>
                        <td className="p-4">
                          {isLuxury ? (
                            <div className="space-y-2">
                              {card.domain_status === 'active' ? (
                                <div className="space-y-1">
                                  <span className="text-xs font-semibold text-green-600 flex items-center gap-1">
                                    <Globe size={14} /> Active: {card.custom_domain}
                                  </span>
                                  <div className="flex gap-1.5 items-center">
                                    <input
                                      type="text"
                                      placeholder="Sửa tên miền..."
                                      className="p-1 text-xs border border-slate-200 rounded w-32 focus:outline-none"
                                      value={domainInputs[card.id] || ''}
                                      onChange={(e) => handleDomainInputChange(card.id, e.target.value)}
                                    />
                                    <button
                                      onClick={() => handleActivateDomain(card.id)}
                                      disabled={actionLoading[card.id + '-domain']}
                                      className="bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-bold p-1 rounded transition"
                                    >
                                      Sửa
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1.5">
                                  <input
                                    type="text"
                                    placeholder="thiepcuoi-abc.com"
                                    className="p-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 w-44"
                                    value={domainInputs[card.id] || ''}
                                    onChange={(e) => handleDomainInputChange(card.id, e.target.value)}
                                  />
                                  <button
                                    onClick={() => handleActivateDomain(card.id)}
                                    disabled={!canActivateDomain || actionLoading[card.id + '-domain']}
                                    className="bg-slate-800 hover:bg-slate-900 disabled:opacity-40 text-white font-bold py-1.5 px-3 rounded-xl text-xs inline-flex items-center justify-center gap-1 transition"
                                  >
                                    {actionLoading[card.id + '-domain'] ? (
                                      <RefreshCw className="animate-spin" size={12} />
                                    ) : (
                                      <>
                                        <Globe size={12} />
                                        <span>Kích hoạt Domain</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 italic">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-20 text-center text-slate-400 italic">
              Chưa có thiệp cưới nào được tạo trên hệ thống.
            </div>
          )}
        </div>
        {/* Edit Modal */}
        {isEditModalOpen && editingCard && (
          <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-slate-100 flex flex-col">
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Chỉnh sửa thiệp cưới</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {editingCard.id}</p>
                </div>
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingCard(null);
                  }}
                  className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 px-6 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setEditTab('customer')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                    editTab === 'customer'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Khách hàng & Slug
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab('couple')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                    editTab === 'couple'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Cô dâu & Chú rể
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab('event')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                    editTab === 'event'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Sự kiện & Khác
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab('content')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                    editTab === 'content'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Nội dung
                </button>
                <button
                  type="button"
                  onClick={() => setEditTab('images')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                    editTab === 'images'
                      ? 'border-rose-500 text-rose-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Hình ảnh
                </button>
              </div>

              {/* Modal Content / Form */}
              <form onSubmit={handleSaveEdit} className="flex-1 overflow-y-auto p-6 space-y-4">
                {editTab === 'customer' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tên khách hàng</label>
                      <input
                        type="text"
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                        value={editFormData.customer_name || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, customer_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</label>
                      <input
                        type="email"
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                        value={editFormData.customer_email || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, customer_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Số điện thoại</label>
                      <input
                        type="text"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                        value={editFormData.customer_phone || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, customer_phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Đường dẫn / Slug</label>
                      <input
                        type="text"
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 font-mono text-rose-600"
                        value={editFormData.slug || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Trạng thái thanh toán</label>
                      <select
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                        value={editFormData.payment_status || 'unpaid'}
                        onChange={(e) => setEditFormData({ ...editFormData, payment_status: e.target.value })}
                      >
                        <option value="unpaid">Chưa thanh toán</option>
                        <option value="paid">Đã thanh toán</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Trạng thái hoạt động</label>
                      <select
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                        value={editFormData.status || 'draft'}
                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      >
                        <option value="draft">Nháp / Chờ duyệt</option>
                        <option value="published">Đang chạy (Published)</option>
                        <option value="archived">Đã lưu trữ</option>
                        <option value="expired">Hết hạn</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Giao diện template</label>
                      <select
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                        value={editFormData.template_id || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, template_id: e.target.value })}
                      >
                        <option value="">-- Chọn template --</option>
                        {templates.map((tpl) => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name} ({tpl.id})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {editTab === 'couple' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tên Chú rể</label>
                        <input
                          type="text"
                          required
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                          value={editFormData.groom_name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, groom_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vai trò Chú rể</label>
                        <input
                          type="text"
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                          value={editFormData.groom_role || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, groom_role: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tên Cô dâu</label>
                        <input
                          type="text"
                          required
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                          value={editFormData.bride_name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, bride_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Vai trò Cô dâu</label>
                        <input
                          type="text"
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                          value={editFormData.bride_role || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, bride_role: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Parents */}
                    <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2"><h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Phụ huynh Chú rể</h4></div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Tên Bố chú rể</label>
                        <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none bg-slate-50 text-slate-800" value={editFormData.groom_father_name || ''} onChange={(e) => setEditFormData({ ...editFormData, groom_father_name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Tên Mẹ chú rể</label>
                        <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none bg-slate-50 text-slate-800" value={editFormData.groom_mother_name || ''} onChange={(e) => setEditFormData({ ...editFormData, groom_mother_name: e.target.value })} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-slate-500 mb-1">Địa chỉ nhà chú rể</label>
                        <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none bg-slate-50 text-slate-800" value={editFormData.groom_address || ''} onChange={(e) => setEditFormData({ ...editFormData, groom_address: e.target.value })} />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2"><h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Phụ huynh Cô dâu</h4></div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Tên Bố cô dâu</label>
                        <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none bg-slate-50 text-slate-800" value={editFormData.bride_father_name || ''} onChange={(e) => setEditFormData({ ...editFormData, bride_father_name: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-500 mb-1">Tên Mẹ cô dâu</label>
                        <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none bg-slate-50 text-slate-800" value={editFormData.bride_mother_name || ''} onChange={(e) => setEditFormData({ ...editFormData, bride_mother_name: e.target.value })} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs text-slate-500 mb-1">Địa chỉ nhà cô dâu</label>
                        <input type="text" className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none bg-slate-50 text-slate-800" value={editFormData.bride_address || ''} onChange={(e) => setEditFormData({ ...editFormData, bride_address: e.target.value })} />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-3">
                        <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Tài khoản Chú rể</h4>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-550 mb-1">Ngân hàng</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-850"
                          value={editFormData.groom_bank_name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, groom_bank_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-550 mb-1">Số tài khoản</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-850"
                          value={editFormData.groom_bank_account || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, groom_bank_account: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-550 mb-1">Chủ tài khoản</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-850"
                          value={editFormData.groom_bank_holder || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, groom_bank_holder: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-3">
                        <h4 className="font-semibold text-xs text-slate-400 uppercase tracking-wider">Tài khoản Cô dâu</h4>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-550 mb-1">Ngân hàng</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-850"
                          value={editFormData.bride_bank_name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, bride_bank_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-550 mb-1">Số tài khoản</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-850"
                          value={editFormData.bride_bank_account || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, bride_bank_account: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-550 mb-1">Chủ tài khoản</label>
                        <input
                          type="text"
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs focus:outline-none text-slate-850"
                          value={editFormData.bride_bank_holder || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, bride_bank_holder: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {editTab === 'event' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Ngày tổ chức</label>
                        <input
                          type="date"
                          required
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                          value={editFormData.event_date || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, event_date: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Giờ đón khách</label>
                        <input
                          type="text"
                          required
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                          value={editFormData.reception_time || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, reception_time: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Giờ làm lễ</label>
                        <input
                          type="text"
                          required
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                          value={editFormData.ceremony_time || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, ceremony_time: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tên nhà hàng/nơi tổ chức</label>
                        <input
                          type="text"
                          required
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                          value={editFormData.venue_name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, venue_name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Dress Code</label>
                        <input
                          type="text"
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                          placeholder="Ví dụ: Hồng pastel, Trắng"
                          value={editFormData.dress_code || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, dress_code: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Địa chỉ nơi tổ chức</label>
                      <input
                        type="text"
                        required
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                        value={editFormData.venue_address || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, venue_address: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Đường dẫn Google Maps</label>
                      <input
                        type="url"
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 font-mono text-xs text-slate-850"
                        value={editFormData.map_url || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, map_url: e.target.value })}
                      />
                    </div>

                    {/* Admin Wedding Schedule Editor */}
                    <div className="border-t border-slate-200 pt-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Hiển thị lịch trình cưới</label>
                          <p className="text-[10px] text-slate-400">Cho phép bật/tắt hiển thị lịch trình trên thiệp cưới.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={editFormData.has_schedule || false}
                            onChange={(e) => setEditFormData({ ...editFormData, has_schedule: e.target.checked })}
                          />
                          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                        </label>
                      </div>

                      {editFormData.has_schedule && (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                          {/* Schedule List */}
                          {editFormData.wedding_schedule && editFormData.wedding_schedule.length > 0 ? (
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                              {editFormData.wedding_schedule.map((item: any, index: number) => (
                                <div key={index} className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-150 gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded font-mono shrink-0">
                                        {item.time}
                                      </span>
                                      <h5 className="text-xs font-bold text-slate-800 truncate">{item.title}</h5>
                                    </div>
                                    {item.description && <p className="text-[10px] text-slate-500 mt-0.5 truncate">{item.description}</p>}
                                  </div>
                                  <div className="flex items-center gap-0.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => moveAdminScheduleItem(index, 'up')}
                                      disabled={index === 0}
                                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition"
                                    >
                                      <ChevronUp size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => moveAdminScheduleItem(index, 'down')}
                                      disabled={index === editFormData.wedding_schedule.length - 1}
                                      className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-30 transition"
                                    >
                                      <ChevronDown size={14} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => removeAdminScheduleItem(index)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic text-center py-3 bg-white rounded-lg border border-slate-200">
                              Chưa có mốc lịch trình nào.
                            </p>
                          )}

                          {/* Add Form */}
                          <div className="bg-white p-3 rounded-lg border border-slate-150 space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold text-slate-500 uppercase">Giờ</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border border-slate-200 rounded-md text-xs focus:outline-none bg-slate-50 font-mono text-slate-800"
                                  placeholder="17:30"
                                  value={adminScheduleTime}
                                  onChange={(e) => setAdminScheduleTime(e.target.value)}
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="block text-[9px] font-bold text-slate-500 uppercase">Tiêu đề *</label>
                                <input
                                  type="text"
                                  className="w-full p-2 border border-slate-200 rounded-md text-xs focus:outline-none bg-slate-50 text-slate-800"
                                  placeholder="Đón khách"
                                  value={adminScheduleTitle}
                                  onChange={(e) => setAdminScheduleTitle(e.target.value)}
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[9px] font-bold text-slate-500 uppercase">Mô tả</label>
                              <input
                                type="text"
                                className="w-full p-2 border border-slate-200 rounded-md text-xs focus:outline-none bg-slate-50 text-slate-800"
                                placeholder="Mô tả ngắn..."
                                value={adminScheduleDesc}
                                onChange={(e) => setAdminScheduleDesc(e.target.value)}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={addAdminScheduleItem}
                              className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-1.5 px-2 rounded-md text-xs transition"
                            >
                              Thêm mốc sự kiện
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {editTab === 'content' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lời mời (Invitation Text)</label>
                      <textarea
                        rows={4}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-800 leading-relaxed"
                        placeholder="Trân trọng kính mời..."
                        value={editFormData.invitation_text || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, invitation_text: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Câu trích dẫn (Quote Text)</label>
                      <textarea
                        rows={3}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-800 leading-relaxed"
                        placeholder="Tình yêu là hành trình dài nhất..."
                        value={editFormData.quote_text || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, quote_text: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Lời cảm ơn (Thank You Text)</label>
                      <textarea
                        rows={3}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-800 leading-relaxed"
                        placeholder="Xin chân thành cảm ơn..."
                        value={editFormData.thank_you_text || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, thank_you_text: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {editTab === 'images' && (
                  <div className="space-y-6">
                    {/* Cover Image */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ảnh bìa (URL hoặc Upload)</label>
                      <div className="flex gap-4">
                        <div className="flex-1">
                          <input
                            type="url"
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850"
                            value={editFormData.cover_image_url || ''}
                            onChange={(e) => setEditFormData({ ...editFormData, cover_image_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                        <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm inline-flex items-center gap-1.5 transition">
                          <Upload size={16} />
                          <span>{uploadingCover ? 'Đang tải lên...' : 'Tải lên'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'cover')}
                            disabled={uploadingCover}
                          />
                        </label>
                      </div>
                      {editFormData.cover_image_url && (
                        <div className="mt-2 h-32 w-32 rounded-xl overflow-hidden shadow-sm relative group">
                          <img src={editFormData.cover_image_url} alt="Cover preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>

                    {/* Album Images */}
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Album ảnh cưới</label>
                      <div className="flex gap-4 mb-2">
                        <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm inline-flex items-center gap-1.5 transition">
                          <Upload size={16} />
                          <span>{uploadingAlbum ? 'Đang tải lên...' : 'Tải lên thêm ảnh'}</span>
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

                      <textarea
                        rows={3}
                        className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-850 font-mono text-xs whitespace-pre mb-2"
                        value={(editFormData.album_images || []).join('\n')}
                        onChange={(e) => {
                          const urls = e.target.value.split('\n').map(u => u.trim()).filter(u => u);
                          setEditFormData({ ...editFormData, album_images: urls });
                        }}
                        placeholder="Có thể sửa trực tiếp URL tại đây (mỗi URL 1 dòng)"
                      />

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                        {(editFormData.album_images || []).map((url: string, index: number) => (
                          <div key={index} className="relative group bg-slate-100 rounded-xl overflow-hidden aspect-[3/4] border border-slate-200">
                            <img src={url} alt={`Album ${index}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => moveAlbumImage(index, 'up')}
                                  disabled={index === 0}
                                  className="p-1.5 bg-white text-slate-700 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                                >
                                  <ChevronUp size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveAlbumImage(index, 'down')}
                                  disabled={index === (editFormData.album_images || []).length - 1}
                                  className="p-1.5 bg-white text-slate-700 rounded-lg hover:bg-slate-100 disabled:opacity-50"
                                >
                                  <ChevronDown size={16} />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAlbumImage(index)}
                                className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Music URL */}
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Nhạc nền</label>
                      
                      {/* Select Predefined Songs */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-400">Chọn nhạc có sẵn</label>
                        <select
                          className="w-full p-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-800"
                          value={editFormData.music_url || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, music_url: e.target.value })}
                        >
                          <option value="">-- Chọn bài nhạc có sẵn --</option>
                          {AVAILABLE_SONGS.map((song) => (
                            <option key={song.url} value={song.url}>
                              {song.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Custom URL or upload */}
                      <div className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-400">Hoặc nhập URL / Tải file lên</label>
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <input
                              type="url"
                              className="w-full p-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-rose-500 bg-slate-50 text-slate-800"
                              value={editFormData.music_url || ''}
                              onChange={(e) => setEditFormData({ ...editFormData, music_url: e.target.value })}
                              placeholder="https://..."
                            />
                          </div>
                          <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white font-bold py-2.5 px-4 rounded-xl text-sm inline-flex items-center gap-1.5 transition">
                            <Upload size={16} />
                            <span>{uploadingMusic ? 'Đang tải lên...' : 'Tải lên mp3'}</span>
                            <input
                              type="file"
                              accept=".mp3,audio/*"
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, 'music')}
                              disabled={uploadingMusic}
                            />
                          </label>
                        </div>
                      </div>

                      {editFormData.music_url && (
                        <div className="mt-2 p-2 bg-slate-100 rounded-xl">
                          <audio controls src={editFormData.music_url} className="w-full h-10" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>

              {/* Modal Footer */}
              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingCard(null);
                  }}
                  className="bg-white hover:bg-slate-100 text-slate-700 font-semibold py-2 px-4 border border-slate-200 rounded-xl text-sm transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={savingEdit}
                  onClick={handleSaveEdit}
                  className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-xl text-sm shadow transition"
                >
                  {savingEdit ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal */}
        {confirmModal.isOpen && (
          <div className="fixed inset-0 z-[60] overflow-y-auto flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 space-y-4 text-center">
              <div className="h-12 w-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 mx-auto">
                <ShieldAlert size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">{confirmModal.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{confirmModal.message}</p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-xl text-xs transition"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={confirmModal.onConfirm}
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-4 rounded-xl text-xs shadow transition"
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
