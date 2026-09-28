-- =============================================================================
--  Fiche PDF personnalisée par formation
-- =============================================================================
--  Par défaut la fiche est générée à partir des données de la formation.
--  L'admin peut déposer son propre PDF : il remplace alors la fiche générée
--  (site vitrine, admin, mail de confirmation). NULL = fiche générée.
--  Bucket privé : lecture/écriture via service_role uniquement (les routes
--  serveur servent le fichier), donc aucune policy storage nécessaire.
-- =============================================================================

alter table public.formations
  add column if not exists fiche_pdf_path text;

insert into storage.buckets (id, name, public)
values ('formation-fiches', 'formation-fiches', false)
on conflict (id) do nothing;
