import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Btn, Icon, Panel } from '@/components/chrome';
import { useMistakes, useBanks } from '@/lib/store';
import { removeMistake, toggleSaveQuestion, clearMistakesForBank } from '@/lib/model';
import { isDueForReview, formatReviewCountdown } from '@/lib/srs';
import { AiExplanationModal } from '@/components/ai-explanation-modal';
import { AlertModal } from '@/components/alert-modal';
import type { MistakeItem } from '@/lib/types';

export function MistakesPage() {
  const mistakes = useMistakes();
  const banks = useBanks();
  const [location, setLocation] = useLocation();

  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'saved') return 'saved';
      if (tab === 'srs') return 'srs';
    }
    return 'all';
  };

  // Extract unique bank tabs that exist in either banks or mistakes
  const bankTabs = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    
    // Add all banks user created
    banks.forEach((b) => {
      map.set(b.id, { id: b.id, name: b.name, count: 0 });
    });

    // Count mistakes
    mistakes.forEach((m) => {
      const existing = map.get(m.bankId);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(m.bankId, { id: m.bankId, name: m.bankName, count: 1 });
      }
    });

    return Array.from(map.values());
  }, [banks, mistakes]);

  const [selectedTab, setSelectedTab] = useState<string>(getInitialTab);
  const [clearBankConfirm, setClearBankConfirm] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (tab === 'saved') setSelectedTab('saved');
      else if (tab === 'srs') setSelectedTab('srs');
    }
  }, [location]);
  const [onlySaved, setOnlySaved] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [explainingItem, setExplainingItem] = useState<MistakeItem | null>(null);

  const dueCount = useMemo(() => mistakes.filter(isDueForReview).length, [mistakes]);
  const savedCount = useMemo(() => mistakes.filter((m) => m.saved).length, [mistakes]);

  // Filtered list
  const filteredMistakes = useMemo(() => {
    return mistakes.filter((item) => {
      if (selectedTab === 'srs') {
        if (!isDueForReview(item)) return false;
      } else if (selectedTab !== 'all' && selectedTab !== 'saved' && item.bankId !== selectedTab) {
        return false;
      }
      if (selectedTab === 'saved' && !item.saved) {
        return false;
      }
      if (onlySaved && !item.saved) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inPrompt = item.prompt.toLowerCase().includes(q);
        const inOptions = item.options.some((o) => o.text.toLowerCase().includes(q));
        if (!inPrompt && !inOptions) return false;
      }
      return true;
    });
  }, [mistakes, selectedTab, onlySaved, searchQuery]);

  // Practice ONLY the mistakes of the current tab (not the whole bank)
  const handlePractice = () => {
    if (!filteredMistakes.length) return;
    setLocation(`/mistakes/practice?scope=${encodeURIComponent(selectedTab)}`);
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <Panel className="p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400">
                <Icon name="ri-error-warning-fill" className="text-2xl" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Xatolarim va Saqlanganlar</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 font-semibold">
                    {mistakes.length} ta
                  </span>
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Imtihonlarda yo‘l qo‘yilgan xatolar va saqlangan savollaringiz tahlili.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {filteredMistakes.length > 0 && selectedTab !== 'all' && selectedTab !== 'saved' && (
              <button
                type="button"
                onClick={() => setClearBankConfirm(true)}
                className="px-3 py-1.5 rounded-[8px] text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
              >
                Fanni tozalash
              </button>
            )}
            <button
              type="button"
              onClick={handlePractice}
              disabled={!filteredMistakes.length}
              className="btn-primary !rounded-[12px] !px-4 !py-2.5 text-sm font-bold shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-40 w-full sm:w-auto"
            >
              <Icon name="ri-refresh-line" className="text-base" />
              <span>Xatolardan test{filteredMistakes.length ? ` (${filteredMistakes.length} ta)` : ''}</span>
            </button>
          </div>
        </div>

        {/* Real Tabs Navigation */}
        <div className="mt-5 border-t border-slate-200/80 dark:border-white/10 pt-2">
          <div className="flex items-center gap-1 sm:gap-4 border-b border-slate-200/80 dark:border-white/10 overflow-x-auto scrollbar-hide -mb-px">
            <button
              type="button"
              onClick={() => setSelectedTab('all')}
              className={`flex items-center gap-2 pb-3 pt-2 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                selectedTab === 'all'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon name="ri-apps-line" className="text-base" />
              <span>Barchasi</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedTab === 'all'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                }`}
              >
                {mistakes.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('srs')}
              className={`flex items-center gap-2 pb-3 pt-2 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                selectedTab === 'srs'
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon name="ri-time-line" className="text-base" />
              <span>Bugungi takrorlash (SRS)</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedTab === 'srs'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                }`}
              >
                {dueCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedTab('saved')}
              className={`flex items-center gap-2 pb-3 pt-2 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                selectedTab === 'saved'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'
              }`}
            >
              <Icon
                name="ri-bookmark-fill"
                className={selectedTab === 'saved' ? 'text-primary text-base' : 'text-slate-400 text-base'}
              />
              <span>Saqlanganlar</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  selectedTab === 'saved'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                }`}
              >
                {savedCount}
              </span>
            </button>

            {bankTabs.map((tab) => {
              const isActive = selectedTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex items-center gap-2 pb-3 pt-2 px-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Icon name="ri-folder-3-line" className="text-base" />
                  <span className="truncate max-w-[180px]">{tab.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search & Quick Filter */}
        <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-white/5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Icon name="ri-search-line" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Savollar ichidan qidirish..."
              className="w-full pl-9 pr-4 py-2 rounded-[10px] border border-slate-200 dark:border-white/10 bg-white dark:bg-[#111827] text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-emerald-500"
            />
          </div>

          {selectedTab !== 'saved' && (
            <button
              type="button"
              onClick={() => setOnlySaved(!onlySaved)}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-[10px] text-xs font-semibold border transition-all cursor-pointer ${
                onlySaved
                  ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon name={onlySaved ? 'ri-bookmark-fill' : 'ri-bookmark-line'} className="text-sm" />
              <span>Faqat saqlanganlar</span>
            </button>
          )}
        </div>
      </Panel>

      {/* Mistakes List */}
      {!filteredMistakes.length ? (
        <Panel className="p-12 text-center shadow-xs">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl">
            <Icon name="ri-checkbox-circle-line" />
          </div>
          <h3 className="mt-4 text-lg font-bold text-slate-900 dark:text-white">
            {onlySaved || selectedTab === 'saved'
              ? 'Hozircha saqlangan savollar yo‘q'
              : 'Bu bo‘limda xatolar mavjud emas!'}
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {onlySaved || selectedTab === 'saved'
              ? 'Test yechish davomida savol yonidagi xatcho‘p (bookmark) tugmasini bosib savollarni saqlab qo‘yishingiz mumkin.'
              : 'Test yechish jarayonida yo‘l qo‘yilgan noto‘g‘ri javoblar avtomatik ushbu fanga yozilib boriladi.'}
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/banks" className="btn-primary !rounded-[10px] text-xs sm:text-sm font-semibold">
              <Icon name="ri-folders-line" /> To‘plamlardan test boshlash
            </Link>
          </div>
        </Panel>
      ) : (
        <div className="space-y-4">
          {filteredMistakes.map((item, idx) => {
            const isSaved = Boolean(item.saved);

            return (
              <Panel key={item.id} className="p-3.5 sm:p-6 transition-all hover:border-slate-300 dark:hover:border-white/20">
                {/* Item Top Row */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-1 rounded-[8px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                      {item.bankName}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      #{idx + 1} · {new Date(item.timestamp).toLocaleDateString('uz-UZ')}
                    </span>
                    {item.nextReviewDate && (
                      <span className={`px-2 py-0.5 rounded-[6px] text-[10px] font-bold inline-flex items-center gap-1 ${
                        isDueForReview(item)
                          ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                          : 'bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/10'
                      }`}>
                        <Icon name="ri-time-line" className="text-xs" />
                        {isDueForReview(item) ? 'Bugun takrorlash' : formatReviewCountdown(item.nextReviewDate)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* AI Explanation Button */}
                    <button
                      type="button"
                      onClick={() => setExplainingItem(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold transition-all cursor-pointer"
                      title="AI Klinik Tushuntirish"
                    >
                      <Icon name="ri-sparkling-fill" className="text-emerald-500 text-xs" />
                      <span className="hidden sm:inline">AI Tushuntirish</span>
                    </button>

                    {/* Save / Bookmark Button */}
                    <button
                      type="button"
                      onClick={() =>
                        toggleSaveQuestion(
                          { id: item.questionId, prompt: item.prompt, options: item.options, image: item.image },
                          item.bankId,
                          item.bankName,
                          item.pickedIndices
                        )
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                        isSaved
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 dark:bg-white/5 dark:hover:bg-emerald-500/10 text-slate-600 dark:text-slate-300'
                      }`}
                      title={isSaved ? 'Saqlanganlardan o‘chirish' : 'Savolni saqlab qo‘yish'}
                    >
                      <Icon name={isSaved ? 'ri-bookmark-fill' : 'ri-bookmark-line'} className="text-sm" />
                      <span>{isSaved ? 'Saqlangan' : 'Saqlash'}</span>
                    </button>

                    {/* Delete Item Button */}
                    <button
                      type="button"
                      onClick={() => removeMistake(item.id)}
                      className="p-1.5 rounded-[8px] text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Xatolar ro‘yxatidan o‘chirish"
                    >
                      <Icon name="ri-delete-bin-line" className="text-base" />
                    </button>
                  </div>
                </div>

                {/* Question Prompt */}
                <h3 className="text-sm sm:text-base font-semibold leading-relaxed text-slate-900 dark:text-white mb-3">
                  {item.prompt}
                </h3>

                {/* Question Image if present */}
                {item.image && (
                  <div className="mb-4 max-h-48 rounded-[10px] overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <img src={item.image} alt="" className="max-h-48 object-contain" />
                  </div>
                )}

                {/* Options List with User Picked vs Correct highlighting */}
                <div className="space-y-2 pt-1">
                  {item.options.map((opt, optIdx) => {
                    const isPicked = item.pickedIndices?.includes(optIdx);
                    const isCorrect = opt.correct;

                    let optionStyle = 'border-slate-200 dark:border-white/10 bg-slate-50/60 dark:bg-white/[0.02] text-slate-700 dark:text-slate-300';
                    let badge = null;

                    if (isCorrect) {
                      optionStyle = 'border-green-500 bg-green-500/10 text-green-800 dark:text-green-300 font-medium ring-1 ring-green-500/20';
                      badge = (
                        <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-green-600 dark:text-green-400 shrink-0">
                          <Icon name="ri-check-line" className="text-sm" /> To‘g‘ri
                        </span>
                      );
                    } else if (isPicked) {
                      optionStyle = 'border-rose-500 bg-rose-500/10 text-rose-800 dark:text-rose-300 font-medium ring-1 ring-rose-500/20';
                      badge = (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 shrink-0">
                          <Icon name="ri-close-line" className="text-sm" /> Sizniki
                        </span>
                      );
                    }

                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center justify-between gap-3 p-3 rounded-[10px] border text-xs sm:text-sm transition-all ${optionStyle}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                            isCorrect
                              ? 'bg-green-500 text-white'
                              : isPicked
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400'
                          }`}>
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="break-words flex-1">{opt.text}</span>
                        </div>
                        {badge}
                      </div>
                    );
                  })}
                </div>
              </Panel>
            );
          })}
        </div>
      )}

      {explainingItem && (
        <AiExplanationModal
          isOpen={Boolean(explainingItem)}
          onClose={() => setExplainingItem(null)}
          question={{
            id: explainingItem.questionId,
            prompt: explainingItem.prompt,
            options: explainingItem.options,
            image: explainingItem.image,
            audio: explainingItem.audio,
          }}
          pickedIndices={explainingItem.pickedIndices}
        />
      )}

      {/* Fanni tozalash Alert Modali */}
      <AlertModal
        isOpen={clearBankConfirm}
        onClose={() => setClearBankConfirm(false)}
        onConfirm={() => {
          clearMistakesForBank(selectedTab);
          setClearBankConfirm(false);
        }}
        variant="warning"
        title="Xatolarni tozalash"
        description="Tanlangan fan bo‘yicha to‘plangan barcha xatolarni o‘chirmoqchimisiz? Ushbu amaldan so‘ng xatolar ro‘yxati bo‘shaydi."
        confirmText="Tozalash"
        cancelText="Bekor qilish"
      />
    </div>
  );
}
