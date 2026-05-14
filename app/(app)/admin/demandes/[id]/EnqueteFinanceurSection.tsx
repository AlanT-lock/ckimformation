import { createAdminClient } from '@/lib/supabase/admin';
import type { QuestionType } from '@/lib/supabase/types';

interface Props {
  inscriptionId: string;
  payerIsEntreprise: boolean;
}

const FR_DATETIME = new Intl.DateTimeFormat('fr-FR', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});

export async function EnqueteFinanceurSection({ inscriptionId, payerIsEntreprise }: Props) {
  if (!payerIsEntreprise) {
    return (
      <section className="bg-white rounded-lg border border-dark/10 p-6">
        <h2 className="font-display text-xl mb-2">Enquête financeur</h2>
        <p className="text-sm text-dark/60">
          Cette demande provient d'un particulier — pas d'enquête financeur applicable.
        </p>
      </section>
    );
  }

  const admin = createAdminClient();
  const { data: envoi } = await admin
    .from('enquete_financeur_envois')
    .select(`
      id, token, scheduled_first_send_at, first_sent_at, last_reminder_at, reminder_count,
      responded_at, completion_id, test_id
    `)
    .eq('inscription_id', inscriptionId)
    .maybeSingle();

  if (!envoi) {
    return (
      <section className="bg-white rounded-lg border border-dark/10 p-6 space-y-2">
        <h2 className="font-display text-xl">Enquête financeur</h2>
        <p className="text-sm text-dark/60">
          Pas encore envoyée. L'enquête part automatiquement 7 jours après la fin de la formation
          (si la demande est confirmée). Vérifiez que l'enquête est active dans <em>Tests &amp; enquêtes</em>.
        </p>
      </section>
    );
  }

  // Si répondu, charger les questions + réponses
  let responsesView: React.ReactNode = null;
  if (envoi.responded_at && envoi.completion_id) {
    const [{ data: questions }, { data: responses }] = await Promise.all([
      admin
        .from('questions')
        .select('id, ordre, libelle, type_reponse, options, echelle_max')
        .eq('test_id', envoi.test_id)
        .order('ordre'),
      admin
        .from('responses')
        .select('question_id, valeur, valeur_json')
        .eq('completion_id', envoi.completion_id),
    ]);

    const byQuestion = new Map<string, { valeur: string | null; valeur_json: unknown }>();
    for (const r of responses ?? []) byQuestion.set(r.question_id, { valeur: r.valeur, valeur_json: r.valeur_json });

    responsesView = (
      <div className="mt-4 space-y-3">
        <h3 className="font-display text-lg">Réponses</h3>
        {(questions ?? []).length === 0 ? (
          <p className="text-sm text-dark/60">Aucune question enregistrée.</p>
        ) : (
          <ul className="space-y-3">
            {(questions ?? []).map((q) => {
              const r = byQuestion.get(q.id);
              const display = formatAnswer(q.type_reponse as QuestionType, r?.valeur ?? null, r?.valeur_json ?? null);
              return (
                <li key={q.id} className="border border-dark/10 rounded p-3 bg-light/40">
                  <p className="text-sm font-medium">{q.ordre}. {q.libelle}</p>
                  <p className="mt-1 text-sm text-dark/80 whitespace-pre-wrap">{display || <em className="text-dark/40">Pas de réponse</em>}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    );
  }

  return (
    <section className="bg-white rounded-lg border border-dark/10 p-6 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h2 className="font-display text-xl">Enquête financeur</h2>
        <StatusBadge envoi={envoi} />
      </div>

      <dl className="text-sm space-y-1">
        <div>
          <dt className="inline text-dark/60">Mail initial : </dt>
          <dd className="inline">{envoi.first_sent_at ? FR_DATETIME.format(new Date(envoi.first_sent_at)) : <span className="text-dark/40">non envoyé</span>}</dd>
        </div>
        <div>
          <dt className="inline text-dark/60">Relances : </dt>
          <dd className="inline">
            {envoi.reminder_count} / 2
            {envoi.last_reminder_at && (
              <> · dernière : {FR_DATETIME.format(new Date(envoi.last_reminder_at))}</>
            )}
          </dd>
        </div>
        {envoi.responded_at && (
          <div>
            <dt className="inline text-dark/60">Répondu le : </dt>
            <dd className="inline">{FR_DATETIME.format(new Date(envoi.responded_at))}</dd>
          </div>
        )}
      </dl>

      {responsesView}
    </section>
  );
}

function StatusBadge({ envoi }: { envoi: { first_sent_at: string | null; responded_at: string | null; reminder_count: number } }) {
  if (envoi.responded_at) {
    return <span className="text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium bg-teal/10 text-teal">Répondu</span>;
  }
  if (!envoi.first_sent_at) {
    return <span className="text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium bg-dark/10 text-dark/60">En attente d'envoi</span>;
  }
  if (envoi.reminder_count >= 2) {
    return <span className="text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium bg-orange/10 text-orange">Sans réponse</span>;
  }
  return <span className="text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium bg-orange/10 text-orange">Envoyée</span>;
}

function formatAnswer(type: QuestionType, valeur: string | null, valeurJson: unknown): string {
  if (type === 'qcm_unique') {
    const v = valeurJson as { value?: string | null; followup?: string | null } | null;
    const base = v?.value ?? '';
    const f = (v?.followup ?? '').toString().trim();
    return f ? `${base} — Précision : ${f}` : base;
  }
  if (type === 'qcm_multiple') {
    const v = valeurJson as { values?: string[] } | null;
    return (v?.values ?? []).join(', ');
  }
  return valeur ?? '';
}
