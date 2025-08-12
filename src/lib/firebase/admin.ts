// src/lib/firebase/admin.ts
/**
 * Firebase Admin SDK (Server-only)
 */
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import {
  FieldValue,
  getFirestore,
  type Firestore,
} from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

function must(name: string, v?: string) {
  if (!v) throw new Error(`[Firebase Admin] Missing env ${name}`);
  return v;
}

// Init (singleton-safe)
const adminApp: App =
  getApps()[0] ??
  initializeApp({
    credential: cert({
      projectId: must(
        'FIREBASE_ADMIN_PROJECT_ID',
        process.env.FIREBASE_ADMIN_PROJECT_ID
      ),
      clientEmail: must(
        'FIREBASE_ADMIN_CLIENT_EMAIL',
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL
      ),
      privateKey: must(
        'FIREBASE_ADMIN_PRIVATE_KEY',
        process.env.FIREBASE_ADMIN_PRIVATE_KEY
      )?.replace(/\\n/g, '\n'),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });

const adminAuth: Auth = getAuth(adminApp);
const adminDb: Firestore = getFirestore(adminApp);
const adminStorage: Storage = getStorage(adminApp);

// ─────────────────────────────────────────────────────────────
// User management helpers
// ─────────────────────────────────────────────────────────────
export const userManagement = {
  // Create user + default role in claims and Firestore doc
  async createUser(
    email: string,
    password: string,
    role: string,
    displayName?: string
  ) {
    const user = await adminAuth.createUser({
      email,
      password,
      displayName,
      emailVerified: false,
    });
    await adminAuth.setCustomUserClaims(user.uid, { role });
    await adminDb
      .collection('users')
      .doc(user.uid)
      .set({
        email,
        displayName: displayName ?? null,
        role,
        photoURL: null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        lastLoginAt: null,
      });
    return { user, error: null as string | null };
  },

  async updateUserRole(uid: string, newRole: string) {
    await adminAuth.setCustomUserClaims(uid, { role: newRole });
    await adminDb
      .collection('users')
      .doc(uid)
      .set(
        { role: newRole, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
    // 🔐 Force clients to refresh token / session
    await adminAuth.revokeRefreshTokens(uid); // หลัง revoke ฝั่ง client ต้อง refresh token ใหม่
    return { success: true as const };
  },

  async getUserById(uid: string) {
    const [record, doc] = await Promise.all([
      adminAuth.getUser(uid),
      adminDb.collection('users').doc(uid).get(),
    ]);
    return { ...record, customData: doc.exists ? doc.data() : null };
  },

  async listUsers(limit = 1000, pageToken?: string) {
    const res = await adminAuth.listUsers(limit, pageToken);
    const ids = res.users.map(u => u.uid);
    const snap = ids.length
      ? await adminDb
          .collection('users')
          .where('__name__', 'in', ids.slice(0, 10))
          .get()
      : null;
    const extra = new Map(snap?.docs.map(d => [d.id, d.data()]) ?? []);
    return {
      users: res.users.map(u => ({
        ...u,
        customData: extra.get(u.uid) ?? null,
      })),
      pageToken: res.pageToken,
    };
  },

  async deleteUser(uid: string) {
    await Promise.all([
      adminAuth.deleteUser(uid),
      adminDb
        .collection('users')
        .doc(uid)
        .delete()
        .catch(() => {}),
    ]);
    return { success: true as const };
  },

  async verifyIdToken(idToken: string) {
    const decodedToken = await adminAuth.verifyIdToken(idToken, true); // checkRevoked=false/true ก็ได้
    return { decodedToken, error: null as string | null };
  },

  async createSessionCookie(
    idToken: string,
    expiresInMs = 3 * 24 * 60 * 60 * 1000
  ) {
    // default 3 วัน
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: expiresInMs,
    });
    return { sessionCookie, error: null as string | null };
  },

  async verifySessionCookie(sessionCookie: string) {
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true
    ); // checkRevoked
    return { decodedClaims, error: null as string | null };
  },
};

export { adminApp, adminAuth, adminDb, adminStorage };
export default {
  app: adminApp,
  auth: adminAuth,
  db: adminDb,
  storage: adminStorage,
  userManagement,
};
