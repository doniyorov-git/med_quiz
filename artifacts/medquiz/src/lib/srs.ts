import { MistakeItem } from '@/lib/types';

/**
 * SM-2 / SRS (Spaced Repetition System) Algoritmi
 * Tibbiy test savollarini uzoq muddatli xotiraga muhrlash uchun oraliqli takrorlash:
 * - 1-marta to'g'ri topilsa: 1 kun
 * - 2-marta to'g'ri topilsa: 3 kun
 * - 3-marta to'g'ri topilsa: 7 kun
 * - 4-marta va undan keyin: 14 kun
 * - Xato qilinsa: qayta 1 kunga tushadi (repetitions = 0)
 */
export function calculateNextReview(
  item: MistakeItem,
  isCorrect: boolean
): {
  interval: number;
  repetitions: number;
  easeFactor: number;
  nextReviewDate: number;
} {
  const currentRepetitions = item.repetitions || 0;
  let easeFactor = item.easeFactor || 2.5;

  let repetitions: number;
  let interval: number;

  if (isCorrect) {
    repetitions = currentRepetitions + 1;
    easeFactor = Math.max(1.3, easeFactor + 0.1);

    if (repetitions === 1) {
      interval = 1;
    } else if (repetitions === 2) {
      interval = 3;
    } else if (repetitions === 3) {
      interval = 7;
    } else {
      interval = 14;
    }
  } else {
    repetitions = 0;
    interval = 1;
    easeFactor = Math.max(1.3, easeFactor - 0.2);
  }

  const nextReviewDate = Date.now() + interval * 24 * 60 * 60 * 1000;

  return {
    interval,
    repetitions,
    easeFactor,
    nextReviewDate,
  };
}

export function isDueForReview(item: MistakeItem): boolean {
  if (!item.nextReviewDate) return true;
  // Due if review time is now or in the past
  return item.nextReviewDate <= Date.now();
}

export function getDueMistakes(mistakes: MistakeItem[]): MistakeItem[] {
  if (!Array.isArray(mistakes)) return [];
  return mistakes.filter(isDueForReview);
}

export function formatReviewCountdown(nextReviewDate?: number): string {
  if (!nextReviewDate) return 'Bugun takrorlash';
  const diffMs = nextReviewDate - Date.now();
  if (diffMs <= 0) return 'Bugun takrorlash';

  const diffHours = Math.ceil(diffMs / (1000 * 60 * 60));
  if (diffHours < 24) {
    return `${diffHours} soatdan so‘ng`;
  }
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return `${diffDays} kundan so‘ng`;
}
