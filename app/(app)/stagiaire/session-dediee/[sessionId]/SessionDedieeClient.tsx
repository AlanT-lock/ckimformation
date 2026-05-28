'use client';

import { useState, useTransition } from 'react';
import {
  saveAnalyseBesoins,
  inscrireStagiaire,
  creerEtInscrireStagiaire,
  uploadDocumentRequest,
  finaliserSession,
} from './actions';

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
  employes: Array<{ id: string; full_name: string; email: string }>;
  inscriptions: string[];
}

export function SessionDedieeClient({ session, employes, inscriptions }: Props) {
  const [analyse, setAnalyse] = useState<string>(
    session.session_reserved_details?.analyse_besoins ?? '',
  );
  const [, startTransition] = useTransition();
  const [newEmp, setNewEmp] = useState({ full_name: '', email: '' });

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
                  {e.full_name} ({e.email})
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
              placeholder="Nom complet"
              className="border rounded px-2 py-1"
              value={newEmp.full_name}
              onChange={(e) => setNewEmp({ ...newEmp, full_name: e.target.value })}
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
                if (!newEmp.full_name || !newEmp.email) return;
                startTransition(async () => {
                  await creerEtInscrireStagiaire(session.id, newEmp);
                  setNewEmp({ full_name: '', email: '' });
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
        <textarea
          className="w-full border rounded px-3 py-2"
          rows={6}
          value={analyse}
          onChange={(e) => setAnalyse(e.target.value)}
        />
        <button
          className="mt-2 px-3 py-1 border rounded"
          onClick={() =>
            startTransition(() => saveAnalyseBesoins(session.id, analyse))
          }
        >
          Enregistrer
        </button>
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
                    {new Date(
                      req.session_document_uploads[0].uploaded_at,
                    ).toLocaleDateString('fr-FR')}
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
            {new Date(
              session.session_reserved_details.completed_at,
            ).toLocaleDateString('fr-FR')}
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
