import type { Question } from '@/lib/types';

let seq = 0;

export function uid(prefix = 'id'): string {
  seq += 1;
  return `${prefix}-${Date.now().toString(36)}-${seq.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

/**
 * Normalizes question text from standard Word/PDF formats:
 * e.g. "1. Question... A) opt1 B) opt2" into "# Question \n + opt1 \n - opt2"
 */
export function normalizeTestText(text: string): string {
  if (text.includes('#') && (text.includes('+') || text.includes('-'))) {
    return text;
  }

  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Question line matching: "1.", "1)", "1 -", "Savol 1:", "№1"
    const qMatch = trimmed.match(/^(?:(?:savol\s*)?(?:\d+[\.\)\-]|№\s*\d+[:\.]?))\s*(.+)/i);
    if (qMatch) {
      out.push('# ' + qMatch[1].trim());
      continue;
    }

    // Option line matching: "A)", "A.", "a)", "*A)", "A*", "+", "-"
    const optMatch = trimmed.match(/^([\*\+]|[A-Ea-e][\.\)\*]|\-|\+)\s*(.+)/);
    if (optMatch) {
      const prefix = optMatch[1];
      const optText = optMatch[2];
      const isCorrect = prefix.includes('*') || prefix.includes('+') || optText.endsWith('*');
      const cleanText = optText.replace(/\*$/, '').trim();
      out.push((isCorrect ? '+ ' : '- ') + cleanText);
      continue;
    }

    out.push(trimmed);
  }

  return out.join('\n');
}

/** Extract text from DOCX (unzip document.xml). */
export async function extractTextFromDocx(buffer: ArrayBuffer): Promise<string> {
  try {
    const bytes = new Uint8Array(buffer);
    const view = new DataView(buffer);
    let pos = 0;
    while (pos < bytes.length - 30) {
      if (view.getUint32(pos, true) === 0x04034b50) {
        const method = view.getUint16(pos + 8, true);
        const compSize = view.getUint32(pos + 18, true);
        const fnLen = view.getUint16(pos + 26, true);
        const extraLen = view.getUint16(pos + 28, true);
        const fn = new TextDecoder().decode(bytes.subarray(pos + 30, pos + 30 + fnLen));
        const dataStart = pos + 30 + fnLen + extraLen;
        if (fn === 'word/document.xml') {
          const rawData = bytes.subarray(dataStart, dataStart + compSize);
          let xml = '';
          if (method === 8) {
            const ds = new DecompressionStream('deflate-raw');
            const writer = ds.writable.getWriter();
            writer.write(rawData);
            writer.close();
            const reader = ds.readable.getReader();
            const chunks: Uint8Array[] = [];
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              if (value) chunks.push(value);
            }
            const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
            const merged = new Uint8Array(totalLen);
            let off = 0;
            for (const c of chunks) {
              merged.set(c, off);
              off += c.length;
            }
            xml = new TextDecoder('utf-8').decode(merged);
          } else {
            xml = new TextDecoder('utf-8').decode(rawData);
          }

          // Extract text from w:p paragraphs
          const paragraphs = xml.match(/<w:p[\s>].*?<\/w:p>/gs) || [];
          const lines = paragraphs
            .map((p) => {
              const texts = p.match(/<w:t[\s>].*?<\/w:t>/gs) || [];
              return texts.map((t) => t.replace(/<[^>]+>/g, '')).join('');
            })
            .filter((t) => t.trim().length > 0);
          return lines.join('\n');
        }
        pos = dataStart + compSize;
      } else {
        pos += 1;
      }
    }
  } catch (err) {
    console.warn('DOCX extraction error, fallback to regex:', err);
  }

  // Fallback: extract XML tags or strings from buffer
  const text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
  const matches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
  if (matches) {
    return matches.map((m) => m.replace(/<[^>]+>/g, '')).join('\n');
  }
  return text.replace(/[^\x20-\x7E\u0400-\u04FF\u0100-\u017F\n\r]/g, ' ');
}

/** Extract text from PDF file. */
export async function extractTextFromPdf(buffer: ArrayBuffer): Promise<string> {
  // 1. Try PDF.js if available or load dynamically from CDN
  try {
    let pdfjs = (window as any).pdfjsLib;
    if (!pdfjs) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('PDF.js yuklanmadi'));
        document.head.appendChild(script);
      });
      pdfjs = (window as any).pdfjsLib;
      if (pdfjs && pdfjs.GlobalWorkerOptions) {
        pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
    }
    if (pdfjs) {
      const pdf = await pdfjs.getDocument({ data: buffer }).promise;
      const pagesText: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str || '').join(' ');
        pagesText.push(pageText);
      }
      return pagesText.join('\n\n');
    }
  } catch (e) {
    console.warn('PDF.js load failed, falling back to stream parsing:', e);
  }

  // 2. Fallback stream parser for PDF text
  const text = new TextDecoder('latin1').decode(buffer);
  const out: string[] = [];
  const tjMatches = text.matchAll(/\(([^)]+)\)\s*Tj/g);
  for (const match of tjMatches) {
    out.push(match[1]);
  }
  if (out.length > 0) {
    return out.join('\n');
  }
  return text.replace(/[^\x20-\x7E\u0400-\u04FF\u0100-\u017F\n\r]/g, ' ');
}

/** Universal file text extractor supporting .txt, .doc, .docx, and .pdf */
export async function extractTextFromFile(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith('.docx')) {
    const buf = await file.arrayBuffer();
    return await extractTextFromDocx(buf);
  }
  if (name.endsWith('.pdf')) {
    const buf = await file.arrayBuffer();
    return await extractTextFromPdf(buf);
  }
  if (name.endsWith('.doc')) {
    try {
      const buf = await file.arrayBuffer();
      const view = new DataView(buf);
      if (view.getUint32(0, true) === 0x04034b50) {
        return await extractTextFromDocx(buf);
      }
    } catch {}
    const raw = await file.text();
    return raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, ' ');
  }
  return await file.text();
}

export function parseQuizText(raw: string): { questions: Question[]; skipped: number } {
  const prepared = normalizeTestText(raw);
  const lines = prepared.replace(/\r\n/g, '\n').split('\n');
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
