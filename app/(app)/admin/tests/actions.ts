'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import type { TestKind, QuestionType } from '@/lib/supabase/types';

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
}) {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('tests')
    .insert({
      formation_id: input.formation_id,
      nom: input.nom,
      description: input.description ?? null,
      kind: input.kind,
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Création échouée');
  revalidatePath('/admin/tests');
  redirect(`/admin/tests/${data.id}`);
}

export async function updateTest(id: string, input: {
  nom: string;
  description?: string | null;
  kind: TestKind;
  actif: boolean;
}) {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from('tests')
    .update({
      nom: input.nom,
      description: input.description ?? null,
      kind: input.kind,
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
  const { error } = await supabase.from('tests').delete().eq('id', id);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/tests');
  redirect('/admin/tests');
}

// ---------- Questions ----------

export interface QuestionInput {
  libelle: string;
  type_reponse: QuestionType;
  options: string[];
  echelle_max: number | null;
  required: boolean;
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
