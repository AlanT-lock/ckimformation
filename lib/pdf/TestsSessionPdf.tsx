import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles } from './styles';
import {
  PdfFooter,
  PdfHeader,
  StagiaireInfo,
  TestsList,
  type PdfOrganisme,
  type PdfStagiaireInfo,
  type PdfTest,
} from './TestsResponsesPdf';

export interface TestsSessionPdfData {
  logoUrl: string;
  organisme: PdfOrganisme;
  formationTitre: string;
  stagiaires: Array<PdfStagiaireInfo & { tests: PdfTest[] }>;
  generatedAt: string;
}

/** Tests & enquêtes de plusieurs stagiaires d'une session : une section (nouvelle page) par stagiaire. */
export function TestsSessionPdf({ data }: { data: TestsSessionPdfData }) {
  return (
    <Document title={`Tests & enquêtes — ${data.formationTitre}`}>
      <Page size="A4" style={pdfStyles.page}>
        <PdfHeader logoUrl={data.logoUrl} organisme={data.organisme} />

        {data.stagiaires.length === 0 && (
          <Text style={pdfStyles.title}>Aucun stagiaire confirmé sur cette session.</Text>
        )}

        {data.stagiaires.map((s, i) => (
          <View key={i} break={i > 0}>
            <Text style={pdfStyles.titleEyebrow}>Suivi pédagogique — Article L. 6353-1</Text>
            <Text style={pdfStyles.title}>Réponses aux tests &amp; enquêtes — {s.stagiaire.nomComplet}</Text>
            <StagiaireInfo info={s} />
            <TestsList tests={s.tests} />
          </View>
        ))}

        <PdfFooter organisme={data.organisme} generatedAt={data.generatedAt} />
      </Page>
    </Document>
  );
}
