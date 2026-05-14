import { NextResponse, type NextRequest } from 'next/server';
import { randomBytes } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { isAuthorizedCron } from '@/lib/recommendations/cron-auth';
import { enqueteFroidEmailHtml, enqueteFroidEmailSubject } from '@/lib/email/templates/enquete-froid';
import { sendAndLog } from '@/lib/email/log';

/**
 * Cron quotidien :
 * 1. Pour chaque enquête "à froid" active liée à une formation,
 *    trouve toutes les sessions de cette formation dont le dernier créneau
 *    est passé depuis ≥ 15 jours.
 * 2. Pour chaque participant confirmé, crée un envoi (1 par test+participant)
 *    s'il n'existe pas.
 * 3. Envoie le mail initial (si non encore envoyé) ou un mail de rappel
 *    (si > 15 jours depuis le dernier envoi et non répondu).
 *
 * L'arrêt des relances est automatique : dès que responded_at est défini,
 * l'envoi ne sera plus traité.
 */

const FIFTEEN_DAYS_MS = 15 * 24 * 60 * 60 * 1000;
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
  const fifteenDaysAgoIso = new Date(now - FIFTEEN_DAYS_MS).toISOString().slice(0, 10);

  // 1. Récupère toutes les enquêtes à froid actives
  const { data: enquetes, error: eErr } = await admin
    .from('tests')
    .select('id, nom, formation_id, formation:formations(titre)')
    .eq('kind', 'enquete')
    .eq('enquete_kind', 'a_froid')
    .eq('actif', true);

  if (eErr) {
    console.error('[cron enquete-froid] read enquetes failed', eErr);
    return NextResponse.json({ ok: false, error: eErr.message }, { status: 500 });
  }

  const summary = {
    enquetes: enquetes?.length ?? 0,
    envoisCreated: 0,
    initialSent: 0,
    remindersSent: 0,
    errors: [] as string[],
  };

  for (const enquete of enquetes ?? []) {
    const formation = Array.isArray(enquete.formation) ? enquete.formation[0] : enquete.formation;
    const formationTitre = formation?.titre ?? 'Formation';

    // 2. Sessions terminées depuis ≥ 15 jours (dernier créneau)
    const { data: sessions } = await admin
      .from('sessions')
      .select(`
        id, statut,
        creneaux:session_creneaux(date),
        inscriptions:inscriptions!inner(
          id, statut,
          participants:inscription_participants(
            id, participant_profile_id,
            employee:employees(prenom, nom, email, profile_id),
            profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
          )
        )
      `)
      .eq('formation_id', enquete.formation_id)
      .in('statut', ['published', 'completed'])
      .eq('inscriptions.statut', 'confirmee');

    for (const s of sessions ?? []) {
      const dates = ((s.creneaux ?? []) as { date: string }[]).map((c) => c.date).sort();
      const lastDate = dates[dates.length - 1];
      if (!lastDate || lastDate > fifteenDaysAgoIso) continue; // pas encore J+15

      const lastDateLabel = FR_DATE.format(new Date(lastDate));

      // 3. Pour chaque participant
      for (const ins of (s.inscriptions ?? []) as Array<{
        id: string; statut: string;
        participants: Array<{
          id: string; participant_profile_id: string | null;
          employee: { prenom: string; nom: string; email: string; profile_id: string | null } | { prenom: string; nom: string; email: string; profile_id: string | null }[] | null;
          profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
        }>;
      }>) {
        for (const p of ins.participants ?? []) {
          const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
          const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
          const email = emp?.email ?? prof?.email ?? null;
          if (!email) continue;
          const prenom = emp?.prenom ?? (prof?.full_name?.split(' ')[0] ?? null);
          const toProfileId = emp?.profile_id ?? p.participant_profile_id ?? null;

          // Récupère ou crée l'envoi
          let { data: envoi } = await admin
            .from('enquete_froid_envois')
            .select('id, token, first_sent_at, last_reminder_at, reminder_count, responded_at')
            .eq('test_id', enquete.id)
            .eq('inscription_participant_id', p.id)
            .maybeSingle();

          if (!envoi) {
            const token = genToken();
            const { data: created, error: insErr } = await admin
              .from('enquete_froid_envois')
              .insert({
                test_id: enquete.id,
                inscription_participant_id: p.id,
                session_id: s.id,
                token,
                scheduled_first_send_at: new Date(now).toISOString(),
              })
              .select('id, token, first_sent_at, last_reminder_at, reminder_count, responded_at')
              .single();
            if (insErr || !created) {
              summary.errors.push(`Insert envoi failed (${email}) : ${insErr?.message}`);
              continue;
            }
            envoi = created;
            summary.envoisCreated++;
          }

          if (envoi.responded_at) continue; // déjà répondu : skip

          const isReminder = !!envoi.first_sent_at;
          const lastEmailAt = envoi.last_reminder_at ?? envoi.first_sent_at;

          if (isReminder) {
            // Relance uniquement si > 15 jours depuis le dernier email
            if (lastEmailAt && (now - new Date(lastEmailAt).getTime()) < FIFTEEN_DAYS_MS) continue;
          }

          const enqueteUrl = `${siteUrl()}/enquete/${envoi.token}`;
          const subject = enqueteFroidEmailSubject(formationTitre, isReminder);
          const reminderNumber = isReminder ? envoi.reminder_count + 1 : 0;

          const sendRes = await sendAndLog({
            kind: 'enquete_froid',
            to: email,
            toProfileId,
            subject,
            html: enqueteFroidEmailHtml({
              prenom,
              formationTitre,
              formationDate: `le ${lastDateLabel}`,
              enqueteUrl,
              isReminder,
              reminderNumber,
            }),
            refTable: 'enquete_froid_envois',
            refId: envoi.id,
            isReminder,
            reminderNumber,
            metadata: { formationTitre, sessionId: s.id, inscriptionId: ins.id, inscriptionParticipantId: p.id },
          });

          if (!sendRes.ok) {
            summary.errors.push(`Send email ${email}: ${sendRes.error}`);
            console.error('[cron enquete-froid] send failed', email, sendRes.error);
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
          await admin.from('enquete_froid_envois').update(patch).eq('id', envoi.id);
        }
      }
    }
  }

  return NextResponse.json({ ok: true, ...summary });
}
