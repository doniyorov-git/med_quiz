import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  type Auth,
  type User as FirebaseUser,
} from 'firebase/auth';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

const STORAGE_KEY = 'medquiz_firebase_config';

// Default Firebase config
const DEFAULT_CONFIG: FirebaseConfig = {
  apiKey: 'AIzaSyBkK6LbpBMNW-mx9jA72khBrB-e8s2rdMc',
  authDomain: 'arlopanel.firebaseapp.com',
  projectId: 'arlopanel',
  storageBucket: 'arlopanel.firebasestorage.app',
  messagingSenderId: '537350312229',
  appId: '1:537350312229:web:7f32776c28284398214acc',
  measurementId: 'G-WTZ79ZQ4D3',
};

export function getStoredFirebaseConfig(): FirebaseConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_CONFIG;
}

export function saveFirebaseConfig(config: FirebaseConfig): boolean {
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    // Reset instance so next call initializes with new config
    appInstance = null;
    authInstance = null;
    return true;
  } catch {
    return false;
  }
}

export function parseFirebaseConfigString(raw: string): FirebaseConfig | null {
  if (!raw || !raw.trim()) return null;
  const str = raw.trim();

  // 1. Try standard JSON.parse
  try {
    const json = JSON.parse(str);
    if (json && json.apiKey && json.projectId) {
      return {
        apiKey: String(json.apiKey || '').trim(),
        authDomain: String(json.authDomain || '').trim(),
        projectId: String(json.projectId || '').trim(),
        storageBucket: json.storageBucket ? String(json.storageBucket).trim() : undefined,
        messagingSenderId: json.messagingSenderId ? String(json.messagingSenderId).trim() : undefined,
        appId: String(json.appId || '').trim(),
        measurementId: json.measurementId ? String(json.measurementId).trim() : undefined,
      };
    }
  } catch {}

  // 2. Try JS Object regex matching for common snippet:
  // apiKey: "...",
  // projectId: "...",
  const extract = (key: string): string => {
    const regex = new RegExp(`["']?${key}["']?\\s*:\\s*["'\`]([^"'\`]+)["'\`]`, 'i');
    const match = str.match(regex);
    return match ? match[1].trim() : '';
  };

  const apiKey = extract('apiKey');
  const projectId = extract('projectId');
  const authDomain = extract('authDomain');
  const appId = extract('appId');
  const storageBucket = extract('storageBucket');
  const messagingSenderId = extract('messagingSenderId');
  const measurementId = extract('measurementId');

  if (apiKey && projectId) {
    return {
      apiKey,
      projectId,
      authDomain: authDomain || `${projectId}.firebaseapp.com`,
      appId: appId || '',
      storageBucket,
      messagingSenderId,
      measurementId,
    };
  }

  return null;
}

export function isFirebaseConfigured(): boolean {
  const cfg = getStoredFirebaseConfig();
  return Boolean(cfg.apiKey && cfg.projectId);
}

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  const config = getStoredFirebaseConfig();
  if (!config.apiKey || !config.projectId) {
    return null;
  }
  try {
    if (getApps().length > 0) {
      appInstance = getApp();
    } else {
      appInstance = initializeApp(config);
    }
    return appInstance;
  } catch (err) {
    console.warn('[Firebase] App initialization error:', err);
    return null;
  }
}

export function getFirebaseAuth(): Auth | null {
  if (authInstance) return authInstance;
  const app = getFirebaseApp();
  if (!app) return null;
  try {
    authInstance = getAuth(app);
    return authInstance;
  } catch (err) {
    console.warn('[Firebase] Auth initialization error:', err);
    return null;
  }
}

export interface GoogleLoginResult {
  success: boolean;
  user?: FirebaseUser;
  name?: string;
  email?: string;
  avatar?: string | null;
  phone?: string;
  error?: string;
}

export async function loginWithGoogle(): Promise<GoogleLoginResult> {
  const auth = getFirebaseAuth();
  if (!auth) {
    return {
      success: false,
      error: 'Firebase API kalitlari kiritilmagan. Iltimos, Firebase sozlamalarini kiriting.',
    };
  }

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    return {
      success: true,
      user,
      name: user.displayName || '',
      email: user.email || '',
      avatar: user.photoURL || null,
      phone: user.phoneNumber || '',
    };
  } catch (err: any) {
    console.error('[Firebase] Google sign-in error:', err);
    let message = 'Google orqali kirishda xatolik yuz berdi.';
    if (err.code === 'auth/popup-closed-by-user') {
      message = 'Kirish oynasi yopildi.';
    } else if (err.code === 'auth/cancelled-popup-request') {
      message = 'So‘rov bekor qilindi.';
    } else if (err.code === 'auth/unauthorized-domain') {
      message = 'Bu domen Firebase konsolida ruxsat berilgan domenlar (Authorized domains) ro‘yxatiga qo‘shilmagan.';
    } else if (err.message) {
      message = err.message;
    }
    return {
      success: false,
      error: message,
    };
  }
}

export async function logoutFirebase(): Promise<void> {
  const auth = getFirebaseAuth();
  if (auth) {
    try {
      await firebaseSignOut(auth);
    } catch {}
  }
}
