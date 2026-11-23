import { EmargementBoard } from '@/components/app/EmargementBoard';
import type { EmargementBoardEntry } from '@/lib/emargements/board';
import { createClient } from '@/lib/supabase/server';
import { loadCreneaux, loadInscriptions, requireAdminSession } from '../../session-data';
import { SectionHeading } from '../SectionHeading';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSessionEmargementPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireAdminSession(id);

  const supabase = await createClient();
  const [creneaux, { participantRows }, { data: formateur }, { data: formateurEmargements }] = await Promise.all([
    loadCreneaux(id),
    loadInscriptions(id),
    session.formateur_id
      ? supabase.from('profiles').select('full_name').eq('id', session.formateur_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from('formateur_emargements')
      .select('creneau_id, signed_at, signature_data')
      .eq('session_id', id),
  ]);

  const creneauIds = creneaux.map((c) => c.id);
  const { data: stagiaireEmargements } = creneauIds.length > 0
    ? await supabase
        .from('emargements')
        .select('creneau_id, signed_at, signature_data, inscription_participant_id')
        .in('creneau_id', creneauIds)
    : { data: [] };

  const formateurName = formateur?.full_name || 'Formateur';
  const boardEntries: EmargementBoardEntry[] = [];
  for (const fe of formateurEmargements ?? []) {
    boardEntries.push({
      id: `formateur-${fe.creneau_id}`,
      creneauId: fe.creneau_id,
      role: 'formateur',
      name: formateurName,
      signedAt: fe.signed_at,
      signatureDataUrl: fe.signature_data,
    });
  }

  const nameByParticipant = new Map(
    participantRows.map((p) => [p.id, `${p.prenom} ${p.nom}`.trim()]),
  );
  const signedStagiaire = new Set<string>();
  for (const se of stagiaireEmargements ?? []) {
    if (!se.inscription_participant_id) continue;
    const key = `${se.inscription_participant_id}-${se.creneau_id}`;
    signedStagiaire.add(key);
    boardEntries.push({
      id: key,
      creneauId: se.creneau_id,
      role: 'stagiaire',
      name: nameByParticipant.get(se.inscription_participant_id) ?? 'Stagiaire',
      signedAt: se.signed_at,
      signatureDataUrl: se.signature_data,
    });
  }
  // Stagiaires qui n'ont pas (encore) signé : une ligne vide par créneau
  for (const p of participantRows) {
    for (const c of creneaux) {
      const key = `${p.id}-${c.id}`;
      if (signedStagiaire.has(key)) continue;
      boardEntries.push({
        id: key,
        creneauId: c.id,
        role: 'stagiaire',
        name: `${p.prenom} ${p.nom}`.trim(),
        signedAt: null,
        signatureDataUrl: null,
      });
    }
  }

  return (
    <section>
      <SectionHeading
        title="Feuille d'émargement"
        description="Cliquez sur un créneau pour afficher ou masquer les signatures (formateur encadré orange)."
        actions={
          <a
            href={`/api/pdf/emargements/session/${session.id}`}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center px-4 py-2 rounded text-sm font-medium bg-teal hover:bg-teal-l text-white transition whitespace-nowrap"
          >
            Feuille collective (PDF)
          </a>
        }
      />
      <div className="mt-3">
        <EmargementBoard creneaux={creneaux} entries={boardEntries} formateurName={formateurName} />
      </div>
    </section>
  );
}
