import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { completionScorePct, isBadScore, BAD_SCORE_THRESHOLD, type ScaleQ } from '@/lib/enquetes/alerts';
import type { QuestionType, EnqueteKind } from '@/lib/supabase/types';

const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});

const KIND_LABEL: Record<EnqueteKind, string> = {
  a_chaud: 'À chaud',
  a_froid: 'À froid',
  financeur: 'Financeur',
};

export async function QualiopiAlertsBanner() {
  const supabase = await createClient();

  const { data: completionsRaw } = await supabase
    .from('test_completions')
    .select(`
      id, test_id, inscription_id, inscription_participant_id, completed_at,
      test:tests!inner(id, nom, kind, enquete_kind, formation:formations(titre))
    `)
    .eq('test.kind', 'enquete')
    .not('completed_at', 'is', null)
    .order('completed_at', { ascending: false });

  const completions = (completionsRaw ?? []) as Array<{
    id: string;
    test_id: string;
    inscription_id: string | null;
    inscription_participant_id: string | null;
    completed_at: string;
    test: {
      id: string; nom: string; kind: string; enquete_kind: EnqueteKind | null;
      formation: { titre: string } | { titre: string }[] | null;
    } | Array<{
      id: string; nom: string; kind: string; enquete_kind: EnqueteKind | null;
      formation: { titre: string } | { titre: string }[] | null;
    }>;
  }>;

  if (completions.length === 0) return null;

  const testIds = Array.from(new Set(completions.map((c) => c.test_id)));
  const completionIds = completions.map((c) => c.id);

  const [{ data: questions }, { data: responses }, { data: actions }] = await Promise.all([
    supabase
      .from('questions')
      .select('id, test_id, type_reponse, echelle_max')
      .in('test_id', testIds),
    supabase
      .from('responses')
      .select('completion_id, question_id, valeur')
      .in('completion_id', completionIds),
    supabase
      .from('enquete_actions_correctives')
      .select('completion_id, resolved')
      .in('completion_id', completionIds),
  ]);

  const qById = new Map<string, ScaleQ>();
  for (const q of (questions ?? []) as Array<{ id: string; type_reponse: QuestionType; echelle_max: number | null }>) {
    qById.set(q.id, { type_reponse: q.type_reponse, echelle_max: q.echelle_max });
  }
  const respsByCompletion = new Map<string, Array<{ question_id: string; valeur: string | null }>>();
  for (const r of (responses ?? []) as Array<{ completion_id: string; question_id: string; valeur: string | null }>) {
    const arr = respsByCompletion.get(r.completion_id) ?? [];
    arr.push({ question_id: r.question_id, valeur: r.valeur });
    respsByCompletion.set(r.completion_id, arr);
  }
  const resolvedById = new Map<string, boolean>();
  for (const a of (actions ?? []) as Array<{ completion_id: string; resolved: boolean }>) {
    resolvedById.set(a.completion_id, a.resolved);
  }

  const alertes = completions
    .map((c) => {
      const rs = respsByCompletion.get(c.id) ?? [];
      const score = completionScorePct(rs, qById);
      return { c, score };
    })
    .filter((x) => isBadScore(x.score));

  const openCount = alertes.filter((a) => !resolvedById.get(a.c.id)).length;
  const resolvedCount = alertes.length - openCount;

  // Récupère identité pour le top 3 ouvertes
  const openAlertes = alertes.filter((a) => !resolvedById.get(a.c.id)).slice(0, 3);
  const partIds = new Set<string>();
  const insIds = new Set<string>();
  for (const a of openAlertes) {
    if (a.c.inscription_participant_id) partIds.add(a.c.inscription_participant_id);
    else if (a.c.inscription_id) insIds.add(a.c.inscription_id);
  }
  const [{ data: parts }, { data: insRows }] = await Promise.all([
    partIds.size === 0 ? Promise.resolve({ data: [] }) : supabase
      .from('inscription_participants')
      .select(`
        id,
        employee:employees(prenom, nom),
        profile:profiles!inscription_participants_participant_profile_id_fkey(full_name)
      `)
      .in('id', Array.from(partIds)),
    insIds.size === 0 ? Promise.resolve({ data: [] }) : supabase
      .from('inscriptions')
      .select(`
        id,
        payer:profiles!inscriptions_payer_profile_id_fkey(full_name),
        company:company_details!company_details_profile_id_fkey(raison_sociale)
      `)
      .in('id', Array.from(insIds)),
  ]);

  const nameByPart = new Map<string, string>();
  for (const p of (parts ?? []) as Array<{
    id: string;
    employee: { prenom: string; nom: string } | { prenom: string; nom: string }[] | null;
    profile: { full_name: string } | { full_name: string }[] | null;
  }>) {
    const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
    const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
    if (emp) nameByPart.set(p.id, `${emp.prenom} ${emp.nom}`.trim());
    else if (prof) nameByPart.set(p.id, prof.full_name);
  }
  const nameByIns = new Map<string, string>();
  for (const r of (insRows ?? []) as Array<{
    id: string;
    payer: { full_name: string } | { full_name: string }[] | null;
    company: { raison_sociale: string } | { raison_sociale: string }[] | null;
  }>) {
    const payer = Array.isArray(r.payer) ? r.payer[0] : r.payer;
    const comp = Array.isArray(r.company) ? r.company[0] : r.company;
    nameByIns.set(r.id, comp?.raison_sociale ?? payer?.full_name ?? 'Anonyme');
  }

  const tone = openCount > 0 ? 'orange' : 'teal';
  const borderCls = tone === 'orange' ? 'border-orange/40 bg-orange/5' : 'border-teal/30 bg-teal/5';

  return (
    <section className={`rounded-lg border ${borderCls} p-5 md:p-6`}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <p className={`text-xs uppercase tracking-[0.3em] ${tone === 'orange' ? 'text-orange' : 'text-teal'}`}>
            Qualiopi · Suivi qualité
          </p>
          <h2 className="font-display text-2xl md:text-3xl tracking-wide mt-1">
            {openCount === 0
              ? 'Aucune alerte qualité à traiter'
              : `${openCount} mauvais résultat${openCount > 1 ? 's' : ''} à traiter`}
          </h2>
          <p className="text-sm text-dark/70 mt-1">
            Seuil de détection : score moyen sous {BAD_SCORE_THRESHOLD}% sur les questions d&apos;échelle. {' '}
            <span className="text-dark/50">{resolvedCount} résolue{resolvedCount > 1 ? 's' : ''} au total.</span>
          </p>
        </div>
        <Link
          href="/admin/qualite"
          className={`inline-flex items-center px-5 py-3 rounded text-sm font-semibold uppercase tracking-[0.15em] transition ${
            tone === 'orange'
              ? 'bg-orange text-white hover:bg-orange-l'
              : 'bg-white text-teal border border-teal/30 hover:bg-teal/5'
          }`}
        >
          Gestion des mauvais résultats →
        </Link>
      </div>

      {openAlertes.length > 0 && (
        <ul className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          {openAlertes.map((a) => {
            const t = Array.isArray(a.c.test) ? a.c.test[0] : a.c.test;
            const form = t && (Array.isArray(t.formation) ? t.formation[0] : t.formation);
            const name = (a.c.inscription_participant_id && nameByPart.get(a.c.inscription_participant_id))
              || (a.c.inscription_id && nameByIns.get(a.c.inscription_id))
              || 'Anonyme';
            return (
              <li key={a.c.id}>
                <Link
                  href={`/admin/qualite/${a.c.id}`}
                  className="block bg-white rounded-lg border border-orange/20 p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium truncate">{name}</p>
                    <span className="text-xs px-2 py-0.5 rounded-full font-mono font-medium bg-orange/15 text-orange whitespace-nowrap">
                      {Math.round(a.score ?? 0)}%
                    </span>
                  </div>
                  <p className="text-xs text-dark/60 mt-1 truncate">
                    {t?.enquete_kind && KIND_LABEL[t.enquete_kind]} · {form?.titre ?? '—'}
                  </p>
                  <p className="text-xs text-dark/40 mt-2">{FR_DATETIME.format(new Date(a.c.completed_at))}</p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
