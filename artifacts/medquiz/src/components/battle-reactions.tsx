import { useEffect, useState } from 'react';
import { sendBattleReaction, API_BASE } from '@/lib/model';
import { subscribe } from '@/lib/db';
import { Icon } from '@/components/chrome';
import type { BattleReaction, Me } from '@/lib/types';

export const REACTION_ICONS = [
  { id: 'fire', icon: 'ri-fire-fill', color: 'text-amber-500', bg: 'hover:bg-amber-500/15', label: 'Olov' },
  { id: 'heart', icon: 'ri-heart-3-fill', color: 'text-rose-500', bg: 'hover:bg-rose-500/15', label: 'Yurak' },
  { id: 'thumb', icon: 'ri-thumb-up-fill', color: 'text-blue-500', bg: 'hover:bg-blue-500/15', label: 'Klass' },
  { id: 'flash', icon: 'ri-flashlight-fill', color: 'text-yellow-400', bg: 'hover:bg-yellow-500/15', label: 'Chaqmoq' },
  { id: 'pill', icon: 'ri-capsule-fill', color: 'text-emerald-500', bg: 'hover:bg-emerald-500/15', label: 'Dori' },
  { id: 'brain', icon: 'ri-brain-line', color: 'text-purple-400', bg: 'hover:bg-purple-500/15', label: 'Miya' },
  { id: 'target', icon: 'ri-focus-3-line', color: 'text-cyan-400', bg: 'hover:bg-cyan-500/15', label: 'Nishon' },
  { id: 'trophy', icon: 'ri-trophy-fill', color: 'text-amber-400', bg: 'hover:bg-amber-500/15', label: 'Kubok' },
];

type Particle = {
  id: string;
  icon: string;
  color: string;
  sender: string;
  x: number;
};

export function BattleReactions({ roomCode, me }: { roomCode: string; me: Me | null }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [lastRxTime, setLastRxTime] = useState(Date.now() - 5000);
  const [expanded, setExpanded] = useState(false);

  const spawnParticle = (iconName: string, sender: string) => {
    const rxItem = REACTION_ICONS.find((r) => r.icon === iconName || r.id === iconName);
    const p: Particle = {
      id: `${Date.now()}-${Math.random()}`,
      icon: rxItem?.icon || iconName || 'ri-thumb-up-fill',
      color: rxItem?.color || 'text-primary',
      sender,
      x: 15 + Math.random() * 70,
    };
    setParticles((prev) => [...prev.slice(-15), p]);

    setTimeout(() => {
      setParticles((prev) => prev.filter((item) => item.id !== p.id));
    }, 2400);
  };

  // 1. Listen to local/BroadcastChannel reactions
  useEffect(() => {
    const key = `medquiz-reaction-${roomCode}`;
    const unsub = subscribe(() => {
      try {
        const raw = window.localStorage.getItem(key);
        if (raw) {
          const rx = JSON.parse(raw) as BattleReaction;
          if (rx && rx.roomCode && roomCode && rx.roomCode.toLowerCase() === roomCode.toLowerCase() && rx.createdAt > lastRxTime && rx.userId !== me?.id) {
            setLastRxTime(rx.createdAt);
            spawnParticle(rx.emoji, rx.userName || 'Talaba');
          }
        }
      } catch {
        // ignore
      }
    });

    const onCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent<BattleReaction>).detail;
      if (detail && detail.roomCode && roomCode && detail.roomCode.toLowerCase() === roomCode.toLowerCase() && detail.userId === me?.id) {
        spawnParticle(detail.emoji, 'Siz');
      }
    };
    window.addEventListener('medquiz-battle-reaction', onCustomEvent);

    return () => {
      unsub();
      window.removeEventListener('medquiz-battle-reaction', onCustomEvent);
    };
  }, [roomCode, me?.id, lastRxTime]);

  // 2. Poll server for reactions from other devices (Wi-Fi / tunnel)
  useEffect(() => {
    if (!roomCode) return;
    const interval = window.setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/reactions/${roomCode.toLowerCase()}?since=${lastRxTime}`);
        if (res.ok) {
          const list = (await res.json()) as BattleReaction[];
          if (Array.isArray(list) && list.length > 0) {
            let maxTime = lastRxTime;
            for (const rx of list) {
              if (rx.createdAt > maxTime) {
                maxTime = rx.createdAt;
              }
              if (rx.userId !== me?.id) {
                spawnParticle(rx.emoji, rx.userName);
              }
            }
            setLastRxTime(maxTime);
          }
        }
      } catch {
        // ignore network error
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [roomCode, lastRxTime, me?.id]);

  const handleSend = (iconName: string) => {
    if (!me) return;
    sendBattleReaction(roomCode, me, iconName);
  };

  return (
    <>
      {/* Floating Particles Overlay */}
      <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute bottom-24 flex flex-col items-center animate-rise-drift"
            style={{ left: `${p.x}%` }}
          >
            <Icon name={p.icon} className={`text-4xl filter drop-shadow-md select-none ${p.color}`} />
            <span className="mt-1 rounded-[6px] bg-slate-900/85 px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs backdrop-blur-xs">
              {p.sender}
            </span>
          </div>
        ))}
      </div>

      {/* Side Reaction Dock: Yon tomonda joylashgan va bosilsa yoyiladigan menyu */}
      <div className="fixed right-3 sm:right-6 bottom-24 sm:bottom-10 z-40 flex flex-col items-end">
        {/* Expanded Palette (Yoyilgan holati) */}
        {expanded && (
          <div className="mb-2.5 w-64 rounded-[10px] border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#111827]/95 p-3 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-right-3 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/10 pb-2 mb-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Icon name="ri-fire-fill" className="text-amber-500" />
                Jonli Reaksiyalar
              </span>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-[6px] p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
                aria-label="Yopish"
              >
                <Icon name="ri-close-line" className="text-base" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {REACTION_ICONS.map((rx) => (
                <button
                  key={rx.id}
                  type="button"
                  onClick={() => handleSend(rx.icon)}
                  title={rx.label}
                  className={`flex flex-col items-center justify-center p-2 rounded-[8px] transition-all hover:scale-110 active:scale-90 ${rx.bg}`}
                >
                  <Icon name={rx.icon} className={`text-2xl ${rx.color}`} />
                  <span className="mt-1 text-[10px] text-slate-500 font-medium">{rx.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Trigger Button: Yon tomondagi tugma chiroyli fon va yaltirash bilan */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className={`flex h-12 w-12 items-center justify-center rounded-[10px] shadow-2xl transition-all duration-200 active:scale-95 border ${
            expanded
              ? 'bg-slate-900 text-white border-white/20 rotate-90 shadow-slate-900/50'
              : 'bg-gradient-to-tr from-amber-500 via-rose-500 to-primary text-white border-white/30 hover:scale-110 shadow-rose-500/30 ring-2 ring-white/20 hover:shadow-primary/40'
          }`}
          title="Reaksiyalar menyusi"
          aria-label="Reaksiyalar menyusi"
        >
          {expanded ? (
            <Icon name="ri-close-line" className="text-2xl drop-shadow" />
          ) : (
            <Icon name="ri-fire-fill" className="text-2xl drop-shadow" />
          )}
        </button>
      </div>
    </>
  );
}
