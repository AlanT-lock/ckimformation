import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { Accordion } from '@/components/ui/Accordion';
import { getFormationBySlug } from '@/lib/db/formations';
import { getParcoursMeta } from '@/lib/parcours';
import { createClient } from '@/lib/supabase/server';
import type { TarifTier } from '@/lib/types/formation';

interface PageProps { params: Promise<{ slug: string }> }

const FR_DATE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
const FR_TIME = (h: string) => h.slice(0, 5);
const FR_NUMBER = new Intl.NumberFormat('fr-FR');

export default async function StagiaireFormationDetail({ params }: PageProps) {
  const { slug } = await params;
  const formation = await getFormationBySlug(slug);
  if (!formation) notFound();
  const meta = getParcoursMeta(formation.parcours);

  const supabase = await createClient();
  const { data: dbForm } = await supabase
    .from('formations')
    .select('id')
    .eq('slug', slug)
    .single();

  let upcoming: {
    id: string;
    creneaux: { date: string; heure_debut: string; heure_fin: string; ordre: number }[];
    adresse: { ville?: string; code_postal?: string; rue?: string };
  }[] = [];

  if (dbForm) {
    const today = new Date().toISOString().slice(0, 10);
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, adresse, creneaux:session_creneaux(date, heure_debut, heure_fin, ordre)')
      .eq('formation_id', dbForm.id)
      .eq('statut', 'published');

    upcoming = (sessions ?? [])
      .map((s) => ({
        id: s.id,
        adresse: s.adresse as typeof upcoming[0]['adresse'],
        creneaux: [...(s.creneaux ?? [])].sort((a, b) => a.ordre - b.ordre),
      }))
      .filter((s) => s.creneaux.some((c) => c.date >= today))
      .sort((a, b) => (a.creneaux[0]?.date ?? '').localeCompare(b.creneaux[0]?.date ?? ''));
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow={`${meta.label} · ${formation.ref}`}
        title={formation.titre}
        description={formation.sousTitre ?? undefined}
        actions={
          <ButtonLink href="/stagiaire/formations" variant="secondary">← Catalogue</ButtonLink>
        }
      />

      {/* Infos pratiques en cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
        <Info label="Durée">{formation.infosPratiques.duree}</Info>
        <Info label="Public">{formation.infosPratiques.public}</Info>
        <Info label="Prérequis">{formation.infosPratiques.prerequis}</Info>
        <Info label="Modalité">{formation.infosPratiques.modalite}</Info>
        <Info label="Inscription">{formation.infosPratiques.inscription}</Info>
        {formation.infosPratiques.recyclage && (
          <Info label="Recyclage">{formation.infosPratiques.recyclage}</Info>
        )}
      </div>

      {/* Objectifs */}
      <section className="bg-white rounded-lg border border-dark/10 p-6">
        <h2 className="font-display text-2xl tracking-wide" style={{ color: meta.couleur }}>Objectifs</h2>
        <p className="mt-3 text-sm md:text-base text-dark/80 leading-relaxed">{formation.objectifs}</p>
      </section>

      {/* Programme — Accordion */}
      <section>
        <h2 className="font-display text-2xl tracking-wide" style={{ color: meta.couleur }}>Programme</h2>
        <p className="text-xs text-dark/60 mt-1">Cliquez pour déplier chaque module.</p>
        <div className="mt-4">
          <Accordion items={formation.programme} color={meta.couleur} />
        </div>
      </section>

      {/* Public détaillé / Prérequis */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-dark/10 p-6">
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: meta.couleur }}>Public visé</p>
          <h3 className="font-display text-xl mt-2">Pour qui&nbsp;?</h3>
          <p className="mt-3 text-sm text-dark/80 leading-relaxed">
            {formation.publicDetail || formation.infosPratiques.public}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-dark/10 p-6">
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: meta.couleur }}>Prérequis</p>
          <h3 className="font-display text-xl mt-2">Avant la formation</h3>
          <p className="mt-3 text-sm text-dark/80 leading-relaxed">{formation.infosPratiques.prerequis}</p>
        </div>
      </section>

      {/* Évaluation */}
      <section className="bg-white rounded-lg border border-dark/10 p-6">
        <h2 className="font-display text-2xl tracking-wide" style={{ color: meta.couleur }}>
          Modalités d&apos;évaluation
        </h2>
        <p className="mt-3 text-sm md:text-base text-dark/80 leading-relaxed">{formation.evaluation}</p>
      </section>

      {/* Références réglementaires */}
      <section
        className="bg-light rounded-lg border-l-4 p-6"
        style={{ borderColor: meta.couleur }}
      >
        <p className="text-xs uppercase tracking-[0.2em]" style={{ color: meta.couleur }}>Cadre légal</p>
        <h3 className="font-display text-xl mt-2">Références réglementaires</h3>
        <p className="mt-3 text-sm text-dark/80 leading-relaxed">{formation.referencesReglementaires}</p>
      </section>

      {/* Tarifs */}
      <Tarifs tarifs={formation.tarifs ?? []} color={meta.couleur} />

      {/* Prochaines sessions */}
      <section>
        <h2 className="font-display text-2xl tracking-wide" style={{ color: meta.couleur }}>Prochaines sessions</h2>
        <div className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <p className="bg-white border border-dark/10 rounded-lg p-6 text-sm text-dark/60">
              Aucune session programmée pour l&apos;instant.{' '}
              <Link href="/contact" className="text-teal underline">Demander une session sur mesure</Link>.
            </p>
          ) : (
            upcoming.map((s) => {
              const first = s.creneaux[0];
              const last = s.creneaux[s.creneaux.length - 1];
              const ville = [s.adresse?.ville, s.adresse?.code_postal].filter(Boolean).join(' ');
              return (
                <Link
                  key={s.id}
                  href={`/stagiaire/inscription/${s.id}`}
                  className="block bg-white border border-dark/10 rounded-lg p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs uppercase tracking-[0.2em]" style={{ color: meta.couleur }}>
                        {first && FR_DATE.format(new Date(first.date))}
                        {last && first && last.date !== first.date && (
                          <> → {FR_DATE.format(new Date(last.date))}</>
                        )}
                      </p>
                      <p className="mt-1 text-sm text-dark/70">
                        {s.creneaux.length} créneau{s.creneaux.length > 1 ? 'x' : ''}
                        {first && <> · {FR_TIME(first.heure_debut)}–{FR_TIME(first.heure_fin)}</>}
                      </p>
                      {(s.adresse?.rue || ville) && (
                        <p className="mt-2 text-sm text-dark/80">
                          {s.adresse?.rue && <>{s.adresse.rue} · </>}{ville}
                        </p>
                      )}
                    </div>
                    <span className="text-xs uppercase tracking-[0.2em] whitespace-nowrap" style={{ color: meta.couleur }}>
                      S&apos;inscrire →
                    </span>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-dark/10 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-dark/50">{label}</p>
      <p className="mt-1 text-dark/80">{children}</p>
    </div>
  );
}

function formatPrice(t: TarifTier): { main: string; sub: string | null } {
  if (t.price === null || t.price === undefined) {
    return { main: t.note ?? 'Sur devis', sub: null };
  }
  return { main: `${FR_NUMBER.format(t.price)} €`, sub: t.unit ?? 'HT' };
}

function Tarifs({ tarifs, color }: { tarifs: TarifTier[]; color: string }) {
  if (!tarifs || tarifs.length === 0) {
    return (
      <section className="bg-white rounded-lg border border-dark/10 p-6">
        <h2 className="font-display text-2xl tracking-wide" style={{ color }}>Tarif</h2>
        <p className="mt-3 text-sm text-dark/80 leading-relaxed">
          Cette formation est <strong>sur devis</strong>. Selon le format (intra-entreprise, individuel ou collectif),
          nous établissons une proposition personnalisée.
        </p>
        <Link
          href="/contact"
          className="inline-block mt-4 text-sm font-medium text-white px-5 py-2.5 rounded transition hover:opacity-90"
          style={{ backgroundColor: color }}
        >
          Demander un devis →
        </Link>
      </section>
    );
  }

  // Regroupement par "group" (formations multi-modes)
  const groups = new Map<string | null, TarifTier[]>();
  for (const t of tarifs) {
    const key = t.group ?? null;
    const arr = groups.get(key) ?? [];
    arr.push(t);
    groups.set(key, arr);
  }
  const hasMultipleGroups = groups.size > 1;

  return (
    <section>
      <h2 className="font-display text-2xl tracking-wide" style={{ color }}>Tarifs 2026</h2>
      <p className="text-xs text-dark/60 mt-1">Tarifs HT — TVA non applicable (Art. 261-4-4° du CGI).</p>

      <div className="mt-4 space-y-6">
        {Array.from(groups.entries()).map(([groupName, tiers]) => (
          <div key={groupName ?? 'default'}>
            {hasMultipleGroups && groupName && (
              <h3 className="font-display text-lg mb-3" style={{ color }}>{groupName}</h3>
            )}
            <div className={`grid gap-3 ${tiers.length === 1 ? 'grid-cols-1 sm:max-w-md' : tiers.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
              {tiers.map((t, i) => {
                const { main, sub } = formatPrice(t);
                const isSurDevis = t.price === null || t.price === undefined;
                return (
                  <div
                    key={`${groupName}-${i}`}
                    className="relative rounded-lg border border-dark/10 bg-white p-5 overflow-hidden"
                  >
                    <div className="absolute inset-x-0 top-0 h-[3px]" style={{ backgroundColor: color }} />
                    <p className="text-xs uppercase tracking-[0.2em] font-semibold text-dark/50">{t.label}</p>
                    <div className="mt-3 flex items-baseline gap-2">
                      <span
                        className="font-display tracking-tight leading-none"
                        style={{ fontSize: isSurDevis ? '1.5rem' : '2.25rem' }}
                      >
                        {main}
                      </span>
                      {sub && <span className="text-xs font-medium text-dark/50">{sub}</span>}
                    </div>
                    {t.pour && <p className="mt-1 text-xs text-dark/60">par {t.pour}</p>}
                    {t.note && (
                      <p className="mt-4 pt-3 border-t border-dark/10 text-xs leading-relaxed text-dark/65">
                        {t.note}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs text-dark/50">
        Inclus dans le tarif&nbsp;: déplacement sur site, matériel pédagogique, attestations, certification Qualiopi.
      </p>
    </section>
  );
}
