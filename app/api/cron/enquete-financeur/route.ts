import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthorizedCron } from '@/lib/recommendations/cron-auth';
import { enqueteFinanceurEmailHtml, enqueteFinanceurEmailSubject } from '@/lib/email/templates/enquete-financeur';
import { sendAndLog } from '@/lib/email/log';

/**
 * Cron quotidien — enquête financeur.
 *  1. Récupère l'unique enquête (kind=enquete, enquete_kind=financeur, actif=true).
 *  2. Trouve toutes les inscriptions :
 *     - statut = confirmee
 *     - payer.account_type = entreprise
 *     - dernier créneau de la session terminé depuis ≥ 7 jours
 *  3. Pour chaque inscription :
 *     - crée enquete_financeur_envois si absent
 *     - envoie le mail initial si first_sent_at IS NULL
 *     - envoie une relance si > 7 jours depuis le dernier envoi, max 2 relances
 *     - skip si responded_at IS NOT NULL
 */

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_REMINDERS = 2;
const FR_DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ckimformation.fr';
}

function genToken(): string {
  return randomBytes(24).toString('hex');
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  const sevenDaysAgoIso = new Date(now - SEVEN_DAYS_MS).toISOString().slice(0, 10);

  // 1. Enquête financeur active
  const { data: enquete, error: eErr } = await admin
    .from('tests')
    .select('id, nom')
    .eq('kind', 'enquete')
    .eq('enquete_kind', 'financeur')
    .eq('actif', true)
    .is('formation_id', null)
    .maybeSingle();

  if (eErr) {
    console.error('[cron enquete-financeur] read enquete failed', eErr);
    return NextResponse.json({ ok: false, error: eErr.message }, { status: 500 });
  }
  if (!enquete) {
    return NextResponse.json({ ok: true, skipped: 'no active enquete' });
  }

  const summary = {
    envoisCreated: 0,
    initialSent: 0,
    remindersSent: 0,
    skipped: 0,
    errors: [] as string[],
  };

  // 2. Inscriptions confirmées d'entreprises avec dernier créneau ≥ 7j
  const { data: inscriptions, error: iErr } = await admin
    .from('inscriptions')
    .select(`
      id, payer_profile_id,
      payer:profiles!inscriptions_payer_profile_id_fkey(full_name, email, account_type),
      session:sessions(
        id,
        formation:formations(titre),
        creneaux:session_creneaux(date)
      )
    `)
    .eq('statut', 'confirmee');

  if (iErr) {
    console.error('[cron enquete-financeur] read inscriptions failed', iErr);
    return NextResponse.json({ ok: false, error: iErr.message }, { status: 500 });
  }

  for (const ins of inscriptions ?? []) {
    const payer = Array.isArray(ins.payer) ? ins.payer[0] : ins.payer;
    if (!payer || payer.account_type !== 'entreprise' || !payer.email) {
      summary.skipped++;
      continue;
    }

    const sess = Array.isArray(ins.session) ? ins.session[0] : ins.session;
    const form = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);
    const formationTitre = form?.titre ?? 'Formation';
    const dates = ((sess?.creneaux ?? []) as { date: string }[]).map((c) => c.date).sort();
    const lastDate = dates[dates.length - 1];
    if (!lastDate || lastDate > sevenDaysAgoIso) {
      summary.skipped++;
      continue;
    }
    const lastDateLabel = FR_DATE.format(new Date(lastDate));

    // Société (raison_sociale)
    const { data: company } = await admin
      .from('company_details')
      .select('raison_sociale')
      .eq('profile_id', ins.payer_profile_id)
      .maybeSingle();
    const raisonSociale = company?.raison_sociale ?? null;

    // Récupère ou crée l'envoi
    let { data: envoi } = await admin
      .from('enquete_financeur_envois')
      .select('id, token, first_sent_at, last_reminder_at, reminder_count, responded_at')
      .eq('inscription_id', ins.id)
      .maybeSingle();

    if (!envoi) {
      const token = genToken();
      const { data: created, error: insErr } = await admin
        .from('enquete_financeur_envois')
        .insert({
          inscription_id: ins.id,
          test_id: enquete.id,
          token,
          scheduled_first_send_at: new Date(now).toISOString(),
        })
        .select('id, token, first_sent_at, last_reminder_at, reminder_count, responded_at')
        .single();
      if (insErr || !created) {
        summary.errors.push(`Insert envoi failed (ins ${ins.id}) : ${insErr?.message}`);
        continue;
      }
      envoi = created;
      summary.envoisCreated++;
    }

    if (envoi.responded_at) { summary.skipped++; continue; }
    if (envoi.reminder_count >= MAX_REMINDERS && envoi.first_sent_at) {
      summary.skipped++;
      continue;
    }

    const isReminder = !!envoi.first_sent_at;
    const lastEmailAt = envoi.last_reminder_at ?? envoi.first_sent_at;
    if (isReminder && lastEmailAt && (now - new Date(lastEmailAt).getTime()) < SEVEN_DAYS_MS) {
      summary.skipped++;
      continue;
    }

    const enqueteUrl = `${siteUrl()}/enquete-financeur/${envoi.token}`;
    const subject = enqueteFinanceurEmailSubject(formationTitre, isReminder);
    const reminderNumber = isReminder ? envoi.reminder_count + 1 : 0;

    const sendRes = await sendAndLog({
      kind: 'enquete_financeur',
      to: payer.email,
      toProfileId: ins.payer_profile_id ?? null,
      subject,
      html: enqueteFinanceurEmailHtml({
        contactName: payer.full_name ?? null,
        raisonSociale,
        formationTitre,
        formationDate: `le ${lastDateLabel}`,
        enqueteUrl,
        isReminder,
        reminderNumber,
      }),
      refTable: 'enquete_financeur_envois',
      refId: envoi.id,
      isReminder,
      reminderNumber,
      metadata: { formationTitre, raisonSociale, inscriptionId: ins.id },
    });

    if (!sendRes.ok) {
      summary.errors.push(`Send email ${payer.email}: ${sendRes.error}`);
      console.error('[cron enquete-financeur] send failed', payer.email, sendRes.error);
      continue;
    }

    const patch: Record<string, unknown> = {};
    if (!envoi.first_sent_at) {
      patch.first_sent_at = new Date(now).toISOString();
      summary.initialSent++;
    } else {
      patch.last_reminder_at = new Date(now).toISOString();
      patch.reminder_count = envoi.reminder_count + 1;
      summary.remindersSent++;
    }
    await admin.from('enquete_financeur_envois').update(patch).eq('id', envoi.id);
  }

  return NextResponse.json({ ok: true, ...summary });
}
