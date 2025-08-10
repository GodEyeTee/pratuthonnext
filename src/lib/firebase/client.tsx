'use client';
/**
 * Firebase Client SDK Configuration (Next.js 15+)
 * - Client-only
 * - Safe singleton init (no FirebaseApp | undefined)
 * - Firestore: persistent local cache + multi-tab
 * - Analytics: dynamic import + isSupported()
 */

import {
  getApps,
  initializeApp,
  type FirebaseApp,
  type FirebaseOptions,
} from 'firebase/app';
import {
  browserLocalPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  getAuth,
  GoogleAuthProvider,
  indexedDBLocalPersistence,
  onAuthStateChanged,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signInWithRedirect,
  updateProfile,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  CACHE_SIZE_UNLIMITED,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const isBrowser = typeof window !== 'undefined';

/* ----------------------------- Env (point access only) ----------------------------- */
/** สำคัญ: อ้าง process.env แบบ “จุด” เท่านั้น เพื่อให้ Next inline ค่าตอน build */
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const MESSAGING_SENDERID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

function validateEnv() {
  if (!API_KEY || !AUTH_DOMAIN || !PROJECT_ID) {
    throw new Error(
      '[Firebase] Missing required env: NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, NEXT_PUBLIC_FIREBASE_PROJECT_ID'
    );
  }
}

/* --------------------------------- Config -------------------------------- */
const firebaseConfig: FirebaseOptions = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MESSAGING_SENDERID,
  appId: APP_ID,
  measurementId: MEASUREMENT_ID,
};

/* ------------------------ Safe singleton initialization ------------------- */
function getOrInitClientApp(config: FirebaseOptions): FirebaseApp {
  validateEnv();
  const apps = getApps();
  return apps.length > 0 ? apps[0]! : initializeApp(config);
}

/* === Exports (named only) ================================================= */
export const app: FirebaseApp = getOrInitClientApp(firebaseConfig);

/* --------------------------------- Auth ---------------------------------- */
export const auth: Auth = getAuth(app);

// กำหนด persistence: IndexedDB → localStorage → session (เว็บ)
if (isBrowser) {
  setPersistence(auth, indexedDBLocalPersistence)
    .catch(() => setPersistence(auth, browserLocalPersistence))
    .catch(() => setPersistence(auth, browserSessionPersistence))
    .catch(e => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Firebase] Failed to set auth persistence:', e);
      }
    });

  try {
    auth.languageCode = navigator?.language ?? 'en';
  } catch {
    /* no-op */
  }
}

/* ------------------------------ Firestore DB ------------------------------ */
// ใช้ cache รุ่นใหม่ + multi-tab (แนวทาง offline/persistence)
export const db: Firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    tabManager: persistentMultipleTabManager(),
  }),
});

/* -------------------------------- Storage -------------------------------- */
export const storage: FirebaseStorage = getStorage(app);

/* ------------------------------- Analytics -------------------------------- */
// โหลดเฉพาะเมื่อรองรับ (กันปัญหา Next/SSR)
export type { Analytics } from 'firebase/analytics';
export async function loadAnalytics() {
  if (!isBrowser) return null;
  try {
    const { isSupported, getAnalytics } = await import('firebase/analytics');
    return (await isSupported()) ? getAnalytics(app) : null;
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Firebase] Analytics not available:', e);
    }
    return null;
  }
}

/* ------------------------------- Providers -------------------------------- */
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/* -------------------------------- Helpers --------------------------------- */
export const authHelpers = {
  async signInWithGoogle(): Promise<{
    user: User | null;
    error: string | null;
  }> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return { user: result.user, error: null };
    } catch (err: any) {
      if (
        isBrowser &&
        (err?.code === 'auth/popup-blocked' ||
          err?.code === 'auth/operation-not-supported-in-this-environment')
      ) {
        try {
          await signInWithRedirect(auth, googleProvider);
          return { user: null, error: null };
        } catch (e: any) {
          return { user: null, error: e?.message ?? 'Google sign-in failed' };
        }
      }
      return { user: null, error: err?.message ?? 'Google sign-in failed' };
    }
  },

  async signInWithEmail(email: string, password: string) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return { user: result.user, error: null };
    } catch (e: any) {
      return { user: null, error: e?.message ?? 'Email sign-in failed' };
    }
  },

  async createAccount(email: string, password: string, displayName?: string) {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      if (displayName) {
        await updateProfile(result.user, { displayName }).catch(() => {});
      }
      return { user: result.user, error: null };
    } catch (e: any) {
      return { user: null, error: e?.message ?? 'Account creation failed' };
    }
  },

  async signOut() {
    try {
      await firebaseSignOut(auth);
      return { error: null };
    } catch (e: any) {
      return { error: e?.message ?? 'Sign out failed' };
    }
  },

  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (e: any) {
      return { error: e?.message ?? 'Password reset failed' };
    }
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async getIdToken(forceRefresh = false): Promise<string | null> {
    const user = auth.currentUser;
    if (!user) return null;
    try {
      return await user.getIdToken(forceRefresh);
    } catch {
      return null;
    }
  },
};
