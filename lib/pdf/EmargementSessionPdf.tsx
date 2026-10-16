import { Document, Page, View, Text, Image } from '@react-pdf/renderer';
import { pdfStyles, colors } from './styles';
import { formatDateLong, formatDateTime } from '@/lib/date';
import { ACCEPTATION_TEXT } from '@/lib/reglement/acceptation';

const trimTime = (s: string) => s.slice(0, 5);

export interface EmargementSessionStagiaire {
  id: string;
  nomComplet: string;
  entreprise: string | null;
  reglementAccepteAt: string | null;
}

export interface EmargementSessionCreneau {
  date: string;
  heureDebut: string;
  heureFin: string;
  /** Par stagiaire (même ordre que `stagiaires`) */
  signatures: Array<{ signatureDataUrl: string | null; signedAt: string | null; absent: boolean }>;
  formateur: { signatureDataUrl: string | null; signedAt: string | null };
}

export interface EmargementSessionPdfData {
  logoUrl: string;
  organisme: { nomComplet: string; siret: string; adresse: string; qualiopi: string; nda: string };
  formation: { titre: string };
  session: { lieu: string; formateurNom: string | null; dateDebut: string | null; dateFin: string | null };
  stagiaires: EmargementSessionStagiaire[];
  creneaux: EmargementSessionCreneau[];
  generatedAt: string;
}

const COL_NAME = 190;
const COL_SIGNED = 110;
const SIG_W = 120;
const SIG_H = 44;

function SignatureCell({ dataUrl, absent }: { dataUrl: string | null; absent?: boolean }) {
  return (
    <View style={[pdfStyles.signatureBox, { width: SIG_W, height: SIG_H }]}>
      {dataUrl ? (
        <Image src={dataUrl} style={[pdfStyles.signatureImage, { maxWidth: SIG_W - 6, maxHeight: SIG_H - 6 }]} />
      ) : (
        <Text style={pdfStyles.signatureMissing}>{absent ? 'Absent' : 'Non signé'}</Text>
      )}
    </View>
  );
}

export function EmargementSessionPdf({ data }: { data: EmargementSessionPdfData }) {
  return (
    <Document title={`Feuille d'émargement — ${data.formation.titre}`}>
      <Page size="A4" style={pdfStyles.page}>
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
        <Text style={pdfStyles.title}>Feuille d&apos;émargement de la session</Text>

        <View style={pdfStyles.infoBlock}>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Intitulé :</Text>
            <Text style={pdfStyles.infoValue}>{data.formation.titre}</Text>
          </View>
          {data.session.dateDebut && (
            <View style={pdfStyles.infoRow}>
              <Text style={pdfStyles.infoLabel}>Période :</Text>
              <Text style={pdfStyles.infoValue}>
                Du {formatDateLong(data.session.dateDebut)}
                {data.session.dateFin && data.session.dateFin !== data.session.dateDebut
                  ? ` au ${formatDateLong(data.session.dateFin)}`
                  : ''}
              </Text>
            </View>
          )}
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Formateur :</Text>
            <Text style={pdfStyles.infoValue}>{data.session.formateurNom ?? '—'}</Text>
          </View>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Lieu :</Text>
            <Text style={pdfStyles.infoValue}>{data.session.lieu || 'À préciser'}</Text>
          </View>
          <View style={pdfStyles.infoRow}>
            <Text style={pdfStyles.infoLabel}>Stagiaires :</Text>
            <Text style={pdfStyles.infoValue}>{data.stagiaires.length}</Text>
          </View>
        </View>

        {data.creneaux.length === 0 && (
          <Text style={{ marginTop: 20, fontStyle: 'italic', color: colors.muted }}>
            Aucun créneau planifié pour cette session.
          </Text>
        )}

        {data.creneaux.map((c, ci) => (
          <View key={ci} style={{ marginTop: 14 }}>
            <View wrap={false} minPresenceAhead={60}>
              <Text style={[pdfStyles.sectionTitle, { marginTop: 0, textTransform: 'none', letterSpacing: 0 }]}>
                {formatDateLong(c.date)} · {trimTime(c.heureDebut)} – {trimTime(c.heureFin)}
              </Text>
              <View style={pdfStyles.tableHeader}>
                <Text style={[pdfStyles.tableHeaderCell, { width: COL_NAME }]}>Participant</Text>
                <Text style={[pdfStyles.tableHeaderCell, { width: COL_SIGNED }]}>Signé le</Text>
                <Text style={[pdfStyles.tableHeaderCell, { flex: 1, textAlign: 'right' }]}>Signature</Text>
              </View>
            </View>
            {data.stagiaires.map((s, si) => {
              const sig = c.signatures[si];
              return (
                <View key={s.id} style={pdfStyles.tableRow} wrap={false}>
                  <View style={{ width: COL_NAME }}>
                    <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{s.nomComplet}</Text>
                    {s.entreprise && <Text style={{ fontSize: 8, color: colors.muted }}>{s.entreprise}</Text>}
                  </View>
                  <Text style={{ width: COL_SIGNED, fontSize: 9, color: colors.muted }}>
                    {sig?.signedAt ? formatDateTime(sig.signedAt) : '—'}
                  </Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <SignatureCell dataUrl={sig?.signatureDataUrl ?? null} absent={sig?.absent} />
                  </View>
                </View>
              );
            })}
            <View style={[pdfStyles.tableRowLast, { backgroundColor: colors.light }]} wrap={false}>
              <View style={{ width: COL_NAME }}>
                <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold' }}>{data.session.formateurNom ?? 'Formateur'}</Text>
                <Text style={{ fontSize: 8, color: colors.teal }}>Formateur</Text>
              </View>
              <Text style={{ width: COL_SIGNED, fontSize: 9, color: colors.muted }}>
                {c.formateur.signedAt ? formatDateTime(c.formateur.signedAt) : '—'}
              </Text>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <SignatureCell dataUrl={c.formateur.signatureDataUrl} />
              </View>
            </View>
          </View>
        ))}

        <View break={data.creneaux.length > 0}>
          <Text style={pdfStyles.sectionTitle}>Règlement intérieur &amp; livret d&apos;accueil</Text>
          <Text style={{ fontSize: 9, color: colors.muted, lineHeight: 1.4, marginBottom: 6 }}>
            Case cochée par chaque stagiaire avant son premier émargement : « {ACCEPTATION_TEXT} »
          </Text>
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { flex: 1 }]}>Stagiaire</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: 200 }]}>Accepté le</Text>
            </View>
            {data.stagiaires.map((s, i) => (
              <View
                key={s.id}
                style={i === data.stagiaires.length - 1 ? pdfStyles.tableRowLast : pdfStyles.tableRow}
                wrap={false}
              >
                <Text style={{ flex: 1, fontSize: 9 }}>{s.nomComplet}</Text>
                <Text style={{ width: 200, fontSize: 9, color: s.reglementAccepteAt ? colors.dark : colors.orange }}>
                  {s.reglementAccepteAt ? formatDateTime(s.reglementAccepteAt) : 'Non accepté'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={pdfStyles.footer} fixed>
          <Text>{data.organisme.nomComplet} — {data.organisme.adresse}</Text>
          <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages} · Édité le ${formatDateTime(data.generatedAt)}`} />
        </View>
      </Page>
    </Document>
  );
}
