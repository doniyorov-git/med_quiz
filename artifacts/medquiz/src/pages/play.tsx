import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'wouter';
import { Btn, Icon, Panel } from '@/components/chrome';
import { Choices, Ring } from '@/components/choices';
import { Dropdown } from '@/components/dropdown';
import { ResultCard, bigBtn, bigBtnLine } from '@/components/result-card';
import { recordDailyWorkoutProgress, recordSolo, recordMistake, toggleSaveQuestion, getMistakes } from '@/lib/model';
import { cleanQuestion, isCorrectPick, shuffle } from '@/lib/parser';
import { useBanks, useStore } from '@/lib/store';
import { playSound } from '@/lib/sound';
import { AiExplanationModal } from '@/components/ai-explanation-modal';
import { AuscultationPlayer } from '@/components/audio-player';
import type { OrderMode, Question } from '@/lib/types';

type Run = {
  questions: Question[];
  index: number;
  picks: number[];
  locked: boolean;
  correct: number;
  fastCorrect: number;
  xp: number;
  seconds: number;
  review: { prompt: string; ok: boolean; image: string | null }[];
};

export function Play() {
  const params = useParams<{ id: string }>();
  const banks = useBanks();
  const { me } = useStore();
  const bank = banks.find((item) => item.id === params.id);
  const ready = useMemo(
    () =>
      (bank?.questions ?? [])
        .map((question) => cleanQuestion(question))
        .filter((question): question is Question => question !== null),
    [bank]
  );
  const [count, setCount] = useState(10);
  const [order, setOrder] = useState<OrderMode>('sequential');
  const [limit, setLimit] = useState(30);
  const [run, setRun] = useState<Run | null>(null);
  const [done, setDone] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    if (!run || done || run.locked || limit === 0) return;
    if (run.seconds <= 0) {
      setRun((current) => (current && !current.locked ? { ...current, locked: true, seconds: 0 } : current));
      return;
    }
    const timer = window.setTimeout(
      () => setRun((current) => (current ? { ...current, seconds: current.seconds - 1 } : current)),
      1000
    );
    return () => window.clearTimeout(timer);
  }, [done, limit, run]);

  if (!bank) {
    return (
      <Panel>
        <p>To‘plam topilmadi.</p>
        <Link href="/banks" className="mt-3 inline-flex text-sm font-semibold text-primary">
          Orqaga
        </Link>
      </Panel>
    );
  }

  const start = () => {
    let questions = [...ready];
    if (order === 'mixed') questions = shuffle(questions);
    questions = questions.slice(0, Math.min(count, questions.length));
    setDone(false);
    setRun({
      questions,
      index: 0,
      picks: [],
      locked: false,
      correct: 0,
      fastCorrect: 0,
      xp: 0,
      seconds: limit,
      review: [],
    });
  };

  const maxAvailable = Math.max(ready.length, 1);
  const countOptions = Array.from(
    new Set([5, 10, 15, 20, 25, 30, maxAvailable].filter((n) => n <= maxAvailable && n > 0))
  )
    .sort((a, b) => a - b)
    .map((num) => ({
      value: num,
      label: num === maxAvailable ? `${num} ta (barchasi)` : `${num} ta savol`,
    }));

  const orderOptions = [
    { value: 'sequential', label: 'Ketma-ket tartibda' },
    { value: 'mixed', label: 'Aralash tasodifiy' },
  ];

  const timeOptions = [
    { value: 15, label: '15 soniya (tezkor)' },
    { value: 30, label: '30 soniya (standart)' },
    { value: 60, label: '60 soniya (batafsil)' },
    { value: 0, label: 'Vaqtsiz (cheksiz)' },
  ];

  if (!run) {
    return (
      <div className="mx-auto max-w-xl space-y-4">
        <Link
          href={`/banks/${bank.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
        >
          <Icon name="ri-arrow-left-line" /> Tahrirlash
        </Link>
        <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {bank.name}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {ready.length} ta yaroqli savol. Savollar soni, tartibi va vaqtini custom menyudan tanlang.
        </p>
        {!ready.length && (
          <p className="mt-4 text-sm text-rose-500 font-medium">
            Avval kamida bitta to‘liq savol kiriting: matn, ikkita variant va bitta to‘g‘ri javob (+).
          </p>
        )}
        <Panel className="mt-4 space-y-4">
          <Dropdown
            label="Savollar soni"
            value={count}
            options={countOptions.length ? countOptions : [{ value: count, label: `${count} ta` }]}
            onChange={(val) => setCount(Number(val))}
          />

          <Dropdown
            label="Savollar tartibi"
            value={order}
            options={orderOptions}
            onChange={(val) => setOrder(val as OrderMode)}
          />

          <Dropdown
            label="Har bir savol uchun vaqt"
            value={limit}
            options={timeOptions}
            onChange={(val) => setLimit(Number(val))}
          />

          <Btn
            className="mt-6 w-full shadow-lg shadow-med-500/25"
            testId="button-start-quiz"
            disabled={!ready.length}
            onClick={start}
          >
            Boshlash
          </Btn>
        </Panel>
      </div>
    );
  }

  if (done) {
    const percent = run.questions.length ? Math.round((run.correct / run.questions.length) * 100) : 0;
    return (
      <div className="px-1">
        <ResultCard
          percent={percent}
          correct={run.correct}
          total={run.questions.length}
          xp={run.xp}
          primary={
            <button
              type="button"
              className={bigBtn}
              onClick={() => {
                setRun(null);
                setDone(false);
              }}
            >
              <Icon name="ri-refresh-line" /> Yana urinish
            </button>
          }
          secondary={
            <Link href="/banks" className={bigBtnLine}>
              To‘plamlarga qaytish
            </Link>
          }
        />
      </div>
    );
  }

  const question = run.questions[run.index];
  if (!question) return null;
  const multi = question.options.filter((option) => option.correct).length > 1;

  const toggle = (index: number) => {
    if (run.locked) return;
    setRun((current) => {
      if (!current || current.locked) return current;
      if (!multi) return { ...current, picks: [index] };
      const picks = current.picks.includes(index)
        ? current.picks.filter((item) => item !== index)
        : [...current.picks, index];
      return { ...current, picks };
    });
  };

  const finishQuestion = () => {
    if (!run.locked) return;
    const ok = isCorrectPick(question, run.picks);
    if (!ok && bank) {
      recordMistake(bank.id, bank.name, question, run.picks);
    }
    const fast = ok && limit > 0 && run.seconds >= limit - 10;
    const gained = ok ? 10 + (fast ? 5 : 0) : 0;
    const review = [...run.review, { prompt: question.prompt, ok, image: question.image }];
    const correct = run.correct + (ok ? 1 : 0);
    const fastCorrect = run.fastCorrect + (fast ? 1 : 0);
    const xp = run.xp + gained;
    if (run.index >= run.questions.length - 1) {
      if (me) {
        recordSolo(me, {
          bankName: bank.name,
          correct,
          total: run.questions.length,
          xp,
          fastCorrect,
          perfect: correct === run.questions.length,
        });
        const accuracy = Math.round((correct / run.questions.length) * 100);
        recordDailyWorkoutProgress(bank.id, run.questions.length, accuracy);
      }
      setRun({ ...run, correct, fastCorrect, xp, review, locked: true });
      setDone(true);
      return;
    }
    setRun({ ...run, index: run.index + 1, picks: [], locked: false, correct, fastCorrect, xp, review, seconds: limit });
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {bank.name} · {run.index + 1} / {run.questions.length}
        </p>
        {limit > 0 ? (
          <Ring seconds={run.seconds} total={limit} />
        ) : (
          <span className="text-xs text-muted-foreground">Vaqtsiz</span>
        )}
      </div>
      <div className="h-1.5 overflow-hidden rounded-[10px] bg-muted">
        <div
          className="h-full bg-primary"
          style={{ width: `${((run.index + (run.locked ? 1 : 0)) / run.questions.length) * 100}%` }}
        />
      </div>
      <Panel className="mt-3 sm:mt-5 p-3.5 sm:p-6">
        <div className="flex items-start justify-between gap-3 mb-2 sm:mb-3">
          <h2 className="text-sm sm:text-base font-semibold leading-snug sm:leading-relaxed text-slate-900 dark:text-white flex-1">{question.prompt}</h2>
          <button
            type="button"
            onClick={() => toggleSaveQuestion(question, bank.id, bank.name, run.picks)}
            className="p-1.5 rounded-[8px] text-slate-400 hover:text-emerald-600 hover:bg-emerald-500/10 dark:hover:bg-emerald-500/15 transition-colors shrink-0 cursor-pointer"
            title="Savolni saqlash"
          >
            <Icon name={getMistakes().some((m) => m.questionId === question.id && m.saved) ? 'ri-bookmark-fill text-emerald-600 dark:text-emerald-400' : 'ri-bookmark-line'} className="text-lg" />
          </button>
        </div>
        {question.image && (
          <img src={question.image} alt="" className="mb-2 sm:mb-4 max-h-36 sm:max-h-60 w-full rounded-[10px] object-contain" />
        )}
        {question.audio && (
          <AuscultationPlayer src={question.audio} title="Auskultatsiya yozuvi" />
        )}
        <Choices question={question} picks={run.picks} locked={run.locked} onPick={toggle} />
        <div className="mt-3 sm:mt-5 flex items-center justify-between gap-2 flex-wrap">
          {run.locked ? (
            <button
              type="button"
              onClick={() => setShowAiModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <Icon name="ri-sparkling-fill" className="text-emerald-500 text-sm" />
              <span>AI Klinik Tushuntirish</span>
            </button>
          ) : <div />}
          <div className="flex items-center gap-2">
            {!run.locked ? (
              <Btn
                className="py-1.5 px-3.5 text-xs sm:text-sm"
                testId="button-check"
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
              <Btn className="py-1.5 px-3.5 text-xs sm:text-sm" testId="button-next" onClick={finishQuestion}>
                {run.index === run.questions.length - 1 ? 'Natija' : 'Keyingisi'}
              </Btn>
            )}
          </div>
        </div>
      </Panel>

      <AiExplanationModal
        isOpen={showAiModal}
        onClose={() => setShowAiModal(false)}
        question={question}
        pickedIndices={run.picks}
      />
    </div>
  );
}
