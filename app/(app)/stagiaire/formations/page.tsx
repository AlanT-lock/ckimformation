import Link from 'next/link';
import { PageHeader } from '@/components/app/PageHeader';
import { getAllFormations } from '@/lib/db/formations';
import { PARCOURS_META } from '@/lib/parcours';
import type { Parcours } from '@/lib/types/formation';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { redirectEmployeeStagiaire } from '@/lib/auth/employee-guard';

export default async function StagiaireFormationsCatalogue() {
  redirectEmployeeStagiaire(await getCurrentProfile());
  const supabase = await createClient();
  const formations = await getAllFormations();
  const today = new Date().toISOString().slice(0, 10);

  // Compter les sessions à venir par formation slug
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, formation:formations(slug), creneaux:session_creneaux(date)')
    .eq('statut', 'published');

  const upcomingCount = new Map<string, number>();
  (sessions ?? []).forEach((s) => {
    const f = Array.isArray(s.formation) ? s.formation[0] : s.formation;
    const dates = s.creneaux ?? [];
    if (f?.slug && dates.some((c: { date: string }) => c.date >= today)) {
      upcomingCount.set(f.slug, (upcomingCount.get(f.slug) ?? 0) + 1);
    }
  });

  const grouped = (Object.keys(PARCOURS_META) as Parcours[]).map((key) => ({
    key,
    meta: PARCOURS_META[key],
    items: formations.filter((f) => f.parcours === key),
  }));

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catalogue"
        title="Toutes nos formations"
        description="Choisis une formation pour voir ses sessions à venir et t'inscrire."
      />

      {grouped.map((g) =>
        g.items.length === 0 ? null : (
          <section key={g.key}>
            <div className="flex items-center gap-3 mb-4">
              <span className="h-8 w-1 rounded" style={{ backgroundColor: g.meta.couleur }} />
              <h2 className="font-display text-2xl tracking-wide">{g.meta.label}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {g.items.map((f) => {
                const count = upcomingCount.get(f.slug) ?? 0;
                return (
                  <Link
                    key={f.slug}
                    href={`/stagiaire/formations/${f.slug}`}
                    className="block bg-white rounded-lg border border-dark/10 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs uppercase tracking-[0.2em] font-medium"
                        style={{ color: g.meta.couleur }}
                      >
                        {f.ref}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          count > 0 ? 'bg-teal/10 text-teal' : 'bg-dark/5 text-dark/40'
                        }`}
                      >
                        {count > 0 ? `${count} session${count > 1 ? 's' : ''}` : 'aucune session'}
                      </span>
                    </div>
                    <h3 className="font-display text-xl mt-2 tracking-wide leading-tight">
                      {f.titre}
                    </h3>
                    <p className="text-xs text-dark/60 mt-3">{f.infosPratiques.duree}</p>
                  </Link>
                );
              })}
            </div>
          </section>
        )
      )}
    </div>
  );
}
