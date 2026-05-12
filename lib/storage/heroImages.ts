import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { sanitizeFilename } from '@/lib/storage/documents';

export const BUCKET_HERO = 'formation-hero';
export const MAX_HERO_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_HERO_MIME = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
];

// Format de référence — déjà utilisé par les visuels existants (1600×1067).
export const HERO_RECOMMENDED = {
  width: 1600,
  height: 1067,
  ratio: 1600 / 1067, // ≈ 1.50 (paysage 3:2)
  minWidth: 1200,
  // Tolérance de ratio acceptée sans alerte (paysage léger → paysage cinéma)
  ratioMin: 1.4,
  ratioMax: 2.0,
} as const;

export interface UploadHeroOk {
  ok: true;
  url: string;
  path: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}
export interface UploadHeroErr {
  ok: false;
  error: string;
}

/**
 * Upload une image de hero dans le bucket public `formation-hero`.
 * Retourne l'URL publique servable directement par <Image />.
 */
export async function uploadHeroImage(
  file: File,
  slugHint?: string,
): Promise<UploadHeroOk | UploadHeroErr> {
  if (file.size === 0) return { ok: false, error: 'Fichier vide.' };
  if (file.size > MAX_HERO_SIZE_BYTES) {
    return { ok: false, error: 'Fichier trop volumineux (max 5 MB).' };
  }
  if (!ALLOWED_HERO_MIME.includes(file.type)) {
    return {
      ok: false,
      error: `Format non supporté (${file.type || 'inconnu'}). Acceptés : JPEG, PNG, WebP, AVIF.`,
    };
  }

  const admin = createAdminClient();
  const cleanName = sanitizeFilename(file.name);
  const ext = cleanName.includes('.') ? cleanName.split('.').pop() : 'jpg';
  const baseName = slugHint ? sanitizeFilename(slugHint) : 'hero';
  // Chemin déterministe-par-formation mais unique-par-upload : permet de
  // retrouver les uploads par formation, et évite les conflits si on remplace.
  const path = `${baseName}/${Date.now()}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await admin.storage.from(BUCKET_HERO).upload(path, buffer, {
    contentType: file.type || 'image/jpeg',
    upsert: false,
    cacheControl: '31536000', // 1 an (URL change si on remplace, pas de souci)
  });
  if (error) return { ok: false, error: error.message };

  const { data } = admin.storage.from(BUCKET_HERO).getPublicUrl(path);
  return {
    ok: true,
    url: data.publicUrl,
    path,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type || 'image/jpeg',
  };
}

/** Supprime un objet du bucket à partir de son chemin storage. */
export async function deleteHeroImage(path: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error } = await admin.storage.from(BUCKET_HERO).remove([path]);
  if (error) {
    console.error('[hero-images] delete failed', error);
    return false;
  }
  return true;
}
