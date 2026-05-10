import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { rowToFormation, type FormationRow } from '@/lib/db/formations';
import type { Formation, FormationRecommandee, RecommandationType } from '@/lib/types/formation';

const MAX_RECOMMANDATIONS = 3;
const RECYCLAGE_WINDOW_DAYS = 90; // On alerte 90j avant échéance

export type RelanceContext = 'bimestrielle' | 'annuelle' | 'recyclage';

export interface ProfileSummary {
  id: string;
  email: string;
  full_name: string;
  account_type: 'particulier' | 'entreprise' | null;
  secteur_activite: string | null;
  relances_optin: boolean;
}

export interface RecommendationItem {
  formation: Formation;
  reason: RecommandationType | 'secteur' | 'transversale';
  source_formation_slug?: string;     // Formation d'origine (pour les recos chaînées)
  // Si reason === 'recyclage' :
  inscription_id?: string;
  expires_at?: string;                // ISO date — quand le certificat expire
  days_until_expiry?: number;
}

export interface RecommendationResult {
  profile: ProfileSummary;
  items: RecommendationItem[];
}

/**
 * Calcule jusqu'à 3 recommandations personnalisées pour un profil donné.
 * Cascade : recyclage imminent → suite logique → complémentaire → secteur → transversales.
 */
export async function getRecommendations(
  profileId: string,
  _context: RelanceContext = 'bimestrielle'
): Promise<RecommendationResult | null> {
  const admin = createAdminClient();

  // 1. Profil
  const { data: profile } = await admin
    .from('profiles')
    .select('id, email, full_name, account_type, secteur_activite, relances_optin')
    .eq('id', profileId)
    .maybeSingle();
  if (!profile || !profile.relances_optin) return null;

  // 2. Toutes les formations actives
  const { data: formationsRows } = await admin
    .from('formations')
    .select(
      `id, slug, titre, sous_titre, parcours, ref, hero_image, hero_alt,
       duree, public_concerne, public_detail, prerequis, prix_indicatif,
       modalite, inscription, recyclage,
       objectifs, programme, tarifs, evaluation, references_reglementaires,
       formations_liees, secteurs_cibles, formations_recommandees,
       seo_title, seo_description, actif, ordre, created_at, updated_at`
    )
    .eq('actif', true)
    .order('ordre');
  const allFormations: Formation[] = (formationsRows ?? []).map((r) =>
    rowToFormation(r as unknown as FormationRow)
  );
  const bySlug = new Map(allFormations.map((f) => [f.slug, f]));

  // 3. Inscriptions payées (formations effectivement réalisées)
  const { data: inscriptions } = await admin
    .from('inscriptions')
    .select(
      `id, statut, paid_at, created_at,
       session:sessions(formation_id, formation:formations(slug, formations_recommandees))`
    )
    .eq('participant_profile_id', profileId)
    .eq('statut', 'paid');
  const followed = (inscriptions ?? [])
    .map((i) => {
      const s = Array.isArray(i.session) ? i.session[0] : i.session;
      const f = s && (Array.isArray(s.formation) ? s.formation[0] : s.formation);
      return {
        inscription_id: i.id,
        date: i.paid_at ?? i.created_at,
        formation_slug: f?.slug as string | undefined,
        recommandees: (f?.formations_recommandees ?? []) as FormationRecommandee[],
      };
    })
    .filter((x) => x.formation_slug);

  const followedSlugs = new Set(followed.map((f) => f.formation_slug!));

  const items: RecommendationItem[] = [];
  const seen = new Set<string>();

  function push(item: RecommendationItem) {
    if (seen.has(item.formation.slug)) return;
    if (followedSlugs.has(item.formation.slug) && item.reason !== 'recyclage') return;
    if (items.length >= MAX_RECOMMANDATIONS) return;
    seen.add(item.formation.slug);
    items.push(item);
  }

  const now = Date.now();

  // ---- Étape 1 : Recyclages imminents ----
  for (const sub of followed) {
    for (const reco of sub.recommandees) {
      if (reco.type !== 'recyclage' || !reco.delai_mois) continue;
      const formation = bySlug.get(reco.slug);
      if (!formation) continue;
      const start = new Date(sub.date).getTime();
      const expiresAt = start + reco.delai_mois * 30 * 24 * 60 * 60 * 1000;
      const daysUntil = Math.round((expiresAt - now) / (24 * 60 * 60 * 1000));
      if (daysUntil <= RECYCLAGE_WINDOW_DAYS && daysUntil >= -30) {
        push({
          formation,
          reason: 'recyclage',
          source_formation_slug: sub.formation_slug,
          inscription_id: sub.inscription_id,
          expires_at: new Date(expiresAt).toISOString(),
          days_until_expiry: daysUntil,
        });
      }
    }
  }

  // ---- Étape 2 : Suites logiques ----
  for (const sub of followed) {
    for (const reco of sub.recommandees) {
      if (reco.type !== 'suite') continue;
      const formation = bySlug.get(reco.slug);
      if (!formation) continue;
      push({ formation, reason: 'suite', source_formation_slug: sub.formation_slug });
    }
  }

  // ---- Étape 3 : Complémentaires ----
  for (const sub of followed) {
    for (const reco of sub.recommandees) {
      if (reco.type !== 'complementaire') continue;
      const formation = bySlug.get(reco.slug);
      if (!formation) continue;
      push({
        formation,
        reason: 'complementaire',
        source_formation_slug: sub.formation_slug,
      });
    }
  }

  // ---- Étape 4 : Match secteur d'activité ----
  if (profile.secteur_activite && items.length < MAX_RECOMMANDATIONS) {
    const candidates = allFormations.filter(
      (f) => (f.secteursCibles ?? []).includes(profile.secteur_activite!)
    );
    for (const f of candidates) push({ formation: f, reason: 'secteur' });
  }

  // ---- Étape 5 : Formations transversales (sans secteurs cibles) ----
  if (items.length < MAX_RECOMMANDATIONS) {
    const transversales = allFormations.filter((f) => (f.secteursCibles ?? []).length === 0);
    for (const f of transversales) push({ formation: f, reason: 'transversale' });
  }

  return {
    profile: profile as ProfileSummary,
    items,
  };
}

/**
 * Pour le mail recyclage spécifiquement : ne sélectionne QUE les inscriptions
 * dont l'échéance est dans la fenêtre et pour lesquelles un mail n'a pas déjà été envoyé.
 */
export async function getRecyclagesDus(): Promise<
  { profile: ProfileSummary; inscription_id: string; formation: Formation; days_until: number }[]
> {
  const admin = createAdminClient();

  // Toutes les inscriptions payées avec formation et recos
  const { data: inscriptions } = await admin
    .from('inscriptions')
    .select(
      `id, paid_at, created_at, participant_profile_id,
       session:sessions(formation:formations(slug, formations_recommandees)),
       participant:profiles!inscriptions_participant_profile_id_fkey(id, email, full_name, account_type, secteur_activite, relances_optin)`
    )
    .eq('statut', 'paid');

  if (!inscriptions) return [];

  // Liste des couples (profile_id, inscription_id) déjà notifiés pour recyclage
  const { data: alreadyNotified } = await admin
    .from('relance_logs')
    .select('profile_id, inscription_id')
    .eq('type', 'recyclage');
  const notifiedSet = new Set(
    (alreadyNotified ?? []).map((r) => `${r.profile_id}:${r.inscription_id}`)
  );

  const { data: formationsRows } = await admin
    .from('formations')
    .select(
      `id, slug, titre, sous_titre, parcours, ref, hero_image, hero_alt,
       duree, public_concerne, public_detail, prerequis, prix_indicatif,
       modalite, inscription, recyclage,
       objectifs, programme, tarifs, evaluation, references_reglementaires,
       formations_liees, secteurs_cibles, formations_recommandees,
       seo_title, seo_description, actif, ordre, created_at, updated_at`
    )
    .eq('actif', true);
  const bySlug = new Map(
    (formationsRows ?? []).map((r) => {
      const f = rowToFormation(r as unknown as FormationRow);
      return [f.slug, f];
    })
  );

  const now = Date.now();
  const out: {
    profile: ProfileSummary;
    inscription_id: string;
    formation: Formation;
    days_until: number;
  }[] = [];

  for (const ins of inscriptions) {
    const part = Array.isArray(ins.participant) ? ins.participant[0] : ins.participant;
    if (!part || !part.relances_optin) continue;

    const sess = Array.isArray(ins.session) ? ins.session[0] : ins.session;
    const form = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);
    if (!form) continue;
    const recommandees: FormationRecommandee[] = form.formations_recommandees ?? [];
    const start = new Date(ins.paid_at ?? ins.created_at).getTime();

    for (const reco of recommandees) {
      if (reco.type !== 'recyclage' || !reco.delai_mois) continue;
      const target = bySlug.get(reco.slug);
      if (!target) continue;

      const expiresAt = start + reco.delai_mois * 30 * 24 * 60 * 60 * 1000;
      const daysUntil = Math.round((expiresAt - now) / (24 * 60 * 60 * 1000));
      // Fenêtre : entre J-90 et J-7 (on n'alerte plus si déjà expiré ou trop proche)
      if (daysUntil > 90 || daysUntil < 7) continue;
      if (notifiedSet.has(`${part.id}:${ins.id}`)) continue;

      out.push({
        profile: part as ProfileSummary,
        inscription_id: ins.id,
        formation: target,
        days_until: daysUntil,
      });
    }
  }

  return out;
}
