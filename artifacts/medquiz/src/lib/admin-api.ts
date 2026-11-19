import { API_BASE } from './model';
import type { AppBanner, AdminChatMessage, BroadcastNotification, PublicUser } from './types';

const ADMIN_STORAGE_KEY = 'medquiz_admin_authed_session';
const DEFAULT_ADMIN_PIN = '7777';

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return window.sessionStorage.getItem(ADMIN_STORAGE_KEY) === 'true';
}

export function setAdminAuthenticated(authed: boolean) {
  if (typeof window === 'undefined') return;
  if (authed) {
    window.sessionStorage.setItem(ADMIN_STORAGE_KEY, 'true');
  } else {
    window.sessionStorage.removeItem(ADMIN_STORAGE_KEY);
  }
}

export function verifyAdminPin(enteredPin: string): boolean {
  const clean = enteredPin.trim();
  if (clean === DEFAULT_ADMIN_PIN || clean === 'medadmin2026') {
    setAdminAuthenticated(true);
    return true;
  }
  return false;
}

// ----------------------------------------------------------------------
// Users & Blocking Management
// ----------------------------------------------------------------------
export async function fetchAdminUsers(): Promise<PublicUser[]> {
  try {
    const res = await fetch(`${API_BASE}/users`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

export async function blockUser(
  userId: string,
  isBlocked: boolean,
  reason: string = 'Ma‘muriyat tomonidan qoidabuzarlik uchun cheklandi'
): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/admin/users/block`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, isBlocked, reason, blockedAt: Date.now() }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function adjustUserCoins(userId: string, amount: number): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/admin/users/coins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, amount }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------
// Banner Constructor Management
// ----------------------------------------------------------------------
const BANNERS_STORAGE_KEY = 'medquiz_banners_store_v1';

export const DEFAULT_BANNERS: AppBanner[] = [
  {
    id: 'banner-default-1',
    title: 'Anatomiya Onlayn Battle Haftaligi!',
    description: 'Barcha talabalar o‘rtasida real vaqtda bellashing va 2x MedCoins mukofotini yutib oling.',
    badge: 'Haftalik Aksiya',
    theme: 'emerald',
    icon: 'ri-fire-fill',
    actionText: 'Battlega kirish',
    actionUrl: '/battle',
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
  },
  {
    id: 'banner-default-2',
    title: 'Spaced Repetition (SRS) Imtihon Taqvimi',
    description: 'Xatolar banki va SM-2 algoritmi bilan testlarni unutilmas uzoq muddatli xotiraga muhrlang.',
    badge: 'Tizim Yangiligi',
    theme: 'cyan',
    icon: 'ri-calendar-check-fill',
    actionText: 'Taqvimni sozlash',
    actionUrl: '/banks',
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 12,
  },
  {
    id: 'banner-default-3',
    title: 'MedCoins Do‘koni va Streak Muzlatish',
    description: 'Testlarni a‘lo yeching, MedCoins to‘plang va kunlik streaklaringizni himoyalang.',
    badge: 'Tez kunda',
    theme: 'amber',
    icon: 'ri-store-2-fill',
    actionText: 'Batafsil',
    actionUrl: '/dashboard',
    active: true,
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
  },
];

export async function fetchBanners(): Promise<AppBanner[]> {
  try {
    const res = await fetch(`${API_BASE}/banners`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        localStorage.setItem(BANNERS_STORAGE_KEY, JSON.stringify(data));
        return data;
      }
    }
  } catch {}

  try {
    const stored = localStorage.getItem(BANNERS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return DEFAULT_BANNERS;
}

export async function saveBanner(banner: AppBanner): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/banners`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(banner),
    });
    if (res.ok) {
      const banners = await fetchBanners();
      const idx = banners.findIndex((b) => b.id === banner.id);
      if (idx !== -1) banners[idx] = banner;
      else banners.unshift(banner);
      localStorage.setItem(BANNERS_STORAGE_KEY, JSON.stringify(banners));
      window.dispatchEvent(new Event('medquiz-banners-updated'));
      return true;
    }
  } catch {}

  // Local fallback
  try {
    const banners = await fetchBanners();
    const idx = banners.findIndex((b) => b.id === banner.id);
    if (idx !== -1) banners[idx] = banner;
    else banners.unshift(banner);
    localStorage.setItem(BANNERS_STORAGE_KEY, JSON.stringify(banners));
    window.dispatchEvent(new Event('medquiz-banners-updated'));
    return true;
  } catch {
    return false;
  }
}

export async function deleteBanner(bannerId: string): Promise<boolean> {
  try {
    await fetch(`${API_BASE}/banners/${bannerId}`, { method: 'DELETE' });
  } catch {}

  try {
    const banners = await fetchBanners();
    const filtered = banners.filter((b) => b.id !== bannerId);
    localStorage.setItem(BANNERS_STORAGE_KEY, JSON.stringify(filtered));
    window.dispatchEvent(new Event('medquiz-banners-updated'));
    return true;
  } catch {
    return false;
  }
}

// ----------------------------------------------------------------------
// Admin Chat & User Messaging
// ----------------------------------------------------------------------
export async function fetchAdminConversations(): Promise<
  { userId: string; userName: string; userAvatar?: string | null; lastMessage: string; lastTime: number; unreadCount: number }[]
> {
  try {
    const res = await fetch(`${API_BASE}/admin/chat/conversations`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

export async function fetchAdminChat(userId: string): Promise<AdminChatMessage[]> {
  try {
    const res = await fetch(`${API_BASE}/admin/chat/${userId}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

export async function sendAdminChatMessage(
  userId: string,
  text: string,
  userName: string,
  sender: 'admin' | 'user' = 'admin'
): Promise<AdminChatMessage | null> {
  try {
    const msg: Partial<AdminChatMessage> = {
      userId,
      userName,
      sender,
      text,
      createdAt: Date.now(),
    };
    const res = await fetch(`${API_BASE}/admin/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    if (res.ok) {
      const data = await res.json();
      return data.message || msg;
    }
  } catch {}
  return null;
}

// ----------------------------------------------------------------------
// Broadcast Notifications
// ----------------------------------------------------------------------
export async function fetchNotifications(): Promise<BroadcastNotification[]> {
  try {
    const res = await fetch(`${API_BASE}/notifications`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data;
    }
  } catch {}
  return [];
}

export async function sendBroadcastNotification(payload: {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'alert';
}): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/admin/notifications/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...payload,
        createdAt: Date.now(),
        senderName: 'MedQuiz Ma’muriyati',
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
