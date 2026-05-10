import { formations } from '../lib/formations';

function esc(v: string | undefined | null): string {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function jsonb(v: unknown): string {
  return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
}

const out: string[] = [];

out.push(`-- =============================================================================
--  Migration : enrichissement complet de la table formations
--  Date : 2026-05-05
--  À exécuter UNE FOIS dans le SQL Editor de Supabase.
--  Idempotent : ALTER ... IF NOT EXISTS + INSERT ... ON CONFLICT DO UPDATE
-- =============================================================================

-- -----------------------------------------------------------------------------
--  1. Étendre la table formations avec toutes les données pédagogiques
-- -----------------------------------------------------------------------------

ALTER TABLE public.formations
  ADD COLUMN IF NOT EXISTS sous_titre text,
  ADD COLUMN IF NOT EXISTS ref text,
  ADD COLUMN IF NOT EXISTS hero_image text,
  ADD COLUMN IF NOT EXISTS hero_alt text,
  ADD COLUMN IF NOT EXISTS duree text,
  ADD COLUMN IF NOT EXISTS public_concerne text,
  ADD COLUMN IF NOT EXISTS public_detail text,
  ADD COLUMN IF NOT EXISTS prerequis text,
  ADD COLUMN IF NOT EXISTS prix_indicatif text,
  ADD COLUMN IF NOT EXISTS modalite text,
  ADD COLUMN IF NOT EXISTS inscription text,
  ADD COLUMN IF NOT EXISTS recyclage text,
  ADD COLUMN IF NOT EXISTS objectifs text,
  ADD COLUMN IF NOT EXISTS programme jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS evaluation text,
  ADD COLUMN IF NOT EXISTS references_reglementaires text,
  ADD COLUMN IF NOT EXISTS formations_liees jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS ordre int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- -----------------------------------------------------------------------------
--  2. Trigger pour maintenir updated_at à chaque update
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.formations_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_formations_updated_at ON public.formations;
CREATE TRIGGER trg_formations_updated_at
  BEFORE UPDATE ON public.formations
  FOR EACH ROW EXECUTE FUNCTION public.formations_set_updated_at();

-- -----------------------------------------------------------------------------
--  3. Données — UPSERT des 17 formations
-- -----------------------------------------------------------------------------
`);

let ordre = 0;
for (const f of formations) {
  ordre += 10;
  out.push(`
-- ${f.titre}${f.sousTitre ? ' — ' + f.sousTitre : ''}
INSERT INTO public.formations (
  slug, titre, sous_titre, parcours, ref, hero_image, hero_alt,
  duree, public_concerne, public_detail, prerequis, prix_indicatif,
  modalite, inscription, recyclage,
  objectifs, programme, evaluation, references_reglementaires, formations_liees,
  seo_title, seo_description, actif, ordre
) VALUES (
  ${esc(f.slug)},
  ${esc(f.titre)},
  ${esc(f.sousTitre)},
  ${esc(f.parcours)},
  ${esc(f.ref)},
  ${esc(f.hero.image)},
  ${esc(f.hero.alt)},
  ${esc(f.infosPratiques.duree)},
  ${esc(f.infosPratiques.public)},
  ${esc(f.publicDetail)},
  ${esc(f.infosPratiques.prerequis)},
  ${esc(f.infosPratiques.prixIndicatif)},
  ${esc(f.infosPratiques.modalite)},
  ${esc(f.infosPratiques.inscription)},
  ${esc(f.infosPratiques.recyclage)},
  ${esc(f.objectifs)},
  ${jsonb(f.programme)},
  ${esc(f.evaluation)},
  ${esc(f.referencesReglementaires)},
  ${jsonb(f.formationsLiees)},
  ${esc(f.seo.title)},
  ${esc(f.seo.description)},
  true,
  ${ordre}
)
ON CONFLICT (slug) DO UPDATE SET
  titre = EXCLUDED.titre,
  sous_titre = EXCLUDED.sous_titre,
  parcours = EXCLUDED.parcours,
  ref = EXCLUDED.ref,
  hero_image = EXCLUDED.hero_image,
  hero_alt = EXCLUDED.hero_alt,
  duree = EXCLUDED.duree,
  public_concerne = EXCLUDED.public_concerne,
  public_detail = EXCLUDED.public_detail,
  prerequis = EXCLUDED.prerequis,
  prix_indicatif = EXCLUDED.prix_indicatif,
  modalite = EXCLUDED.modalite,
  inscription = EXCLUDED.inscription,
  recyclage = EXCLUDED.recyclage,
  objectifs = EXCLUDED.objectifs,
  programme = EXCLUDED.programme,
  evaluation = EXCLUDED.evaluation,
  references_reglementaires = EXCLUDED.references_reglementaires,
  formations_liees = EXCLUDED.formations_liees,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description,
  ordre = EXCLUDED.ordre;`);
}

console.log(out.join('\n'));
