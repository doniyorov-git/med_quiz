import { useEffect, useState, useMemo } from 'react';
import { useLocation } from 'wouter';
import { Btn, Icon } from '@/components/chrome';
import { dayKey, getBankSchedule, setBankExamDate, parseDateSafe, formatDateSafe } from '@/lib/model';
import type { Bank, BankExamSchedule } from '@/lib/types';

interface ExamCalendarModalProps {
  bank: Bank | null;
  onClose: () => void;
  onScheduleChange?: (schedule: BankExamSchedule) => void;
}

const MONTH_NAMES_UZ = [
  'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
];

const WEEKDAYS_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

export function ExamCalendarModal({ bank, onClose, onScheduleChange }: ExamCalendarModalProps) {
  const [, setLocation] = useLocation();
  const [risen, setRisen] = useState(false);
  const [schedule, setSchedule] = useState<BankExamSchedule | undefined>(
    bank ? getBankSchedule(bank.id) : undefined
  );

  const [examDate, setExamDate] = useState<string>(() => {
    if (schedule?.examDate) return schedule.examDate;
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return dayKey(d);
  });

  const [editingDate, setEditingDate] = useState(false);
  const [tempExamDate, setTempExamDate] = useState(examDate);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Month navigation in calendar
  const today = useMemo(() => new Date(), []);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-indexed

  // Selected date inspector
  const [selectedDateStr, setSelectedDateStr] = useState<string>(dayKey(today));

  useEffect(() => {
    if (!bank) {
      setRisen(false);
      return;
    }
    const frame = requestAnimationFrame(() => setRisen(true));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('keydown', onKey);
    };
  }, [bank, onClose]);

  if (!bank) return null;

  const totalQuestions = (bank.questions ?? []).length;

  const applyExamDate = (newDate: string) => {
    if (!newDate) return;
    const updated = setBankExamDate(bank.id, newDate, totalQuestions);
    setExamDate(newDate);
    setSchedule(updated);
    setEditingDate(false);
    if (onScheduleChange) {
      onScheduleChange(updated);
    }
    setToastMessage(`Imtihon sanasi ${formatDateSafe(newDate)} ga belgilandi!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveDate = () => {
    applyExamDate(tempExamDate);
  };

  const setPresetDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    applyExamDate(dayKey(d));
  };

  const todayStr = dayKey(today);
  const targetTime = parseDateSafe(examDate).getTime();
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const daysLeft = Math.max(0, Math.ceil((targetTime - now) / (1000 * 60 * 60 * 24)));
  const dailyTarget =
    schedule?.workouts[todayStr]?.questionCount ||
    (daysLeft > 0 ? Math.max(5, Math.ceil(totalQuestions / daysLeft)) : 10);

  // Stats calculation
  const totalCompletedWorkouts = useMemo(() => {
    if (!schedule?.workouts) return 0;
    return Object.values(schedule.workouts).filter((w) => w.completed).length;
  }, [schedule]);

  const avgAccuracy = useMemo(() => {
    if (!schedule?.workouts) return 0;
    const completed = Object.values(schedule.workouts).filter(
      (w) => w.completed && typeof w.accuracy === 'number'
    );
    if (completed.length === 0) return 0;
    const sum = completed.reduce((acc, cur) => acc + (cur.accuracy || 0), 0);
    return Math.round(sum / completed.length);
  }, [schedule]);

  const prepProgressPercent = useMemo(() => {
    if (totalQuestions === 0) return 0;
    const totalAnswered = Object.values(schedule?.workouts || {}).reduce(
      (acc, w) => acc + (w.completed ? w.questionCount : 0),
      0
    );
    return Math.min(100, Math.round((totalAnswered / totalQuestions) * 100));
  }, [schedule, totalQuestions]);

  // Calendar Grid builder for currentMonth / currentYear
  const monthCalendarData = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dObj = new Date(currentYear, currentMonth, d);
      const dStr = dayKey(dObj);
      const isToday = dStr === todayStr;
      const isExam = dStr === examDate;
      const workout = schedule?.workouts[dStr];
      const isPast = dObj.getTime() < now;
      days.push({
        dayNum: d,
        dateStr: dStr,
        dateObj: dObj,
        isToday,
        isExam,
        workout,
        isPast,
      });
    }

    return days;
  }, [currentYear, currentMonth, todayStr, examDate, schedule, now]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDateStr(todayStr);
  };

  const startWorkoutForSelectedDate = () => {
    onClose();
    setLocation(`/play/${bank.id}`);
  };

  // Selected date workout info
  const selectedWorkout = schedule?.workouts[selectedDateStr];
  const isSelectedExam = selectedDateStr === examDate;
  const isSelectedToday = selectedDateStr === todayStr;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${bank.name} imtihon taqvimi`}
      className={`fixed inset-0 z-[100] flex flex-col bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-white transition-opacity duration-300 ${
        risen ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-xl animate-in fade-in slide-in-from-top-4 duration-200">
          <Icon name="ri-checkbox-circle-fill" className="text-base" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Bar - Clean with NO ESC button */}
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0e1422]/95 backdrop-blur-md shadow-xs shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Orqaga / Yopish"
          >
            <Icon name="ri-arrow-left-line" className="text-lg" />
          </button>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-primary/10 text-primary">
              <Icon name="ri-calendar-check-fill" className="text-xl" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {bank.name}
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-[8px] bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
                  <Icon name="ri-heart-pulse-fill" className="text-xs" /> Tibbiyot imtihoni rejasi
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                Kunlik intervalli takrorlash va mashg‘ulotlar jadvali
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold text-xs border border-amber-500/25">
            <Icon name="ri-alarm-warning-fill" className="text-sm" />
            <span>{daysLeft > 0 ? `${daysLeft} kun qoldi` : 'Imtihon kuni!'}</span>
          </div>

          {/* Clean Close X Button without any ESC text */}
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
            title="Yopish"
          >
            <Icon name="ri-close-line" className="text-xl" />
          </button>
        </div>
      </header>

      {/* Main Fullscreen Body */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full space-y-6">
        {/* Hero Section Banner */}
        <section className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600 via-teal-700 to-indigo-800 p-5 sm:p-7 text-white shadow-lg">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-white/20 backdrop-blur-md text-white text-xs font-semibold">
                <Icon name="ri-flag-fill" className="text-amber-300" /> Belgilangan Imtihon Sanasi
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {formatDateSafe(examDate, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                Ushbu fandan muvaffaqiyatli o‘tish uchun har kuni belgilangan me’yorni bajaring. Spaced repetition algoritmi eslab qolish samaradorligini 3 barobarga oshiradi.
              </p>

              {/* Quick Preset Buttons */}
              <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
                <span className="text-emerald-200 text-[11px] font-medium mr-1">Tezkor muddat:</span>
                <button
                  type="button"
                  onClick={() => setPresetDays(7)}
                  className="px-2.5 py-1 rounded-[8px] bg-white/15 hover:bg-white/25 text-white font-medium transition-colors"
                >
                  +7 kun
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDays(14)}
                  className="px-2.5 py-1 rounded-[8px] bg-white/15 hover:bg-white/25 text-white font-medium transition-colors"
                >
                  +14 kun
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDays(30)}
                  className="px-2.5 py-1 rounded-[8px] bg-white/15 hover:bg-white/25 text-white font-medium transition-colors"
                >
                  +1 oy (30 kun)
                </button>
                <button
                  type="button"
                  onClick={() => setPresetDays(60)}
                  className="px-2.5 py-1 rounded-[8px] bg-white/15 hover:bg-white/25 text-white font-medium transition-colors"
                >
                  +2 oy (60 kun)
                </button>
              </div>
            </div>

            {/* Quick Action / Change Date Box */}
            <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3 shrink-0 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/20">
              <div className="text-left md:text-right">
                <div className="text-xs text-emerald-200 font-medium">Tayyorgarlik ko‘rsatkichi</div>
                <div className="text-2xl font-black text-white">{prepProgressPercent}%</div>
              </div>

              {editingDate ? (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <input
                    type="date"
                    value={tempExamDate}
                    onChange={(e) => setTempExamDate(e.target.value)}
                    className="rounded-[8px] bg-slate-900/90 text-white px-3 py-1.5 text-xs border border-white/30 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleSaveDate}
                    className="px-3 py-1.5 rounded-[8px] bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-sm cursor-pointer"
                  >
                    Saqlash
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingDate(false)}
                    className="px-2 py-1.5 rounded-[8px] bg-white/10 hover:bg-white/20 text-white text-xs cursor-pointer"
                  >
                    Bekor
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setTempExamDate(examDate);
                    setEditingDate(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-all border border-white/30 cursor-pointer"
                >
                  <Icon name="ri-calendar-event-line" /> Sanani tanlash
                </button>
              )}
            </div>
          </div>

          {/* Progress track */}
          <div className="mt-5 w-full bg-black/20 rounded-full h-2.5 overflow-hidden p-0.5">
            <div
              className="bg-emerald-300 h-full rounded-full transition-all duration-500"
              style={{ width: `${prepProgressPercent}%` }}
            />
          </div>
        </section>

        {/* 4 Stat Overview Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422] shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">Kunlik Me’yor</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-primary/10 text-primary">
                <Icon name="ri-focus-2-line" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {dailyTarget} <span className="text-xs font-normal text-slate-500">ta savol</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Har bir kunlik mashq hajmi</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422] shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">Jami Savollar</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-indigo-500/10 text-indigo-500">
                <Icon name="ri-database-2-line" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {totalQuestions} <span className="text-xs font-normal text-slate-500">ta</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Fandagi to‘liq test bazasi</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422] shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">Bajarilgan Kunlar</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-emerald-500/10 text-emerald-500">
                <Icon name="ri-checkbox-circle-line" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {totalCompletedWorkouts} <span className="text-xs font-normal text-slate-500">kun</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">O‘z vaqtida yechilgan mashqlar</p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422] shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-semibold">O‘rtacha Aniqlik</span>
              <div className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-amber-500/10 text-amber-500">
                <Icon name="ri-percent-line" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {avgAccuracy > 0 ? `${avgAccuracy}%` : '—'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">O‘zlashtirish sifati</p>
          </div>
        </section>

        {/* 2-Column Section: Calendar Matrix & Day Inspector */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Interactive Month Calendar */}
          <div className="lg:col-span-2 rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422] p-5 sm:p-6 shadow-xs flex flex-col">
            {/* Calendar Month Header */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {MONTH_NAMES_UZ[currentMonth]} {currentYear}
                </h3>
                <button
                  type="button"
                  onClick={handleJumpToToday}
                  className="px-2.5 py-1 rounded-[8px] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs text-primary font-semibold transition-colors cursor-pointer"
                >
                  Bugun
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Oldingi oy"
                >
                  <Icon name="ri-arrow-left-s-line" className="text-lg" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Keyingi oy"
                >
                  <Icon name="ri-arrow-right-s-line" className="text-lg" />
                </button>
              </div>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
              {WEEKDAYS_SHORT.map((wd, idx) => (
                <div
                  key={wd}
                  className={`text-xs font-bold py-1.5 ${
                    idx >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {wd}
                </div>
              ))}
            </div>

            {/* Calendar Day Cells */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 flex-1">
              {monthCalendarData.map((d, index) => {
                if (!d) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="min-h-[58px] sm:min-h-[72px] rounded-xl bg-slate-50/50 dark:bg-white/[0.02]"
                    />
                  );
                }

                const isSelected = d.dateStr === selectedDateStr;

                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(d.dateStr)}
                    className={`relative p-1.5 sm:p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[62px] sm:min-h-[76px] cursor-pointer group ${
                      isSelected
                        ? 'ring-2 ring-primary border-primary shadow-sm scale-[1.02]'
                        : 'hover:border-slate-300 dark:hover:border-white/20'
                    } ${
                      d.isToday
                        ? 'bg-primary/10 border-primary/50'
                        : d.isExam
                        ? 'bg-amber-500/15 border-amber-500/50'
                        : d.workout?.completed
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'border-slate-200/80 dark:border-white/5 bg-slate-50/70 dark:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          d.isToday
                            ? 'text-primary'
                            : d.isExam
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}
                      >
                        {d.dayNum}
                      </span>
                      {d.isExam && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-amber-500 text-white text-[10px]">
                          <Icon name="ri-flag-fill" />
                        </span>
                      )}
                      {d.workout?.completed && !d.isExam && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-[6px] bg-emerald-500 text-white text-[10px]">
                          <Icon name="ri-check-line" />
                        </span>
                      )}
                    </div>

                    <div className="mt-1">
                      {d.isExam ? (
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block truncate">
                          Imtihon!
                        </span>
                      ) : d.workout?.completed ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                          {d.workout.accuracy ? `${d.workout.accuracy}%` : 'Bajarildi'}
                        </span>
                      ) : d.isToday ? (
                        <span className="text-[10px] font-bold text-primary block truncate">
                          Bugun ({dailyTarget}t)
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                          Reja
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Legend / Status Indicators */}
            <div className="mt-5 pt-4 border-t border-slate-200/80 dark:border-white/10 flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[4px] bg-primary/20 border border-primary" />
                <span>Bugun</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[4px] bg-amber-500/20 border border-amber-500" />
                <span>Imtihon kuni</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[4px] bg-emerald-500/20 border border-emerald-500" />
                <span>Bajarilgan mashq</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[4px] bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10" />
                <span>Rejalashtirilgan</span>
              </div>
            </div>
          </div>

          {/* Right Col: Selected Day Inspector & Set Exam / Start Workout */}
          <div className="space-y-4 flex flex-col">
            {/* Selected Date Card */}
            <div className="rounded-xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#0e1422] p-5 shadow-xs flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-white/10">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Kun Tafsilotlari
                  </div>
                  {isSelectedToday && (
                    <span className="px-2 py-0.5 rounded-[8px] bg-primary/10 text-primary text-[11px] font-bold">
                      Bugungi vazifa
                    </span>
                  )}
                  {isSelectedExam && (
                    <span className="px-2 py-0.5 rounded-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-bold">
                      Imtihon kuni
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">
                    {formatDateSafe(selectedDateStr, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isSelectedExam
                      ? 'Katta tibbiy imtihon sinovi kuni!'
                      : isSelectedToday
                      ? 'Bugun topshirishingiz lozim bo‘lgan kunlik norma'
                      : 'Rejalashtirilgan o‘quv mashg‘uloti'}
                  </p>
                </div>

                {/* Day status detail */}
                <div className="mt-5 space-y-3">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Mo‘ljal savollar:</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedWorkout?.questionCount || dailyTarget} ta savol
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Holat:</span>
                    {selectedWorkout?.completed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                        <Icon name="ri-checkbox-circle-fill" /> Bajarildi ({selectedWorkout.accuracy || 100}%)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
                        <Icon name="ri-time-line" /> Kutilmoqda
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-slate-200/80 dark:border-white/10 space-y-2.5">
                {/* Button to set the clicked date as the exam date directly */}
                {!isSelectedExam && (
                  <button
                    type="button"
                    onClick={() => applyExamDate(selectedDateStr)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-xs transition-all cursor-pointer shadow-xs active:scale-98"
                  >
                    <Icon name="ri-flag-fill" className="text-base text-amber-500" />
                    <span>Ushbu sanani imtihon kuni deb belgilash</span>
                  </button>
                )}

                <Btn
                  className="w-full justify-center py-2.5 text-sm font-bold shadow-md cursor-pointer"
                  onClick={startWorkoutForSelectedDate}
                >
                  <Icon name="ri-play-fill" /> {isSelectedToday ? 'Bugungi mashqni boshlash' : 'Mashqni boshlash'}
                </Btn>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full text-center py-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/5 text-xs text-slate-600 dark:text-slate-400 font-semibold transition-colors cursor-pointer"
                >
                  Yopish
                </button>
              </div>
            </div>

            {/* Medical Study Tip Card */}
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 dark:bg-indigo-500/10 p-4 text-xs text-indigo-900 dark:text-indigo-200">
              <div className="flex items-center gap-2 font-bold mb-1 text-indigo-700 dark:text-indigo-300">
                <Icon name="ri-lightbulb-flash-line" className="text-base" /> Spaced Repetition printsipi
              </div>
              <p className="leading-relaxed text-[11px] opacity-90">
                Tibbiyotda yangi ma’lumotlarni 1, 3 va 7-kunlarda qayta takrorlash xotirada uzoq muddatli saqlanib qolishini kafolatlaydi. Kalendar bo‘yicha mashqlarni o‘z vaqtida yeching.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
