'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { formatDate } from '@/lib/date';
import { FIN_FORMATION_KINDS, KIND_LABEL, type FinFormationKind } from '@/lib/fin-formation/model';
import { sendFinFormationCompanyRecaps, sendFinFormationToStagiaire } from './fin-formation-actions';

export interface FinFormationPanelRow {
  id: string;
  nom: string;
  email: string;
  /** Entreprise payeuse (stagiaire inscrit via une fiche salarié), sinon null. */
  entreprise: { id: string; nom: string } | null;
  /** Nombre de compétences de la formation déjà évaluées pour ce stagiaire. */
  competencesEvaluees: number;
  docs: Partial<Record<FinFormationKind, { id: string; numero: string; sentAt: string }>>;
}

export interface FinFormationPanelData {
  sessionId: string;
  formationTitre: string;
  /** Session terminée : le bouton d'envoi est proposé. */
  terminee: boolean;
  /** Raison qui empêche l'envoi (ex. aucun créneau), sinon null. */
  blocker: string | null;
  /** Points d'attention affichés avant l'envoi (formateur manquant…). */
  warnings: string[];
  competencesTotal: number;
  rows: FinFormationPanelRow[];
}

const KIND_DESCRIPTION: Record<FinFormationKind, string> = {
  certificat:
    'Modèle officiel du ministère du Travail : atteste la réalisation de l’action et le nombre d’heures suivies.',
  attestation:
    'Rappelle l’action suivie et liste toutes les compétences de la formation, avec le niveau d’acquisition du stagiaire.',
};

type Step = 'stagiaires' | 'documents' | 'apercu' | 'envoi' | 'termine';

interface SendOutcome {
  id: string;
  nom: string;
  status: 'emailed' | 'deposited' | 'email_failed' | 'failed';
  detail?: string;
}

const plural = (n: number, one: string, many: string) => `${n} ${n > 1 ? many : one}`;

function downloadHref(docId: string) {
  return `/api/documents/download/fin-formation/${docId}`;
}

export function FinFormationPanel({ data }: { data: FinFormationPanelData }) {
  const [open, setOpen] = useState(false);
  const hasDocs = data.rows.some((r) => r.docs.certificat || r.docs.attestation);
  if (!data.terminee && !hasDocs) return null;

  return (
    <div>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-display text-2xl tracking-wide">Documents de fin de formation</h2>
          <p className="text-xs text-dark/60 mt-1 max-w-2xl">
            Certificat de réalisation et attestation de fin de formation. Une fois envoyés, ils sont joints à
            l&apos;e-mail du stagiaire et de son entreprise, et restent disponibles dans leurs espaces.
          </p>
        </div>
        {data.terminee && (
          <Button
            type="button"
            onClick={() => setOpen(true)}
            disabled={!!data.blocker || data.rows.length === 0}
            className="whitespace-nowrap"
          >
            Envoyer les documents de fin de formation
          </Button>
        )}
      </div>

      {data.terminee && data.blocker && <p className="mt-3 text-sm text-orange">{data.blocker}</p>}
      {data.terminee && !data.blocker && data.rows.length === 0 && (
        <p className="mt-3 text-sm text-dark/60">Aucun stagiaire confirmé sur cette session.</p>
      )}

      {data.rows.length > 0 && (
        <div className="mt-4 bg-white border border-dark/10 rounded-lg overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-2 px-4">Stagiaire</th>
                {FIN_FORMATION_KINDS.map((k) => (
                  <th key={k} className="text-left py-2 px-4">
                    {KIND_LABEL[k]}
                  </th>
                ))}
                <th className="text-left py-2 px-4">Envoyé le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {data.rows.map((r) => {
                const sentAt = r.docs.attestation?.sentAt ?? r.docs.certificat?.sentAt ?? null;
                return (
                  <tr key={r.id}>
                    <td className="py-2 px-4">
                      {r.nom}
                      {r.entreprise && <span className="block text-xs text-dark/50">{r.entreprise.nom}</span>}
                    </td>
                    {FIN_FORMATION_KINDS.map((k) => {
                      const doc = r.docs[k];
                      return (
                        <td key={k} className="py-2 px-4">
                          {doc ? (
                            <a
                              href={downloadHref(doc.id)}
                              target="_blank"
                              rel="noopener"
                              className="text-teal hover:underline"
                            >
                              {doc.numero}
                            </a>
                          ) : (
                            <span className="text-dark/40">Non envoyé</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-2 px-4 text-dark/60">{sentAt ? formatDate(sentAt) : '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {open && <SendWizard data={data} onClose={() => setOpen(false)} />}
    </div>
  );
}

function SendWizard({ data, onClose }: { data: FinFormationPanelData; onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>('stagiaires');
  const [selected, setSelected] = useState<Set<string>>(() => new Set(data.rows.map((r) => r.id)));
  const [kinds, setKinds] = useState<Set<FinFormationKind>>(() => new Set(FIN_FORMATION_KINDS));
  const [previewKind, setPreviewKind] = useState<FinFormationKind | null>(null);
  const [progress, setProgress] = useState<{ done: number; current: string }>({ done: 0, current: '' });
  const [outcomes, setOutcomes] = useState<SendOutcome[]>([]);
  const [recap, setRecap] = useState<{ sent: string[]; failed: Array<{ entreprise: string; error: string }> }>({
    sent: [],
    failed: [],
  });

  const selectedRows = useMemo(() => data.rows.filter((r) => selected.has(r.id)), [data.rows, selected]);
  const selectedKinds = FIN_FORMATION_KINDS.filter((k) => kinds.has(k));
  const first = selectedRows[0] ?? null;
  const entreprises = useMemo(
    () => new Set(selectedRows.filter((r) => r.entreprise).map((r) => r.entreprise!.id)).size,
    [selectedRows]
  );
  const allSelected = data.rows.length > 0 && selectedRows.length === data.rows.length;
  const sending = step === 'envoi';

  function close() {
    if (sending) return;
    if (step === 'termine') router.refresh();
    onClose();
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      if (previewKind) setPreviewKind(null);
      else close();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleKind(kind: FinFormationKind) {
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  // Points d'attention dépendant de la sélection, affichés avant l'envoi.
  const warnings = useMemo(() => {
    const out = [...data.warnings];
    const noEmail = selectedRows.filter((r) => !r.email).length;
    if (noEmail > 0) {
      out.push(
        `${plural(noEmail, 'stagiaire n’a', 'stagiaires n’ont')} pas d’adresse e-mail : les documents seront déposés dans l’espace, sans e-mail.`
      );
    }
    if (kinds.has('attestation') && data.competencesTotal > 0) {
      const none = selectedRows.filter((r) => r.competencesEvaluees === 0).length;
      const partial = selectedRows.filter(
        (r) => r.competencesEvaluees > 0 && r.competencesEvaluees < data.competencesTotal
      ).length;
      if (none > 0) {
        out.push(
          `Bilan de compétences non rempli pour ${plural(none, 'stagiaire', 'stagiaires')} : l’attestation listera les compétences sans niveau d’acquisition.`
        );
      }
      if (partial > 0) {
        out.push(
          `Bilan de compétences incomplet pour ${plural(partial, 'stagiaire', 'stagiaires')} : les compétences sans niveau porteront la mention « Non évaluée ».`
        );
      }
    }
    return out;
  }, [data.warnings, data.competencesTotal, selectedRows, kinds]);

  async function send() {
    const rows = selectedRows;
    const kindList = selectedKinds;
    setStep('envoi');
    setOutcomes([]);
    const results: SendOutcome[] = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      setProgress({ done: i, current: r.nom });
      let outcome: SendOutcome;
      try {
        const res = await sendFinFormationToStagiaire(data.sessionId, r.id, kindList);
        if (!res.ok) outcome = { id: r.id, nom: r.nom, status: 'failed', detail: res.error };
        else if (res.emailed) outcome = { id: r.id, nom: r.nom, status: 'emailed' };
        else if (res.emailError) outcome = { id: r.id, nom: r.nom, status: 'email_failed', detail: res.emailError };
        else outcome = { id: r.id, nom: r.nom, status: 'deposited' };
      } catch (err) {
        outcome = {
          id: r.id,
          nom: r.nom,
          status: 'failed',
          detail: err instanceof Error ? err.message : 'Erreur inattendue.',
        };
      }
      results.push(outcome);
      setOutcomes([...results]);
    }

    const issued = results.filter((o) => o.status !== 'failed').map((o) => o.id);
    setProgress({ done: rows.length, current: 'Récapitulatif aux entreprises' });
    if (issued.length > 0) {
      try {
        setRecap(await sendFinFormationCompanyRecaps(data.sessionId, issued, kindList));
      } catch (err) {
        setRecap({
          sent: [],
          failed: [{ entreprise: 'Entreprises', error: err instanceof Error ? err.message : 'Erreur inattendue.' }],
        });
      }
    }
    setStep('termine');
  }

  const stepIndex = step === 'stagiaires' ? 0 : step === 'documents' ? 1 : 2;
  const stepLabels = ['Stagiaires', 'Documents', 'Aperçu et envoi'];

  return (
    <div
      className="fixed inset-0 z-50 bg-dark/50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fin-formation-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 pt-5 pb-4 border-b border-dark/10">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 id="fin-formation-title" className="font-display text-2xl tracking-wide">
                Documents de fin de formation
              </h3>
              <p className="text-xs text-dark/60 mt-0.5 truncate">{data.formationTitre}</p>
            </div>
            <button
              type="button"
              onClick={close}
              disabled={sending}
              aria-label="Fermer"
              className="text-dark/50 hover:text-dark text-2xl leading-none px-1 disabled:opacity-30"
            >
              ×
            </button>
          </div>
          {(step === 'stagiaires' || step === 'documents' || step === 'apercu') && (
            <ol className="mt-4 flex items-center gap-2 text-xs">
              {stepLabels.map((label, i) => (
                <li key={label} className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-medium ${
                      i <= stepIndex ? 'bg-teal text-white' : 'bg-dark/10 text-dark/50'
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={i === stepIndex ? 'font-medium text-dark' : 'text-dark/50'}>{label}</span>
                  {i < stepLabels.length - 1 && <span className="w-6 h-px bg-dark/20" aria-hidden />}
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">
          {step === 'stagiaires' && (
            <div>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-sm text-dark/70">
                  Décochez les stagiaires qui ne doivent pas recevoir leurs documents.
                </p>
                <button
                  type="button"
                  className="text-xs text-teal hover:underline"
                  onClick={() => setSelected(allSelected ? new Set() : new Set(data.rows.map((r) => r.id)))}
                >
                  {allSelected ? 'Tout décocher' : 'Tout cocher'}
                </button>
              </div>
              <ul className="mt-3 border border-dark/10 rounded-lg divide-y divide-dark/10">
                {data.rows.map((r) => {
                  const alreadySent = r.docs.attestation?.sentAt ?? r.docs.certificat?.sentAt ?? null;
                  return (
                    <li key={r.id}>
                      <label className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-light/60">
                        <input
                          type="checkbox"
                          className="mt-1 h-4 w-4 accent-teal"
                          checked={selected.has(r.id)}
                          onChange={() => toggleRow(r.id)}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="font-medium">{r.nom}</span>
                          <span className="block text-xs text-dark/60">
                            {r.entreprise ? r.entreprise.nom : 'Particulier'}
                            {' · '}
                            {r.email || <span className="text-orange">pas d&apos;adresse e-mail</span>}
                          </span>
                        </span>
                        {alreadySent && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal whitespace-nowrap">
                            Déjà envoyé le {formatDate(alreadySent)}
                          </span>
                        )}
                      </label>
                    </li>
                  );
                })}
              </ul>
              <p className="mt-3 text-xs text-dark/60">
                {plural(selectedRows.length, 'stagiaire sélectionné', 'stagiaires sélectionnés')} sur {data.rows.length}.
              </p>
            </div>
          )}

          {step === 'documents' && (
            <div>
              <p className="text-sm text-dark/70">Choisissez les documents à envoyer.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {FIN_FORMATION_KINDS.map((k) => {
                  const on = kinds.has(k);
                  return (
                    <button
                      key={k}
                      type="button"
                      role="checkbox"
                      aria-checked={on}
                      onClick={() => toggleKind(k)}
                      className={`text-left rounded-xl border-2 p-4 transition ${
                        on ? 'border-teal bg-teal/5' : 'border-dark/15 bg-white hover:border-dark/30'
                      }`}
                    >
                      <span className="flex items-start justify-between gap-3">
                        <span className="font-medium">{KIND_LABEL[k]}</span>
                        <span
                          aria-hidden
                          className={`shrink-0 inline-flex items-center justify-center w-6 h-6 rounded-full border-2 text-sm ${
                            on ? 'bg-teal border-teal text-white' : 'border-dark/25 text-transparent'
                          }`}
                        >
                          ✓
                        </span>
                      </span>
                      <span className="block text-xs text-dark/60 mt-2 leading-relaxed">{KIND_DESCRIPTION[k]}</span>
                    </button>
                  );
                })}
              </div>
              {selectedKinds.length === 0 && (
                <p className="mt-3 text-xs text-orange">Sélectionnez au moins un document.</p>
              )}
            </div>
          )}

          {step === 'apercu' && first && (
            <div className="space-y-4">
              <p className="text-sm text-dark/70">
                {`Vérifiez ${selectedKinds.length > 1 ? 'les documents' : 'le document'} avant l’envoi. L’aperçu est celui de `}
                <strong>{first.nom}</strong>
                {selectedRows.length > 1 ? ', premier stagiaire de la liste' : ''}.
              </p>
              <ul className="space-y-2">
                {selectedKinds.map((k) => (
                  <li
                    key={k}
                    className="flex items-center justify-between gap-3 flex-wrap border border-dark/10 rounded-lg px-4 py-3"
                  >
                    <span className="font-medium">{KIND_LABEL[k]}</span>
                    <Button type="button" variant="secondary" onClick={() => setPreviewKind(k)}>
                      Voir l&apos;aperçu
                    </Button>
                  </li>
                ))}
              </ul>
              <div className="bg-light rounded-lg p-4 text-sm">
                <p className="font-medium">Récapitulatif de l&apos;envoi</p>
                <ul className="mt-2 space-y-1 text-dark/80 list-disc list-inside">
                  <li>
                    {plural(selectedRows.length, 'stagiaire recevra', 'stagiaires recevront')}{' '}
                    {selectedKinds
                      .map((k) => `${selectedRows.length > 1 ? 'leur' : 'son'} ${KIND_LABEL[k].toLowerCase()}`)
                      .join(' et ')}
                    .
                  </li>
                  {entreprises > 0 && (
                    <li>
                      {plural(entreprises, 'entreprise recevra', 'entreprises recevront')} un e-mail récapitulatif avec
                      les documents de ses salariés.
                    </li>
                  )}
                  <li>Les documents seront disponibles dans l&apos;espace des stagiaires et des entreprises.</li>
                </ul>
              </div>
              {warnings.length > 0 && (
                <div className="bg-orange/5 border border-orange/30 rounded-lg p-4 text-sm">
                  <p className="font-medium text-orange">À savoir avant l&apos;envoi</p>
                  <ul className="mt-2 space-y-1 text-dark/80 list-disc list-inside">
                    {warnings.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {step === 'envoi' && (
            <div className="py-6 text-center">
              <p className="font-medium">Envoi en cours…</p>
              <p className="text-sm text-dark/60 mt-1">
                {progress.done} / {selectedRows.length} — {progress.current}
              </p>
              <div className="mt-4 h-2 rounded-full bg-dark/10 overflow-hidden">
                <div
                  className="h-full bg-teal transition-all"
                  style={{ width: `${Math.round((progress.done / Math.max(1, selectedRows.length)) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-dark/50 mt-4">Ne fermez pas cette fenêtre pendant l&apos;envoi.</p>
            </div>
          )}

          {step === 'termine' && <Outcome outcomes={outcomes} recap={recap} />}
        </div>

        <div className="px-6 py-4 border-t border-dark/10 flex items-center justify-between gap-3">
          {step === 'stagiaires' && (
            <>
              <Button type="button" variant="ghost" onClick={close}>
                Annuler
              </Button>
              <Button type="button" onClick={() => setStep('documents')} disabled={selectedRows.length === 0}>
                Continuer
              </Button>
            </>
          )}
          {step === 'documents' && (
            <>
              <Button type="button" variant="ghost" onClick={() => setStep('stagiaires')}>
                ← Retour
              </Button>
              <Button type="button" onClick={() => setStep('apercu')} disabled={selectedKinds.length === 0}>
                Continuer
              </Button>
            </>
          )}
          {step === 'apercu' && (
            <>
              <Button type="button" variant="ghost" onClick={() => setStep('documents')}>
                ← Retour
              </Button>
              <Button type="button" onClick={send}>
                Envoyer à {plural(selectedRows.length, 'stagiaire', 'stagiaires')}
              </Button>
            </>
          )}
          {step === 'envoi' && <span className="text-xs text-dark/50">Génération et envoi des documents…</span>}
          {step === 'termine' && (
            <>
              <span />
              <Button type="button" onClick={close}>
                Fermer
              </Button>
            </>
          )}
        </div>
      </div>

      {previewKind && first && (
        <PreviewOverlay
          title={`${KIND_LABEL[previewKind]} — ${first.nom}`}
          src={`/api/pdf/fin-formation/${first.id}?session=${data.sessionId}&kind=${previewKind}`}
          onClose={() => setPreviewKind(null)}
        />
      )}
    </div>
  );
}

function PreviewOverlay({ title, src, onClose }: { title: string; src: string; onClose: () => void }) {
  // Certains navigateurs (mobiles surtout) n'affichent pas un PDF dans une
  // page : on propose alors de l'ouvrir dans un nouvel onglet.
  const inlinePdf = typeof navigator === 'undefined' || navigator.pdfViewerEnabled !== false;
  return (
    <div
      className="fixed inset-0 z-[60] bg-dark/70 flex items-center justify-center p-3 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={`Aperçu : ${title}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl h-full max-h-[92vh] flex flex-col overflow-hidden">
        <div className="px-4 py-3 border-b border-dark/10 flex items-center justify-between gap-3 flex-wrap">
          <p className="font-medium text-sm min-w-0 truncate">Aperçu — {title}</p>
          <div className="flex items-center gap-2">
            <a
              href={src}
              target="_blank"
              rel="noopener"
              className="text-xs text-teal hover:underline whitespace-nowrap"
            >
              Ouvrir dans un nouvel onglet
            </a>
            <Button type="button" variant="secondary" onClick={onClose}>
              Fermer l&apos;aperçu
            </Button>
          </div>
        </div>
        {inlinePdf ? (
          <iframe src={src} title={`Aperçu : ${title}`} className="flex-1 w-full bg-light" />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 text-center bg-light">
            <p className="text-sm text-dark/70 max-w-sm">
              Ce navigateur n&apos;affiche pas les PDF dans la page. Ouvrez l&apos;aperçu dans un nouvel onglet, puis
              revenez ici pour valider l&apos;envoi.
            </p>
            <a
              href={src}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center px-4 py-2 rounded text-sm font-medium bg-teal hover:bg-teal-l text-white transition"
            >
              Ouvrir l&apos;aperçu
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function Outcome({
  outcomes,
  recap,
}: {
  outcomes: SendOutcome[];
  recap: { sent: string[]; failed: Array<{ entreprise: string; error: string }> };
}) {
  const emailed = outcomes.filter((o) => o.status === 'emailed').length;
  const deposited = outcomes.filter((o) => o.status === 'deposited');
  const emailFailed = outcomes.filter((o) => o.status === 'email_failed');
  const failed = outcomes.filter((o) => o.status === 'failed');
  const allGood = emailFailed.length === 0 && failed.length === 0 && recap.failed.length === 0;

  return (
    <div className="space-y-4 text-sm">
      <div
        className={`rounded-lg border p-4 ${allGood ? 'bg-teal/5 border-teal/30' : 'bg-orange/5 border-orange/30'}`}
      >
        <p className={`font-medium ${allGood ? 'text-teal' : 'text-orange'}`}>
          {allGood ? 'Documents envoyés.' : 'Envoi terminé avec des points à vérifier.'}
        </p>
        <ul className="mt-2 space-y-1 text-dark/80 list-disc list-inside">
          <li>
            {plural(emailed, 'stagiaire a reçu ses', 'stagiaires ont reçu leurs')} documents par e-mail.
          </li>
          {deposited.length > 0 && (
            <li>
              {`${plural(deposited.length, 'stagiaire', 'stagiaires')} sans adresse e-mail : documents déposés dans l’espace (${deposited.map((o) => o.nom).join(', ')}).`}
            </li>
          )}
          {recap.sent.length > 0 && (
            <li>
              Récapitulatif envoyé à {plural(recap.sent.length, 'entreprise', 'entreprises')} ({recap.sent.join(', ')}).
            </li>
          )}
        </ul>
      </div>

      {(emailFailed.length > 0 || failed.length > 0 || recap.failed.length > 0) && (
        <ul className="space-y-2">
          {failed.map((o) => (
            <li key={o.id} className="border border-orange/30 rounded-lg px-4 py-2">
              <span className="font-medium">{o.nom}</span> — documents non générés : {o.detail}
            </li>
          ))}
          {emailFailed.map((o) => (
            <li key={o.id} className="border border-orange/30 rounded-lg px-4 py-2">
              <span className="font-medium">{o.nom}</span>
              {` — documents déposés dans l’espace, mais l’e-mail n’est pas parti : ${o.detail}`}
            </li>
          ))}
          {recap.failed.map((f) => (
            <li key={f.entreprise} className="border border-orange/30 rounded-lg px-4 py-2">
              <span className="font-medium">{f.entreprise}</span> — récapitulatif non envoyé : {f.error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
