import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { formatDateLetter, formatDateLong } from '@/lib/date';

const trimTime = (s: string) => s.slice(0, 5);

const colors = {
  teal: '#1B8FA0',
  dark: '#0A1A1E',
  muted: '#6B7479',
  border: '#E3E8EA',
  light: '#F3F6F7',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 52,
    paddingHorizontal: 48,
    fontSize: 11,
    fontFamily: 'Times-Roman',
    color: colors.dark,
    lineHeight: 1.45,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 14,
    marginBottom: 28,
    borderBottom: `1.5pt solid ${colors.teal}`,
  },
  logo: {
    width: 96,
    height: 'auto',
  },
  headerMeta: {
    textAlign: 'right',
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: colors.muted,
    lineHeight: 1.4,
  },
  headerName: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: colors.dark,
    marginBottom: 3,
  },
  dateLine: {
    textAlign: 'right',
    fontSize: 11,
    marginBottom: 18,
  },
  destinataire: {
    marginBottom: 22,
  },
  destinataireName: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
  },
  objet: {
    marginBottom: 18,
    fontSize: 11,
  },
  objetLabel: {
    fontFamily: 'Times-Bold',
  },
  body: {
    marginBottom: 10,
    textAlign: 'justify',
  },
  bold: {
    fontFamily: 'Times-Bold',
  },
  infoBlock: {
    marginVertical: 14,
    padding: 12,
    backgroundColor: colors.light,
    borderLeft: `3pt solid ${colors.teal}`,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  infoLabel: {
    width: 80,
    fontFamily: 'Times-Bold',
    fontSize: 10,
  },
  infoValue: {
    flex: 1,
    fontSize: 10,
  },
  planningTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 11,
    marginBottom: 8,
    marginTop: 4,
    color: colors.teal,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottom: `1pt solid ${colors.border}`,
    paddingBottom: 4,
    marginBottom: 4,
  },
  tableHeaderCell: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 8,
    color: colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  closing: {
    marginTop: 16,
    marginBottom: 8,
  },
  footer: {
    position: 'absolute',
    left: 48,
    right: 48,
    bottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: colors.muted,
    borderTop: `1pt solid ${colors.border}`,
    paddingTop: 8,
  },
});

export interface ConvocationPdfCreneau {
  date: string;
  heureDebut: string;
  heureFin: string;
}

export interface ConvocationPdfData {
  logoUrl: string;
  organisme: {
    nomComplet: string;
    siret: string;
    adresse: string;
    nda: string;
    telephone: string;
    email: string;
  };
  stagiaire: {
    prenom: string;
    nom: string;
  };
  formationTitre: string;
  lieu: string;
  creneaux: ConvocationPdfCreneau[];
  emittedAt: string;
}

export function ConvocationPdf({ data }: { data: ConvocationPdfData }) {
  const nomComplet = `${data.stagiaire.prenom} ${data.stagiaire.nom}`.trim();
  const lieu = data.lieu.trim() || 'Le lieu vous sera communiqué ultérieurement.';
  const dateEmission = formatDateLetter(data.emittedAt);

  return (
    <Document title={`Convocation — ${nomComplet}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src={data.logoUrl} style={styles.logo} />
          <View style={styles.headerMeta}>
            <Text style={styles.headerName}>{data.organisme.nomComplet}</Text>
            <Text>{data.organisme.adresse}</Text>
            <Text>SIRET {data.organisme.siret}</Text>
            <Text>NDA {data.organisme.nda}</Text>
            <Text>Tél. {data.organisme.telephone}</Text>
            <Text>{data.organisme.email}</Text>
          </View>
        </View>

        <Text style={styles.dateLine}>Draguignan, le {dateEmission}</Text>

        <View style={styles.destinataire}>
          <Text style={styles.destinataireName}>{nomComplet}</Text>
        </View>

        <Text style={styles.objet}>
          <Text style={styles.objetLabel}>Objet : </Text>
          Convocation à la formation « {data.formationTitre} »
        </Text>

        <Text style={styles.body}>Madame, Monsieur {nomComplet},</Text>

        <Text style={styles.body}>
          Nous vous convions à la formation{' '}
          <Text style={styles.bold}>« {data.formationTitre} »</Text>
          {' '}organisée par {data.organisme.nomComplet}.
        </Text>

        <Text style={styles.body}>
          Vous trouverez ci-dessous les informations pratiques de la session.
        </Text>

        <View style={styles.infoBlock}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Formation</Text>
            <Text style={styles.infoValue}>{data.formationTitre}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Lieu</Text>
            <Text style={styles.infoValue}>{lieu}</Text>
          </View>
        </View>

        <Text style={styles.planningTitle}>Planning</Text>
        {data.creneaux.length === 0 ? (
          <Text style={styles.body}>Les horaires vous seront communiqués ultérieurement.</Text>
        ) : (
          <View>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { flex: 1 }]}>Date</Text>
              <Text style={[styles.tableHeaderCell, { width: 120 }]}>Horaires</Text>
            </View>
            {data.creneaux.map((c, i) => (
              <View key={i} style={styles.tableRow} wrap={false}>
                <Text style={{ flex: 1, fontSize: 10, textTransform: 'capitalize' }}>
                  {formatDateLong(c.date)}
                </Text>
                <Text style={{ width: 120, fontSize: 10 }}>
                  {trimTime(c.heureDebut)} – {trimTime(c.heureFin)}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Text style={[styles.body, { marginTop: 16 }]}>
          Merci de vous présenter <Text style={styles.bold}>quinze minutes avant</Text> le début
          de chaque créneau, muni(e) d’une <Text style={styles.bold}>pièce d’identité</Text>.
          En cas d’empêchement, merci de nous prévenir dès que possible au{' '}
          {data.organisme.telephone} ou à {data.organisme.email}.
        </Text>

        <Text style={styles.body}>Nous vous souhaitons une excellente formation.</Text>

        <Text style={styles.closing}>Cordialement,</Text>
        <Text style={styles.bold}>{data.organisme.nomComplet}</Text>

        <View style={styles.footer} fixed>
          <Text>
            {data.organisme.nomComplet} — {data.organisme.adresse}
          </Text>
          <Text
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
}
