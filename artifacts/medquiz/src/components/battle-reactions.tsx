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

export function BattleReactions({
  roomCode,
  me,
  open,
  onClose,
  hideFloatingButton = false,
}: {
  roomCode: string;
  me: Me | null;
  open?: boolean;
  onClose?: () => void;
  hideFloatingButton?: boolean;
}) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [lastRxTime, setLastRxTime] = useState(Date.now() - 5000);
  const [expanded, setExpanded] = useState(false);

  const isPaletteOpen = open !== undefined ? open : expanded;
  const handleClose = () => {
    if (open !== undefined) {
      onClose?.();
    } else {
      setExpanded(false);
    }
  };

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

      {/* Modal Dialog Palette when opened from unified dock or triggered */}
      {isPaletteOpen && (
        <div className="fixed inset-0 z-[160] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:w-80 rounded-t-2xl sm:rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-[#111827]/98 p-4 shadow-2xl backdrop-blur-xl animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-200/70 dark:border-white/10 pb-2.5 mb-3">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Icon name="ri-fire-fill" className="text-amber-500" />
                Jonli Reaksiyalar
              </span>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-[6px] p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/5 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Yopish"
              >
                <Icon name="ri-close-line" className="text-lg" />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {REACTION_ICONS.map((rx) => (
                <button
                  key={rx.id}
                  type="button"
                  onClick={() => {
                    handleSend(rx.icon);
                    handleClose();
                  }}
                  title={rx.label}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-[10px] border border-transparent hover:border-slate-200/80 dark:hover:border-white/10 transition-all hover:scale-105 active:scale-95 cursor-pointer ${rx.bg}`}
                >
                  <Icon name={rx.icon} className={`text-2xl ${rx.color}`} />
                  <span className="mt-1 text-[11px] text-slate-600 dark:text-slate-300 font-medium">{rx.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Legacy Floating Side Reaction Dock (only if hideFloatingButton is false) */}
      {!hideFloatingButton && (
        <div className="fixed left-1/2 z-40 ml-10 flex flex-col items-start bottom-[calc(5.2rem+env(safe-area-inset-bottom))] sm:left-auto sm:right-6 sm:ml-0 sm:bottom-10 sm:items-end">
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
      )}
    </>
  );
}
