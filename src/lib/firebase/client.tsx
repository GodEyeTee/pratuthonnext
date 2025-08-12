// src/lib/firebase/client.tsx
/**
 * Firebase Client SDK (Browser)
 * Next.js 15 compatible, singleton-safe, clean & optimized
 *
 * - Firestore: initializeFirestore + persistentLocalCache (multi-tab)
 * - Auth persistence: LOCAL (stay signed-in)
 * - Analytics: lazy load with isSupported()
 */

import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';
import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  getAuth,
  GoogleAuthProvider,
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
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
} from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/* -------------------------------------------------------------------------- */
/*  Env (อ่านแบบ "คงที่" ทีละตัว เพื่อให้ Next inline ตอน build)             */
/* -------------------------------------------------------------------------- */
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const MSG_SENDER_ID = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const APP_ID = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
const MEASUREMENT_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

// ตรวจ required env แบบชัด ๆ (ห้ามใช้ process.env[key] แบบไดนามิกในฝั่ง client)
if (!API_KEY)
  throw new Error(
    '[Firebase] Missing required env: NEXT_PUBLIC_FIREBASE_API_KEY'
  );
if (!AUTH_DOMAIN)
  throw new Error(
    '[Firebase] Missing required env: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'
  );
if (!PROJECT_ID)
  throw new Error(
    '[Firebase] Missing required env: NEXT_PUBLIC_FIREBASE_PROJECT_ID'
  );

const firebaseConfig = {
  apiKey: API_KEY,
  authDomain: AUTH_DOMAIN,
  projectId: PROJECT_ID,
  storageBucket: STORAGE_BUCKET,
  messagingSenderId: MSG_SENDER_ID,
  appId: APP_ID,
  measurementId: MEASUREMENT_ID, // optional
};

/* -------------------------------------------------------------------------- */
/*  Singletons (กัน HMR ซ้ำใน dev)                                           */
/* -------------------------------------------------------------------------- */
const g = globalThis as unknown as {
  __FBCACHE__?: {
    app?: FirebaseApp;
    auth?: Auth;
    db?: Firestore;
    storage?: FirebaseStorage;
    analytics?: Analytics | null;
    analyticsInit?: Promise<Analytics | null>;
    persistenceApplied?: boolean;
  };
};
g.__FBCACHE__ ||= {};

// App
const app: FirebaseApp =
  g.__FBCACHE__!.app ??
  (getApps().length ? getApps()[0]! : initializeApp(firebaseConfig));
g.__FBCACHE__!.app = app;

// Firestore (local persistent cache, multi-tab)
if (!g.__FBCACHE__!.db) {
  initializeFirestore(app, {
    localCache: persistentLocalCache({
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
      tabManager: persistentMultipleTabManager(),
    }),
  });
  g.__FBCACHE__!.db = getFirestore(app);
}
const db: Firestore = g.__FBCACHE__!.db!;

// Auth
const auth: Auth = g.__FBCACHE__!.auth ?? getAuth(app);
g.__FBCACHE__!.auth = auth;

// Storage
const storage: FirebaseStorage = g.__FBCACHE__!.storage ?? getStorage(app);
g.__FBCACHE__!.storage = storage;

// Apply auth persistence (LOCAL) ครั้งเดียว
if (typeof window !== 'undefined' && !g.__FBCACHE__!.persistenceApplied) {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  g.__FBCACHE__!.persistenceApplied = true;
}

/* -------------------------------------------------------------------------- */
/*  Analytics (lazy)                                                          */
/* -------------------------------------------------------------------------- */
export async function loadAnalytics(): Promise<Analytics | null> {
  if (typeof window === 'undefined') return null;
  if (!MEASUREMENT_ID) return null;

  if (!g.__FBCACHE__!.analyticsInit) {
    g.__FBCACHE__!.analyticsInit = isSupported()
      .then(ok => (ok ? getAnalytics(app) : null))
      .catch(() => null);
  }
  g.__FBCACHE__!.analytics = await g.__FBCACHE__!.analyticsInit;
  return g.__FBCACHE__!.analytics ?? null;
}

/* -------------------------------------------------------------------------- */
/*  Auth helpers                                                              */
/* -------------------------------------------------------------------------- */
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

type AuthResult =
  | { user: User; error: null }
  | { user: null; error: string | null };

export const authHelpers = {
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      if (typeof window === 'undefined')
        return { user: null, error: 'Client only' };
      try {
        const { user } = await signInWithPopup(auth, googleProvider);
        return { user, error: null };
      } catch {
        // บางเคส (iOS Safari / popup blocker) — fallback เป็น redirect
        await setPersistence(auth, browserLocalPersistence);
        await signInWithRedirect(auth, googleProvider);
        // หลัง redirect กลับมา หน้า caller จะต้อง handle เอง
        return { user: null, error: null };
      }
    } catch (e: any) {
      console.error('Google sign-in error:', e);
      return { user: null, error: e?.message ?? 'Sign-in failed' };
    }
  },

  async signInWithEmail(email: string, password: string): Promise<AuthResult> {
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      return { user, error: null };
    } catch (e: any) {
      console.error('Email sign-in error:', e);
      return { user: null, error: e?.message ?? 'Sign-in failed' };
    }
  },

  async createAccount(
    email: string,
    password: string,
    displayName?: string
  ): Promise<AuthResult> {
    try {
      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Update display name if provided
      if (displayName) {
        await updateProfile(user, { displayName });
      }

      return { user, error: null };
    } catch (e: any) {
      console.error('Create account error:', e);
      return { user: null, error: e?.message ?? 'Account creation failed' };
    }
  },

  async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      await sendPasswordResetEmail(auth, email);
      return { error: null };
    } catch (e: any) {
      console.error('Password reset error:', e);
      return { error: e?.message ?? 'Password reset failed' };
    }
  },

  async signOut(): Promise<{ error: string | null }> {
    try {
      await firebaseSignOut(auth);
      return { error: null };
    } catch (e: any) {
      console.error('Sign out error:', e);
      return { error: e?.message ?? 'Sign-out failed' };
    }
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async getIdToken(forceRefresh = false): Promise<string | null> {
    const u = auth.currentUser;
    if (!u) return null;
    try {
      return await u.getIdToken(forceRefresh);
    } catch (e) {
      console.error('Get ID token error:', e);
      return null;
    }
  },
};

/* -------------------------------------------------------------------------- */
export { app, auth, db, storage };
export default { app, auth, db, storage, loadAnalytics, authHelpers };
