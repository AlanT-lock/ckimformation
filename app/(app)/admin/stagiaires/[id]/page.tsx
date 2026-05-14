import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import type { QuestionType } from '@/lib/supabase/types';
import { completionScorePct, type ScaleQ } from '@/lib/enquetes/alerts';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

type Tab = 'infos' | 'inscriptions' | 'tests' | 'enquetes' | 'mails';

const TABS: { value: Tab; label: string }[] = [
  { value: 'infos',        label: 'Informations' },
  { value: 'inscriptions', label: 'Inscriptions' },
  { value: 'tests',        label: 'Résultats tests' },
  { value: 'enquetes',     label: 'Enquêtes de satisfaction' },
  { value: 'mails',        label: 'Logs emails' },
];

export default async function AdminStagiaireDetailPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  const me = await getCurrentProfile();
  if (!me || me.role !== 'admin') redirect('/login');
  const tab: Tab = (TABS.find((t) => t.value === sp.tab)?.value) ?? 'infos';

  const supabase = await createClient();

  // 1. Profile + extensions
  const { data: prof } = await supabase
    .from('profiles')
    .select(`
      id, full_name, email, phone, role, account_type, employer_profile_id, created_at,
      company:company_details!company_details_profile_id_fkey(raison_sociale, siret, tva_intra, contact_fonction)
    `)
    .eq('id', id)
    .single();

  if (!prof) notFound();

  const company = Array.isArray(prof.company) ? prof.company[0] : prof.company;

  // 2. Employeur (si salarié)
  let employer: { id: string; full_name: string; email: string; company: string | null } | null = null;
  if (prof.employer_profile_id) {
    const { data: emp } = await supabase
      .from('profiles')
      .select(`
        id, full_name, email,
        company:company_details!company_details_profile_id_fkey(raison_sociale)
      `)
      .eq('id', prof.employer_profile_id)
      .single();
    if (emp) {
      const c = Array.isArray(emp.company) ? emp.company[0] : emp.company;
      employer = { id: emp.id, full_name: emp.full_name, email: emp.email, company: c?.raison_sociale ?? null };
    }
  }

  // 3. Employee fiches (le profile peut être le profile_id d'employees)
  const { data: employeeRows } = await supabase
    .from('employees')
    .select('id')
    .eq('profile_id', id);
  const employeeIds = (employeeRows ?? []).map((e) => e.id);

  // 4. Inscription participants liés au profile (soit participant_profile_id, soit via employees)
  let participantsQuery = supabase
    .from('inscription_participants')
    .select(`
      id, inscription_id, employee_id, participant_profile_id, created_at,
      inscription:inscriptions(
        id, statut, session:sessions(
          id, formation:formations(slug, titre),
          creneaux:session_creneaux(date)
        )
      )
    `);

  if (employeeIds.length > 0) {
    participantsQuery = participantsQuery.or(`participant_profile_id.eq.${id},employee_id.in.(${employeeIds.join(',')})`);
  } else {
    participantsQuery = participantsQuery.eq('participant_profile_id', id);
  }

  const { data: participants } = await participantsQuery;
  const participantIds = (participants ?? []).map((p) => p.id);

  // 5. Test completions (quiz + enquêtes) de ce stagiaire
  const { data: completionsRaw } = participantIds.length === 0 ? { data: [] } : await supabase
    .from('test_completions')
    .select(`
      id, test_id, inscription_id, inscription_participant_id, started_at, completed_at,
      test:tests(id, nom, kind, enquete_kind, formation:formations(titre))
    `)
    .in('inscription_participant_id', participantIds)
    .order('completed_at', { ascending: false });

  const completions = (completionsRaw ?? []) as Array<{
    id: string; test_id: string; inscription_id: string | null;
    inscription_participant_id: string | null;
    started_at: string; completed_at: string | null;
    test: {
      id: string; nom: string; kind: string;
      enquete_kind: string | null;
      formation: { titre: string } | { titre: string }[] | null;
    } | Array<{
      id: string; nom: string; kind: string; enquete_kind: string | null;
      formation: { titre: string } | { titre: string }[] | null;
    }>;
  }>;

  // 6. Questions + Responses pour calculer scores
  const completionIds = completions.map((c) => c.id);
  const testIds = Array.from(new Set(completions.map((c) => c.test_id)));
  const [{ data: questions }, { data: responses }] = await Promise.all([
    testIds.length === 0 ? Promise.resolve({ data: [] }) : supabase
      .from('questions')
      .select('id, test_id, type_reponse, echelle_max, bonne_reponse, options')
      .in('test_id', testIds),
    completionIds.length === 0 ? Promise.resolve({ data: [] }) : supabase
      .from('responses')
      .select('completion_id, question_id, valeur, valeur_json')
      .in('completion_id', completionIds),
  ]);

  const qById = new Map<string, ScaleQ & { test_id: string; bonne_reponse: unknown; options: unknown }>();
  for (const q of (questions ?? []) as Array<{
    id: string; test_id: string; type_reponse: QuestionType; echelle_max: number | null;
    bonne_reponse: unknown; options: unknown;
  }>) {
    qById.set(q.id, {
      test_id: q.test_id,
      type_reponse: q.type_reponse,
      echelle_max: q.echelle_max,
      bonne_reponse: q.bonne_reponse,
      options: q.options,
    });
  }

  const respsByCompletion = new Map<string, Array<{ question_id: string; valeur: string | null; valeur_json: unknown }>>();
  for (const r of (responses ?? []) as Array<{ completion_id: string; question_id: string; valeur: string | null; valeur_json: unknown }>) {
    const arr = respsByCompletion.get(r.completion_id) ?? [];
    arr.push({ question_id: r.question_id, valeur: r.valeur, valeur_json: r.valeur_json });
    respsByCompletion.set(r.completion_id, arr);
  }

  // 7. Logs emails — uniquement quand le stagiaire est destinataire
  const { data: emailLogs } = await supabase
    .from('email_logs')
    .select('id, kind, to_email, subject, status, error_message, sent_at, is_reminder, reminder_number, metadata')
    .or(`to_profile_id.eq.${id},to_email.eq.${prof.email}`)
    .order('sent_at', { ascending: false })
    .limit(200);

  // 8. Inscriptions où le stagiaire est PAYER (cas entreprise — pour enquêtes financeur)
  const { data: payerInscriptions } = await supabase
    .from('inscriptions')
    .select(`
      id, statut, created_at,
      session:sessions(formation:formations(titre))
    `)
    .eq('payer_profile_id', id)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stagiaire"
        title={prof.full_name || '—'}
        description={`${prof.email}${prof.phone ? ` · ${prof.phone}` : ''}`}
        actions={<ButtonLink href="/admin/stagiaires" variant="secondary">← Liste</ButtonLink>}
      />

      {/* Onglets */}
      <nav className="border-b border-dark/10 flex gap-1 flex-wrap">
        {TABS.map((t) => {
          const active = tab === t.value;
          const href = `/admin/stagiaires/${id}${t.value === 'infos' ? '' : `?tab=${t.value}`}`;
          return (
            <Link
              key={t.value}
              href={href}
              className={`px-4 py-2 text-sm uppercase tracking-[0.15em] font-medium border-b-2 -mb-px transition ${
                active ? 'border-teal text-teal' : 'border-transparent text-dark/50 hover:text-dark'
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>

      {tab === 'infos' && (
        <InfosSection
          prof={prof}
          company={company}
          employer={employer}
        />
      )}

      {tab === 'inscriptions' && (
        <InscriptionsSection
          asParticipant={(participants ?? []) as ParticipantRow[]}
          asPayer={(payerInscriptions ?? []) as PayerInscriptionRow[]}
        />
      )}

      {tab === 'tests' && (
        <TestsSection
          completions={completions.filter((c) => testKind(c) === 'quiz' && c.completed_at !== null)}
          qById={qById}
          respsByCompletion={respsByCompletion}
        />
      )}

      {tab === 'enquetes' && (
        <EnquetesSection
          completions={completions.filter((c) => testKind(c) === 'enquete' && c.completed_at !== null)}
          qById={qById}
          respsByCompletion={respsByCompletion}
        />
      )}

      {tab === 'mails' && (
        <MailsSection logs={(emailLogs ?? []) as EmailLogRow[]} />
      )}
    </div>
  );
}

function testKind(c: { test: unknown }): string {
  const t = Array.isArray(c.test) ? c.test[0] : c.test;
  return (t as { kind?: string } | null)?.kind ?? '';
}

// =================== Sections ===================

function InfosSection({
  prof, company, employer,
}: {
  prof: { id: string; full_name: string; email: string; phone: string | null; account_type: 'particulier' | 'entreprise' | null; role: string; created_at: string | null };
  company: { raison_sociale: string; siret: string | null; tva_intra: string | null; contact_fonction: string | null } | null;
  employer: { id: string; full_name: string; email: string; company: string | null } | null;
}) {
  return (
    <section className="grid lg:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-dark/10 p-6">
        <h2 className="font-display text-xl mb-3">Identité</h2>
        <dl className="text-sm space-y-1">
          <Row k="Nom complet" v={prof.full_name || '—'} />
          <Row k="Email" v={prof.email} />
          <Row k="Téléphone" v={prof.phone || '—'} />
          <Row k="Rôle" v={prof.role} />
          <Row k="Type de compte" v={prof.account_type === 'entreprise' ? 'Entreprise' : prof.account_type === 'particulier' ? 'Particulier' : '—'} />
          <Row k="Compte créé le" v={prof.created_at ? FR_DATE.format(new Date(prof.created_at)) : '—'} />
        </dl>
      </div>

      {company ? (
        <div className="bg-white rounded-lg border border-dark/10 p-6">
          <h2 className="font-display text-xl mb-3">Société (financeur)</h2>
          <dl className="text-sm space-y-1">
            <Row k="Raison sociale" v={company.raison_sociale} />
            {company.siret && <Row k="SIRET" v={company.siret} />}
            {company.tva_intra && <Row k="TVA intra." v={company.tva_intra} />}
            {company.contact_fonction && <Row k="Fonction" v={company.contact_fonction} />}
          </dl>
        </div>
      ) : employer ? (
        <div className="bg-white rounded-lg border border-dark/10 p-6">
          <h2 className="font-display text-xl mb-3">Employeur</h2>
          <dl className="text-sm space-y-1">
            <Row k="Société" v={employer.company ?? employer.full_name} />
            <Row k="Contact" v={employer.full_name} />
            <Row k="Email contact" v={employer.email} />
          </dl>
          <Link href={`/admin/stagiaires/${employer.id}`} className="mt-3 inline-block text-xs uppercase tracking-[0.15em] text-teal hover:underline">
            Voir l&apos;employeur →
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">
          Pas d&apos;employeur ni de société rattachée.
        </div>
      )}
    </section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="inline text-dark/60">{k} : </dt>
      <dd className="inline">{v}</dd>
    </div>
  );
}

interface ParticipantRow {
  id: string;
  inscription_id: string;
  employee_id: string | null;
  participant_profile_id: string | null;
  created_at: string;
  inscription: {
    id: string; statut: string;
    session: {
      id: string;
      formation: { slug: string; titre: string } | { slug: string; titre: string }[] | null;
      creneaux: Array<{ date: string }>;
    } | Array<{
      id: string;
      formation: { slug: string; titre: string } | { slug: string; titre: string }[] | null;
      creneaux: Array<{ date: string }>;
    }> | null;
  } | Array<{
    id: string; statut: string;
    session: {
      id: string;
      formation: { slug: string; titre: string } | { slug: string; titre: string }[] | null;
      creneaux: Array<{ date: string }>;
    } | Array<{
      id: string;
      formation: { slug: string; titre: string } | { slug: string; titre: string }[] | null;
      creneaux: Array<{ date: string }>;
    }> | null;
  }> | null;
}

interface PayerInscriptionRow {
  id: string;
  statut: string;
  created_at: string;
  session: {
    formation: { titre: string } | { titre: string }[] | null;
  } | Array<{
    formation: { titre: string } | { titre: string }[] | null;
  }> | null;
}

const STATUT_TONE: Record<string, string> = {
  en_attente:         'bg-orange/10 text-orange',
  documents_demandes: 'bg-orange/15 text-orange',
  documents_recus:    'bg-teal/10 text-teal',
  confirmee:          'bg-teal/10 text-teal',
  refusee:            'bg-dark/10 text-dark/60',
};

function InscriptionsSection({ asParticipant, asPayer }: { asParticipant: ParticipantRow[]; asPayer: PayerInscriptionRow[] }) {
  return (
    <div className="space-y-6">
      <section>
        <h2 className="font-display text-xl mb-3">En tant que stagiaire ({asParticipant.length})</h2>
        {asParticipant.length === 0 ? (
          <div className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">Aucune inscription en tant que stagiaire.</div>
        ) : (
          <ul className="space-y-2">
            {asParticipant.map((p) => {
              const ins = Array.isArray(p.inscription) ? p.inscription[0] : p.inscription;
              const sess = ins && (Array.isArray(ins.session) ? ins.session[0] : ins.session);
              const form = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);
              const dates = (sess?.creneaux ?? []).map((c) => c.date).sort();
              const last = dates[dates.length - 1];
              const tone = ins ? STATUT_TONE[ins.statut] ?? 'bg-dark/10 text-dark/60' : 'bg-dark/10 text-dark/60';
              return (
                <li key={p.id} className="bg-white rounded-lg border border-dark/10 p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium">{form?.titre ?? 'Formation'}</p>
                      {last && <p className="text-xs text-dark/60 mt-0.5">Dernière séance : {FR_DATE.format(new Date(last))}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium ${tone}`}>{ins?.statut ?? '—'}</span>
                      {ins && (
                        <Link href={`/admin/demandes/${ins.id}`} className="text-xs uppercase tracking-[0.15em] text-teal hover:underline">
                          Voir →
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {asPayer.length > 0 && (
        <section>
          <h2 className="font-display text-xl mb-3">En tant que payeur / financeur ({asPayer.length})</h2>
          <ul className="space-y-2">
            {asPayer.map((p) => {
              const sess = Array.isArray(p.session) ? p.session[0] : p.session;
              const form = sess && (Array.isArray(sess.formation) ? sess.formation[0] : sess.formation);
              const tone = STATUT_TONE[p.statut] ?? 'bg-dark/10 text-dark/60';
              return (
                <li key={p.id} className="bg-white rounded-lg border border-dark/10 p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="font-medium">{form?.titre ?? 'Formation'}</p>
                      <p className="text-xs text-dark/60 mt-0.5">Demande créée le {FR_DATE.format(new Date(p.created_at))}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium ${tone}`}>{p.statut}</span>
                      <Link href={`/admin/demandes/${p.id}`} className="text-xs uppercase tracking-[0.15em] text-teal hover:underline">Voir →</Link>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

type CompletionLite = {
  id: string; test_id: string; completed_at: string | null;
  test: unknown;
};

function TestsSection({
  completions, qById, respsByCompletion,
}: {
  completions: CompletionLite[];
  qById: Map<string, ScaleQ & { test_id: string; bonne_reponse: unknown; options: unknown }>;
  respsByCompletion: Map<string, Array<{ question_id: string; valeur: string | null; valeur_json: unknown }>>;
}) {
  if (completions.length === 0) {
    return <div className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">Aucun test (quiz) complété.</div>;
  }
  return (
    <ul className="space-y-2">
      {completions.map((c) => {
        const t = Array.isArray(c.test) ? c.test[0] : c.test;
        const test = t as { id: string; nom: string; formation: { titre: string } | { titre: string }[] | null } | null;
        const form = test && (Array.isArray(test.formation) ? test.formation[0] : test.formation);
        const resps = respsByCompletion.get(c.id) ?? [];
        const score = quizScore(resps, qById, c.test_id);
        return (
          <li key={c.id} className="bg-white rounded-lg border border-dark/10 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-medium">{test?.nom ?? 'Test'}</p>
                {form?.titre && <p className="text-xs text-dark/60 mt-0.5">{form.titre}</p>}
                {c.completed_at && <p className="text-xs text-dark/50 mt-1">Complété le {FR_DATETIME.format(new Date(c.completed_at))}</p>}
              </div>
              <div className="text-right">
                {score !== null ? (
                  <p className="font-display text-2xl text-teal">{score.correct} / {score.total}</p>
                ) : (
                  <p className="text-xs text-dark/40">Score non calculable</p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function quizScore(
  responses: Array<{ question_id: string; valeur: string | null; valeur_json: unknown }>,
  qById: Map<string, ScaleQ & { bonne_reponse: unknown; test_id: string }>,
  testId: string,
): { correct: number; total: number } | null {
  let total = 0;
  let correct = 0;
  for (const r of responses) {
    const q = qById.get(r.question_id);
    if (!q || q.test_id !== testId) continue;
    if (q.type_reponse !== 'qcm_unique' && q.type_reponse !== 'qcm_multiple') continue;
    total++;
    if (q.type_reponse === 'qcm_unique') {
      const expected = typeof q.bonne_reponse === 'string' ? q.bonne_reponse : null;
      const got = (r.valeur_json as { value?: string | null } | null)?.value ?? null;
      if (expected && got === expected) correct++;
    } else {
      const exp = Array.isArray(q.bonne_reponse) ? (q.bonne_reponse as string[]) : [];
      const got = (r.valeur_json as { values?: string[] } | null)?.values ?? [];
      const allOk = exp.length === got.length && exp.every((v) => got.includes(v));
      if (allOk && exp.length > 0) correct++;
    }
  }
  if (total === 0) return null;
  return { correct, total };
}

function EnquetesSection({
  completions, qById, respsByCompletion,
}: {
  completions: CompletionLite[];
  qById: Map<string, ScaleQ & { test_id: string; bonne_reponse: unknown; options: unknown }>;
  respsByCompletion: Map<string, Array<{ question_id: string; valeur: string | null; valeur_json: unknown }>>;
}) {
  if (completions.length === 0) {
    return <div className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">Aucune enquête de satisfaction complétée.</div>;
  }
  return (
    <ul className="space-y-2">
      {completions.map((c) => {
        const t = Array.isArray(c.test) ? c.test[0] : c.test;
        const test = t as { id: string; nom: string; enquete_kind: string | null; formation: { titre: string } | { titre: string }[] | null } | null;
        const form = test && (Array.isArray(test.formation) ? test.formation[0] : test.formation);
        const resps = respsByCompletion.get(c.id) ?? [];
        const score = completionScorePct(
          resps.map((r) => ({ question_id: r.question_id, valeur: r.valeur })),
          qById
        );
        const kindLabel = test?.enquete_kind === 'a_chaud' ? 'À chaud'
          : test?.enquete_kind === 'a_froid' ? 'À froid'
          : test?.enquete_kind === 'financeur' ? 'Financeur' : '—';
        const isBad = score !== null && score < 50;
        return (
          <li key={c.id} className="bg-white rounded-lg border border-dark/10 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-medium">{test?.nom ?? 'Enquête'}</p>
                <p className="text-xs text-dark/60 mt-0.5">
                  {kindLabel}{form?.titre ? ` · ${form.titre}` : ''}
                </p>
                {c.completed_at && <p className="text-xs text-dark/50 mt-1">Répondue le {FR_DATETIME.format(new Date(c.completed_at))}</p>}
              </div>
              <div className="text-right">
                <p className={`font-display text-2xl ${isBad ? 'text-orange' : 'text-teal'}`}>
                  {score === null ? '—' : `${Math.round(score)}%`}
                </p>
                {test && (
                  <Link href={`/admin/tests/${test.id}/resultats`} className="text-xs uppercase tracking-[0.15em] text-teal hover:underline">
                    Détail enquête →
                  </Link>
                )}
                {isBad && (
                  <Link href={`/admin/qualite/${c.id}`} className="block mt-1 text-xs uppercase tracking-[0.15em] text-orange hover:underline">
                    ⚠ Traiter l&apos;alerte →
                  </Link>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

interface EmailLogRow {
  id: string;
  kind: string;
  to_email: string;
  subject: string;
  status: string;
  error_message: string | null;
  sent_at: string;
  is_reminder: boolean;
  reminder_number: number | null;
  metadata: Record<string, unknown> | null;
}

function MailsSection({ logs }: { logs: EmailLogRow[] }) {
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">
        Aucun email de satisfaction envoyé à cette adresse.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-dark/60">
        {logs.length} mail{logs.length > 1 ? 's' : ''} envoyé{logs.length > 1 ? 's' : ''} — enquêtes à froid et financeur uniquement.
      </p>
      <ul className="space-y-2">
        {logs.map((l) => (
          <li key={l.id} className="bg-white rounded-lg border border-dark/10 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <KindBadge kind={l.kind} />
                  {l.is_reminder && (
                    <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-dark/10 text-dark/60">
                      Relance {l.reminder_number ?? ''}
                    </span>
                  )}
                  <StatusBadge status={l.status} />
                </div>
                <p className="font-medium mt-1.5">{l.subject}</p>
                <p className="text-xs text-dark/60 mt-0.5">à {l.to_email}</p>
                {l.error_message && (
                  <p className="text-xs text-orange mt-1">Erreur : {l.error_message}</p>
                )}
              </div>
              <span className="text-xs text-dark/40 whitespace-nowrap">
                {FR_DATETIME.format(new Date(l.sent_at))}
              </span>
            </div>
            {l.metadata && Object.keys(l.metadata).length > 0 && (
              <details className="mt-2 text-xs">
                <summary className="cursor-pointer text-dark/40 hover:text-dark/60">Métadonnées</summary>
                <pre className="mt-1 p-2 bg-light/50 rounded overflow-x-auto text-dark/70">
                  {JSON.stringify(l.metadata, null, 2)}
                </pre>
              </details>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function KindBadge({ kind }: { kind: string }) {
  if (kind === 'enquete_froid') return <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-teal/10 text-teal">Enquête à froid</span>;
  if (kind === 'enquete_financeur') return <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-orange/10 text-orange">Enquête financeur</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-dark/10 text-dark/60">{kind}</span>;
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'sent') return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-teal/10 text-teal">Envoyé</span>;
  if (status === 'failed') return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-orange/15 text-orange">Échec</span>;
  return <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-dark/10 text-dark/60">{status}</span>;
}
