import { useState, useRef } from 'react';
import { Icon } from '@/components/chrome';
import { PRESET_AVATARS, type PresetAvatar } from '@/lib/avatars';
import { fileToImage } from '@/lib/images';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string | null;
  currentName: string;
  onSelectAvatar: (avatarUrl: string | null) => void;
}

export function AvatarModal({
  isOpen,
  onClose,
  currentAvatar,
  currentName,
  onSelectAvatar,
}: AvatarModalProps) {
  const [activeCategory, setActiveCategory] = useState<'all' | '3d-med' | 'meme' | 'specialist'>('all');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const filteredAvatars = activeCategory === 'all'
    ? PRESET_AVATARS
    : PRESET_AVATARS.filter((a) => a.category === activeCategory);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const dataUrl = await fileToImage(file);
      onSelectAvatar(dataUrl);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rasm yuklashda xatolik yuz berdi');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Sheet Content (Slide from bottom on mobile, centered modal on desktop) */}
      <div className="relative w-full max-w-lg max-h-[85vh] flex flex-col rounded-t-[24px] sm:rounded-[20px] bg-white dark:bg-[#111827] border-t sm:border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-10 transition-transform animate-slide-up">
        {/* Handle bar on mobile */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-white/20" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200/80 dark:border-white/10">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Icon name="ri-user-smile-line" className="text-emerald-500 text-xl" />
              <span>Profil avatarini tanlang</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Tayyor 3D memlardan birini tanlang yoki o‘z rasmingizni yuklang
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Yopish"
          >
            <Icon name="ri-close-line" className="text-xl" />
          </button>
        </div>

        {/* Action row: Upload Custom + Reset to Initials */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200/60 dark:border-white/5 flex gap-2.5">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            className="sr-only"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition-all active:scale-98 cursor-pointer disabled:opacity-50"
          >
            <Icon name="ri-upload-cloud-2-line" className="text-base" />
            <span>{uploading ? 'Yuklanmoqda...' : 'Galereyadan yuklash'}</span>
          </button>

          {currentAvatar && (
            <button
              type="button"
              onClick={() => {
                onSelectAvatar(null);
                onClose();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-[10px] border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 text-xs sm:text-sm font-medium transition-colors cursor-pointer"
              title="Boshlang‘ich avatar"
            >
              <Icon name="ri-delete-bin-line" className="text-sm" />
              <span>O‘chirish</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mx-4 mt-3 p-2.5 rounded-[10px] bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 overflow-x-auto scrollbar-hide shrink-0">
          {[
            { id: 'all', label: 'Barchasi', icon: 'ri-apps-2-line' },
            { id: '3d-med', label: '3D Shifokorlar', icon: 'ri-stethoscope-line' },
            { id: 'meme', label: 'Memlar', icon: 'ri-emotion-laugh-line' },
            { id: 'specialist', label: 'Maxsus', icon: 'ri-sparkling-line' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id as any)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white dark:bg-emerald-600 dark:text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <Icon name={cat.icon} className="text-xs" />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Presets Grid */}
        <div className="flex-1 overflow-y-auto p-4 pt-2">
          <div className="grid grid-cols-4 sm:grid-cols-4 gap-3">
            {filteredAvatars.map((avatar) => {
              const isSelected = currentAvatar === avatar.url;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => {
                    onSelectAvatar(avatar.url);
                    onClose();
                  }}
                  className={`group relative flex flex-col items-center p-2 rounded-[14px] border-2 transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500/10 shadow-md ring-2 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-white/10 hover:border-emerald-400/60 dark:hover:border-emerald-500/40 bg-white dark:bg-white/5'
                  }`}
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-[12px] overflow-hidden shadow-xs flex items-center justify-center">
                    <img src={avatar.url} alt={avatar.name} className="w-full h-full object-cover" />
                  </div>
                  <span className="mt-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-700 dark:text-slate-300 text-center truncate max-w-full">
                    {avatar.name}
                  </span>
                  {isSelected && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-white text-[10px] shadow-sm">
                      <Icon name="ri-check-line" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
