import { NextResponse, type NextRequest } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  EmargementSessionPdf,
  type EmargementSessionCreneau,
  type EmargementSessionPdfData,
  type EmargementSessionStagiaire,
} from '@/lib/pdf/EmargementSessionPdf';
import {
  ORGANISME,
  formatSessionLieu,
  logoUrl,
  requireAdminOrFormateurOfSession,
  safePdfFilename,
  splitStagiaireName,
} from '@/lib/pdf/data';
import type { SessionAdresse } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Maybe<T> = T | T[] | null;
const one = <T,>(v: Maybe<T>): T | null => (Array.isArray(v) ? v[0] ?? null : v);

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;

  const auth = await requireAdminOrFormateurOfSession(sessionId);
  if (!auth.ok) return NextResponse.json({ error: 'forbidden' }, { status: auth.status });

  const admin = createAdminClient();
  const [{ data: session }, { data: creneaux }, { data: inscriptions }, { data: formateurEmargements }] =
    await Promise.all([
      admin
        .from('sessions')
        .select('id, adresse, formation:formations(titre), formateur:profiles!sessions_formateur_id_fkey(full_name)')
        .eq('id', sessionId)
        .single(),
      admin
        .from('session_creneaux')
        .select('id, date, heure_debut, heure_fin, ordre')
        .eq('session_id', sessionId)
        .order('ordre'),
      admin
        .from('inscriptions')
        .select(`
          id, payer_profile_id, created_at,
          payer:profiles!inscriptions_payer_profile_id_fkey(account_type),
          participants:inscription_participants(
            id, reglement_accepte_at, created_at,
            employee:employees(prenom, nom),
            profile:profiles!inscription_participants_participant_profile_id_fkey(full_name)
          )
        `)
        .eq('session_id', sessionId)
        .eq('statut', 'confirmee')
        .order('created_at'),
      admin
        .from('formateur_emargements')
        .select('creneau_id, signature_data, signed_at')
        .eq('session_id', sessionId),
    ]);

  if (!session) return NextResponse.json({ error: 'introuvable' }, { status: 404 });

  // Raisons sociales des payeurs entreprise
  const entreprisePayerIds = (inscriptions ?? [])
    .filter((i) => one(i.payer as Maybe<{ account_type: string }>)?.account_type === 'entreprise')
    .map((i) => i.payer_profile_id as string);
  const { data: companies } = entreprisePayerIds.length > 0
    ? await admin.from('company_details').select('profile_id, raison_sociale').in('profile_id', entreprisePayerIds)
    : { data: [] as Array<{ profile_id: string; raison_sociale: string }> };
  const companyByPayer = new Map((companies ?? []).map((c) => [c.profile_id, c.raison_sociale]));

  const stagiaires: EmargementSessionStagiaire[] = [];
  for (const ins of inscriptions ?? []) {
    const entreprise = companyByPayer.get(ins.payer_profile_id as string) ?? null;
    const parts = (ins.participants ?? []) as Array<{
      id: string;
      reglement_accepte_at: string | null;
      employee: Maybe<{ prenom: string; nom: string }>;
      profile: Maybe<{ full_name: string }>;
    }>;
    for (const p of parts) {
      const { nomComplet } = splitStagiaireName(one(p.employee), one(p.profile)?.full_name);
      stagiaires.push({ id: p.id, nomComplet, entreprise, reglementAccepteAt: p.reglement_accepte_at });
    }
  }
  stagiaires.sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, 'fr'));

  const creneauIds = (creneaux ?? []).map((c) => c.id);
  const participantIds = stagiaires.map((s) => s.id);
  const [{ data: emargements }, { data: absences }] = await Promise.all([
    creneauIds.length > 0 && participantIds.length > 0
      ? admin
          .from('emargements')
          .select('creneau_id, inscription_participant_id, signature_data, signed_at')
          .in('creneau_id', creneauIds)
          .in('inscription_participant_id', participantIds)
      : Promise.resolve({ data: [] as Array<{ creneau_id: string; inscription_participant_id: string; signature_data: string | null; signed_at: string | null }> }),
    creneauIds.length > 0
      ? admin.from('creneau_absences').select('creneau_id, inscription_participant_id').in('creneau_id', creneauIds)
      : Promise.resolve({ data: [] as Array<{ creneau_id: string; inscription_participant_id: string }> }),
  ]);

  const key = (c: string, p: string) => `${c}:${p}`;
  const sigMap = new Map((emargements ?? []).map((e) => [key(e.creneau_id, e.inscription_participant_id), e]));
  const absentSet = new Set((absences ?? []).map((a) => key(a.creneau_id, a.inscription_participant_id)));
  const formateurByCreneau = new Map((formateurEmargements ?? []).map((f) => [f.creneau_id, f]));

  const pdfCreneaux: EmargementSessionCreneau[] = (creneaux ?? []).map((c) => {
    const f = formateurByCreneau.get(c.id);
    return {
      date: c.date,
      heureDebut: c.heure_debut,
      heureFin: c.heure_fin,
      signatures: stagiaires.map((s) => {
        const e = sigMap.get(key(c.id, s.id));
        return {
          signatureDataUrl: e?.signature_data ?? null,
          signedAt: e?.signed_at ?? null,
          absent: !e && absentSet.has(key(c.id, s.id)),
        };
      }),
      formateur: { signatureDataUrl: f?.signature_data ?? null, signedAt: f?.signed_at ?? null },
    };
  });

  const formation = one(session.formation as Maybe<{ titre: string }>);
  const formateur = one(session.formateur as Maybe<{ full_name: string }>);
  const data: EmargementSessionPdfData = {
    logoUrl: logoUrl(),
    organisme: ORGANISME,
    formation: { titre: formation?.titre ?? 'Formation' },
    session: {
      lieu: formatSessionLieu(session.adresse as SessionAdresse | null),
      formateurNom: formateur?.full_name ?? null,
      dateDebut: creneaux?.[0]?.date ?? null,
      dateFin: creneaux?.[creneaux.length - 1]?.date ?? null,
    },
    stagiaires,
    creneaux: pdfCreneaux,
    generatedAt: new Date().toISOString(),
  };

  const buffer = await renderToBuffer(<EmargementSessionPdf data={data} />);
  const filename = `emargement-session-${safePdfFilename(data.formation.titre)}-${sessionId.slice(0, 8)}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
