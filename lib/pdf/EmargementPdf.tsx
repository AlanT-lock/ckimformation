import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles, colors } from './styles';

const FR_DATE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const trimTime = (s: string) => s.slice(0, 5);

export interface EmargementPdfCreneau {
  date: string;
  heureDebut: string;
  heureFin: string;
  signatureDataUrl: string | null;
  signedAt: string | null;
}

export interface EmargementPdfData {
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
    lieu: string;
    formateurNom: string | null;
    dateDebut: string | null;
    dateFin: string | null;
  };
  stagiaire: {
    nomComplet: string;
    email: string;
  };
  entreprise: { raisonSociale: string; siret?: string | null } | null;
  creneaux: EmargementPdfCreneau[];
  generatedAt: string;
}

export function EmargementPdf({ data }: { data: EmargementPdfData }) {
  return (
    <Document title={`Émargement — ${data.stagiaire.nomComplet}`}>
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

        <Text style={pdfStyles.titleEyebrow}>Document de traçabilité — Article L. 6353-1</Text>
        <Text style={pdfStyles.title}>Feuille d&apos;émargement individuelle</Text>

        {/* Formation */}
        <Text style={pdfStyles.sectionTitle}>Formation</Text>
        <View style={pdfStyles.infoBlock}>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Intitulé :</Text>
            <Text style={pdfStyles.infoValue}>{data.formation.titre}</Text>
          </View>
          {data.session.dateDebut && (
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>Période :</Text>
              <Text style={pdfStyles.infoValue}>
                Du {FR_DATE.format(new Date(data.session.dateDebut))}
                {data.session.dateFin && data.session.dateFin !== data.session.dateDebut
                  ? ` au ${FR_DATE.format(new Date(data.session.dateFin))}`
                  : ''}
              </Text>
            </View>
          )}
          {data.session.formateurNom && (
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>Formateur :</Text>
              <Text style={pdfStyles.infoValue}>{data.session.formateurNom}</Text>
            </View>
          )}
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Lieu :</Text>
            <Text style={pdfStyles.infoValue}>{data.session.lieu || 'À préciser'}</Text>
          </View>
        </View>

        {/* Stagiaire */}
        <Text style={pdfStyles.sectionTitle}>Stagiaire</Text>
        <View style={pdfStyles.infoBlock}>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Nom et prénom :</Text>
            <Text style={pdfStyles.infoValue}>{data.stagiaire.nomComplet}</Text>
          </View>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Email :</Text>
            <Text style={pdfStyles.infoValue}>{data.stagiaire.email}</Text>
          </View>
        </View>

        {/* Entreprise */}
        {data.entreprise && (
          <>
            <Text style={pdfStyles.sectionTitle}>Entreprise</Text>
            <View style={pdfStyles.infoBlock}>
              <View style={pdfStyles.infoRow}>
                <Text style={pdfStyles.infoLabel}>Raison sociale :</Text>
                <Text style={pdfStyles.infoValue}>{data.entreprise.raisonSociale}</Text>
              </View>
              {data.entreprise.siret && (
                <View style={pdfStyles.infoRow}>
                  <Text style={pdfStyles.infoLabel}>SIRET :</Text>
                  <Text style={pdfStyles.infoValue}>{data.entreprise.siret}</Text>
                </View>
              )}
            </View>
          </>
        )}

        {/* Émargements */}
        <Text style={pdfStyles.sectionTitle}>Émargements par créneau</Text>
        <View style={pdfStyles.table}>
          <View style={pdfStyles.tableHeader}>
            <Text style={[pdfStyles.tableHeaderCell, { width: 170 }]}>Date</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 90 }]}>Horaire</Text>
            <Text style={[pdfStyles.tableHeaderCell, { flex: 1 }]}>Signé le</Text>
            <Text style={[pdfStyles.tableHeaderCell, { width: 130, textAlign: 'right' }]}>Signature</Text>
          </View>
          {data.creneaux.map((c, i) => {
            const isLast = i === data.creneaux.length - 1;
            const dateLabel = FR_DATE.format(new Date(c.date));
            return (
              <View key={i} style={isLast ? pdfStyles.tableRowLast : pdfStyles.tableRow} wrap={false}>
                <Text style={{ width: 170, fontSize: 9, textTransform: 'capitalize' }}>{dateLabel}</Text>
                <Text style={{ width: 90, fontSize: 9 }}>
                  {trimTime(c.heureDebut)} – {trimTime(c.heureFin)}
                </Text>
                <Text style={{ flex: 1, fontSize: 9, color: colors.muted }}>
                  {c.signedAt ? FR_DATETIME.format(new Date(c.signedAt)) : '—'}
                </Text>
                <View style={pdfStyles.signatureBox}>
                  {c.signatureDataUrl ? (
                    <Image src={c.signatureDataUrl} style={pdfStyles.signatureImage} />
                  ) : (
                    <Text style={pdfStyles.signatureMissing}>Non signé</Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Footer */}
        <View style={pdfStyles.footer} fixed>
          <Text>{data.organisme.nomComplet} — {data.organisme.adresse}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages} · Édité le ${FR_DATETIME.format(new Date(data.generatedAt))}`} />
        </View>
      </Page>
    </Document>
  );
}
