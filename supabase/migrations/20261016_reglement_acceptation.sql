-- =============================================================================
--  Acceptation du règlement intérieur / livret d'accueil avant émargement
-- =============================================================================
--  Avant son premier émargement d'une session, le stagiaire coche une case
--  (règlement intérieur, livret d'accueil, cadre VHSS). On horodate ce clic,
--  par participation (= par session). NULL = pas encore accepté.
--  Écriture via service-role uniquement (server action stagiaire) : pas de
--  nouvelle policy RLS.
-- =============================================================================

alter table public.inscription_participants
  add column if not exists reglement_accepte_at timestamptz;
