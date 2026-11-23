import { loadFinFormationSession } from '@/lib/fin-formation/data';
import { sessionChecks } from '@/lib/fin-formation/model';
import { FinFormationPanel, type FinFormationPanelData } from '../../FinFormationPanel';
import { requireAdminSession } from '../../session-data';
import { EmptySection, SectionHeading } from '../SectionHeading';

interface PageProps {
  params: Promise<{ id: string }>;
}

// Génération des PDF + envoi des e-mails depuis les actions de cette page.
export const maxDuration = 60;

export default async function AdminSessionFinFormationPage({ params }: PageProps) {
  const { id } = await params;
  await requireAdminSession(id);
  const finFormation = await loadFinFormationSession(id);

  // Documents de fin de formation (certificat de réalisation + attestation)
  let data: FinFormationPanelData | null = null;
  if (finFormation) {
    const competenceIds = new Set(finFormation.competences.map((c) => c.id));
    data = {
      sessionId: finFormation.sessionId,
      formationTitre: finFormation.formationTitre,
      terminee: finFormation.terminee,
      ...sessionChecks({
        hasCreneaux: !!finFormation.dateDebut,
        formateurNom: finFormation.formateurNom,
        lieu: finFormation.lieu,
        competencesTotal: finFormation.competences.length,
      }),
      competencesTotal: finFormation.competences.length,
      rows: finFormation.participants.map((p) => ({
        id: p.id,
        nom: p.nomComplet,
        email: p.email,
        entreprise: p.entreprise ? { id: p.entreprise.payerProfileId, nom: p.entreprise.raisonSociale } : null,
        competencesEvaluees: Object.keys(p.niveaux).filter((cid) => competenceIds.has(cid)).length,
        docs: Object.fromEntries(
          Object.entries(p.docs).map(([kind, d]) => [kind, { id: d.id, numero: d.numero, sentAt: d.sentAt }])
        ),
      })),
    };
  }

  // Le panneau ne s'affiche qu'une fois la session terminée (ou si des documents existent déjà).
  const hasDocs = !!data && data.rows.some((r) => r.docs.certificat || r.docs.attestation);
  if (!data || (!data.terminee && !hasDocs)) {
    return (
      <section className="space-y-4">
        <SectionHeading
          title="Documents de fin de formation"
          description="Certificat de réalisation et attestation de fin de formation."
        />
        <EmptySection>
          Les documents de fin de formation pourront être générés et envoyés une fois la session terminée.
        </EmptySection>
      </section>
    );
  }

  return <FinFormationPanel data={data} />;
}
