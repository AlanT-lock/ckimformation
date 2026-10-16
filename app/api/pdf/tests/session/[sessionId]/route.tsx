import { NextResponse, type NextRequest } from 'next/server';
import { renderToBuffer } from '@react-pdf/renderer';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCurrentProfile } from '@/lib/supabase/server';
import { TestsSessionPdf, type TestsSessionPdfData } from '@/lib/pdf/TestsSessionPdf';
import { loadParticipantPdfTests } from '@/lib/pdf/tests-data';
import { ORGANISME, logoUrl, safePdfFilename, splitStagiaireName } from '@/lib/pdf/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Maybe<T> = T | T[] | null;
const one = <T,>(v: Maybe<T>): T | null => (Array.isArray(v) ? v[0] ?? null : v);

/**
 * Tests & enquêtes d'une session en un seul PDF (admin uniquement).
 * `?participant=<id>` limite l'export à un stagiaire ; sinon tous les stagiaires confirmés.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const profile = await getCurrentProfile();
  if (!profile) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (profile.role !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const { sessionId } = await params;
  const participantFilter = request.nextUrl.searchParams.get('participant');

  const admin = createAdminClient();
  const [{ data: session }, { data: creneaux }, { data: inscriptions }] = await Promise.all([
    admin.from('sessions').select('id, formation:formations(titre)').eq('id', sessionId).single(),
    admin.from('session_creneaux').select('date, ordre').eq('session_id', sessionId).order('ordre'),
    admin
      .from('inscriptions')
      .select(`
        id, payer_profile_id,
        payer:profiles!inscriptions_payer_profile_id_fkey(account_type),
        participants:inscription_participants(
          id,
          employee:employees(prenom, nom, email),
          profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
        )
      `)
      .eq('session_id', sessionId)
      .eq('statut', 'confirmee'),
  ]);
  if (!session) return NextResponse.json({ error: 'introuvable' }, { status: 404 });

  const entreprisePayerIds = (inscriptions ?? [])
    .filter((i) => one(i.payer as Maybe<{ account_type: string }>)?.account_type === 'entreprise')
    .map((i) => i.payer_profile_id as string);
  const { data: companies } = entreprisePayerIds.length > 0
    ? await admin.from('company_details').select('profile_id, raison_sociale').in('profile_id', entreprisePayerIds)
    : { data: [] as Array<{ profile_id: string; raison_sociale: string }> };
  const companyByPayer = new Map((companies ?? []).map((c) => [c.profile_id, c.raison_sociale]));

  const participants: Array<{ id: string; inscriptionId: string; nomComplet: string; email: string; entreprise: string | null }> = [];
  for (const ins of inscriptions ?? []) {
    const parts = (ins.participants ?? []) as Array<{
      id: string;
      employee: Maybe<{ prenom: string; nom: string; email: string }>;
      profile: Maybe<{ full_name: string; email: string }>;
    }>;
    for (const p of parts) {
      const emp = one(p.employee);
      const prof = one(p.profile);
      participants.push({
        id: p.id,
        inscriptionId: ins.id,
        nomComplet: splitStagiaireName(emp, prof?.full_name).nomComplet,
        email: emp?.email ?? prof?.email ?? '',
        entreprise: companyByPayer.get(ins.payer_profile_id as string) ?? null,
      });
    }
  }
  participants.sort((a, b) => a.nomComplet.localeCompare(b.nomComplet, 'fr'));

  const selected = participantFilter ? participants.filter((p) => p.id === participantFilter) : participants;
  if (participantFilter && selected.length === 0) {
    return NextResponse.json({ error: 'introuvable' }, { status: 404 });
  }

  const formationTitre = one(session.formation as Maybe<{ titre: string }>)?.titre ?? 'Formation';
  const sessionDates = {
    dateDebut: creneaux?.[0]?.date ?? null,
    dateFin: creneaux?.[creneaux.length - 1]?.date ?? null,
  };

  const testsByParticipant = await Promise.all(
    selected.map((p) => loadParticipantPdfTests(p.id, p.inscriptionId))
  );

  const data: TestsSessionPdfData = {
    logoUrl: logoUrl(),
    organisme: ORGANISME,
    formationTitre,
    stagiaires: selected.map((p, i) => ({
      stagiaire: { nomComplet: p.nomComplet, email: p.email },
      entreprise: p.entreprise ? { raisonSociale: p.entreprise } : null,
      formation: { titre: formationTitre },
      session: sessionDates,
      tests: testsByParticipant[i] ?? [],
    })),
    generatedAt: new Date().toISOString(),
  };

  const buffer = await renderToBuffer(<TestsSessionPdf data={data} />);
  const who = selected.length === 1 ? safePdfFilename(selected[0].nomComplet) : 'tous-les-stagiaires';
  const filename = `tests-enquetes-${who}-${sessionId.slice(0, 8)}.pdf`;

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
