import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';

export const BUCKET_PAYER = 'inscription-docs-payer';
export const BUCKET_ADMIN = 'inscription-docs-admin';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export interface UploadResult {
  ok: true;
  path: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}
export interface UploadError {
  ok: false;
  error: string;
}

export function sanitizeFilename(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120) || 'document';
}

/** Upload un File dans un bucket privé. Retourne le chemin storage. */
export async function uploadDocument(
  bucket: typeof BUCKET_PAYER | typeof BUCKET_ADMIN,
  inscriptionId: string,
  subKey: string,
  file: File
): Promise<UploadResult | UploadError> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return { ok: false, error: `Fichier trop volumineux (max 10 MB).` };
  }
  if (file.size === 0) {
    return { ok: false, error: 'Fichier vide.' };
  }
  const admin = createAdminClient();
  const cleanName = sanitizeFilename(file.name);
  const path = `${inscriptionId}/${subKey}/${Date.now()}-${cleanName}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(bucket).upload(path, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return {
    ok: true,
    path,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'application/octet-stream',
  };
}

/** Renvoie une URL signée à durée limitée pour télécharger un objet. */
export async function getSignedUrl(
  bucket: typeof BUCKET_PAYER | typeof BUCKET_ADMIN,
  path: string,
  ttlSeconds = 60
): Promise<string | null> {
  const admin = createAdminClient();
  const { data, error } = await admin.storage.from(bucket).createSignedUrl(path, ttlSeconds);
  if (error || !data) {
    console.error('[storage] signed url failed', error);
    return null;
  }
  return data.signedUrl;
}

export async function deleteDocument(
  bucket: typeof BUCKET_PAYER | typeof BUCKET_ADMIN,
  path: string
): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(bucket).remove([path]);
  if (error) {
    console.error('[storage] delete failed', error);
    return false;
  }
  return true;
}
