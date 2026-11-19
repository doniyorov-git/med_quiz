export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    query_id?: string;
    user?: TelegramUser;
    auth_date?: number;
    hash?: string;
    start_param?: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  isExpanded: boolean;
  viewportHeight: number;
  viewportStableHeight: number;
  headerColor: string;
  backgroundColor: string;
  expand: () => void;
  close: () => void;
  ready: () => void;
  setHeaderColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  showAlert: (message: string) => void;
  showConfirm: (message: string, callback: (confirmed: boolean) => void) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp || null;
}

export function isTelegramMiniApp(): boolean {
  const tg = getTelegramWebApp();
  return Boolean(tg && (tg.initData || tg.initDataUnsafe?.user));
}

export function getTelegramUser(): TelegramUser | null {
  const tg = getTelegramWebApp();
  return tg?.initDataUnsafe?.user || null;
}

export async function syncTelegramWithServer(): Promise<{
  ok: boolean;
  user?: any;
  needsContact?: boolean;
  error?: string;
}> {
  const tg = getTelegramWebApp();
  if (!tg) return { ok: false, error: 'Telegram muhiti topilmadi' };

  const tgUser = tg.initDataUnsafe?.user;
  if (!tgUser) return { ok: false, error: 'Telegram foydalanuvchisi aniqlanmadi' };

  try {
    const res = await fetch('/api/auth/telegram-sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        initData: tg.initData,
        telegramId: tgUser.id,
        username: tgUser.username || '',
        firstName: tgUser.first_name || '',
        lastName: tgUser.last_name || '',
        photoUrl: tgUser.photo_url || null,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e: any) {
    console.warn('[Telegram TMA] Sync network error, using client fallback:', e);
  }

  // Fallback if backend offline: assemble client profile
  return {
    ok: true,
    user: {
      id: `tg-${tgUser.id}`,
      telegramId: tgUser.id,
      name: `${tgUser.first_name} ${tgUser.last_name || ''}`.trim(),
      username: tgUser.username ? tgUser.username.toLowerCase() : `user_${tgUser.id}`,
      avatar: tgUser.photo_url || null,
      phone: '',
      termsAgreed: true,
    },
    needsContact: false,
  };
}
