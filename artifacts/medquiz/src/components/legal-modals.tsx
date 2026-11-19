import { useEffect } from 'react';
import { Icon } from '@/components/chrome';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TermsModal({ isOpen, onClose }: LegalModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] shadow-2xl text-slate-900 dark:text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 px-5 py-4 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon name="ri-file-text-line" className="text-xl" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">Foydalanish shartlari</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Ommaviy oferta va tibbiy ta’lim qoidalari</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {/* Medical Disclaimer Banner */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-amber-900 dark:text-amber-200 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-700 dark:text-amber-400 text-xs sm:text-sm">
              <Icon name="ri-alarm-warning-fill" className="text-base" />
              <span>MUHIM TIBBIY OGOHLANTIRISH (Medical Disclaimer)</span>
            </div>
            <p className="text-xs leading-relaxed opacity-95">
              MedQuiz platformasidagi barcha ma’lumotlar, savollar, tushuntirishlar va testlar <strong>faqat ta’limiy va o‘quv mashg‘ulotlari</strong> maqsadida taqdim etiladi. Ular rasmiy tibbiy xulosa, klinik tashxis yoki davolash bo‘yicha ko‘rsatma o‘rnini bosa olmaydi. Haqiqiy klinik amaliyotda har doim tasdiqlangan klinik protokollarga va mutaxassis shifokor maslahatiga tayaning.
            </p>
          </div>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>1. Umumiy qoidalar</span>
            </h3>
            <p>
              Ushbu shartnoma MedQuiz platformasidan (sayt, mobil ko‘rinish va Telegram Mini App) foydalanish tartibini belgilaydi. Platformaga kirish yoki ro‘yxatdan o‘tish orqali siz ushbu shartlarga to‘liq va shartsiz rozilik bildirasiz.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>2. Intellektual mulk va test kontenti</span>
            </h3>
            <p>
              MedQuiz platformasining dasturiy kodi, dizayni, klinik keyslar, audio-auskultatsiya materiallari va test savollari intellektual mulk ob’ekti hisoblanadi. Kontentni tijoriy maqsadlarda noqonuniy nusxalash yoki tarqatish taqiqlanadi.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>3. Foydalanuvchining majburiyatlari</span>
            </h3>
            <ul className="list-disc pl-5 space-y-1">
              <li>Ro‘yxatdan o‘tishda to‘g‘ri va haqqoniy ma’lumotlarni kiritish;</li>
              <li>O‘z hisob ma’lumotlarini (parol, login) uchinchi shaxslarga bermaslik;</li>
              <li>Battle va chatlarda axloqiy me’yorlarga hamda tibbiy etika qoidalariga rioya qilish;</li>
              <li>Avtomatlashtirilgan botlar, cheat-kodlar va xakerlik vositalaridan foydalanmaslik.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>4. Xizmat ko‘rsatish va o‘zgartirishlar</span>
            </h3>
            <p>
              Ma’muriyat platforma faoliyatini takomillashtirish, yangi fanlarni qo‘shish va xatoliklarni bartaraf etish maqsadida istalgan vaqtda platforma funksiyalariga o‘zgartirishlar kiritish huquqiga ega.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200/80 dark:border-white/10 px-5 py-3.5 bg-slate-50/50 dark:bg-white/[0.02] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
          >
            Tushundim va qabul qilaman
          </button>
        </div>
      </div>
    </div>
  );
}

export function PrivacyModal({ isOpen, onClose }: LegalModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative flex flex-col w-full max-w-2xl max-h-[90vh] rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white dark:bg-[#111827] shadow-2xl text-slate-900 dark:text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200/80 dark:border-white/10 px-5 py-4 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Icon name="ri-shield-check-line" className="text-xl" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">Maxfiylik siyosati</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Shaxsiy ma’lumotlarni himoya qilish kafolati</p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>1. Qanday ma’lumotlar yig‘iladi?</span>
            </h3>
            <p>
              MedQuiz platformasida foydalanuvchilarga xizmat ko‘rsatish uchun quyidagi ma’lumotlar yig‘iladi:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Foydalanuvchi ma’lumotlari:</strong> Ism-familiya, @username, telefon raqami yoki elektron pochta (Google orqali kirilganda);</li>
              <li><strong>Telegram ma’lumotlari:</strong> Telegram orqali kirilganda Telegram ID, username va bot orqali tasdiqlangan telefon raqami;</li>
              <li><strong>O‘quv statistikasi:</strong> Yechilgan testlar soni, to‘g‘ri/xato javoblar, Spaced Repetition (SRS) takrorlash jadvali va XP ballari.</li>
            </ul>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>2. Ma’lumotlar nima maqsadda ishlatiladi?</span>
            </h3>
            <p>
              Yig‘ilgan ma’lumotlar faqatgina o‘quv jarayonini tashkil etish, test natijalarini hisoblash, do‘stlar o‘rtasidagi Battle musobaqalarini boshqarish va foydalanuvchiga shaxsiy o‘quv tavsiyalarini (SRS) taqdim etish uchun qo‘llaniladi.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>3. Uchinchi shaxslarga bermaslik kafolati</span>
            </h3>
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-900 dark:text-emerald-200">
              <p className="font-semibold text-xs">
                MedQuiz foydalanuvchilarning telefon raqamlari, shaxsiy yozishmalari yoki test natijalarini hech qachon uchinchi shaxslarga, reklama agentliklariga yoki begona tashkilotlarga sotmaydi va bermaydi.
              </p>
            </div>
          </section>

          <section className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>4. Ma’lumotlar xavfsizligi va saqlash</span>
            </h3>
            <p>
              Barcha uzatiladigan ma’lumotlar HTTPS shifrlangan protokoli orqali himoyalangan. Parollar maxsus xesh (hash) ko‘rinishida saqlanadi. Foydalanuvchi istalgan vaqtda o‘z hisobini va o‘quv tarixini to‘liq o‘chirish huquqiga ega.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200/80 dark:border-white/10 px-5 py-3.5 bg-slate-50/50 dark:bg-white/[0.02] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-primary hover:bg-emerald-600 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
          >
            Tushundim
          </button>
        </div>
      </div>
    </div>
  );
}
