import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSyncExternalStore } from 'react';
import { readFresh, subscribe, writeKey } from '@/lib/db';
import { uid } from '@/lib/parser';
import {
  beat,
  clearMe,
  fetchFriendships,
  fetchInvites,
  fetchPublicUsers,
  getBanks,
  getInvites,
  getMistakes,
  getRooms,
  getStatsMap,
  loadLast,
  loadMe,
  onlineUsers,
  saveMe,
  subscribePresence,
} from '@/lib/model';
import type { Me } from '@/lib/types';
import { saveStoredAccount } from '@/lib/auth-storage';

type Theme = 'light' | 'dark';

export type EnterData = {
  name: string;
  username?: string;
  password?: string;
  phone?: string;
  email?: string;
  university?: string;
  course?: string;
  faculty?: string;
  avatar?: string | null;
};

type StoreValue = {
  me: Me | null;
  last: Me | null;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  enter: (dataOrName: string | EnterData, existing?: Me | null) => void;
  leave: () => void;
  updateMe: (patch: Partial<Me>) => void;
};

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(() => loadMe());
  const [last, setLast] = useState<Me | null>(() => loadLast());
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = readFresh<Theme>('medquiz-v2-theme', '' as Theme);
    if (saved === 'dark' || saved === 'light') return saved;
    return 'light'; // default: oq rejim (foydalanuvchi o‘zi tungi rejimni tanlashi mumkin)
  });

  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.colorScheme = theme;
    writeKey('medquiz-v2-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchPublicUsers();
    if (!me) {
      const guestTimer = window.setInterval(() => {
        fetchPublicUsers();
      }, 5000);
      return () => window.clearInterval(guestTimer);
    }
    beat(me);
    fetchInvites();
    fetchFriendships();
    const timer = window.setInterval(() => {
      beat(me);
      fetchInvites();
      fetchFriendships();
      fetchPublicUsers();
    }, 2500);
    return () => window.clearInterval(timer);
  }, [me]);

  const value = useMemo<StoreValue>(() => ({
    me,
    last,
    theme,
    setTheme,
    enter: (dataOrName, existing) => {
      const data: EnterData = typeof dataOrName === 'string' ? { name: dataOrName } : dataOrName;
      const trimmedName = data.name.trim();
      if (!trimmedName) return;
      const next: Me = existing
        ? {
            ...existing,
            name: trimmedName,
            ...(data.username !== undefined ? { username: data.username } : {}),
            ...(data.password !== undefined ? { password: data.password } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {}),
            ...(data.email !== undefined ? { email: data.email } : {}),
            ...(data.university !== undefined ? { university: data.university } : {}),
            ...(data.course !== undefined ? { course: data.course } : {}),
            ...(data.faculty !== undefined ? { faculty: data.faculty } : {}),
            ...(data.avatar !== undefined ? { avatar: data.avatar } : {}),
          }
        : {
            id: uid('user'),
            name: trimmedName,
            username: data.username || undefined,
            password: data.password || '',
            phone: data.phone || '',
            email: data.email || '',
            university: data.university || '',
            course: data.course || '',
            faculty: data.faculty || '',
            avatar: data.avatar || null,
          };
      saveMe(next);
      saveStoredAccount({
        id: next.id,
        name: next.name,
        username: next.username || defaultUsername(next.name, next.id),
        phone: next.phone || '',
        password: next.password || '',
        email: next.email || '',
        avatar: next.avatar || null,
        createdAt: Date.now(),
      });
      setMe(next);
      setLast(next);
    },
    leave: () => {
      clearMe(me?.id);
      setMe(null);
    },
    updateMe: (patch) => {
      setMe((current) => {
        if (!current) return current;
        const next = { ...current, ...patch };
        saveMe(next);
        setLast(next);
        return next;
      });
    },
  }), [last, me, theme]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const value = useContext(StoreContext);
  if (!value) throw new Error('Store yo‘q');
  return value;
}

export function useBanks() {
  return useSyncExternalStore(subscribe, getBanks, getBanks);
}

export function useRooms() {
  return useSyncExternalStore(subscribe, getRooms, getRooms);
}

export function useInvites() {
  return useSyncExternalStore(subscribe, getInvites, getInvites);
}

export function useStatsMap() {
  return useSyncExternalStore(subscribe, getStatsMap, getStatsMap);
}

export function useOnline() {
  return useSyncExternalStore(subscribePresence, onlineUsers, onlineUsers);
}

export function useMistakes() {
  return useSyncExternalStore(subscribe, getMistakes, getMistakes);
}
