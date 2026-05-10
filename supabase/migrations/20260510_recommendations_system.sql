-- =============================================================================
--  Migration : système de recommandations & relances email
--  Date : 2026-05-10
--  À exécuter dans le SQL Editor de Supabase. Idempotent.
-- =============================================================================

-- -----------------------------------------------------------------------------
--  1. Table de référence : secteurs d'activité
-- -----------------------------------------------------------------------------

create table if not exists public.secteurs_activite (
  code        text primary key,
  label       text not null,
  ordre       int  not null default 0,
  actif       boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.secteurs_activite enable row level security;

drop policy if exists "secteurs read all" on public.secteurs_activite;
create policy "secteurs read all" on public.secteurs_activite
  for select using (true);

drop policy if exists "secteurs write admin" on public.secteurs_activite;
create policy "secteurs write admin" on public.secteurs_activite
  for all using (public.is_admin()) with check (public.is_admin());

-- Seed initial : 20 secteurs courants
insert into public.secteurs_activite (code, label, ordre) values
  ('batiment-tp',              'Bâtiment et travaux publics',           10),
  ('industrie',                'Industrie manufacturière',              20),
  ('automobile',               'Automobile, mécanique',                 30),
  ('transport-logistique',     'Transport et logistique',               40),
  ('agriculture-agroalim',     'Agriculture et agroalimentaire',        50),
  ('restauration-hcr',         'Restauration, hôtellerie, café',        60),
  ('commerce',                 'Commerce et distribution',              70),
  ('artisanat',                'Artisanat',                             80),
  ('services-personne',        'Services à la personne',                90),
  ('sante-medico-social',      'Santé et médico-social',               100),
  ('securite-privee',          'Sécurité privée',                      110),
  ('tertiaire-bureaux',        'Tertiaire et bureaux',                 120),
  ('finance-assurance',        'Finance, banque, assurance',           130),
  ('immobilier',               'Immobilier',                           140),
  ('enseignement-formation',   'Enseignement, formation',              150),
  ('culture-medias',           'Culture, médias, audiovisuel',         160),
  ('coiffure-esthetique',      'Coiffure, esthétique',                 170),
  ('collectivites-publiques',  'Collectivités, secteur public',        180),
  ('associations',             'Associations, économie sociale',       190),
  ('autre',                    'Autre / non précisé',                  999)
on conflict (code) do update set label = excluded.label, ordre = excluded.ordre;

-- -----------------------------------------------------------------------------
--  2. Profils : secteur d'activité + tracking
-- -----------------------------------------------------------------------------

alter table public.profiles
  add column if not exists secteur_activite text references public.secteurs_activite(code) on delete set null,
  add column if not exists relances_optin boolean not null default true,
  add column if not exists last_relance_at timestamptz;

create index if not exists idx_profiles_secteur on public.profiles(secteur_activite);
create index if not exists idx_profiles_relances on public.profiles(relances_optin, last_relance_at);

-- -----------------------------------------------------------------------------
--  3. Formations : secteurs cibles + recos typées
-- -----------------------------------------------------------------------------

alter table public.formations
  add column if not exists secteurs_cibles jsonb default '[]'::jsonb,
  add column if not exists formations_recommandees jsonb default '[]'::jsonb;

-- formations_recommandees = [
--   { "slug": "mac-sst", "type": "recyclage", "delai_mois": 24 },
--   { "slug": "formateur-sst", "type": "suite" },
--   { "slug": "gestes-et-postures", "type": "complementaire" }
-- ]
-- secteurs_cibles = ["batiment-tp", "industrie", ...]   (codes de secteurs_activite)

-- -----------------------------------------------------------------------------
--  4. Tracking des relances envoyées
-- -----------------------------------------------------------------------------

do $$ begin
  create type relance_type as enum ('bimestrielle', 'annuelle', 'recyclage');
exception when duplicate_object then null; end $$;

create table if not exists public.relance_logs (
  id                        uuid primary key default uuid_generate_v4(),
  profile_id                uuid not null references public.profiles(id) on delete cascade,
  type                      relance_type not null,
  sent_at                   timestamptz not null default now(),
  email                     text not null,
  formations_recommandees   jsonb not null default '[]'::jsonb,
  -- Pour le recyclage : référence à l'inscription concernée
  inscription_id            uuid references public.inscriptions(id) on delete set null,
  -- Tracking d'engagement (à remplir plus tard via webhooks Resend)
  opened_at                 timestamptz,
  clicked_at                timestamptz
);

create index if not exists idx_relance_profile on public.relance_logs(profile_id, sent_at desc);
create index if not exists idx_relance_type on public.relance_logs(type, sent_at desc);
-- Unique partial index : empêche d'envoyer 2 relances bimestrielles dans la même fenêtre
create unique index if not exists idx_relance_recyclage_unique
  on public.relance_logs(profile_id, inscription_id)
  where type = 'recyclage';

alter table public.relance_logs enable row level security;

drop policy if exists "relances read self" on public.relance_logs;
create policy "relances read self" on public.relance_logs
  for select using (profile_id = auth.uid());

drop policy if exists "relances read admin" on public.relance_logs;
create policy "relances read admin" on public.relance_logs
  for select using (public.is_admin());

-- Les writes se font uniquement via service_role (cron endpoints)

-- -----------------------------------------------------------------------------
--  5. Trigger handle_new_user : récupérer secteur_activite depuis les metadata
-- -----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role         user_role;
  v_account_type account_type;
  v_secteur      text;
begin
  v_role := coalesce(nullif(new.raw_user_meta_data->>'role',''), 'stagiaire')::user_role;
  v_account_type := nullif(new.raw_user_meta_data->>'account_type','')::account_type;
  v_secteur := nullif(new.raw_user_meta_data->>'secteur_activite','');

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
      new.raw_user_meta_data->>'siret',
      new.raw_user_meta_data->>'tva_intra',
      new.raw_user_meta_data->>'contact_fonction',
      coalesce((new.raw_user_meta_data->>'billing_address')::jsonb, '{}'::jsonb)
    );
  end if;

  return new;
end;
$$;

-- Le trigger lui-même est déjà créé dans la migration init — pas besoin de le recréer.
