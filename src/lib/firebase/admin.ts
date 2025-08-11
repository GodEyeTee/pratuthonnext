/**
 * Firebase Admin SDK Configuration
 * Server-side only (Next.js App Router, Node.js runtime)
 */
import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

// กัน import ซ้ำตอน dev
const g = globalThis as unknown as {
  __ADMIN__?: { app?: App; auth?: Auth; db?: Firestore; storage?: Storage };
};
g.__ADMIN__ ||= {};

function validateAdminEnv() {
  const required = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
    'FIREBASE_ADMIN_PRIVATE_KEY',
  ] as const;
  for (const key of required) {
    if (!process.env[key])
      throw new Error(`[Firebase Admin] Missing env: ${key}`);
  }
}

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

try {
  validateAdminEnv();

  if (!g.__ADMIN__!.app) {
    adminApp =
      getApps().length === 0
        ? initializeApp({
            credential: cert({
              projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
              clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
              privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY!.replace(
                /\\n/g,
                '\n'
              ),
            }),
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          })
        : getApps()[0]!;
    g.__ADMIN__!.app = adminApp;
  } else {
    adminApp = g.__ADMIN__!.app!;
  }

  g.__ADMIN__!.auth ||= getAuth(adminApp);
  g.__ADMIN__!.db ||= getFirestore(adminApp);
  g.__ADMIN__!.storage ||= getStorage(adminApp);

  adminAuth = g.__ADMIN__!.auth!;
  adminDb = g.__ADMIN__!.db!;
  adminStorage = g.__ADMIN__!.storage!;
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  throw error;
}

/* ----------------------------- User management ---------------------------- */
export const userManagement = {
  async createUser(
    email: string,
    password: string,
    role: string,
    displayName?: string
  ) {
    try {
      const userRecord = await adminAuth.createUser({
        email,
        password,
        displayName,
        emailVerified: false,
      });

      // ตั้ง custom claims เมื่อจำเป็น (admin/support); ผู้ใช้ทั่วไปไม่ต้องตั้งก็ได้
      await adminAuth.setCustomUserClaims(userRecord.uid, { role });

      // สร้างโปรไฟล์ Firestore
      await adminDb
        .collection('users')
        .doc(userRecord.uid)
        .set({
          email,
          displayName: displayName || null,
          role,
          photoURL: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastLoginAt: null,
        });

      return { user: userRecord, error: null };
    } catch (e: any) {
      console.error('Create user error:', e);
      return { user: null, error: e?.message ?? 'Create user failed' };
    }
  },

  async updateUserRole(uid: string, newRole: string) {
    try {
      await adminAuth.setCustomUserClaims(uid, { role: newRole });
      await adminDb.collection('users').doc(uid).set(
        {
          role: newRole,
          updatedAt: new Date(),
        },
        { merge: true }
      );
      await adminDb.collection('audit_logs').add({
        action: 'role_changed',
        userId: uid,
        performedBy: 'system',
        timestamp: new Date(),
        details: { newRole },
      });
      return { success: true, error: null };
    } catch (e: any) {
      console.error('Update role error:', e);
      return { success: false, error: e?.message ?? 'Update role failed' };
    }
  },

  async getUserById(uid: string) {
    try {
      const [userRecord, userDoc] = await Promise.all([
        adminAuth.getUser(uid),
        adminDb.collection('users').doc(uid).get(),
      ]);
      return {
        ...userRecord,
        customData: userDoc.exists ? userDoc.data() : null,
      };
    } catch (e) {
      console.error('Get user error:', e);
      return null;
    }
  },

  async listUsers(limit = 100, pageToken?: string) {
    try {
      const listResult = await adminAuth.listUsers(limit, pageToken);
      const ids = listResult.users.map(u => u.uid);
      if (ids.length === 0)
        return { users: [], pageToken: listResult.pageToken };

      const snap = await adminDb
        .collection('users')
        .where('__name__', 'in', ids)
        .get();
      const meta = new Map<string, any>();
      snap.forEach(d => meta.set(d.id, d.data()));

      const enriched = listResult.users.map(u => ({
        ...u,
        customData: meta.get(u.uid) || null,
      }));

      return { users: enriched, pageToken: listResult.pageToken };
    } catch (e) {
      console.error('List users error:', e);
      return { users: [], pageToken: undefined };
    }
  },

  async deleteUser(uid: string) {
    try {
      await adminAuth.deleteUser(uid);
      await adminDb.collection('users').doc(uid).delete();
      await adminDb.collection('audit_logs').add({
        action: 'user_deleted',
        userId: uid,
        performedBy: 'system',
        timestamp: new Date(),
      });
      return { success: true, error: null };
    } catch (e: any) {
      console.error('Delete user error:', e);
      return { success: false, error: e?.message ?? 'Delete user failed' };
    }
  },

  async verifyIdToken(idToken: string) {
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      return { decodedToken, error: null };
    } catch (e: any) {
      console.error('Verify token error:', e);
      return { decodedToken: null, error: e?.message ?? 'Verify token failed' };
    }
  },

  // คุกกี้ 3 วัน
  async createSessionCookie(
    idToken: string,
    expiresIn = 3 * 24 * 60 * 60 * 1000
  ) {
    try {
      const sessionCookie = await adminAuth.createSessionCookie(idToken, {
        expiresIn,
      });
      return { sessionCookie, error: null };
    } catch (e: any) {
      console.error('Create session cookie error:', e);
      return {
        sessionCookie: null,
        error: e?.message ?? 'Create session cookie failed',
      };
    }
  },

  async verifySessionCookie(sessionCookie: string) {
    try {
      const decodedClaims = await adminAuth.verifySessionCookie(
        sessionCookie,
        true
      );
      return { decodedClaims, error: null };
    } catch (e: any) {
      console.error('Verify session cookie error:', e);
      return {
        decodedClaims: null,
        error: e?.message ?? 'Verify session cookie failed',
      };
    }
  },
};

/* ------------------------------- DB helpers ------------------------------- */
export const dbHelpers = {
  async getDoc(collection: string, docId: string) {
    const snap = await adminDb.collection(collection).doc(docId).get();
    return snap.exists ? { id: snap.id, ...snap.data() } : null;
  },
  async getCollection(collection: string, limit = 100) {
    const snap = await adminDb.collection(collection).limit(limit).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },
  async createDoc(collection: string, data: any, docId?: string) {
    const ref = docId
      ? adminDb.collection(collection).doc(docId)
      : adminDb.collection(collection).doc();
    await ref.set({ ...data, createdAt: new Date(), updatedAt: new Date() });
    return ref.id;
  },
  async updateDoc(collection: string, docId: string, data: any) {
    await adminDb
      .collection(collection)
      .doc(docId)
      .update({ ...data, updatedAt: new Date() });
  },
  async deleteDoc(collection: string, docId: string) {
    await adminDb.collection(collection).doc(docId).delete();
  },
  batch() {
    return adminDb.batch();
  },
  runTransaction<T>(
    callback: (tx: FirebaseFirestore.Transaction) => Promise<T>
  ) {
    return adminDb.runTransaction(callback);
  },
};

export { adminApp, adminAuth, adminDb, adminStorage };
export default {
  app: adminApp,
  auth: adminAuth,
  db: adminDb,
  storage: adminStorage,
  userManagement,
  dbHelpers,
};
