import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles, colors } from './styles';

const FR_DATE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export interface PdfQuestion {
  ordre: number;
  libelle: string;
  type: 'qcm_unique' | 'qcm_multiple' | 'texte_libre' | 'echelle' | 'liste';
  bonneReponse: string | string[] | null;
  reponseAffichee: string;
}

export interface PdfTest {
  nom: string;
  kindLabel: string; // 'Test', 'Enquête à chaud', 'Enquête à froid', 'Informatif'
  description: string | null;
  completedAt: string | null;
  scorePct: number | null;
  scoreCorrect: number;
  scoreTotal: number;
  questions: PdfQuestion[];
}

export interface TestsResponsesPdfData {
  logoUrl: string;
  organisme: {
    nomComplet: string;
    siret: string;
    adresse: string;
    qualiopi: string;
    nda: string;
  };
  formation: { titre: string };
  session: {
    dateDebut: string | null;
    dateFin: string | null;
  };
  stagiaire: {
    nomComplet: string;
    email: string;
  };
  entreprise: { raisonSociale: string } | null;
  tests: PdfTest[];
  generatedAt: string;
}

export function TestsResponsesPdf({ data }: { data: TestsResponsesPdfData }) {
  return (
    <Document title={`Réponses aux tests — ${data.stagiaire.nomComplet}`}>
      <Page size="A4" style={pdfStyles.page}>
        {/* Header */}
        <View style={pdfStyles.header} fixed>
          <Image src={data.logoUrl} style={pdfStyles.logo} />
          <View style={pdfStyles.headerMeta}>
            <Text>{data.organisme.nomComplet}</Text>
            <Text>SIRET {data.organisme.siret}</Text>
            <Text>NDA {data.organisme.nda}</Text>
            <Text>Qualiopi {data.organisme.qualiopi}</Text>
          </View>
        </View>

        <Text style={pdfStyles.titleEyebrow}>Suivi pédagogique — Article L. 6353-1</Text>
        <Text style={pdfStyles.title}>Réponses aux tests &amp; enquêtes</Text>

        {/* Stagiaire + formation */}
        <View style={pdfStyles.infoBlock}>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Stagiaire :</Text>
            <Text style={pdfStyles.infoValue}>{data.stagiaire.nomComplet} — {data.stagiaire.email}</Text>
          </View>
          {data.entreprise && (
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>Entreprise :</Text>
              <Text style={pdfStyles.infoValue}>{data.entreprise.raisonSociale}</Text>
            </View>
          )}
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Formation :</Text>
            <Text style={pdfStyles.infoValue}>{data.formation.titre}</Text>
          </View>
          {data.session.dateDebut && (
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>Session :</Text>
              <Text style={pdfStyles.infoValue}>
                Du {FR_DATE.format(new Date(data.session.dateDebut))}
                {data.session.dateFin && data.session.dateFin !== data.session.dateDebut
                  ? ` au ${FR_DATE.format(new Date(data.session.dateFin))}`
                  : ''}
              </Text>
            </View>
          )}
        </View>

        {data.tests.length === 0 && (
          <Text style={{ marginTop: 20, fontStyle: 'italic', color: colors.muted }}>
            Aucun test ni enquête complété pour cette session.
          </Text>
        )}

        {data.tests.map((test, ti) => (
          <View key={ti} style={{ marginTop: 18 }} wrap={false}>
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
                    Complété le {FR_DATETIME.format(new Date(test.completedAt))}
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
        ))}

        {/* Footer */}
        <View style={pdfStyles.footer} fixed>
          <Text>{data.organisme.nomComplet} — {data.organisme.adresse}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages} · Édité le ${FR_DATETIME.format(new Date(data.generatedAt))}`} />
        </View>
      </Page>
    </Document>
  );
}
