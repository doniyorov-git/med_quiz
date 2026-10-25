import type { Question } from '@/lib/types';

let seq = 0;

export function uid(prefix = 'id'): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function parseQuizText(raw: string): { questions: Question[]; skipped: number } {
  const lines = raw.replace(/\r\n/g, '\n').split('\n');
  const questions: Question[] = [];
  let skipped = 0;
  let promptParts: string[] = [];
  let options: { text: string; correct: boolean }[] = [];
  let open = false;

  const flush = () => {
    if (!open) return;
    const prompt = promptParts.join(' ').replace(/\s+/g, ' ').trim();
    const clean = options.map((option) => ({ ...option, text: option.text.trim() })).filter((option) => option.text);
    const correctCount = clean.filter((option) => option.correct).length;
    if (prompt && clean.length >= 2 && correctCount >= 1) {
      questions.push({
        id: uid('q'),
        prompt,
        image: null,
        options: clean.map((option) => ({ id: uid('o'), text: option.text, correct: option.correct })),
      });
    } else if (prompt || clean.length) {
      skipped += 1;
    }
    promptParts = [];
    options = [];
    open = false;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) continue;
    if (trimmed.startsWith('#')) {
      flush();
      const prompt = trimmed.replace(/^#\s*/, '').trim();
      if (!prompt) continue;
      open = true;
      promptParts = [prompt];
      continue;
    }
    if (!open) continue;
    if (trimmed.startsWith('+') || trimmed.startsWith('-')) {
      options.push({ correct: trimmed.startsWith('+'), text: trimmed.slice(1).trim() });
      continue;
    }
    promptParts.push(trimmed);
  }
  flush();
  return { questions, skipped };
}

export function serializeQuiz(questions: Question[]): string {
  return questions
    .map((question) => {
      const lines = [`# ${question.prompt.replace(/\s+/g, ' ').trim()}`];
      for (const option of question.options) {
        lines.push(`${option.correct ? '+' : '-'} ${option.text.replace(/\s+/g, ' ').trim()}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');
}

export function cleanQuestion(question: Question): Question | null {
  const options = question.options.filter((option) => option.text.trim());
  if (!question.prompt.trim() || options.length < 2 || !options.some((option) => option.correct)) return null;
  return { ...question, prompt: question.prompt.trim(), options };
}

export function blankQuestion(): Question {
  return {
    id: uid('q'),
    prompt: '',
    image: null,
    options: [
      { id: uid('o'), text: '', correct: true },
      { id: uid('o'), text: '', correct: false },
      { id: uid('o'), text: '', correct: false },
      { id: uid('o'), text: '', correct: false },
    ],
  };
}

export function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    const current = next[index];
    next[index] = next[swap] as T;
    next[swap] = current as T;
  }
  return next;
}

export function isCorrectPick(question: Question, picks: number[]): boolean {
  const correct = question.options.flatMap((option, index) => (option.correct ? [index] : []));
  if (picks.length !== correct.length) return false;
  return picks.every((pick) => correct.includes(pick));
}
