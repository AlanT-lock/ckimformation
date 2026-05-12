import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { FadeUp } from '@/components/motion/FadeUp';
import { createPublicClient } from '@/lib/supabase/public';
import type { SessionAdresse } from '@/lib/supabase/types';

interface Props {
  formationSlug: string;
  color: string;
}

interface SessionRow {
  id: string;
  adresse: SessionAdresse;
  creneaux: { date: string; heure_debut: string; heure_fin: string; ordre: number }[];
}

const FR_DATE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const FR_TIME = (hhmmss: string) => hhmmss.slice(0, 5);

export async function UpcomingSessions({ formationSlug, color }: Props) {
  const supabase = createPublicClient();

  const { data: formation } = await supabase
    .from('formations')
    .select('id')
    .eq('slug', formationSlug)
    .single();
  if (!formation) return null;

  const today = new Date().toISOString().slice(0, 10);

  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, adresse, creneaux:session_creneaux(date, heure_debut, heure_fin, ordre)')
    .eq('formation_id', formation.id)
    .eq('statut', 'published');

  // On garde les sessions qui ont au moins un créneau aujourd'hui ou plus tard.
  const upcoming = ((sessions ?? []) as SessionRow[])
    .map((s) => ({
      ...s,
      creneaux: [...(s.creneaux ?? [])].sort((a, b) => a.ordre - b.ordre),
    }))
    .filter((s) => s.creneaux.some((c) => c.date >= today))
    .sort((a, b) => (a.creneaux[0]?.date ?? '').localeCompare(b.creneaux[0]?.date ?? ''));

  return (
    <section
      id="prochaines-sessions"
      className="bg-light py-20 scroll-mt-24"
      style={{ borderTop: `1px solid ${color}33` }}
    >
      <Container className="max-w-5xl">
        <FadeUp>
          <p className="text-xs uppercase tracking-[0.3em]" style={{ color }}>
            Prochaines sessions
          </p>
          <h2 className="font-display text-3xl md:text-5xl tracking-wide mt-3 leading-[1.05]">
            S&apos;<em className="not-italic" style={{ color }}>inscrire</em>.
          </h2>
        </FadeUp>

        {upcoming.length === 0 ? (
          <FadeUp>
            <p className="mt-8 text-dark/70 leading-relaxed">
              Aucune session n&apos;est programmée pour l&apos;instant.{' '}
              <Link href="/contact" className="underline" style={{ color }}>
                Contactez-nous
              </Link>{' '}
              pour organiser une session sur mesure.
            </p>
          </FadeUp>
        ) : (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((s) => {
              const first = s.creneaux[0];
              const last = s.creneaux[s.creneaux.length - 1];
              const adr = s.adresse ?? {};
              const ville = [adr.ville, adr.code_postal].filter(Boolean).join(' ');
              return (
                <FadeUp key={s.id}>
                  <Link
                    href={`/login?redirect=${encodeURIComponent(`/stagiaire/inscription/${s.id}`)}`}
                    className="block bg-white rounded-lg border border-dark/10 p-6 hover:shadow-xl hover:-translate-y-1 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p
                          className="text-xs uppercase tracking-[0.2em]"
                          style={{ color }}
                        >
                          {first && FR_DATE.format(new Date(first.date))}
                          {last && first && last.date !== first.date && (
                            <> → {FR_DATE.format(new Date(last.date))}</>
                          )}
                        </p>
                        <p className="mt-2 text-sm text-dark/70">
                          {s.creneaux.length} créneau{s.creneaux.length > 1 ? 'x' : ''}
                          {first && (
                            <>
                              {' · '}
                              {FR_TIME(first.heure_debut)}–{FR_TIME(first.heure_fin)}
                              {s.creneaux.length > 1 && ' …'}
                            </>
                          )}
                        </p>
                        {(adr.rue || ville) && (
                          <p className="mt-3 text-sm text-dark/80">
                            {adr.rue && <>{adr.rue}<br /></>}
                            {ville}
                          </p>
                        )}
                      </div>
                      <span
                        className="text-xs uppercase tracking-[0.2em] whitespace-nowrap"
                        style={{ color }}
                      >
                        S&apos;inscrire →
                      </span>
                    </div>
                  </Link>
                </FadeUp>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
