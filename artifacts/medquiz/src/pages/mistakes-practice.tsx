import { useMemo, useState } from 'react';
import { Link } from 'wouter';
import { Btn, Icon, Panel } from '@/components/chrome';
import { Choices } from '@/components/choices';
import { ResultCard, bigBtn, bigBtnLine } from '@/components/result-card';
import { recordMistake, removeMistake } from '@/lib/model';
import { isCorrectPick, shuffle } from '@/lib/parser';
import { useBanks, useMistakes } from '@/lib/store';
import { playSound } from '@/lib/sound';
import type { MistakeItem, Question } from '@/lib/types';

type Result = { item: MistakeItem; ok: boolean; picks: number[] };

function toQuestion(m: MistakeItem): Question {
  return { id: m.questionId, prompt: m.prompt, options: m.options, image: m.image };
}

/**
 * Test built ONLY from the questions the student got wrong (or saved).
 * Route: /mistakes/practice?scope=all|saved|<bankId>
 * A correct answer marks the mistake as mastered and removes it from the list (saved ones stay).
 */
export function MistakesPractice() {
  const mistakes = useMistakes();
  const banks = useBanks();

  const scope = useMemo(() => {
    if (typeof window === 'undefined') return 'all';
    return new URLSearchParams(window.location.search).get('scope') || 'all';
  }, []);

  const scopeName = useMemo(() => {
    if (scope === 'all') return 'Barcha xatolarim';
    if (scope === 'saved') return 'Saqlangan savollar';
    return banks.find((b) => b.id === scope)?.name ?? mistakes.find((m) => m.bankId === scope)?.bankName ?? 'Fan';
  }, [scope, banks, mistakes]);

  // Snapshot the pool once at start so removing mastered items mid-run doesn't reshuffle the test.
  const [run, setRun] = useState<{ items: MistakeItem[]; index: number; picks: number[]; locked: boolean; results: Result[] } | null>(null);
  const [done, setDone] = useState(false);
  const [count, setCount] = useState(10);
  const [mix, setMix] = useState(true);

  const pool = useMemo(
    () =>
      mistakes.filter((m) => {
        if (!Array.isArray(m.options) || m.options.length < 2 || !m.options.some((o) => o.correct)) return false;
        if (scope === 'all') return true;
        if (scope === 'saved') return Boolean(m.saved);
        return m.bankId === scope;
      }),
    [mistakes, scope],
  );

  const options = useMemo(() => {
    const max = Math.max(pool.length, 1);
    const set = new Set([5, 10, 15, 20, 30, max].filter((n) => n <= max && n > 0));
    return Array.from(set).sort((a, b) => a - b);
  }, [pool.length]);

  const start = () => {
    const base = mix ? shuffle(pool) : [...pool];
    const items = base.slice(0, Math.min(count, base.length));
    if (!items.length) return;
    setDone(false);
    setRun({ items, index: 0, picks: [], locked: false, results: [] });
  };

  const back = (
    <Link href={scope === 'saved' ? '/mistakes?tab=saved' : '/mistakes'} className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white">
      <Icon name="ri-arrow-left-line" /> Xatolarim
    </Link>
  );

  /* ---------- setup ---------- */
  if (!run) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        {back}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-2xl text-rose-600 dark:text-rose-400">
            <Icon name="ri-refresh-line" />
          </div>
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Xatolar ustida ishlash</h1>
            <p className="truncate text-sm text-slate-500 dark:text-slate-400">{scopeName}</p>
          </div>
        </div>

        {!pool.length ? (
          <Panel className="p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-3xl text-emerald-600">
              <Icon name="ri-checkbox-circle-line" />
            </div>
            <p className="mt-3 font-semibold text-slate-900 dark:text-white">Bu bo‘limda mashq qilinadigan savol yo‘q</p>
            <p className="mt-1 text-sm text-slate-500">Test yechganingizda xato qilgan savollaringiz shu yerga tushadi.</p>
            <Link href="/banks" className="btn-primary mt-4 !rounded-[10px] text-sm">
              <Icon name="ri-folders-line" /> To‘plamlarga o‘tish
            </Link>
          </Panel>
        ) : (
          <Panel className="space-y-5 p-5">
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-[12px] bg-rose-50 p-3 dark:bg-rose-500/10">
                <p className="text-2xl font-bold tabular-nums text-rose-600 dark:text-rose-400">{pool.length}</p>
                <p className="text-xs text-slate-500">mashq uchun savol</p>
              </div>
              <div className="rounded-[12px] bg-green-50 p-3 dark:bg-green-500/10">
                <p className="text-2xl font-bold tabular-nums text-green-600 dark:text-green-400">{Math.min(count, pool.length)}</p>
                <p className="text-xs text-slate-500">shu testda</p>
              </div>
            </div>

            <div>
              <p className="input-label">Savollar soni</p>
              <div className="flex flex-wrap gap-2">
                {options.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={`rounded-[10px] border px-3.5 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer ${
                      Math.min(count, pool.length) === n
                        ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-emerald-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'
                    }`}
                  >
                    {n === pool.length ? `${n} (barchasi)` : n}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex cursor-pointer items-center justify-between rounded-[12px] border border-slate-200 bg-slate-50/70 px-3.5 py-3 dark:border-white/10 dark:bg-white/5">
              <span>
                <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">Aralashtirish</span>
                <span className="block text-xs text-slate-500">Savollar tasodifiy tartibda chiqadi</span>
              </span>
              <input type="checkbox" checked={mix} onChange={(e) => setMix(e.target.checked)} className="h-5 w-5 accent-emerald-600" />
            </label>

            <p className="rounded-[10px] bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <Icon name="ri-lightbulb-flash-line" className="mr-1" />
              To‘g‘ri javob bergan savolingiz “o‘zlashtirildi” deb xatolar ro‘yxatidan olib tashlanadi (saqlanganlar qoladi).
            </p>

            <Btn className="w-full shadow-lg shadow-med-500/25" onClick={start}>
              <Icon name="ri-play-circle-line" className="text-lg" /> Testni boshlash
            </Btn>
          </Panel>
        )}
      </div>
    );
  }

  /* ---------- finished ---------- */
  if (done) {
    const correct = run.results.filter((r) => r.ok).length;
    const total = run.results.length;
    const percent = total ? Math.round((correct / total) * 100) : 0;
    const wrong = run.results.filter((r) => !r.ok);
    return (
      <div className="px-1">
        <ResultCard
          percent={percent}
          correct={correct}
          total={total}
          primary={
            wrong.length > 0 ? (
              <button
                type="button"
                className={bigBtn}
                onClick={() => {
                  setDone(false);
                  setRun({ items: wrong.map((r) => r.item), index: 0, picks: [], locked: false, results: [] });
                }}
              >
                <Icon name="ri-refresh-line" /> Qolgan {wrong.length} tasini qayta yechish
              </button>
            ) : (
              <Link href="/mistakes" className={bigBtn}>
                <Icon name="ri-medal-line" /> Hammasi o‘zlashtirildi!
              </Link>
            )
          }
          secondary={
            <button
              type="button"
              className={bigBtnLine}
              onClick={() => {
                setRun(null);
                setDone(false);
              }}
            >
              Qayta sozlash
            </button>
          }
        />
      </div>
    );
  }

  /* ---------- question ---------- */
  const item = run.items[run.index];
  const question = toQuestion(item);
  const multi = question.options.filter((o) => o.correct).length > 1;

  const pick = (index: number) => {
    if (run.locked) return;
    setRun((cur) => {
      if (!cur || cur.locked) return cur;
      if (!multi) return { ...cur, picks: [index] };
      return { ...cur, picks: cur.picks.includes(index) ? cur.picks.filter((p) => p !== index) : [...cur.picks, index] };
    });
  };

  const next = () => {
    if (!run.locked) return;
    const ok = isCorrectPick(question, run.picks);
    // update the persistent mistakes list
    if (ok) {
      if (!item.saved) removeMistake(item.id);
    } else {
      recordMistake(item.bankId, item.bankName, question, run.picks);
    }
    const results = [...run.results, { item, ok, picks: run.picks }];
    if (run.index >= run.items.length - 1) {
      setRun({ ...run, results });
      setDone(true);
      return;
    }
    setRun({ ...run, index: run.index + 1, picks: [], locked: false, results });
  };

  const progress = ((run.index + (run.locked ? 1 : 0)) / run.items.length) * 100;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-sm text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-rose-600 dark:text-rose-400">Xatolar</span> · {item.bankName} · {run.index + 1} / {run.items.length}
        </p>
        <button
          type="button"
          onClick={() => {
            setRun(null);
            setDone(false);
          }}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5"
        >
          <Icon name="ri-close-line" /> Chiqish
        </button>
      </div>
      <div className="h-1.5 overflow-hidden rounded-[10px] bg-slate-200 dark:bg-white/10">
        <div className="h-full bg-rose-500 transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>

      <Panel className="mt-3 p-3.5 sm:mt-5 sm:p-6">
        <h2 className="mb-2 text-sm font-semibold leading-snug text-slate-900 dark:text-white sm:mb-3 sm:text-base sm:leading-relaxed">{question.prompt}</h2>
        {question.image && <img src={question.image} alt="" className="mb-2 max-h-36 w-full rounded-[10px] object-contain sm:mb-4 sm:max-h-60" />}
        <Choices question={question} picks={run.picks} locked={run.locked} onPick={pick} />

        {run.locked && (
          <p
            className={`mt-3 rounded-[10px] px-3 py-2 text-xs font-semibold ${
              isCorrectPick(question, run.picks)
                ? 'bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
            }`}
          >
            {isCorrectPick(question, run.picks) ? (
              <>
                <Icon name="ri-medal-line" className="mr-1" />
                Barakalla! Bu xato o‘zlashtirildi.
              </>
            ) : (
              <>
                <Icon name="ri-information-line" className="mr-1" />
                To‘g‘ri javob yuqorida yashil rangda. Bu savol ro‘yxatda qoladi.
              </>
            )}
          </p>
        )}

        <div className="mt-3 flex justify-end sm:mt-5">
          {!run.locked ? (
            <Btn
              className="px-3.5 py-1.5 text-xs sm:text-sm"
              disabled={!run.picks.length}
              onClick={() => {
                const ok = isCorrectPick(question, run.picks);
                playSound(ok ? 'correct' : 'wrong');
                setRun({ ...run, locked: true });
              }}
            >
              Tekshirish
            </Btn>
          ) : (
            <Btn className="px-3.5 py-1.5 text-xs sm:text-sm" onClick={next}>
              {run.index === run.items.length - 1 ? 'Natija' : 'Keyingisi'}
            </Btn>
          )}
        </div>
      </Panel>
    </div>
  );
}
