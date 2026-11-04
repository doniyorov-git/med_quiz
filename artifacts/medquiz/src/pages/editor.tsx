import { useState } from 'react';
import { Link, useLocation, useParams } from 'wouter';
import {
  HiOutlineArrowLeft,
  HiOutlineCheck,
  HiOutlineDownload,
  HiOutlinePhotograph,
  HiOutlinePlus,
  HiOutlineTrash,
  HiOutlineUpload,
} from 'react-icons/hi';
import { Btn, Field, Icon, fieldClass } from '@/components/chrome';
import { ImageField } from '@/components/image-field';
import { deleteBank, renameBank, replaceQuestions } from '@/lib/model';
import { blankQuestion, cleanQuestion, parseQuizText, serializeQuiz, uid, extractTextFromFile } from '@/lib/parser';
import { useBanks } from '@/lib/store';
import type { Question } from '@/lib/types';

export function Editor() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const banks = useBanks();
  const bank = banks.find((item) => item.id === params.id);
  const [open, setOpen] = useState<string | null>(bank?.questions[0]?.id ?? null);
  const [error, setError] = useState('');
  const [justSaved, setJustSaved] = useState<string | null>(null);

  if (!bank) {
    return (
      <div className="glass-card p-8 text-center max-w-md mx-auto">
        <p className="text-lg font-semibold text-slate-800 dark:text-white">To‘plam topilmadi.</p>
        <Link href="/banks" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-med-600 dark:text-med-400 hover:underline">
          <HiOutlineArrowLeft className="h-4 w-4" /> To‘plamlarga qaytish
        </Link>
      </div>
    );
  }

  const save = (questions: Question[]) => replaceQuestions(bank.id, questions);
  const playable = (bank.questions ?? []).filter((question) => cleanQuestion(question)).length;

  const update = (questionId: string, patch: Partial<Question>) => {
    save((bank.questions ?? []).map((question) => (question.id === questionId ? { ...question, ...patch } : question)));
  };

  const handleDoneQuestion = (questionId: string) => {
    setOpen(null);
    setJustSaved(questionId);
    window.setTimeout(() => setJustSaved(null), 2000);
  };

  const handleAddQuestion = () => {
    const question = blankQuestion();
    save([...(bank.questions ?? []), question]);
    setOpen(question.id);
    // Smooth scroll to bottom
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/banks" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors">
          <HiOutlineArrowLeft className="h-4 w-4" /> To‘plamlar
        </Link>
        <span className="badge-primary">
          {playable} / {(bank.questions ?? []).length} tayyor savol
        </span>
      </div>

      <div className="glass-card p-4 sm:p-6">
        <div className="space-y-1">
          <label className="input-label flex items-center justify-between">
            <span>To‘plam nomi</span>
            <span className="text-xs font-normal text-slate-500 dark:text-slate-400">
              {playable} ta tayyor savol
            </span>
          </label>
          <div className="relative">
            <input
              className={`${fieldClass} text-base sm:text-lg font-bold pr-10`}
              value={bank.name}
              data-testid="input-bank-name"
              onChange={(event) => renameBank(bank.id, event.target.value)}
            />
            <Icon name="ri-edit-line" className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-base" />
          </div>
        </div>

        {/* Primary CTA: Testni boshlash */}
        <Link
          href={`/play/${bank.id}`}
          className={`mt-4 w-full flex items-center justify-center gap-2 rounded-[10px] py-3 px-4 font-bold text-sm sm:text-base transition-all shadow-md active:scale-[0.99] ${
            playable
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              : 'pointer-events-none bg-slate-200 text-slate-400 dark:bg-white/10 dark:text-slate-500 opacity-60'
          }`}
          data-testid="link-start-bank"
        >
          <Icon name="ri-play-fill" className="text-xl" />
          <span>Testni boshlash</span>
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
            {playable} ta savol
          </span>
        </Link>

        {/* Secondary Actions: Clean 2x2 / 4x1 Toolbar */}
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={handleAddQuestion}
            className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-[10px] bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 text-xs font-bold transition-all active:scale-95 cursor-pointer"
            data-testid="button-add-question"
          >
            <Icon name="ri-add-line" className="text-base" />
            <span>Savol qo‘shish</span>
          </button>

          <label className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-[10px] bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 text-xs font-bold cursor-pointer transition-all active:scale-95">
            <Icon name="ri-upload-2-line" className="text-base text-primary" />
            <span>Fayl yuklash</span>
            <input
              type="file"
              accept=".txt,.doc,.docx,.pdf,text/plain,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={async (event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (!file) return;
                try {
                  const text = await extractTextFromFile(file);
                  const parsed = parseQuizText(text);
                  if (!parsed.questions.length) {
                    setError('Fayldan savol o‘qilmadi. Fayl formati: # Savol, + To‘g‘ri, - Noto‘g‘ri javob.');
                    return;
                  }
                  setError('');
                  save([...bank.questions, ...parsed.questions]);
                } catch {
                  setError('Faylni o‘qishda xatolik yuz berdi.');
                }
              }}
            />
          </label>

          <button
            type="button"
            onClick={() => {
              const blob = new Blob([serializeQuiz(bank.questions)], { type: 'text/plain;charset=utf-8' });
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${bank.name || 'test'}.txt`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-[10px] bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-white/10 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <Icon name="ri-download-2-line" className="text-base" />
            <span>Yuklab olish</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (window.confirm(`«${bank.name}» to‘plamini o‘chirishni xohlaysizmi?`)) {
                deleteBank(bank.id);
                setLocation('/banks');
              }
            }}
            className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/25 text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <Icon name="ri-delete-bin-line" className="text-base" />
            <span>O‘chirish</span>
          </button>
        </div>

        {/* Tip Notice */}
        <div className="mt-3.5 flex items-start gap-2 p-2.5 rounded-[10px] bg-amber-500/10 border border-amber-500/20 text-[11px] sm:text-xs text-amber-800 dark:text-amber-300">
          <Icon name="ri-information-fill" className="text-amber-600 dark:text-amber-400 text-sm shrink-0 mt-0.5" />
          <span>Savolda kamida 2 ta variant va bitta «+» (to‘g‘ri javob) bo‘lishi shart. Agar bir nechta «+» tanlansa, savol ko‘p javobli bo‘ladi.</span>
        </div>

        {error && <p className="mt-3 text-sm text-rose-500 dark:text-rose-400" role="alert">{error}</p>}
      </div>

      {/* Questions list */}
      <div className="space-y-3.5">
        {!(bank.questions ?? []).length && (
          <div className="glass-card p-10 text-center">
            <p className="text-slate-500 dark:text-slate-400">Hozircha hech qanday savol yo‘q.</p>
            <Btn kind="primary" className="mt-4" onClick={handleAddQuestion}>
              <HiOutlinePlus className="h-4 w-4" /> Birinchi savolni qo‘shish
            </Btn>
          </div>
        )}

        {(bank.questions ?? []).map((question, index) => {
          const expanded = open === question.id;
          const isComplete = Boolean(cleanQuestion(question));
          const hasImage = Boolean(question.image);
          const wasJustSaved = justSaved === question.id;

          return (
            <article
              key={question.id}
              className={`min-w-0 overflow-hidden rounded-[10px] border transition-all duration-200 ${
                expanded
                  ? 'border-med-500/50 bg-white dark:bg-[#111827] shadow-md'
                  : 'glass-card hover:border-slate-300 dark:hover:border-white/15'
              }`}
            >
              {/* Accordion header */}
              <div
                className="flex w-full min-w-0 items-center justify-between gap-3 px-4 py-3.5 cursor-pointer select-none"
                onClick={() => setOpen(expanded ? null : question.id)}
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-[6px] text-xs font-bold ${
                    isComplete
                      ? 'bg-med-500/15 text-med-700 dark:text-med-400'
                      : 'bg-slate-200 text-slate-600 dark:bg-[#1f2937] dark:text-slate-400'
                  }`}>
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-normal break-words text-sm font-medium leading-5 text-slate-900 dark:text-white">
                      {question.prompt || <span className="italic text-slate-400">Yangi bo‘sh savol</span>}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      {question.options.length} ta variant · {question.options.filter((o) => o.correct).length} ta to‘g‘ri javob
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {hasImage && (
                    <span title="Savolda rasm bor" className="text-med-600 dark:text-med-400">
                      <HiOutlinePhotograph className="h-5 w-5" />
                    </span>
                  )}
                  {wasJustSaved ? (
                    <span className="badge bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 text-xs !rounded-[10px] flex items-center gap-1">
                      <Icon name="ri-check-line" /> Saqlandi!
                    </span>
                  ) : isComplete ? (
                    <span className="badge-primary text-xs !rounded-[10px]">
                      Tayyor
                    </span>
                  ) : (
                    <span className="badge bg-amber-500/15 text-amber-700 dark:text-amber-400 text-xs !rounded-[10px]">
                      Chala
                    </span>
                  )}
                  {expanded && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDoneQuestion(question.id);
                      }}
                      className="inline-flex items-center gap-1 rounded-[10px] bg-med-600 px-3 py-1 text-xs font-semibold text-white shadow-xs hover:bg-med-500 transition-colors"
                      data-testid={`button-done-quick-${index}`}
                    >
                      <HiOutlineCheck className="h-3.5 w-3.5" /> Tayyor
                    </button>
                  )}
                </div>
              </div>

              {/* Accordion content */}
              {expanded && (
                <div className="space-y-4 border-t border-slate-200/80 dark:border-white/10 p-4 sm:p-5 bg-slate-50/50 dark:bg-[#0f172a]/50">
                  <Field label="Savol matni">
                    <textarea
                      className={`${fieldClass} min-h-24`}
                      value={question.prompt}
                      placeholder="Savol matnini kiriting..."
                      data-testid={`input-prompt-${index}`}
                      onChange={(event) => update(question.id, { prompt: event.target.value })}
                    />
                  </Field>

                  <ImageField
                    value={question.image}
                    onChange={(image) => update(question.id, { image })}
                    label="Savol rasmi (ixtiyoriy) — yuklash, aylantirish, olib tashlash"
                  />

                  <div className="space-y-2.5">
                    <p className="input-label">Javob variantlari (to‘g‘ri javob uchun «+» belgisini bosing):</p>
                    {question.options.map((option, optionIndex) => (
                      <div key={option.id} className="flex items-center gap-2">
                        <button
                          type="button"
                          className={`h-10 w-10 shrink-0 rounded-[10px] text-base font-bold transition-all ${
                            option.correct
                              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-500/30'
                              : 'border border-slate-300 bg-white text-slate-500 hover:bg-slate-100 dark:border-white/10 dark:bg-[#1f2937] dark:text-slate-400'
                          }`}
                          title={option.correct ? 'To‘g‘ri javob (tanlangan)' : 'To‘g‘ri javob qilish uchun bosing'}
                          aria-label={option.correct ? 'To‘g‘ri javob' : 'Noto‘g‘ri javob'}
                          onClick={() =>
                            update(question.id, {
                              options: question.options.map((item) =>
                                item.id === option.id ? { ...item, correct: !item.correct } : item,
                              ),
                            })
                          }
                        >
                          {option.correct ? <Icon name="ri-check-line" /> : <Icon name="ri-subtract-line" />}
                        </button>
                        <input
                          className={fieldClass}
                          value={option.text}
                          placeholder={`Variant ${String.fromCharCode(65 + optionIndex)}`}
                          onChange={(event) =>
                            update(question.id, {
                              options: question.options.map((item) =>
                                item.id === option.id ? { ...item, text: event.target.value } : item,
                              ),
                            })
                          }
                        />
                        <button
                          type="button"
                          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] text-slate-400 hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                          aria-label="Variantni o‘chirish"
                          title="Variantni o‘chirish"
                          onClick={() =>
                            update(question.id, {
                              options: question.options.filter((item) => item.id !== option.id),
                            })
                          }
                        >
                          <Icon name="ri-close-line" className="text-lg" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Actions & Tayyor button */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-white/5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Btn
                        kind="primary"
                        testId={`button-done-question-${index}`}
                        onClick={() => handleDoneQuestion(question.id)}
                        className="!px-6 shadow-md"
                      >
                        <HiOutlineCheck className="h-4 w-4" /> Tayyor
                      </Btn>
                      <Btn
                        kind="line"
                        onClick={() =>
                          update(question.id, {
                            options: [...question.options, { id: uid('o'), text: '', correct: false }],
                          })
                        }
                      >
                        <HiOutlinePlus className="h-4 w-4" /> Variant qo‘shish
                      </Btn>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <Btn
                        kind="quiet"
                        className="text-xs"
                        onClick={() => {
                          const next = [...bank.questions];
                          if (index > 0) {
                            const previous = next[index - 1]!;
                            next[index - 1] = next[index]!;
                            next[index] = previous;
                            save(next);
                          }
                        }}
                      >
                        Yuqoriga
                      </Btn>
                      <Btn
                        kind="quiet"
                        className="text-xs"
                        onClick={() => {
                          const next = [...bank.questions];
                          if (index < next.length - 1) {
                            const following = next[index + 1]!;
                            next[index + 1] = next[index]!;
                            next[index] = following;
                            save(next);
                          }
                        }}
                      >
                        Pastga
                      </Btn>
                      <Btn
                        kind="danger"
                        className="text-xs"
                        onClick={() => save((bank.questions ?? []).filter((item) => item.id !== question.id))}
                      >
                        <HiOutlineTrash className="h-4 w-4" /> Savolni o‘chirish
                      </Btn>
                    </div>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

