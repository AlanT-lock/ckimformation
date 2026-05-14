-- =============================================================================
--  Fix RLS session_test_triggers : couvrir le modèle multi-participants
-- =============================================================================
--  Le bug : la policy initiale ne reconnaissait que l'ancien modèle
--  "inscriptions.participant_profile_id = auth.uid()" (particulier). Les
--  employés entreprise (qui passent par inscription_participants → employees
--  → profile_id) ne pouvaient pas lire les triggers, donc Supabase Realtime
--  ne leur propageait pas le déclenchement d'un test et le popup ne
--  s'affichait pas.
--
--  Fix : on utilise la fonction SECURITY DEFINER uid_participates_in_inscription
--  (créée dans 20260513_rls_fix_recursion.sql) qui couvre les deux modèles
--  sans recourir à une jointure récursive.
-- =============================================================================

drop policy if exists "triggers read participants" on public.session_test_triggers;
create policy "triggers read participants" on public.session_test_triggers
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.sessions s
      where s.id = session_id and s.formateur_id = auth.uid()
    )
    or exists (
      select 1 from public.inscriptions i
      where i.session_id = session_id
        and (
          i.participant_profile_id = auth.uid()
          or i.payer_profile_id = auth.uid()
          or public.uid_participates_in_inscription(i.id)
        )
    )
  );
