'use client';

import { useState, useTransition } from 'react';
import {
  saveAnalyseBesoins,
  inscrireStagiaire,
  creerEtInscrireStagiaire,
  uploadDocumentRequest,
  finaliserSession,
} from './actions';
import { formatDate } from '@/lib/date';
import {
  BesoinsQuestionnaire,
  besoinsClientError,
  besoinsStateFromSnapshot,
  toBesoinsInputs,
  type BesoinsState,
} from '@/components/app/besoins/BesoinsQuestionnaire';
import type { BesoinAnswerSnapshot, BesoinQuestion } from '@/lib/besoins/answers';

interface AdminDoc {
  id: string;
  filename: string;
  label: string | null;
  storage_path: string;
  uploaded_at: string;
}

interface DocUpload {
  id: string;
  filename: string;
  uploaded_at: string;
  storage_path: string;
}

interface DocRequest {
  id: string;
  ordre: number;
  label: string;
  description: string | null;
  required: boolean;
  session_document_uploads: DocUpload[];
}

interface ReservedDetails {
  analyse_besoins: string | null;
  completed_at: string | null;
}

interface SessionData {
  id: string;
  formations?: { titre?: string | null } | null;
  session_reserved_details: ReservedDetails | null;
  session_admin_documents: AdminDoc[];
  session_document_requests: DocRequest[];
}

interface Props {
  session: SessionData;
  employes: Array<{ id: string; prenom: string; nom: string; email: string }>;
  inscriptions: string[];
  besoinsQuestions: BesoinQuestion[];
  besoinsSaved: BesoinAnswerSnapshot[];
}

export function SessionDedieeClient({ session, employes, inscriptions, besoinsQuestions, besoinsSaved }: Props) {
  const [besoins, setBesoins] = useState<BesoinsState>(() => besoinsStateFromSnapshot(besoinsQuestions, besoinsSaved));
  const [besoinsMsg, setBesoinsMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [besoinsPending, startBesoins] = useTransition();
  const legacyAnalyse = besoinsSaved.length === 0 ? session.session_reserved_details?.analyse_besoins : null;
  const [, startTransition] = useTransition();

  function saveBesoins() {
    const err = besoinsClientError(besoinsQuestions, besoins);
    if (err) {
      setBesoinsMsg({ ok: false, text: err });
      return;
    }
    setBesoinsMsg(null);
    startBesoins(async () => {
      const res = await saveAnalyseBesoins(session.id, toBesoinsInputs(besoinsQuestions, besoins));
      setBesoinsMsg(res.ok ? { ok: true, text: 'Analyse des besoins enregistrée.' } : { ok: false, text: res.error });
    });
  }
  const [newEmp, setNewEmp] = useState({ prenom: '', nom: '', email: '' });

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold">{session.formations?.titre}</h1>

      <section>
        <h2 className="text-xl font-semibold mb-3">Documents fournis par CKIM</h2>
        {session.session_admin_documents.length === 0 && (
          <p className="text-gray-500">Aucun document.</p>
        )}
        <ul className="space-y-1">
          {session.session_admin_documents.map((d) => (
            <li key={d.id}>
              <a
                href={`/api/storage/signed?bucket=session-admin-docs&path=${encodeURIComponent(d.storage_path)}`}
                className="text-emerald-700 underline"
              >
                {d.label ?? d.filename}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Stagiaires</h2>
        <ul className="space-y-2 mb-4">
          {employes.map((e) => {
            const inscrit = inscriptions.includes(e.id);
            return (
              <li key={e.id} className="flex items-center gap-3">
                <span className="flex-1">
                  {e.prenom} {e.nom} ({e.email})
                </span>
                {inscrit ? (
                  <span className="text-emerald-700">✓ Inscrit</span>
                ) : (
                  <button
                    className="px-3 py-1 border rounded"
                    onClick={() =>
                      startTransition(() => inscrireStagiaire(session.id, e.id))
                    }
                  >
                    Inscrire
                  </button>
                )}
              </li>
            );
          })}
        </ul>
        <div className="border-t pt-4">
          <div className="font-medium mb-2">Ajouter un nouvel employé</div>
          <div className="flex gap-2">
            <input
              placeholder="Prénom"
              className="border rounded px-2 py-1"
              value={newEmp.prenom}
              onChange={(e) => setNewEmp({ ...newEmp, prenom: e.target.value })}
            />
            <input
              placeholder="Nom"
              className="border rounded px-2 py-1"
              value={newEmp.nom}
              onChange={(e) => setNewEmp({ ...newEmp, nom: e.target.value })}
            />
            <input
              placeholder="Email"
              className="border rounded px-2 py-1"
              value={newEmp.email}
              onChange={(e) => setNewEmp({ ...newEmp, email: e.target.value })}
            />
            <button
              className="px-3 py-1 border rounded"
              onClick={() => {
                if (!newEmp.prenom || !newEmp.nom || !newEmp.email) return;
                startTransition(async () => {
                  await creerEtInscrireStagiaire(session.id, newEmp);
                  setNewEmp({ prenom: '', nom: '', email: '' });
                });
              }}
            >
              Créer + inscrire
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Analyse des besoins</h2>
        {besoinsQuestions.length === 0 ? (
          <p className="text-sm text-gray-500">Aucune question pour cette formation.</p>
        ) : (
          <>
            {legacyAnalyse && (
              <div className="mb-4 rounded border p-3 text-sm whitespace-pre-wrap bg-gray-50">
                <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Votre réponse précédente</p>
                {legacyAnalyse}
              </div>
            )}
            <BesoinsQuestionnaire questions={besoinsQuestions} value={besoins} onChange={setBesoins} />
            <button
              className="mt-4 px-3 py-1 border rounded disabled:opacity-50"
              disabled={besoinsPending}
              onClick={saveBesoins}
            >
              {besoinsPending ? 'Enregistrement…' : 'Enregistrer'}
            </button>
            {besoinsMsg && (
              <p className={`mt-2 text-sm ${besoinsMsg.ok ? 'text-emerald-700' : 'text-orange'}`}>{besoinsMsg.text}</p>
            )}
          </>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Documents à fournir</h2>
        <ul className="space-y-3">
          {session.session_document_requests.map((req) => (
            <li key={req.id} className="border rounded p-3">
              <div className="font-medium">
                {req.label}
                {req.required && <span className="text-red-600"> *</span>}
              </div>
              {req.description && (
                <div className="text-sm text-gray-600">{req.description}</div>
              )}
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="file"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const fd = new FormData();
                    fd.append('file', f);
                    startTransition(() =>
                      uploadDocumentRequest(session.id, req.id, fd),
                    );
                  }}
                />
                {req.session_document_uploads.length > 0 && (
                  <span className="text-sm text-emerald-700">
                    ✓ Fourni le{' '}
                    {formatDate(req.session_document_uploads[0].uploaded_at)}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="pt-4 border-t">
        {session.session_reserved_details?.completed_at ? (
          <p className="text-emerald-700">
            ✓ Session finalisée le{' '}
            {formatDate(session.session_reserved_details.completed_at)}
          </p>
        ) : (
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded"
            onClick={() => startTransition(() => finaliserSession(session.id))}
          >
            Finaliser
          </button>
        )}
      </section>
    </div>
  );
}
