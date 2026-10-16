import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles, colors } from './styles';
import { formatDateLong, formatDateTime } from '@/lib/date';

export interface PdfQuestion {
  ordre: number;
  libelle: string;
  type: 'qcm_unique' | 'qcm_multiple' | 'texte_libre' | 'echelle' | 'liste';
  bonneReponse: string | string[] | null;
  reponseAffichee: string;
}

export interface PdfTest {
  nom: string;
  kindLabel: string; // 'Test', 'Enquête à chaud', 'Enquête à froid', 'Informatif', 'Évaluation formateur'
  isEvaluationFormateur?: boolean;
  description: string | null;
  completedAt: string | null;
  scorePct: number | null;
  scoreCorrect: number;
  scoreTotal: number;
  questions: PdfQuestion[];
}

export interface PdfOrganisme {
  nomComplet: string;
  siret: string;
  adresse: string;
  qualiopi: string;
  nda: string;
}

export interface PdfStagiaireInfo {
  stagiaire: { nomComplet: string; email: string };
  entreprise: { raisonSociale: string } | null;
  formation: { titre: string };
  session: { dateDebut: string | null; dateFin: string | null };
}

export interface TestsResponsesPdfData extends PdfStagiaireInfo {
  logoUrl: string;
  organisme: PdfOrganisme;
  tests: PdfTest[];
  generatedAt: string;
}

export function PdfHeader({ logoUrl, organisme }: { logoUrl: string; organisme: PdfOrganisme }) {
  return (
    <View style={pdfStyles.header} fixed>
      <Image src={logoUrl} style={pdfStyles.logo} />
      <View style={pdfStyles.headerMeta}>
        <Text>{organisme.nomComplet}</Text>
        <Text>SIRET {organisme.siret}</Text>
        <Text>NDA {organisme.nda}</Text>
        <Text>Qualiopi {organisme.qualiopi}</Text>
      </View>
    </View>
  );
}

export function PdfFooter({ organisme, generatedAt }: { organisme: PdfOrganisme; generatedAt: string }) {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text>{organisme.nomComplet} — {organisme.adresse}</Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages} · Édité le ${formatDateTime(generatedAt)}`} />
    </View>
  );
}

export function StagiaireInfo({ info }: { info: PdfStagiaireInfo }) {
  return (
    <View style={pdfStyles.infoBlock}>
      <View style={pdfStyles.infoRow}>
        <Text style={pdfStyles.infoLabel}>Stagiaire :</Text>
        <Text style={pdfStyles.infoValue}>
          {info.stagiaire.nomComplet}{info.stagiaire.email ? ` — ${info.stagiaire.email}` : ''}
        </Text>
      </View>
      {info.entreprise && (
        <View style={pdfStyles.infoRow}>
          <Text style={pdfStyles.infoLabel}>Entreprise :</Text>
          <Text style={pdfStyles.infoValue}>{info.entreprise.raisonSociale}</Text>
        </View>
      )}
      <View style={pdfStyles.infoRow}>
        <Text style={pdfStyles.infoLabel}>Formation :</Text>
        <Text style={pdfStyles.infoValue}>{info.formation.titre}</Text>
      </View>
      {info.session.dateDebut && (
        <View style={pdfStyles.infoRow}>
          <Text style={pdfStyles.infoLabel}>Session :</Text>
          <Text style={pdfStyles.infoValue}>
            Du {formatDateLong(info.session.dateDebut)}
            {info.session.dateFin && info.session.dateFin !== info.session.dateDebut
              ? ` au ${formatDateLong(info.session.dateFin)}`
              : ''}
          </Text>
        </View>
      )}
    </View>
  );
}

export function TestsList({ tests }: { tests: PdfTest[] }) {
  if (tests.length === 0) {
    return (
      <Text style={{ marginTop: 20, fontStyle: 'italic', color: colors.muted }}>
        Aucun test ni enquête complété pour cette session.
      </Text>
    );
  }
  return (
    <>
      {tests.map((test, ti) => {
        const prev = ti > 0 ? tests[ti - 1] : null;
        const isFirstEval = !!test.isEvaluationFormateur && !prev?.isEvaluationFormateur;
        return (
          <View key={ti}>
            <View style={{ marginTop: 18 }} wrap={false}>
              {isFirstEval && (
                <View
                  style={{
                    marginTop: 24,
                    paddingTop: 12,
                    borderTop: `2px solid ${colors.teal}`,
                    marginBottom: 14,
                  }}
                >
                  <Text style={{ fontSize: 10, color: colors.teal, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Helvetica-Bold' }}>
                    Évaluations du formateur
                  </Text>
                  <Text style={{ fontSize: 9, color: colors.muted, marginTop: 2 }}>
                    Évaluations remplies par le formateur — usage interne, non communiqué au stagiaire.
                  </Text>
                </View>
              )}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingBottom: 6,
                  borderBottom: `1px solid ${colors.border}`,
                  marginBottom: 10,
                }}
              >
                <View>
                  <Text style={{ fontSize: 9, color: colors.teal, textTransform: 'uppercase', letterSpacing: 1 }}>
                    {test.kindLabel}
                  </Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', marginTop: 2 }}>{test.nom}</Text>
                  {test.completedAt && (
                    <Text style={{ fontSize: 9, color: colors.muted, marginTop: 2 }}>
                      Complété le {formatDateTime(test.completedAt)}
                    </Text>
                  )}
                </View>
                {test.scorePct !== null && (
                  <Text style={pdfStyles.badge}>
                    Score : {test.scorePct}% ({test.scoreCorrect}/{test.scoreTotal})
                  </Text>
                )}
              </View>

              {test.questions.length === 0 ? (
                <Text style={{ fontStyle: 'italic', color: colors.muted, fontSize: 9 }}>
                  Aucune question dans ce test.
                </Text>
              ) : (
                test.questions.map((q, qi) => (
                  <View key={qi} style={pdfStyles.question} wrap={false}>
                    <Text style={pdfStyles.questionLabel}>{q.ordre + 1}. {q.libelle}</Text>
                    <Text style={pdfStyles.questionAnswer}>{q.reponseAffichee || '—'}</Text>
                    {q.bonneReponse !== null && (q.type === 'qcm_unique' || q.type === 'qcm_multiple') && (
                      <Text style={pdfStyles.questionCorrect}>
                        Bonne réponse : {
                          Array.isArray(q.bonneReponse)
                            ? q.bonneReponse.join(', ')
                            : String(q.bonneReponse)
                        }
                      </Text>
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
        );
      })}
    </>
  );
}

export function TestsResponsesPdf({ data, title }: { data: TestsResponsesPdfData; title?: string }) {
  return (
    <Document title={`${title ?? 'Réponses aux tests'} — ${data.stagiaire.nomComplet}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader logoUrl={data.logoUrl} organisme={data.organisme} />

        <Text style={pdfStyles.titleEyebrow}>Suivi pédagogique — Article L. 6353-1</Text>
        <Text style={pdfStyles.title}>{title ?? 'Réponses aux tests & enquêtes'}</Text>

        <StagiaireInfo info={data} />
        <TestsList tests={data.tests} />

        <PdfFooter organisme={data.organisme} generatedAt={data.generatedAt} />
      </Page>
    </Document>
  );
}
