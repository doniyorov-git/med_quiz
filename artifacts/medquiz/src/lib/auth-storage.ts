import { uid } from '@/lib/parser';
import type { Me } from '@/lib/types';
import { defaultUsername } from '@/lib/model';

const ACCOUNTS_KEY = 'medquiz_registered_accounts';

export interface StoredAccount {
  id: string;
  name: string;
  username: string;
  phone: string;
  password?: string;
  email?: string;
  avatar: string | null;
  createdAt: number;
}

export function getStoredAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveStoredAccount(account: StoredAccount): void {
  if (typeof window === 'undefined') return;
  try {
    const accounts = getStoredAccounts();
    const index = accounts.findIndex((a) => a.id === account.id || a.username.toLowerCase() === account.username.toLowerCase());
    if (index >= 0) {
      accounts[index] = { ...accounts[index], ...account };
    } else {
      accounts.push(account);
    }
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {}
}

export function normalizePhone(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.startsWith('998') && digits.length === 12) {
    return digits.slice(3);
  }
  return digits;
}

export function normalizeUsername(username: string): string {
  return (username || '').trim().replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
}

export function findAccountByLogin(loginInput: string): StoredAccount | null {
  const cleanInput = loginInput.trim();
  if (!cleanInput) return null;

  const accounts = getStoredAccounts();

  // Try username match
  const cleanUsername = normalizeUsername(cleanInput);
  if (cleanUsername) {
    const foundByUsername = accounts.find((a) => normalizeUsername(a.username) === cleanUsername);
    if (foundByUsername) return foundByUsername;
  }

  // Try phone match
  const cleanPhone = normalizePhone(cleanInput);
  if (cleanPhone) {
    const foundByPhone = accounts.find((a) => normalizePhone(a.phone) === cleanPhone);
    if (foundByPhone) return foundByPhone;
  }

  // Try name match as fallback
  const foundByName = accounts.find((a) => a.name.toLowerCase() === cleanInput.toLowerCase());
  return foundByName || null;
}
