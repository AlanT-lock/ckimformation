/* eslint-disable jsx-a11y/alt-text */
import path from 'node:path';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import type { Formation } from '@/lib/types/formation';
import { getParcoursMeta } from '@/lib/parcours';
import { COLORS, CKIM_CONTACT, getParcoursColor } from './theme';

// Polices identiques à la plaquette commerciale (Bebas Neue + DM Sans),
// servies depuis /public/fonts pour éviter toute dépendance CDN au runtime.
const FONTS_DIR = path.join(process.cwd(), 'public', 'fonts');

Font.register({
  family: 'Bebas Neue',
  src: path.join(FONTS_DIR, 'BebasNeue-Regular.woff'),
});
Font.register({
  family: 'DM Sans',
  fonts: [
    { src: path.join(FONTS_DIR, 'DMSans-Regular.woff'), fontWeight: 400 },
    { src: path.join(FONTS_DIR, 'DMSans-SemiBold.woff'), fontWeight: 600 },
    { src: path.join(FONTS_DIR, 'DMSans-Bold.woff'), fontWeight: 700 },
  ],
});

// Désactive la césure forcée pour respecter les longs mots techniques
Font.registerHyphenationCallback((word) => [word]);

// ───────────────────────────────────────────────────────────────
// Styles — reprise fidèle de l'empreinte plaquette
// (valeurs en pt, ~px × 0.75 pour matcher le rendu print du HTML)
// ───────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: 'DM Sans',
    fontSize: 7,
    color: COLORS.body,
    backgroundColor: COLORS.lightBg,
    paddingBottom: 22, // place pour le footer absolu
  },

  // Header parcours (fond coloré, titre Bebas)
  header: {
    paddingTop: '10mm',
    paddingBottom: '7mm',
    paddingHorizontal: '14mm',
    position: 'relative',
    overflow: 'hidden',
  },
  headerEyebrow: {
    fontSize: 6,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 5,
    fontWeight: 600,
  },
  headerTitle: {
    fontFamily: 'Bebas Neue',
    fontSize: 30,
    color: COLORS.white,
    letterSpacing: 1,
    lineHeight: 1,
  },
  headerSubtitle: {
    fontFamily: 'Bebas Neue',
    fontSize: 18,
    color: 'rgba(255,255,255,0.85)',
    letterSpacing: 1,
    lineHeight: 1.1,
    marginTop: 4,
  },
  headerRef: {
    fontSize: 6.5,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: 0.7,
    marginTop: 6,
  },
  headerRefPill: {
    position: 'absolute',
    top: '10mm',
    right: '14mm',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 2,
    paddingHorizontal: 7,
    paddingVertical: 3,
    fontSize: 6.5,
    color: COLORS.white,
    letterSpacing: 1.5,
    fontWeight: 700,
  },
  headerBarBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
  },
  // Grille décorative subtile sur le header (lignes verticales)
  headerGrid: {
    position: 'absolute',
    inset: 0,
    flexDirection: 'row',
  },
  headerGridCol: {
    flex: 1,
    borderRightWidth: 0.5,
    borderRightColor: 'rgba(255,255,255,0.06)',
    borderRightStyle: 'solid',
  },

  // Corps : fiche blanche posée sur fond clair
  body: {
    paddingTop: '8mm',
    paddingHorizontal: '14mm',
    paddingBottom: '6mm',
  },
  fiche: {
    backgroundColor: COLORS.white,
    borderRadius: 6,
  },
  ficheStripe: {
    height: 4,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  ficheInner: {
    padding: 11,
    flexDirection: 'row',
    gap: 12,
  },
  ficheLeft: {
    width: '34%',
  },
  ficheRight: {
    flex: 1,
  },

  // Colonne gauche : Infos pratiques
  metaTitle: {
    fontSize: 6.5,
    fontWeight: 700,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  metaBlock: {
    marginBottom: 8,
  },
  metaLabel: {
    fontSize: 5.5,
    color: COLORS.label,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 1.5,
    fontWeight: 600,
  },
  metaValue: {
    fontSize: 7.5,
    fontWeight: 600,
    color: COLORS.dark,
    lineHeight: 1.35,
  },
  metaNote: {
    fontSize: 6,
    color: '#7A9AA0',
    marginTop: 1.5,
    lineHeight: 1.35,
  },

  // Bloc Validation (fond sombre)
  validBlock: {
    backgroundColor: COLORS.dark2,
    borderRadius: 4,
    padding: 9,
    marginTop: 7,
  },
  validTitle: {
    fontSize: 6,
    fontWeight: 700,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: COLORS.tealLight,
    marginBottom: 4,
  },
  validText: {
    fontSize: 6.5,
    color: COLORS.muted,
    lineHeight: 1.55,
  },
  validStrong: {
    color: COLORS.text,
    fontWeight: 700,
  },

  // Colonne droite : sections
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 6.5,
    fontWeight: 700,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 4,
    paddingBottom: 2.5,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightBg,
    borderBottomStyle: 'solid',
  },
  paragraph: {
    fontSize: 7,
    color: COLORS.body,
    lineHeight: 1.55,
  },
  list: {
    marginTop: 2,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 1.5,
  },
  listBullet: {
    width: 8,
    fontSize: 8,
    fontWeight: 700,
  },
  listText: {
    flex: 1,
    fontSize: 7,
    color: COLORS.body,
    lineHeight: 1.45,
  },

  // Modules programme (fond bleu pâle, bordure gauche parcours)
  module: {
    backgroundColor: COLORS.moduleBg,
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    paddingLeft: 9,
    marginBottom: 3,
    borderLeftWidth: 2.5,
    borderLeftStyle: 'solid',
  },
  moduleTitle: {
    fontSize: 6.5,
    fontWeight: 700,
    color: COLORS.dark,
    marginBottom: 2,
    letterSpacing: 0.3,
  },
  moduleItem: {
    flexDirection: 'row',
    marginBottom: 0.5,
  },
  moduleBullet: {
    width: 6,
    fontSize: 7,
  },
  moduleText: {
    flex: 1,
    fontSize: 6.5,
    color: COLORS.body,
    lineHeight: 1.45,
  },

  // Bloc références réglementaires
  refBlock: {
    backgroundColor: COLORS.refBg,
    borderRadius: 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderLeftWidth: 2.5,
    borderLeftColor: COLORS.orange,
    borderLeftStyle: 'solid',
    marginTop: 4,
  },
  refStrong: {
    fontWeight: 700,
    color: COLORS.refText,
  },
  refText: {
    fontSize: 6.5,
    color: COLORS.refText,
    lineHeight: 1.5,
  },

  // Tarifs (table compacte)
  tarifsTable: {
    marginTop: 2,
  },
  tarifsRow: {
    flexDirection: 'row',
    paddingVertical: 3,
    paddingHorizontal: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.lightBg,
    borderBottomStyle: 'solid',
    alignItems: 'center',
  },
  tarifsRowHighlight: {
    backgroundColor: COLORS.lightBg,
    borderRadius: 2,
  },
  tarifLabel: {
    flex: 2,
    fontSize: 6.5,
    color: COLORS.dark,
    fontWeight: 600,
  },
  tarifPrice: {
    fontSize: 7,
    fontWeight: 700,
    color: COLORS.dark,
    textAlign: 'right',
  },
  tarifNote: {
    fontSize: 5.8,
    color: COLORS.label,
    marginTop: 1,
  },
  tarifGroup: {
    fontSize: 6,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: COLORS.label,
    marginTop: 5,
    marginBottom: 2,
  },

  // Footer (barre sombre)
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 22,
    backgroundColor: COLORS.dark2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '14mm',
  },
  footerBrand: {
    fontFamily: 'Bebas Neue',
    fontSize: 8,
    letterSpacing: 2.5,
    color: COLORS.tealLight,
  },
  footerInfo: {
    flexDirection: 'row',
    gap: 14,
  },
  footerInfoItem: {
    fontSize: 5.8,
    color: COLORS.muted,
  },
});

// ─────────────────────────────────────
// Helpers
// ─────────────────────────────────────
function renderText(value: string | null | undefined, fallback = '—') {
  return value && value.trim() ? value : fallback;
}

function MetaItem({
  label,
  value,
  note,
}: {
  label: string;
  value: string | null | undefined;
  note?: string | null;
}) {
  if (!value) return null;
  return (
    <View style={s.metaBlock}>
      <Text style={s.metaLabel}>{label}</Text>
      <Text style={s.metaValue}>{value}</Text>
      {note ? <Text style={s.metaNote}>{note}</Text> : null}
    </View>
  );
}

function Bullet({ color, char = '›' }: { color: string; char?: string }) {
  return <Text style={[s.listBullet, { color }]}>{char}</Text>;
}

// ─────────────────────────────────────
// Document
// ─────────────────────────────────────
export function FormationPDF({ formation }: { formation: Formation }) {
  const parcoursMeta = getParcoursMeta(formation.parcours);
  const parcoursColor = getParcoursColor(formation.parcours);
  const {
    titre,
    sousTitre,
    ref,
    infosPratiques: ip,
    publicDetail,
    objectifs,
    programme,
    tarifs = [],
    evaluation,
    referencesReglementaires,
  } = formation;

  // Regroupement des tarifs par "group" pour structurer la table
  const tarifsByGroup: Record<string, typeof tarifs> = {};
  for (const t of tarifs) {
    const key = t.group ?? '';
    if (!tarifsByGroup[key]) tarifsByGroup[key] = [];
    tarifsByGroup[key].push(t);
  }

  return (
    <Document
      title={`${titre}${sousTitre ? ' — ' + sousTitre : ''} — C-KIM Formation`}
      author="C-KIM Formation"
      subject={`Fiche formation ${ref ?? ''}`}
    >
      <Page size="A4" style={s.page}>
        {/* ═══════════════ HEADER ═══════════════ */}
        <View style={[s.header, { backgroundColor: parcoursColor.main }]}>
          {/* Grille décorative */}
          <View style={s.headerGrid}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={i} style={s.headerGridCol} />
            ))}
          </View>

          <Text style={s.headerEyebrow}>
            Parcours {parcoursMeta.label}
            {ref ? ` — ${ref}` : ''}
          </Text>
          <Text style={s.headerTitle}>{titre}</Text>
          {sousTitre ? <Text style={s.headerSubtitle}>{sousTitre}</Text> : null}

          {ref ? <Text style={s.headerRefPill}>RÉF. {ref}</Text> : null}

          {/* Barre dégradée bas (simulée par 3 segments) */}
          <View style={s.headerBarBottom}>
            <View
              style={{
                flexDirection: 'row',
                width: '100%',
                height: '100%',
              }}
            >
              <View style={{ flex: 1, backgroundColor: parcoursColor.light }} />
              <View style={{ flex: 1, backgroundColor: parcoursColor.main }} />
              <View style={{ flex: 1, backgroundColor: COLORS.orange }} />
            </View>
          </View>
        </View>

        {/* ═══════════════ CORPS ═══════════════ */}
        <View style={s.body}>
          <View style={s.fiche}>
            {/* Stripe colorée en haut de la fiche */}
            <View
              style={[s.ficheStripe, { backgroundColor: parcoursColor.main }]}
            />
            <View style={s.ficheInner}>
              {/* ── COLONNE GAUCHE : Infos pratiques + Validation ── */}
              <View style={s.ficheLeft}>
                <Text style={[s.metaTitle, { color: parcoursColor.main }]}>
                  Infos pratiques
                </Text>

                <MetaItem label="Durée" value={ip.duree} />
                <MetaItem
                  label="Public"
                  value={ip.public}
                  note={publicDetail || null}
                />
                <MetaItem label="Prérequis" value={ip.prerequis} />
                <MetaItem label="Prix indicatif" value={ip.prixIndicatif} />
                <MetaItem label="Modalité" value={ip.modalite} />
                <MetaItem label="Inscription" value={ip.inscription} />
                {ip.recyclage ? (
                  <MetaItem label="Recyclage" value={ip.recyclage} />
                ) : null}
                {ref ? <MetaItem label="Référence" value={ref} /> : null}

                {evaluation ? (
                  <View style={s.validBlock}>
                    <Text style={s.validTitle}>Validation</Text>
                    <Text style={s.validText}>{evaluation}</Text>
                  </View>
                ) : null}
              </View>

              {/* ── COLONNE DROITE : Objectifs / Programme / Tarifs / Réf ── */}
              <View style={s.ficheRight}>
                {objectifs ? (
                  <View style={s.section}>
                    <Text
                      style={[s.sectionTitle, { color: parcoursColor.main }]}
                    >
                      Objectifs
                    </Text>
                    <Text style={s.paragraph}>{objectifs}</Text>
                  </View>
                ) : null}

                {programme.length > 0 ? (
                  <View style={s.section}>
                    <Text
                      style={[s.sectionTitle, { color: parcoursColor.main }]}
                    >
                      Programme de formation
                    </Text>
                    {programme.map((mod, i) => (
                      <View
                        key={i}
                        style={[
                          s.module,
                          { borderLeftColor: parcoursColor.main },
                        ]}
                      >
                        <Text style={s.moduleTitle}>{mod.titre}</Text>
                        {mod.points.map((pt, j) => (
                          <View key={j} style={s.moduleItem}>
                            <Text
                              style={[
                                s.moduleBullet,
                                { color: parcoursColor.main },
                              ]}
                            >
                              •
                            </Text>
                            <Text style={s.moduleText}>{pt}</Text>
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                ) : null}

                {tarifs.length > 0 ? (
                  <View style={s.section}>
                    <Text
                      style={[s.sectionTitle, { color: parcoursColor.main }]}
                    >
                      Tarifs
                    </Text>
                    <View style={s.tarifsTable}>
                      {Object.entries(tarifsByGroup).map(([group, items]) => (
                        <View key={group}>
                          {group ? (
                            <Text style={s.tarifGroup}>{group}</Text>
                          ) : null}
                          {items.map((t, i) => (
                            <View
                              key={i}
                              style={
                                t.highlight
                                  ? [s.tarifsRow, s.tarifsRowHighlight]
                                  : s.tarifsRow
                              }
                            >
                              <View style={{ flex: 2 }}>
                                <Text style={s.tarifLabel}>{t.label}</Text>
                                {t.note ? (
                                  <Text style={s.tarifNote}>{t.note}</Text>
                                ) : null}
                              </View>
                              <Text style={s.tarifPrice}>
                                {t.price === null
                                  ? 'Sur devis'
                                  : `${t.price.toLocaleString('fr-FR')} € ${
                                      t.unit ?? 'HT'
                                    }${t.pour ? ` / ${t.pour}` : ''}`}
                              </Text>
                            </View>
                          ))}
                        </View>
                      ))}
                    </View>
                  </View>
                ) : null}

                {referencesReglementaires ? (
                  <View style={s.refBlock}>
                    <Text style={s.refText}>
                      <Text style={s.refStrong}>
                        Références réglementaires :{' '}
                      </Text>
                      {referencesReglementaires}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          </View>
        </View>

        {/* ═══════════════ FOOTER ═══════════════ */}
        <View style={s.footer} fixed>
          <Text style={s.footerBrand}>
            {CKIM_CONTACT.brand} — {parcoursMeta.label.toUpperCase()}
          </Text>
          <View style={s.footerInfo}>
            {ref ? <Text style={s.footerInfoItem}>{ref}</Text> : null}
            <Text style={s.footerInfoItem}>{CKIM_CONTACT.phone}</Text>
            <Text style={s.footerInfoItem}>{CKIM_CONTACT.email}</Text>
            <Text style={s.footerInfoItem}>SIRET {CKIM_CONTACT.siret}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}

// Helper non utilisé directement — exposé pour debug si besoin
export { renderText, Bullet };
