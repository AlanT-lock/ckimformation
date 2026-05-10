-- =============================================================================
--  Migration : tarifs structurés par formation
--  Date : 2026-05-06
--  À exécuter dans le SQL Editor de Supabase.
--  Idempotent : ALTER ... IF NOT EXISTS + UPDATE par slug
-- =============================================================================

-- 1. Nouvelle colonne tarifs (JSONB)
ALTER TABLE public.formations
  ADD COLUMN IF NOT EXISTS tarifs jsonb DEFAULT '[]'::jsonb;

-- 2. Remplissage par formation
--    Format : [{ label, price, unit?, pour?, note?, group?, highlight? }]
--    price = null  → "Sur devis"
--    group         → mode (ex. "Express 2h" / "Complet 5h" pour Incendie)
--    pour          → "personne" / "groupe"

-- ---- Sécurité & Prévention ---------------------------------------------------

UPDATE public.formations SET tarifs = '[
  {"label":"Individuel","price":250,"unit":"HT","pour":"personne"},
  {"label":"Groupe 4 à 6 pers.","price":1100,"unit":"HT","pour":"groupe"},
  {"label":"Groupe 7 à 10 pers.","price":1600,"unit":"HT","pour":"groupe","highlight":true}
]'::jsonb WHERE slug = 'sst-initiale';

UPDATE public.formations SET tarifs = '[
  {"label":"Individuel","price":150,"unit":"HT","pour":"personne"},
  {"label":"Groupe 4 à 6 pers.","price":650,"unit":"HT","pour":"groupe"},
  {"label":"Groupe 7 à 10 pers.","price":900,"unit":"HT","pour":"groupe","highlight":true}
]'::jsonb WHERE slug = 'mac-sst';

UPDATE public.formations SET tarifs = '[
  {"label":"Individuel","price":80,"unit":"HT","pour":"personne","group":"Express 2h"},
  {"label":"Groupe 4 à 6 pers.","price":450,"unit":"HT","pour":"groupe","group":"Express 2h"},
  {"label":"Groupe 7 à 10 pers.","price":700,"unit":"HT","pour":"groupe","group":"Express 2h"},
  {"label":"Individuel","price":150,"unit":"HT","pour":"personne","group":"Complet 5h"},
  {"label":"Groupe 4 à 6 pers.","price":800,"unit":"HT","pour":"groupe","group":"Complet 5h"},
  {"label":"Groupe 7 à 10 pers.","price":1200,"unit":"HT","pour":"groupe","group":"Complet 5h","highlight":true}
]'::jsonb WHERE slug = 'incendie-extincteur-evacuation';

UPDATE public.formations SET tarifs = '[
  {"label":"Individuel","price":200,"unit":"HT","pour":"personne"},
  {"label":"Groupe 4 à 6 pers.","price":850,"unit":"HT","pour":"groupe"},
  {"label":"Groupe 7 à 10 pers.","price":1300,"unit":"HT","pour":"groupe","highlight":true}
]'::jsonb WHERE slug = 'gestes-et-postures';

UPDATE public.formations SET tarifs = '[
  {"label":"Individuel","price":350,"unit":"HT","pour":"personne"},
  {"label":"Groupe 4 à 6 pers.","price":1500,"unit":"HT","pour":"groupe"},
  {"label":"Groupe 7 à 10 pers.","price":2200,"unit":"HT","pour":"groupe","highlight":true}
]'::jsonb WHERE slug = 'hygiene-alimentaire-haccp';

UPDATE public.formations SET tarifs = '[
  {"label":"Individuel","price":550,"unit":"HT","pour":"personne"},
  {"label":"Groupe 4 à 6 pers.","price":1700,"unit":"HT","pour":"groupe"},
  {"label":"Groupe 7 à 10 pers.","price":2400,"unit":"HT","pour":"groupe","highlight":true}
]'::jsonb WHERE slug = 'habilitation-electrique-b1v-b2v';

UPDATE public.formations SET tarifs = '[
  {"label":"Individuel","price":200,"unit":"HT","pour":"personne"},
  {"label":"Groupe 4 à 6 pers.","price":850,"unit":"HT","pour":"groupe"},
  {"label":"Groupe 7 à 10 pers.","price":1300,"unit":"HT","pour":"groupe","highlight":true}
]'::jsonb WHERE slug = 'habilitation-electrique-h0-b0';

UPDATE public.formations SET tarifs = '[]'::jsonb
  WHERE slug = 'habilitation-electrique-bs-be-manoeuvre';

-- ---- Prévention & Conformité -------------------------------------------------

UPDATE public.formations SET tarifs = '[
  {"label":"Groupe 4 à 6 pers.","price":1800,"unit":"HT","pour":"groupe","note":"DUERP finalisé inclus"},
  {"label":"Groupe 7 à 10 pers.","price":2500,"unit":"HT","pour":"groupe","note":"DUERP finalisé inclus","highlight":true}
]'::jsonb WHERE slug = 'duerp-formation-accompagnement';

UPDATE public.formations SET tarifs = '[
  {"label":"Groupe 4 à 6 pers.","price":1100,"unit":"HT","pour":"groupe"},
  {"label":"Groupe 7 à 10 pers.","price":1600,"unit":"HT","pour":"groupe","highlight":true}
]'::jsonb WHERE slug = 'elaboration-duerp-manager-sst';

UPDATE public.formations SET tarifs = '[]'::jsonb
  WHERE slug = 'preparer-controle-qualiopi';

-- ---- Développement professionnel ---------------------------------------------

UPDATE public.formations SET tarifs = '[
  {"label":"Individuel","price":320,"unit":"HT","pour":"personne"},
  {"label":"Groupe","price":null,"note":"Sur devis"}
]'::jsonb WHERE slug = 'pnl-controle-qualiopi';

-- ---- Formations certifiantes (RNCP) ------------------------------------------

UPDATE public.formations SET tarifs = '[
  {"label":"Parcours complet","price":6000,"unit":"HT","pour":"personne","note":"29 semaines · financement CPF, OPCO, France Travail, Région Sud","highlight":true}
]'::jsonb WHERE slug = 'formateur-professionnel-adultes-fpa';

-- ---- Formation de formateurs (sur devis) -------------------------------------

UPDATE public.formations SET tarifs = '[]'::jsonb WHERE slug = 'formateur-sst';
UPDATE public.formations SET tarifs = '[]'::jsonb WHERE slug = 'mac-formateur-sst';
UPDATE public.formations SET tarifs = '[]'::jsonb WHERE slug = 'formateur-incendie-gestes-postures';
UPDATE public.formations SET tarifs = '[]'::jsonb WHERE slug = 'formateur-independant-interne';
