import 'server-only';
/**
 * Firebase Admin SDK Configuration (Server-only)
 */

import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getStorage, type Storage } from 'firebase-admin/storage';

function sanitizePrivateKey(raw?: string): string | undefined {
  return raw?.replace(/\\n/g, '\n');
}
function hasServiceAccountEnv() {
  return (
    !!process.env.FIREBASE_ADMIN_PROJECT_ID &&
    !!process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
    !!process.env.FIREBASE_ADMIN_PRIVATE_KEY
  );
}
function hasADC() {
  return (
    !!process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    !!process.env.FIREBASE_ADMIN_CREDENTIAL_JSON
  );
}
function validateAdminConfig() {
  if (!hasServiceAccountEnv() && !hasADC()) {
    throw new Error('[Firebase Admin] Missing credentials.');
  }
}

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

try {
  validateAdminConfig();
  const apps = getApps();
  if (apps.length > 0) {
    adminApp = apps[0]!;
  } else if (hasServiceAccountEnv()) {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: sanitizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY),
      }),
      storageBucket:
        process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  } else {
    adminApp = initializeApp({
      storageBucket:
        process.env.FIREBASE_ADMIN_STORAGE_BUCKET ||
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
  adminDb.settings({ ignoreUndefinedProperties: true });
  adminStorage = getStorage(adminApp);
} catch (error) {
  console.error('Firebase Admin initialization error:', error);
  throw error;
}

export { adminApp, adminAuth, adminDb, adminStorage };
export default {
  app: adminApp,
  auth: adminAuth,
  db: adminDb,
  storage: adminStorage,
};
