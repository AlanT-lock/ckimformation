import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend, EMAIL_FROM } from '@/lib/email/resend';
import { buildRelanceHtml, buildRelanceSubject } from '@/lib/email/templates/relance';
import { buildUnsubscribeUrl } from '@/lib/recommendations/unsubscribe';
import {
  getRecommendations,
  getRecyclagesDus,
  type RecommendationItem,
  type RelanceContext,
  type ProfileSummary,
} from '@/lib/recommendations/engine';

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://project-0t9kh.vercel.app';
}

function firstName(p: ProfileSummary): string {
  return (p.full_name || '').trim().split(/\s+/)[0] || '';
}

interface SendResult {
  total_targets: number;
  sent: number;
  skipped_no_items: number;
  errors: number;
}

/**
 * Envoie une vague de relances bimestrielles ou annuelles à tous les comptes opt-in.
 * Garde-fou : pas plus d'1 relance du même type dans la fenêtre récente (30j).
 */
export async function sendRelancesVague(context: 'bimestrielle' | 'annuelle'): Promise<SendResult> {
  const admin = createAdminClient();
  const stats: SendResult = { total_targets: 0, sent: 0, skipped_no_items: 0, errors: 0 };

  // Récupère tous les comptes stagiaires opt-in
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, email, full_name')
    .eq('role', 'stagiaire')
    .eq('relances_optin', true);

  if (!profiles || profiles.length === 0) return stats;
  stats.total_targets = profiles.length;

  // Fenêtre d'exclusion : ne pas réenvoyer la même type de relance dans les 30 derniers jours
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentLogs } = await admin
    .from('relance_logs')
    .select('profile_id')
    .eq('type', context)
    .gte('sent_at', since);
  const recentSet = new Set((recentLogs ?? []).map((r) => r.profile_id));

  for (const p of profiles) {
    if (recentSet.has(p.id)) continue;

    try {
      const result = await getRecommendations(p.id, context);
      if (!result || result.items.length === 0) {
        stats.skipped_no_items++;
        continue;
      }

      await sendOne(context, result.profile, result.items);
      await logRelance(p.id, p.email, context, result.items);
      stats.sent++;

      // Rate-limit doux : 100ms entre envois → ~10/sec, sous le seuil Resend free
      await sleep(120);
    } catch (err) {
      console.error('[relance] error for', p.id, err);
      stats.errors++;
    }
  }

  return stats;
}

/**
 * Envoie les relances de recyclage (alerte certificat à échéance).
 * 1 envoi max par (profile, inscription) — l'index unique SQL le garantit.
 */
export async function sendRelancesRecyclage(): Promise<SendResult> {
  const stats: SendResult = { total_targets: 0, sent: 0, skipped_no_items: 0, errors: 0 };
  const targets = await getRecyclagesDus();
  stats.total_targets = targets.length;

  for (const t of targets) {
    try {
      const item: RecommendationItem = {
        formation: t.formation,
        reason: 'recyclage',
        inscription_id: t.inscription_id,
        days_until_expiry: t.days_until,
      };
      await sendOne('recyclage', t.profile, [item]);
      await logRelance(t.profile.id, t.profile.email, 'recyclage', [item], t.inscription_id);
      stats.sent++;
      await sleep(120);
    } catch (err) {
      console.error('[relance recyclage] error for', t.profile.id, err);
      stats.errors++;
    }
  }

  return stats;
}

async function sendOne(
  context: RelanceContext,
  profile: ProfileSummary,
  items: RecommendationItem[]
) {
  const html = buildRelanceHtml({
    context,
    firstName: firstName(profile),
    items,
    siteUrl: siteUrl(),
    unsubscribeUrl: buildUnsubscribeUrl(siteUrl(), profile.id),
  });
  const subject = buildRelanceSubject(context, firstName(profile));

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: profile.email,
    subject,
    html,
    headers: {
      'List-Unsubscribe': `<${buildUnsubscribeUrl(siteUrl(), profile.id)}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
    },
  });
  if (error) throw new Error(error.message ?? 'Resend send failed');
}

async function logRelance(
  profileId: string,
  email: string,
  type: RelanceContext,
  items: RecommendationItem[],
  inscriptionId?: string
) {
  const admin = createAdminClient();
  await admin.from('relance_logs').insert({
    profile_id: profileId,
    email,
    type,
    formations_recommandees: items.map((i) => ({
      slug: i.formation.slug,
      reason: i.reason,
      ...(i.inscription_id && { inscription_id: i.inscription_id }),
      ...(i.days_until_expiry !== undefined && { days_until: i.days_until_expiry }),
    })),
    inscription_id: inscriptionId ?? null,
  });

  // Met à jour last_relance_at sur le profil
  await admin
    .from('profiles')
    .update({ last_relance_at: new Date().toISOString() })
    .eq('id', profileId);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
