import type { ComponentProps } from 'react';
import { Document, Page, View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import {
  FIN_FORMATION_PARAMS,
  NIVEAU_LABEL,
  footLine,
  headLines,
  type DocBlock,
  type DocModel,
  type Niveau,
  type Run,
} from '@/lib/fin-formation/model';
import { CACHET_SIGNATURE, LOGO_BLANC } from './fin-formation-assets';

// Rendu PDF du certificat de réalisation et de l'attestation de fin de
// formation. Mise en page reprise de l'outil « Attestations et certificats »
// C-KIM : bandeau pétrole, liseré turquoise, tableaux gris-vert, cachet.

const mm = (v: number) => (v * 72) / 25.4;

const C = {
  petrole: '#2E4A50',
  turquoise: '#3DBFAE',
  text: '#1d2b30',
  muted: '#6B7C80',
  border: '#C9D5D6',
  keyBg: '#F3F7F7',
  headBg: '#E8EFEE',
  bandText: '#E8F0F0',
};

const NIVEAU_COLORS: Record<Niveau, { bg: string; fg: string }> = {
  acquise: { bg: '#E2F2E7', fg: '#1F7A3E' },
  en_cours: { bg: '#FBEFD9', fg: '#9A5B0B' },
  non_acquise: { bg: '#FBE3DF', fg: '#B42318' },
};

// react-pdf transmet l'interligne aux enfants en valeur absolue : il est donc
// fixé sur chaque style de texte, jamais sur la page.
const LH = 1.18;
const BOLD = 'Helvetica-Bold';
const ITALIC = 'Helvetica-Oblique';

const s = StyleSheet.create({
  page: {
    paddingTop: mm(37),
    paddingBottom: mm(18),
    paddingHorizontal: mm(15),
    fontFamily: 'Helvetica',
    fontSize: 9.6,
    color: C.text,
  },
  band: { position: 'absolute', top: 0, left: 0, right: 0 },
  bandFill: { height: mm(31), backgroundColor: C.petrole },
  bandAccent: { height: mm(1), backgroundColor: C.turquoise },
  bandLogo: { position: 'absolute', left: mm(15), top: mm(7.5), width: mm(32) },
  bandOrg: { position: 'absolute', right: mm(15), top: mm(6.5), width: mm(135), textAlign: 'right' },
  bandOrgName: { fontFamily: BOLD, fontSize: 10, lineHeight: LH, color: '#FFFFFF' },
  bandOrgLine: { fontSize: 8, lineHeight: 1.3, color: C.bandText },
  footer: {
    position: 'absolute',
    left: mm(15),
    right: mm(15),
    bottom: mm(6),
    borderTop: `0.6pt solid ${C.border}`,
    paddingTop: 4,
    textAlign: 'center',
    fontSize: 6.8,
    lineHeight: LH,
    color: C.muted,
  },
  numero: { textAlign: 'right', fontSize: 8.5, lineHeight: LH, color: '#555555' },
  title: {
    textAlign: 'center',
    fontFamily: BOLD,
    fontSize: 16,
    lineHeight: LH,
    color: C.petrole,
    letterSpacing: 1,
    marginTop: 6,
    marginBottom: 2,
  },
  legal: { textAlign: 'center', fontSize: 8, lineHeight: LH, color: C.muted, marginBottom: 11 },
  intro: { fontSize: 10, lineHeight: LH, marginBottom: 7 },
  p: { fontSize: 10.2, lineHeight: LH },
  supRow: { flexDirection: 'row', alignItems: 'flex-start' },
  sup: { fontSize: 6.5, lineHeight: 1 },
  checks: { marginBottom: 10 },
  checkRow: { flexDirection: 'row', alignItems: 'flex-start', marginLeft: 10, marginBottom: 3 },
  checkBox: {
    width: 7.5,
    height: 7.5,
    marginTop: 1.5,
    marginRight: 6,
    border: `0.7pt solid ${C.text}`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontFamily: BOLD, fontSize: 6, lineHeight: 1 },
  clause: { fontSize: 10, textAlign: 'justify', lineHeight: 1.2, marginTop: 4, marginBottom: 16 },
  h: { fontFamily: BOLD, fontSize: 10, lineHeight: LH, marginBottom: 4 },
  box: {
    backgroundColor: '#F4F8F8',
    border: `0.6pt solid ${C.border}`,
    borderLeft: `3.4pt solid ${C.turquoise}`,
    paddingLeft: 11,
    paddingRight: 10,
    paddingTop: 6,
    paddingBottom: 4,
    marginBottom: 6,
  },
  boxTitle: { fontFamily: BOLD, fontSize: 9, lineHeight: LH, marginBottom: 3 },
  boxLine: { fontSize: 9, lineHeight: LH, marginBottom: 2 },
  small: { fontSize: 7.6, color: C.muted, lineHeight: 1.1, marginBottom: 8 },
  table: { borderTop: `0.6pt solid ${C.border}`, borderLeft: `0.6pt solid ${C.border}` },
  row: { flexDirection: 'row' },
  cell: { borderRight: `0.6pt solid ${C.border}`, borderBottom: `0.6pt solid ${C.border}` },
  kvTable: { fontSize: 9.2, lineHeight: LH, marginBottom: 8 },
  kvCell: { paddingLeft: 7, paddingRight: 7, paddingTop: 4, paddingBottom: 3 },
  kvKey: { width: '38%', backgroundColor: C.keyBg, fontFamily: BOLD },
  resTable: { fontSize: 8.6, lineHeight: 1.08, marginBottom: 8 },
  resCell: { paddingLeft: 5, paddingRight: 5, paddingTop: 3.5, paddingBottom: 3 },
  resHead: {
    backgroundColor: C.headBg,
    fontFamily: BOLD,
    fontSize: 7.4,
    color: C.petrole,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  resResult: { width: 112 },
  badge: { alignSelf: 'flex-start', borderRadius: 2, paddingHorizontal: 4, paddingTop: 1.5, paddingBottom: 1 },
  badgeText: { fontFamily: BOLD, fontSize: 8.2, lineHeight: 1 },
  sign: { flexDirection: 'row', marginTop: 6 },
  signLeft: { flex: 1, fontSize: 10, lineHeight: LH, paddingRight: 20 },
  signRight: { width: '48%' },
  signTitle: { fontSize: 10, lineHeight: LH },
  signName: { fontSize: 8, lineHeight: LH, color: C.muted, marginTop: 1, marginBottom: 3 },
  stampBox: { border: `0.6pt dashed #8FA5A8`, padding: 3, alignItems: 'center', justifyContent: 'center' },
  stamp: { height: 56, width: 94 },
  notes: { marginTop: 26 },
  notesRule: { width: 150, borderTop: '0.6pt solid #444444', marginBottom: 4 },
  noteRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 2 },
  noteNum: { width: 7, fontSize: 5.5, lineHeight: 1, color: '#333333' },
  noteText: { flex: 1, fontSize: 7.8, lineHeight: LH, color: '#333333' },
});

/** Aucune césure : un mot trop long passe entier à la ligne suivante. */
const noHyphenation = (word: string) => [word];

/** Texte sans césure automatique (react-pdf coupe sinon les mots à l'anglaise). */
function T(props: ComponentProps<typeof Text>) {
  return <Text hyphenationCallback={noHyphenation} {...props} />;
}

function runStyle(r: Run) {
  if (r.b) return { fontFamily: BOLD };
  if (r.i) return { fontFamily: ITALIC };
  return undefined;
}

/** Fragments en ligne (les appels de note sont rendus à part, voir Paragraph). */
function Runs({ runs }: { runs: Run[] }) {
  return (
    <>
      {runs.map((r, i) => (
        <T key={i} style={runStyle(r)}>
          {r.text}
        </T>
      ))}
    </>
  );
}

/**
 * Paragraphe. Un appel de note en fin de ligne est posé dans une colonne à
 * part, alignée en haut, pour apparaître en exposant (react-pdf ne sait pas
 * surélever un fragment de texte).
 */
function Paragraph({ runs, gap }: { runs: Run[]; gap?: boolean }) {
  const marginBottom = gap ? 12 : 4;
  const last = runs[runs.length - 1];
  if (last?.sup) {
    return (
      <View style={[s.supRow, { marginBottom }]}>
        <T style={s.p}>
          <Runs runs={runs.slice(0, -1)} />
        </T>
        <T style={s.sup}>{last.text}</T>
      </View>
    );
  }
  return (
    <T style={[s.p, { marginBottom }]}>
      <Runs runs={runs} />
    </T>
  );
}

function Block({ block }: { block: DocBlock }) {
  switch (block.t) {
    case 'intro':
      return (
        <T style={s.intro}>
          <Runs runs={block.runs} />
        </T>
      );
    case 'p':
      return <Paragraph runs={block.runs} gap={block.gap} />;
    case 'checks':
      return (
        <View style={s.checks}>
          {block.items.map((item, i) => (
            <View key={i} style={s.checkRow}>
              <View style={s.checkBox}>{item.checked && <T style={s.checkMark}>X</T>}</View>
              <T style={s.p}>{item.label}</T>
              {item.note && <T style={s.sup}>{item.note}</T>}
            </View>
          ))}
        </View>
      );
    case 'clause':
      return (
        <T style={s.clause}>
          <Runs runs={block.runs} />
        </T>
      );
    case 'h':
      return <T style={s.h}>{block.text}</T>;
    case 'box':
      return (
        <View style={s.box} wrap={false}>
          <T style={s.boxTitle}>{block.title}</T>
          {block.lines.map((line, i) => (
            <T key={i} style={s.boxLine}>
              {line}
            </T>
          ))}
        </View>
      );
    case 'small':
      return (
        <T style={s.small}>
          <Runs runs={block.runs} />
        </T>
      );
    case 'kv':
      return (
        <View style={[s.table, s.kvTable]}>
          {block.rows.map((row, i) => (
            <View key={i} style={s.row} wrap={false}>
              <T style={[s.cell, s.kvCell, s.kvKey]}>{row.k}</T>
              <T style={[s.cell, s.kvCell, { flex: 1 }]}>
                <Runs runs={row.v} />
              </T>
            </View>
          ))}
        </View>
      );
    case 'res':
      return (
        <View style={[s.table, s.resTable]}>
          <View style={s.row} wrap={false}>
            <T style={[s.cell, s.resCell, s.resHead, { flex: 1 }]}>{block.head[0]}</T>
            {block.withResult && <T style={[s.cell, s.resCell, s.resHead, s.resResult]}>{block.head[1]}</T>}
          </View>
          {block.rows.map((row, i) => (
            <View key={i} style={s.row} wrap={false}>
              <T style={[s.cell, s.resCell, { flex: 1 }]}>{row.libelle}</T>
              {block.withResult && (
                <View style={[s.cell, s.resCell, s.resResult]}>
                  {row.niveau ? (
                    <View style={[s.badge, { backgroundColor: NIVEAU_COLORS[row.niveau].bg }]}>
                      <T style={[s.badgeText, { color: NIVEAU_COLORS[row.niveau].fg }]}>
                        {NIVEAU_LABEL[row.niveau]}
                      </T>
                    </View>
                  ) : (
                    <T style={{ color: C.muted }}>Non évaluée</T>
                  )}
                </View>
              )}
            </View>
          ))}
        </View>
      );
    case 'sign':
      return (
        <View style={s.sign} wrap={false}>
          <T style={s.signLeft}>
            <Runs runs={block.left} />
          </T>
          <View style={s.signRight}>
            <T style={s.signTitle}>{block.rightTitle}</T>
            <T style={s.signName}>
              {FIN_FORMATION_PARAMS.signNom}, {FIN_FORMATION_PARAMS.signQualite}
            </T>
            <View style={s.stampBox}>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, pas une balise HTML */}
              <Image src={CACHET_SIGNATURE} style={s.stamp} />
            </View>
          </View>
        </View>
      );
    case 'foot':
      return (
        <View style={s.notes} wrap={false}>
          <View style={s.notesRule} />
          {block.notes.map(([n, text]) => (
            <View key={n} style={s.noteRow}>
              <T style={s.noteNum}>{n}</T>
              <T style={s.noteText}>{text}</T>
            </View>
          ))}
        </View>
      );
  }
}

export function FinFormationPdf({ model, stagiaireNom }: { model: DocModel; stagiaireNom: string }) {
  return (
    <Document title={`${model.title} — ${stagiaireNom}`} author={FIN_FORMATION_PARAMS.raison}>
      <Page size="A4" style={s.page}>
        <View style={s.band} fixed>
          <View style={s.bandFill} />
          <View style={s.bandAccent} />
          {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image, pas une balise HTML */}
          <Image src={LOGO_BLANC} style={s.bandLogo} />
          <View style={s.bandOrg}>
            <T style={s.bandOrgName}>{FIN_FORMATION_PARAMS.raison}</T>
            {headLines().map((line) => (
              <T key={line} style={s.bandOrgLine}>
                {line}
              </T>
            ))}
          </View>
        </View>

        <T style={s.numero}>N° {model.numero}</T>
        <T style={s.title}>{model.title}</T>
        {model.legal ? <T style={s.legal}>{model.legal}</T> : <View style={{ height: 16 }} />}

        {model.blocks.map((block, i) => (
          <Block key={i} block={block} />
        ))}

        <T style={s.footer} fixed>
          {footLine()}
        </T>
      </Page>
    </Document>
  );
}
