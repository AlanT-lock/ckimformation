'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import type { TestKind, EnqueteKind, QuestionType } from '@/lib/supabase/types';

async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') throw new Error('Accès refusé');
  return profile;
}

// ---------- Tests ----------

export async function createTest(input: {
  formation_id: string;
  nom: string;
  description?: string;
  kind: TestKind;
  enquete_kind?: EnqueteKind | null;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const enquete_kind = input.kind === 'enquete' ? (input.enquete_kind ?? null) : null;
  const { data, error } = await supabase
    .from('tests')
    .insert({
      formation_id: input.formation_id,
      nom: input.nom,
      description: input.description ?? null,
      kind: input.kind,
      enquete_kind,
    })
    .select('id, formation_id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Création échouée');
  revalidatePath('/admin/tests');
  revalidatePath(`/admin/tests/formation/${data.formation_id}`);
  redirect(`/admin/tests/${data.id}`);
}

export async function updateTest(id: string, input: {
  nom: string;
  description?: string | null;
  kind: TestKind;
  enquete_kind?: EnqueteKind | null;
  actif: boolean;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const enquete_kind = input.kind === 'enquete' ? (input.enquete_kind ?? null) : null;
  const { error } = await supabase
    .from('tests')
    .update({
      nom: input.nom,
      description: input.description ?? null,
      kind: input.kind,
      enquete_kind,
      actif: input.actif,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tests');
  revalidatePath(`/admin/tests/${id}`);
}

export async function deleteTest(id: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: t } = await supabase.from('tests').select('formation_id').eq('id', id).single();
  const { error } = await supabase.from('tests').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tests');
  if (t?.formation_id) revalidatePath(`/admin/tests/formation/${t.formation_id}`);
  redirect(t?.formation_id ? `/admin/tests/formation/${t.formation_id}` : '/admin/tests');
}

// ---------- Questions ----------

export interface QuestionInput {
  libelle: string;
  type_reponse: QuestionType;
  options: string[];
  echelle_max: number | null;
  required: boolean;
  // QCM unique : string | null ; QCM multiple : string[] ; autres : null
  bonne_reponse: unknown;
}

export async function createQuestion(testId: string, input: QuestionInput) {
  await requireAdmin();
  const supabase = await createClient();
  const { data: max } = await supabase
    .from('questions')
    .select('ordre')
    .eq('test_id', testId)
    .order('ordre', { ascending: false })
    .limit(1);
  const nextOrdre = (max?.[0]?.ordre ?? 0) + 1;

  const { error } = await supabase.from('questions').insert({
    test_id: testId,
    ordre: nextOrdre,
    libelle: input.libelle,
    type_reponse: input.type_reponse,
    options: input.options,
    echelle_max: input.echelle_max,
    required: input.required,
    bonne_reponse: input.bonne_reponse ?? null,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}`);
}

export async function updateQuestion(id: string, testId: string, input: QuestionInput) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from('questions')
    .update({
      libelle: input.libelle,
      type_reponse: input.type_reponse,
      options: input.options,
      echelle_max: input.echelle_max,
      required: input.required,
      bonne_reponse: input.bonne_reponse ?? null,
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}`);
}

export async function deleteQuestion(id: string, testId: string) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase.from('questions').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath(`/admin/tests/${testId}`);
}
