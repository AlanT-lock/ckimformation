import 'server-only';

import { createElement, type ReactElement } from 'react';
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import { rowToFormation, type FormationRow } from '@/lib/db/formations';
import { FormationPDF } from '@/lib/pdf/FormationPDF';
import { ficheFilename, validateFichePdf } from './fiche-rules';

export const BUCKET_FICHES = 'formation-fiches';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COLS = `
  id, slug, titre, sous_titre, parcours, ref, hero_image, hero_alt,
  duree, public_concerne, public_detail, prerequis, prix_indicatif,
  modalite, inscription, recyclage,
  objectifs, programme, tarifs, evaluation, references_reglementaires, formations_liees,
  secteurs_cibles, formations_recommandees,
  seo_title, seo_description, actif, ordre, created_at, updated_at, fiche_pdf_path
`;

export interface FormationFiche {
  buffer: Buffer;
  filename: string;
  source: 'custom' | 'generated';
  slug: string;
}

/**
 * Fiche PDF d'une formation (id ou slug) : le PDF déposé par l'admin s'il
 * existe, sinon la fiche générée. `client` porte la visibilité : client RLS
 * pour le public (formations actives), client admin côté back-office / emails.
 */
export async function loadFormationFiche(
  client: SupabaseClient,
  idOrSlug: string,
): Promise<FormationFiche | null> {
  const query = client.from('formations').select(COLS);
  const { data } = UUID_RE.test(idOrSlug)
    ? await query.eq('id', idOrSlug).maybeSingle()
    : await query.eq('slug', idOrSlug).maybeSingle();
  if (!data) return null;

  const row = data as unknown as FormationRow & { fiche_pdf_path: string | null; slug: string; ref: string | null };
  const filename = ficheFilename({ ref: row.ref, slug: row.slug });

  if (row.fiche_pdf_path) {
    const { data: blob, error } = await createAdminClient().storage.from(BUCKET_FICHES).download(row.fiche_pdf_path);
    if (blob && !error) {
      return { buffer: Buffer.from(await blob.arrayBuffer()), filename, source: 'custom', slug: row.slug };
    }
    console.error('[fiche-pdf] PDF déposé introuvable, fiche générée utilisée', row.fiche_pdf_path, error);
  }

  const formation = rowToFormation(row);
  const buffer = await renderToBuffer(
    createElement(FormationPDF, { formation }) as unknown as ReactElement<DocumentProps>,
  );
  return { buffer, filename, source: 'generated', slug: row.slug };
}

/** Dépose (ou remplace) le PDF personnalisé d'une formation. */
export async function uploadFormationFiche(
  formationId: string,
  file: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const invalid = validateFichePdf(file, bytes);
  if (invalid) return { ok: false, error: invalid };

  const admin = createAdminClient();
  const { data: formation } = await admin
    .from('formations')
    .select('id, fiche_pdf_path')
    .eq('id', formationId)
    .maybeSingle();
  if (!formation) return { ok: false, error: 'Formation introuvable.' };

  const path = `${formationId}/${Date.now()}.pdf`;
  const { error: upErr } = await admin.storage
    .from(BUCKET_FICHES)
    .upload(path, bytes, { contentType: 'application/pdf', upsert: false });
  if (upErr) return { ok: false, error: upErr.message };

  const { error: dbErr } = await admin.from('formations').update({ fiche_pdf_path: path }).eq('id', formationId);
  if (dbErr) {
    await admin.storage.from(BUCKET_FICHES).remove([path]);
    return { ok: false, error: dbErr.message };
  }
  if (formation.fiche_pdf_path) {
    await admin.storage.from(BUCKET_FICHES).remove([formation.fiche_pdf_path]);
  }
  return { ok: true };
}

/** Revient à la fiche générée automatiquement. */
export async function removeFormationFiche(
  formationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { data: formation } = await admin
    .from('formations')
    .select('id, fiche_pdf_path')
    .eq('id', formationId)
    .maybeSingle();
  if (!formation) return { ok: false, error: 'Formation introuvable.' };
  if (!formation.fiche_pdf_path) return { ok: true };

  const { error } = await admin.from('formations').update({ fiche_pdf_path: null }).eq('id', formationId);
  if (error) return { ok: false, error: error.message };
  await admin.storage.from(BUCKET_FICHES).remove([formation.fiche_pdf_path]);
  return { ok: true };
}
