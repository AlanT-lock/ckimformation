-- =============================================================================
--  Rubrique Entreprises (admin) — correctif handle_new_user
-- =============================================================================
--  20260510 avait ajouté secteur_activite au trigger ; 20260512 l'a redéfini
--  (liaison employee_id) SANS secteur_activite → le secteur saisi au signup
--  entreprise n'était plus enregistré. On fusionne les deux versions.
--  Un code secteur inconnu est ignoré (sinon la FK ferait échouer la création
--  de l'utilisateur auth).
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role         user_role;
  v_account_type account_type;
  v_employee_id  uuid;
  v_secteur      text;
begin
  v_role := coalesce(nullif(new.raw_user_meta_data->>'role',''), 'stagiaire')::user_role;
  v_account_type := nullif(new.raw_user_meta_data->>'account_type','')::account_type;
  v_employee_id := nullif(new.raw_user_meta_data->>'employee_id','')::uuid;

  select code into v_secteur
    from public.secteurs_activite
   where code = nullif(new.raw_user_meta_data->>'secteur_activite','');

  insert into public.profiles (id, role, account_type, full_name, phone, email, employer_profile_id, secteur_activite)
  values (
    new.id,
    v_role,
    v_account_type,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new.raw_user_meta_data->>'phone',
    new.email,
    nullif(new.raw_user_meta_data->>'employer_profile_id','')::uuid,
    v_secteur
  );

  if v_account_type = 'entreprise' then
    insert into public.company_details (profile_id, raison_sociale, siret, tva_intra, contact_fonction, billing_address)
    values (
      new.id,
      coalesce(new.raw_user_meta_data->>'raison_sociale', ''),
      nullif(new.raw_user_meta_data->>'siret', ''),
      nullif(new.raw_user_meta_data->>'tva_intra', ''),
      new.raw_user_meta_data->>'contact_fonction',
      coalesce((new.raw_user_meta_data->>'billing_address')::jsonb, '{}'::jsonb)
    );
  end if;

  -- Salarié invité : on lie sa fiche employee à son profile.
  if v_employee_id is not null then
    update public.employees
       set profile_id = new.id, updated_at = now()
     where id = v_employee_id;
  end if;

  return new;
end;
$$;

-- Le trigger on_auth_user_created existe déjà (init) — pas besoin de le recréer.
