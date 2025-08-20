'use client';

import { db, storage } from '@/lib/firebase/client';
import {
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref,
  uploadBytesResumable,
  type UploadMetadata,
} from 'firebase/storage';

/** --------------------
 * Domain Types
 * ---------------------*/
export type UploadType = 'image' | 'document';

export interface UploadQuota {
  imagesUsed: number;
  documentsUsed: number;
  lastReset: Date | Timestamp;
  profileUploadsThisWeek: number;
  lastProfileUpload?: Date | Timestamp;
}

export interface UploadResult {
  path: string;
  url: string;
  size: number;
  contentType: string | null;
}

/** --------------------
 * Config
 * ---------------------*/
const QUOTA_LIMITS = {
  imagesPerMonth: 100,
  documentsPerMonth: 50,
  profileUploadsPerWeek: 1,
};

const MAX_SIZE_BYTES = {
  image: 10 * 1024 * 1024, // 10MB
  document: 20 * 1024 * 1024, // 20MB (PDF)
};

/** --------------------
 * Helpers
 * ---------------------*/
const toJsDate = (v?: Date | Timestamp | null): Date | undefined => {
  if (!v) return undefined;
  return v instanceof Date ? v : (v as Timestamp).toDate();
};

const monthChanged = (a: Date, b: Date) =>
  a.getUTCFullYear() !== b.getUTCFullYear() ||
  a.getUTCMonth() !== b.getUTCMonth();

const safeFileName = (name: string) => {
  const base = name.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const stamp = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  return `${stamp}_${base}`;
};

const quotaDocRef = (userId: string) => doc(db, 'upload_quotas', userId);

const ensureQuotaDoc = async (userId: string) => {
  const ref = quotaDocRef(userId);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const payload: UploadQuota = {
      imagesUsed: 0,
      documentsUsed: 0,
      lastReset: serverTimestamp() as unknown as Timestamp,
      profileUploadsThisWeek: 0,
      lastProfileUpload: undefined,
    };
    await setDoc(ref, payload);
    return (await getDoc(ref)).data() as UploadQuota;
  }
  return snap.data() as UploadQuota;
};

/** --------------------
 * Quota Logic
 * ---------------------*/
export async function checkAndResetMonthlyQuota(
  userId: string
): Promise<UploadQuota> {
  const ref = quotaDocRef(userId);
  const quota = await ensureQuotaDoc(userId);
  const now = new Date();

  const lastResetDate = toJsDate(quota.lastReset) ?? now;

  if (monthChanged(now, lastResetDate)) {
    await updateDoc(ref, {
      imagesUsed: 0,
      documentsUsed: 0,
      lastReset: serverTimestamp(),
    });
    const fresh = await getDoc(ref);
    return fresh.data() as UploadQuota;
  }
  return quota;
}

export async function canUpload(
  userId: string,
  type: UploadType,
  { isProfileImage = false }: { isProfileImage?: boolean } = {}
): Promise<{ allowed: boolean; reason?: string; quota: UploadQuota }> {
  const ref = quotaDocRef(userId);
  const quota = await checkAndResetMonthlyQuota(userId);
  const now = new Date();

  if (type === 'image' && quota.imagesUsed >= QUOTA_LIMITS.imagesPerMonth) {
    return { allowed: false, reason: 'เกินโควต้ารูปภาพรายเดือนแล้ว', quota };
  }
  if (
    type === 'document' &&
    quota.documentsUsed >= QUOTA_LIMITS.documentsPerMonth
  ) {
    return { allowed: false, reason: 'เกินโควต้าเอกสารรายเดือนแล้ว', quota };
  }

  if (isProfileImage) {
    const last = toJsDate(quota.lastProfileUpload);
    if (last) {
      const diffDays = (now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24);
      if (
        diffDays < 7 &&
        quota.profileUploadsThisWeek >= QUOTA_LIMITS.profileUploadsPerWeek
      ) {
        const remaining = Math.max(1, Math.ceil(7 - diffDays));
        return {
          allowed: false,
          reason: `อัพโหลดรูปโปรไฟล์ได้อีกครั้งใน ${remaining} วัน`,
          quota,
        };
      }
    }
  }

  return { allowed: true, quota };
}

export async function recordUpload(
  userId: string,
  type: UploadType,
  { isProfileImage = false }: { isProfileImage?: boolean } = {}
) {
  const ref = quotaDocRef(userId);
  const updates: Record<string, any> = {};
  if (type === 'image') updates.imagesUsed = increment(1);
  if (type === 'document') updates.documentsUsed = increment(1);

  if (isProfileImage) {
    updates.profileUploadsThisWeek = increment(1);
    updates.lastProfileUpload = serverTimestamp();
  }
  await updateDoc(ref, updates);
}

/** --------------------
 * Validation
 * ---------------------*/
export function validateFile(
  file: File,
  type: UploadType
): { valid: true } | { valid: false; error: string } {
  if (!file) return { valid: false, error: 'ไม่พบไฟล์' };

  if (type === 'image') {
    if (!file.type.startsWith('image/'))
      return { valid: false, error: 'กรุณาอัพโหลดไฟล์รูปภาพเท่านั้น' };
    if (file.size > MAX_SIZE_BYTES.image)
      return { valid: false, error: 'ไฟล์รูปภาพมีขนาดใหญ่เกินกำหนด (10MB)' };
  } else {
    if (file.type !== 'application/pdf')
      return { valid: false, error: 'กรุณาอัพโหลดไฟล์ PDF เท่านั้น' };
    if (file.size > MAX_SIZE_BYTES.document)
      return { valid: false, error: 'ไฟล์เอกสารมีขนาดใหญ่เกินกำหนด (20MB)' };
  }

  return { valid: true };
}

/** --------------------
 * Uploads
 * ---------------------*/
export async function uploadFile(
  userId: string,
  type: UploadType,
  file: File,
  opts: {
    isProfileImage?: boolean;
    compress?: boolean; // only for images
    pathPrefix?: string; // default: `${userId}/${type}s`
    metadata?: UploadMetadata;
  } = {}
): Promise<UploadResult> {
  const {
    isProfileImage = false,
    compress = false,
    pathPrefix,
    metadata,
  } = opts;

  const check = await canUpload(userId, type, { isProfileImage });
  if (!check.allowed)
    throw new Error(check.reason || 'ไม่สามารถอัพโหลดไฟล์ได้');

  let sourceFile = file;
  if (type === 'image' && compress) {
    const blob = await compressImage(file);
    sourceFile = new File([blob], file.name, { type: blob.type });
  }

  const dir = pathPrefix ?? `${userId}/${type}s`;
  const path = `${dir}/${safeFileName(sourceFile.name)}`;
  const storageRef = ref(storage, path);

  const task = uploadBytesResumable(storageRef, sourceFile, metadata);
  await new Promise<void>((resolve, reject) => {
    task.on(
      'state_changed',
      // progress listener is optional; omit to keep infra layer pure
      undefined,
      reject,
      () => resolve()
    );
  });

  const url = await getDownloadURL(storageRef);

  await recordUpload(userId, type, { isProfileImage });

  return {
    path,
    url,
    size: sourceFile.size,
    contentType: sourceFile.type || null,
  };
}

/** --------------------
 * Storage Utilities
 * ---------------------*/
export async function deleteByPath(path: string) {
  const r = ref(storage, path);
  await deleteObject(r);
}

export async function listByPrefix(prefix: string) {
  const r = ref(storage, prefix);
  const res = await listAll(r);
  return res.items.map(i => i.fullPath);
}

export async function getPublicUrlByPath(path: string) {
  const r = ref(storage, path);
  return getDownloadURL(r);
}

/** --------------------
 * Image compression (client-only)
 * ---------------------*/
export async function compressImage(
  file: File,
  maxWidth = 1920,
  maxHeight = 1080,
  quality = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;

        let { width, height } = img;
        const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          blob => {
            if (!blob) return reject(new Error('สร้าง blob ไม่สำเร็จ'));
            resolve(blob);
          },
          file.type || 'image/jpeg',
          quality
        );
      };
      img.onerror = reject;
      img.src = String(e.target?.result);
    };
    reader.readAsDataURL(file);
  });
}

/** --------------------
 * Example: High-level use case (kept minimal)
 * ---------------------*/
export async function uploadProfileImage(userId: string, file: File) {
  return uploadFile(userId, 'image', file, {
    isProfileImage: true,
    compress: true,
    pathPrefix: `${userId}/profile`,
  });
}
