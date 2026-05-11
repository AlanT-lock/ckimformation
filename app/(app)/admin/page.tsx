import Link from 'next/link';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function AdminHome() {
  const supabase = await createClient();

  // KPIs en parallèle
  const [
    { count: nbFormations },
    { count: nbSessions },
    { count: nbParticipants },
    { count: nbDemandesEnAttente },
    { data: enquetes },
    { data: envois },
    { data: completionsFroid },
    { data: completionsChaud },
    { data: echelleResponses },
  ] = await Promise.all([
    supabase.from('formations').select('*', { count: 'exact', head: true }).eq('actif', true),
    supabase.from('sessions').select('*', { count: 'exact', head: true }),
    supabase.from('inscription_participants').select('*', { count: 'exact', head: true }),
    supabase.from('inscriptions').select('*', { count: 'exact', head: true }).eq('statut', 'en_attente'),
    supabase
      .from('tests')
      .select('id, nom, enquete_kind, formation:formations(titre)')
      .eq('kind', 'enquete')
      .eq('actif', true)
      .order('created_at', { ascending: false }),
    supabase
      .from('enquete_froid_envois')
      .select('test_id, responded_at'),
    supabase
      .from('test_completions')
      .select('test_id, completed_at, test:tests!inner(enquete_kind)')
      .not('completed_at', 'is', null)
      .eq('test.enquete_kind', 'a_froid'),
    supabase
      .from('test_completions')
      .select('test_id, completed_at, test:tests!inner(enquete_kind)')
      .not('completed_at', 'is', null)
      .eq('test.enquete_kind', 'a_chaud'),
    // Pour le score de satisfaction global : on récupère toutes les réponses
    // d'échelle des enquêtes complétées
    supabase
      .from('responses')
      .select(`
        valeur,
        question:questions!inner(type_reponse, echelle_max, test:tests!inner(kind))
      `)
      .eq('question.type_reponse', 'echelle')
      .eq('question.test.kind', 'enquete'),
  ]);

  // Agrège par enquête
  const enquetesData = (enquetes ?? []).map((e) => {
    const formation = Array.isArray(e.formation) ? e.formation[0] : e.formation;
    const envoisOfTest = (envois ?? []).filter((x) => x.test_id === e.id);
    const completions = e.enquete_kind === 'a_froid'
      ? (completionsFroid ?? []).filter((c) => c.test_id === e.id).length
      : (completionsChaud ?? []).filter((c) => c.test_id === e.id).length;
    const envoyes = envoisOfTest.length;
    const repondus = envoisOfTest.filter((x) => x.responded_at).length;
    return {
      id: e.id,
      nom: e.nom,
      formationTitre: formation?.titre ?? '—',
      kind: e.enquete_kind as 'a_chaud' | 'a_froid' | null,
      completions,
      envoyes,
      repondus,
    };
  });

  // Score de satisfaction global (moyenne normalisée des échelles, 0-100)
  let satisfactionScore: number | null = null;
  const rows = (echelleResponses ?? []) as unknown as Array<{
    valeur: string | null;
    question: { type_reponse: string; echelle_max: number | null } | { type_reponse: string; echelle_max: number | null }[] | null;
  }>;
  const normalized: number[] = [];
  for (const r of rows) {
    const q = Array.isArray(r.question) ? r.question[0] : r.question;
    const max = q?.echelle_max ?? 0;
    const v = r.valeur ? parseFloat(r.valeur) : NaN;
    if (max > 0 && !Number.isNaN(v)) normalized.push((v / max) * 100);
  }
  if (normalized.length > 0) {
    satisfactionScore = Math.round(normalized.reduce((a, b) => a + b, 0) / normalized.length);
  }

  return (
    <div className="space-y-8">
      <PageHeader eyebrow="Administration" title="Tableau de bord" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Stat label="Formations actives" value={nbFormations ?? 0} href="/admin/formations" />
        <Stat label="Sessions" value={nbSessions ?? 0} href="/admin/sessions" />
        <Stat label="Stagiaires inscrits" value={nbParticipants ?? 0} />
        <Stat
          label="Demandes en attente"
          value={nbDemandesEnAttente ?? 0}
          href="/admin/demandes"
          tone={nbDemandesEnAttente ? 'orange' : 'teal'}
        />
      </div>

      <section>
        <div className="flex items-end justify-between gap-3 flex-wrap mb-4">
          <div>
            <h2 className="font-display text-2xl tracking-wide">Analyse des enquêtes de satisfaction</h2>
            <p className="text-xs text-dark/60 mt-1">
              Taux de réponse et score moyen de satisfaction (basé sur les questions d&apos;échelle).
            </p>
          </div>
          {satisfactionScore !== null && (
            <div className="bg-white rounded-lg border border-teal/30 px-5 py-3">
              <p className="text-xs uppercase tracking-[0.2em] text-dark/50">Satisfaction globale</p>
              <p className="font-display text-3xl text-teal mt-1">{satisfactionScore}%</p>
            </div>
          )}
        </div>

        {enquetesData.length === 0 ? (
          <div className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">
            Aucune enquête de satisfaction n&apos;a encore été créée.{' '}
            <Link href="/admin/tests" className="text-teal underline">Configurer une enquête</Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {enquetesData.map((e) => {
              const isFroid = e.kind === 'a_froid';
              const tauxReponse = isFroid && e.envoyes > 0
                ? Math.round((e.repondus / e.envoyes) * 100)
                : null;
              return (
                <li key={e.id} className="bg-white rounded-lg border border-dark/10 p-5">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{e.nom}</p>
                      <p className="text-xs text-dark/60 mt-0.5">{e.formationTitre}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium whitespace-nowrap ${
                      isFroid ? 'bg-dark/10 text-dark/70' : 'bg-orange/10 text-orange'
                    }`}>
                      {isFroid ? 'À froid' : 'À chaud'}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <Metric label="Réponses" value={`${e.completions}`} />
                    {isFroid ? (
                      <Metric
                        label="Taux de réponse"
                        value={tauxReponse !== null ? `${tauxReponse}%` : '—'}
                        sublabel={e.envoyes > 0 ? `${e.repondus} / ${e.envoyes} envois` : 'pas encore envoyée'}
                      />
                    ) : (
                      <Metric label="Type" value="En fin de session" sublabel="déclenchée par le formateur" />
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-dark/10">
                    <Link
                      href={`/admin/tests/${e.id}`}
                      className="text-xs uppercase tracking-[0.15em] text-teal hover:underline"
                    >
                      Configurer →
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({
  label, value, href, tone = 'teal',
}: {
  label: string; value: number; href?: string; tone?: 'teal' | 'orange';
}) {
  const valueColor = tone === 'orange' ? 'text-orange' : 'text-teal';
  const content = (
    <div className="bg-white rounded-lg border border-dark/10 p-4 md:p-6 h-full transition hover:shadow-md">
      <p className="text-xs uppercase tracking-[0.2em] text-dark/50">{label}</p>
      <p className={`font-display text-3xl md:text-5xl mt-2 ${valueColor}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{content}</Link> : content;
}

function Metric({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.15em] text-dark/50">{label}</p>
      <p className="font-display text-2xl mt-1">{value}</p>
      {sublabel && <p className="text-xs text-dark/50 mt-0.5">{sublabel}</p>}
    </div>
  );
}
