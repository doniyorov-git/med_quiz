import { useEffect, useRef } from 'react';
import { useStore } from './store';
import { API_BASE } from './model';

/**
 * Vaqtni o'zbek tilida inson tushunadigan formatga keltiradi:
 * Masalan:
 * - 2 kun 5 soat 14 daqiqa
 * - 3 soat 20 daqiqa
 * - 45 daqiqa 10 soniya
 * - 35 soniya
 */
export function formatDurationUz(totalSeconds?: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0 daqiqa';
  const s = Math.floor(totalSeconds);

  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const parts: string[] = [];

  if (days > 0) parts.push(`${days} kun`);
  if (hours > 0) parts.push(`${hours} soat`);
  if (minutes > 0) parts.push(`${minutes} daqiqa`);

  // Agar kun va soat bo'lmasa yoki umumiy vaqt juda kam bo'lsa soniyani ham ko'rsatamiz
  if (parts.length === 0 || (days === 0 && hours === 0 && seconds > 0)) {
    parts.push(`${seconds} soniya`);
  }

  return parts.join(' ');
}

/**
 * Qisqa ixcham format (masalan, jadvallar yoki kichik ekranlar uchun):
 * Masalan: "1k 4s 20d" yoki "45d 12s"
 */
export function formatDurationShortUz(totalSeconds?: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0d';
  const s = Math.floor(totalSeconds);

  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  if (days > 0) {
    return `${days}k ${hours}s ${minutes}d`;
  }
  if (hours > 0) {
    return `${hours}s ${minutes}d`;
  }
  if (minutes > 0) {
    return `${minutes}d ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * useUserTimeTracker:
 * Har soniya foydalanuvchining ilovada faol ishlagan vaqtini hisoblaydi (+1 soniya).
 * 60 soniyaga yetganda (1 daqiqa) serverga va asosiy ma'lumotlar bazasiga yozadi.
 * Serverda har bir user uchun .user-time-logs/<userId>.txt faylga qayd qilinadi.
 */
export function useUserTimeTracker() {
  const { me, updateMe } = useStore();
  const bufferRef = useRef<number>(0);
  const meRef = useRef(me);

  useEffect(() => {
    meRef.current = me;
  }, [me]);

  useEffect(() => {
    if (!me?.id) return;

    const flushTime = async (secondsToFlush: number) => {
      if (secondsToFlush <= 0 || !meRef.current?.id) return;
      const currentUserId = meRef.current.id;

      try {
        // Mahalliy holatni darhol yangilaymiz
        const prevTotal = meRef.current.totalTimeSpent || 0;
        const newTotal = prevTotal + secondsToFlush;
        updateMe({ totalTimeSpent: newTotal });

        // Serverga va .txt log tizimiga yozamiz
        await fetch(`${API_BASE}/users/time-spent`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: currentUserId,
            seconds: secondsToFlush,
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      } catch {}
    };

    // Har 1 soniyada +1 qo'shish
    const interval = window.setInterval(() => {
      // Faqat brauzer sahifasi ko'rinib turgan va foydalanuvchi ilovada bo'lganda hisoblaymiz
      if (document.hidden) return;

      bufferRef.current += 1;

      // 60 soniyaga yetganda server va DB ga yozamiz
      if (bufferRef.current >= 60) {
        const flushAmount = bufferRef.current;
        bufferRef.current = 0;
        flushTime(flushAmount);
      }
    }, 1000);

    // Sahifadan chiqib ketayotganda qoldiq soniyalarni saqlash
    const handleBeforeUnload = () => {
      if (bufferRef.current > 0 && meRef.current?.id) {
        const flushAmount = bufferRef.current;
        bufferRef.current = 0;
        const payload = JSON.stringify({
          userId: meRef.current.id,
          seconds: flushAmount,
          timestamp: Date.now(),
        });

        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            `${API_BASE}/users/time-spent`,
            new Blob([payload], { type: 'application/json' })
          );
        } else {
          fetch(`${API_BASE}/users/time-spent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Komponent unmount bo'lganda ham flush
      if (bufferRef.current > 0) {
        const rem = bufferRef.current;
        bufferRef.current = 0;
        flushTime(rem);
      }
    };
  }, [me?.id, updateMe]);
}
