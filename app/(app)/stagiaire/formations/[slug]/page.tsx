import { notFound } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { getFormationBySlug } from '@/lib/db/formations';
import { getParcoursMeta } from '@/lib/parcours';
import { createClient } from '@/lib/supabase/server';

interface PageProps { params: Promise<{ slug: string }> }

const FR_DATE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
});
const FR_TIME = (h: string) => h.slice(0, 5);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <Info label="Durée">{formation.infosPratiques.duree}</Info>
        <Info label="Public">{formation.infosPratiques.public}</Info>
        <Info label="Prérequis">{formation.infosPratiques.prerequis}</Info>
      </div>

      <section className="bg-white rounded-lg border border-dark/10 p-6">
        <h2 className="font-display text-2xl tracking-wide">Objectifs</h2>
        <p className="mt-2 text-sm text-dark/80 leading-relaxed">{formation.objectifs}</p>
      </section>

      <section>
        <h2 className="font-display text-2xl tracking-wide">Prochaines sessions</h2>
        <div className="mt-4 space-y-3">
          {upcoming.length === 0 ? (
            <p className="bg-white border border-dark/10 rounded-lg p-6 text-sm text-dark/60">
              Aucune session programmée pour l&apos;instant.{' '}
              <Link href="/contact" className="text-teal underline">Demande une session sur mesure</Link>.
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
                  <div className="flex items-start justify-between gap-4">
                    <div>
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
