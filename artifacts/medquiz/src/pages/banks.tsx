import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import {
  HiOutlineCheck,
  HiOutlineDocumentText,
  HiOutlinePaperClip,
  HiOutlinePencilAlt,
  HiOutlinePlay,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineX,
} from 'react-icons/hi';
import { Btn, Icon, Panel, fieldClass } from '@/components/chrome';
import { createBank, deleteBank, getBankSchedule, saveQuestionsToSubject } from '@/lib/model';
import { cleanQuestion, parseQuizText, extractTextFromFile } from '@/lib/parser';
import { useBanks } from '@/lib/store';
import { ExamCalendarModal } from '@/components/exam-calendar-modal';
import { useI18n } from '@/lib/i18n';
import type { Bank } from '@/lib/types';

const controlClass = `${fieldClass} !rounded-[10px]`;

export function Banks() {
  const banks = useBanks();
  const { t } = useI18n();
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [risen, setRisen] = useState(false);
  const [calendarBank, setCalendarBank] = useState<Bank | null>(null);
  const [deleteRisen, setDeleteRisen] = useState(false);
  const [fan, setFan] = useState('');
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedCount, setParsedCount] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [mode, setMode] = useState<'file' | 'text'>('file');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) {
      setRisen(false);
      return;
    }
    const frame = requestAnimationFrame(() => setRisen(true));
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!deleteOpen) {
      setDeleteRisen(false);
      return;
    }
    const frame = requestAnimationFrame(() => setDeleteRisen(true));
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDeleteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKey);
    };
  }, [deleteOpen]);

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setSelectedFile(file);
    setFileName(file.name);
    try {
      const text = await extractTextFromFile(file);
      const parsed = parseQuizText(text);
      setParsedCount(parsed.questions.length);
      setError('');
      if (!fan.trim()) {
        const guessedName = file.name.replace(/\.[^/.]+$/, '').trim();
        if (guessedName) setFan(guessedName);
      }
    } catch {
      setError('Faylni o‘qishda xatolik yuz berdi. TXT, DOC, DOCX yoki PDF fayl ekanligini tekshiring.');
    }
  };

  const handleDone = async () => {
    const name = fan.trim();
    if (!name) {
      setError('Fan nomini kiriting.');
      return;
    }

    let questionsText = rawText;
    if (mode === 'file' && selectedFile) {
      questionsText = await extractTextFromFile(selectedFile);
    }

    if (questionsText.trim()) {
      const parsed = parseQuizText(questionsText);
      if (!parsed.questions.length) {
        setError('Savollar topilmadi. Har bir savol # bilan, to‘g‘ri javob + bilan, noto‘g‘ri javob - bilan boshlansin.');
        return;
      }
      saveQuestionsToSubject(name, parsed.questions);
    } else {
      // Create empty bank and open editor
      const newBank = createBank(name, []);
      setError('');
      setFan('');
      setFileName('');
      setSelectedFile(null);
      setRawText('');
      setOpen(false);
      setLocation(`/banks/${newBank.id}`);
      return;
    }

    setError('');
    setFan('');
    setFileName('');
    setSelectedFile(null);
    setRawText('');
    setParsedCount(null);
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 dark:text-white">{t('banks_title')}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {t('banks_sub')}
            </p>
          </div>
          <div>
            <button
              type="button"
              className="btn-primary !rounded-[10px] px-4 py-2.5 text-sm shadow-md cursor-pointer"
              data-testid="button-add-questions"
              onClick={() => {
                setError('');
                setOpen(true);
              }}
            >
              <HiOutlinePlus className="h-4 w-4" />
              {t('banks_add_questions')}
            </button>
          </div>
        </div>

        {!banks.length && (
          <div className="mt-8 rounded-[10px] border border-dashed border-slate-300 dark:border-white/10 p-10 text-center">
            <HiOutlineDocumentText className="mx-auto h-12 w-12 text-slate-400" />
            <p className="mt-3 font-semibold text-slate-700 dark:text-slate-300">{t('banks_empty_title')}</p>
            <p className="mt-1 text-sm text-slate-500">{t('banks_empty_desc')}</p>
            <button
              type="button"
              className="btn-primary mt-4 text-sm !rounded-[10px] cursor-pointer"
              onClick={() => setOpen(true)}
            >
              <HiOutlinePlus className="h-4 w-4" /> {t('banks_add_questions')}
            </button>
          </div>
        )}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {banks.map((bank) => {
            const playableCount = (bank.questions ?? []).filter((q) => cleanQuestion(q)).length;
            const schedule = getBankSchedule(bank.id);
            const daysLeft = schedule?.examDate
              ? Math.max(0, Math.ceil((new Date(schedule.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
              : null;
            return (
              <div
                key={bank.id}
                className="group relative flex flex-col justify-between rounded-[10px] border border-slate-200/80 bg-white/70 p-4 transition-all hover:border-med-500/40 hover:shadow-md dark:border-white/10 dark:bg-[#111827] dark:hover:border-med-500/30"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <Link
                      href={`/banks/${bank.id}`}
                      className="font-display font-bold text-base text-slate-900 group-hover:text-med-600 dark:text-white dark:group-hover:text-med-400 transition-colors truncate"
                      data-testid={`link-bank-${bank.id}`}
                    >
                      {bank.name}
                    </Link>
                    <span className="badge-primary shrink-0 text-xs !rounded-[10px]">
                      {playableCount} {t('banks_ready_count')}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('banks_total_questions', { count: (bank.questions ?? []).length })}
                    </p>
                    {daysLeft !== null && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-[6px]">
                        <Icon name="ri-calendar-line text-[11px]" />
                        <span>{t('banks_days_left', { days: daysLeft })}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="flex items-center gap-2">
                    {/* Boshlash (Play) Icon Button */}
                    <Link
                      href={`/play/${bank.id}`}
                      className={`inline-flex items-center justify-center h-9 w-9 rounded-[10px] transition-all shadow-xs active:scale-95 ${
                        playableCount > 0
                          ? 'bg-med-600 hover:bg-med-500 text-white'
                          : 'pointer-events-none bg-slate-200 text-slate-400 dark:bg-[#1f2937] dark:text-slate-500 opacity-50'
                      }`}
                      title={t('banks_play_btn')}
                      data-testid={`link-play-${bank.id}`}
                    >
                      <Icon name="ri-play-fill text-lg" />
                    </Link>

                    {/* Tahrirlash (Edit) Icon Button */}
                    <Link
                      href={`/banks/${bank.id}`}
                      className="inline-flex items-center justify-center h-9 w-9 rounded-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 transition-all active:scale-95 cursor-pointer"
                      title={t('banks_edit_btn')}
                      data-testid={`link-edit-${bank.id}`}
                    >
                      <Icon name="ri-edit-line text-base" />
                    </Link>

                    {/* Imtihon Kalendari (Exam Calendar) Icon Button */}
                    <button
                      type="button"
                      onClick={() => setCalendarBank(bank)}
                      className={`relative inline-flex items-center justify-center h-9 w-9 rounded-[10px] border transition-all active:scale-95 cursor-pointer ${
                        daysLeft !== null
                          ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-white/5 dark:hover:bg-white/10 dark:text-slate-300 border-slate-200/80 dark:border-white/10'
                      }`}
                      title={daysLeft !== null ? `Imtihon: ${schedule?.examDate} (${daysLeft} kun qoldi)` : t('banks_calendar_btn')}
                    >
                      <Icon name="ri-calendar-event-line text-base" />
                      {daysLeft !== null && (
                        <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-amber-500 text-[9px] font-extrabold text-white">
                          {daysLeft}k
                        </span>
                      )}
                    </button>
                  </div>

                  {/* O'chirish (Delete) Icon Button */}
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-9 w-9 rounded-[10px] text-slate-400 hover:bg-rose-500/10 hover:text-rose-600 dark:hover:text-rose-400 transition-colors active:scale-95 cursor-pointer"
                    data-testid={`button-delete-bank-${bank.id}`}
                    title={t('banks_delete_btn')}
                    onClick={() => {
                      if (window.confirm(`«${bank.name}» to‘plamini o‘chirishni tasdiqlaysizmi?`)) {
                        deleteBank(bank.id);
                      }
                    }}
                  >
                    <Icon name="ri-delete-bin-line text-base" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      {/* Savollar qo'shish modali (Pastdan tepaga chiqadigan sheet) */}
      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            aria-label="Yopish"
            onClick={() => setOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-questions-title"
            className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-[10px] border border-slate-200/90 dark:border-white/10 border-b-0 bg-white dark:bg-[#111827] pb-safe shadow-2xl backdrop-blur-xl"
            style={{ transform: risen ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 280ms ease-out' }}
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-[10px] bg-slate-300 dark:bg-white/20" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-4">
                <div>
                  <h2 id="add-questions-title" className="font-display text-xl font-bold text-slate-900 dark:text-white">
                    Savollar qo‘shish
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Fan nomini kiriting va fayl yoki matn orqali savollarni qo‘shing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-[10px] p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white"
                  aria-label="Yopish"
                  data-testid="button-close-add-questions"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300" htmlFor="fan-name">
                    Fan nomi *
                  </label>
                  <input
                    id="fan-name"
                    className={`${controlClass} mt-1.5`}
                    value={fan}
                    onChange={(event) => setFan(event.target.value)}
                    placeholder="Masalan, Normal anatomiya"
                    data-testid="input-fan-name"
                    autoFocus
                  />
                </div>

                {/* Tabs: Fayl yuklash yoki Matn yozish */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Savollar manbasi:</span>
                    <div className="flex rounded-[10px] bg-slate-100 dark:bg-[#1f2937] p-0.5 text-xs font-medium border border-slate-200 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setMode('file')}
                        className={`rounded-[8px] px-2.5 py-1 transition-colors ${
                          mode === 'file'
                            ? 'bg-white text-slate-900 shadow-xs dark:bg-[#111827] dark:text-white font-semibold'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                        }`}
                      >
                        TXT Fayl
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode('text')}
                        className={`rounded-[8px] px-2.5 py-1 transition-colors ${
                          mode === 'text'
                            ? 'bg-white text-slate-900 shadow-xs dark:bg-[#111827] dark:text-white font-semibold'
                            : 'text-slate-500 hover:text-slate-900 dark:text-slate-400'
                        }`}
                      >
                        Matn kiritish
                      </button>
                    </div>
                  </div>

                  {mode === 'file' ? (
                    <div className="relative">
                      <input
                        id="quiz-file"
                        type="file"
                        accept=".txt,.doc,.docx,.pdf,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                        className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                        data-testid="input-quiz-file"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          event.target.value = '';
                          void handleFileChange(file);
                        }}
                      />
                      <div className="flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-[10px] border-2 border-dashed border-slate-300 bg-slate-50/80 p-4 transition-colors hover:border-med-500 dark:border-white/10 dark:bg-[#1f2937]/50 dark:hover:border-med-500/50">
                        <HiOutlinePaperClip className="h-6 w-6 text-med-600 dark:text-med-400" />
                        {fileName ? (
                          <div className="text-center">
                            <span className="text-sm font-semibold text-slate-900 dark:text-white">{fileName}</span>
                            {parsedCount !== null && (
                              <p className="text-xs text-med-600 dark:text-med-400 font-medium flex items-center justify-center gap-1">
                                <Icon name="ri-check-line" /> {parsedCount} ta savol aniqlandi
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-center">
                            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                              TXT, DOC, DOCX yoki PDF faylni tanlang
                            </span>
                            <p className="mt-0.5 text-[11px] text-slate-500">Qo‘llab-quvvatlanadi: .txt, .doc, .docx, .pdf</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <textarea
                        className={`${controlClass} min-h-28 text-xs font-mono`}
                        value={rawText}
                        onChange={(e) => setRawText(e.target.value)}
                        placeholder={`# 1-savol matni\n+ To‘g‘ri javob\n- Noto‘g‘ri javob 1\n- Noto‘g‘ri javob 2`}
                      />
                      <p className="mt-1 text-[11px] text-slate-500">
                        Masalan: har bir savol # bilan, to‘g‘ri javob + bilan, noto‘g‘ri javob - bilan boshlanadi.
                      </p>
                    </div>
                  )}
                </div>

                {error && <p className="text-sm text-rose-500 dark:text-rose-400 font-medium" role="alert">{error}</p>}

                {/* ASOSIY TAYYOR TUGMASI */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleDone}
                    data-testid="button-submit-add-questions"
                    className="btn-primary w-full !py-3 !rounded-[10px] text-base shadow-lg shadow-med-500/30 flex items-center justify-center gap-2"
                  >
                    <HiOutlineCheck className="h-5 w-5" />
                    Tayyor (Saqlash)
                  </button>
                  <p className="mt-2 text-center text-xs text-slate-500 dark:text-slate-400">
                    Agar fayl yuklanmasa, bo‘sh to‘plam yaratilib muharrir ochiladi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Savollarni o'chirish modali */}
      {deleteOpen && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-xs" aria-label="Yopish" onClick={() => setDeleteOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-questions-title"
            className="relative z-10 max-h-[88vh] w-full max-w-xl overflow-y-auto rounded-t-[10px] border border-slate-200/90 dark:border-white/10 border-b-0 bg-white dark:bg-[#111827] pb-safe shadow-2xl backdrop-blur-xl"
            style={{ transform: deleteRisen ? 'translateY(0)' : 'translateY(100%)', transition: 'transform 280ms ease-out' }}
          >
            <div className="mx-auto mt-3 h-1.5 w-12 rounded-[10px] bg-slate-300 dark:bg-white/20" />
            <div className="p-6">
              <div className="flex items-start justify-between gap-3 border-b border-slate-200/80 dark:border-white/10 pb-3">
                <h2 id="delete-questions-title" className="font-display text-xl font-bold text-slate-900 dark:text-white">Savollarni o‘chirish</h2>
                <button type="button" onClick={() => setDeleteOpen(false)} className="rounded-[10px] p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white" aria-label="Yopish">
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>
              {!banks.length && <p className="mt-4 text-sm text-slate-500">O‘chirish uchun fan yo‘q.</p>}
              <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                {banks.map((bank) => (
                  <div key={bank.id} className="flex items-center justify-between gap-3 rounded-[10px] border border-slate-200/80 bg-slate-50/70 p-3 dark:border-white/10 dark:bg-[#1f2937]/50">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">{bank.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{(bank.questions ?? []).length} ta savol</p>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded-[10px] bg-rose-500/15 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500/25 transition-colors"
                      data-testid={`button-sheet-delete-${bank.id}`}
                      onClick={() => deleteBank(bank.id)}
                    >
                      <HiOutlineTrash className="h-4 w-4" />
                      O‘chirish
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Imtihon Kalendari Modali */}
      {calendarBank && (
        <ExamCalendarModal
          bank={calendarBank}
          onClose={() => setCalendarBank(null)}
        />
      )}
    </div>
  );
}

