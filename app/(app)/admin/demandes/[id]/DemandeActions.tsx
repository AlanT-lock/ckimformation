'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/app/Button';
import { Field, Textarea } from '@/components/app/Field';
import {
  confirmerDemande,
  refuserDemande,
  requestDocuments,
  deleteAdminDocument,
} from '../actions';

interface AdminDoc {
  id: string;
  fileName: string;
  fileSize: number | null;
  createdAt: string;
}

interface Props {
  inscriptionId: string;
  statut: string;
  hasDocRequests: boolean;
  adminDocs: AdminDoc[];
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DemandeActions({ inscriptionId, statut, hasDocRequests, adminDocs: initialDocs }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adminDocs, setAdminDocs] = useState<AdminDoc[]>(initialDocs);

  // Demande de documents
  const [showDocRequest, setShowDocRequest] = useState(false);
  const [docNames, setDocNames] = useState<string[]>(['']);

  // Refus
  const [showRefus, setShowRefus] = useState(false);
  const [motif, setMotif] = useState('');

  function setDocName(i: number, v: string) {
    setDocNames((a) => a.map((x, idx) => (idx === i ? v : x)));
  }
  function addDocName() { setDocNames((a) => [...a, '']); }
  function removeDocName(i: number) { setDocNames((a) => a.filter((_, idx) => idx !== i)); }

  // ----- Confirm ----------------------------------------------------------
  function handleConfirm() {
    if (!confirm('Confirmer cette demande ? Un email de confirmation sera envoyé au demandeur.')) return;
    setError(null);
    startTransition(async () => {
      try {
        await confirmerDemande(inscriptionId);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur';
        if (msg.includes('NEXT_REDIRECT')) return;
        setError(msg);
      }
    });
  }

  // ----- Refus ------------------------------------------------------------
  function handleRefus(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (motif.trim().length < 5) { setError('Motif trop court.'); return; }
    startTransition(async () => {
      try {
        await refuserDemande(inscriptionId, motif);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur';
        if (msg.includes('NEXT_REDIRECT')) return;
        setError(msg);
      }
    });
  }

  // ----- Demander des documents -------------------------------------------
  function handleRequestDocs(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const cleaned = docNames.map((n) => n.trim()).filter(Boolean);
    if (cleaned.length === 0) { setError('Indiquez au moins un document.'); return; }
    startTransition(async () => {
      try {
        await requestDocuments(inscriptionId, cleaned);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erreur';
        if (msg.includes('NEXT_REDIRECT')) return;
        setError(msg);
      }
    });
  }

  // ----- Upload admin doc -------------------------------------------------
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  async function uploadAdminFile(file: File) {
    setError(null);
    if (file.size > 10 * 1024 * 1024) { setError('Fichier trop volumineux (max 10 Mo).'); return; }
    setUploading(true);
    setUploadProgress(0);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('inscriptionId', inscriptionId);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/documents/upload-admin');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      const result = await new Promise<{ ok: boolean; document?: { id: string; file_name: string; file_size: number | null; created_at: string }; error?: string }>(
        (resolve, reject) => {
          xhr.onload = () => {
            try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error('Réponse invalide.')); }
          };
          xhr.onerror = () => reject(new Error('Erreur réseau.'));
          xhr.send(fd);
        }
      );
      setUploadProgress(null);
      setUploading(false);
      if (!result.ok || !result.document) {
        setError(result.error ?? 'Échec de l\'upload.');
        return;
      }
      setAdminDocs((arr) => [
        { id: result.document!.id, fileName: result.document!.file_name, fileSize: result.document!.file_size, createdAt: result.document!.created_at },
        ...arr,
      ]);
    } catch (e) {
      setUploadProgress(null);
      setUploading(false);
      setError(e instanceof Error ? e.message : 'Erreur réseau.');
    }
  }

  function handleDeleteAdminDoc(docId: string) {
    if (!confirm('Supprimer ce document ? Le demandeur n\'y aura plus accès.')) return;
    startTransition(async () => {
      try {
        await deleteAdminDocument(docId);
        setAdminDocs((arr) => arr.filter((d) => d.id !== docId));
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
    });
  }

  const isFinalized = statut === 'confirmee' || statut === 'refusee';

  return (
    <div className="space-y-6">
      {/* Documents transmis à joindre */}
      <section className="bg-white rounded-lg border border-dark/10 p-6 space-y-4">
        <div>
          <h2 className="font-display text-xl">Documents à transmettre au demandeur</h2>
          <p className="text-xs text-dark/60 mt-1">
            Joignez convention, programme, livret d&apos;accueil ou autre document. Le demandeur les
            retrouvera dans son espace personnel. Email automatique en cas de confirmation ou refus.
          </p>
        </div>

        {adminDocs.length > 0 && (
          <ul className="space-y-2">
            {adminDocs.map((d) => (
              <li key={d.id} className="flex items-center justify-between gap-3 bg-light/50 border border-dark/10 rounded p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium break-all">{d.fileName}</p>
                  <p className="text-xs text-dark/50">
                    {fmtSize(d.fileSize)} · ajouté le {new Date(d.createdAt).toLocaleString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/documents/download/admin/${d.id}`}
                    target="_blank"
                    rel="noopener"
                    className="text-xs text-teal hover:underline"
                  >
                    Voir
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDeleteAdminDoc(d.id)}
                    disabled={pending}
                    className="text-xs text-orange hover:underline"
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {uploadProgress !== null && (
          <div className="h-2 bg-light rounded-full overflow-hidden">
            <div className="h-full bg-teal transition-all" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        <div>
          <Button
            type="button"
            variant="secondary"
            onClick={() => uploadRef.current?.click()}
            disabled={uploading || pending}
          >
            {uploading ? 'Upload en cours…' : '+ Joindre un document'}
          </Button>
          <input
            ref={uploadRef}
            type="file"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) uploadAdminFile(f);
              e.currentTarget.value = '';
            }}
          />
          <p className="text-xs text-dark/50 mt-2">Tous types acceptés — 10 Mo max par fichier.</p>
        </div>
      </section>

      {/* Actions principales */}
      {isFinalized ? (
        <section className={`rounded-lg border p-4 text-sm ${
          statut === 'confirmee' ? 'bg-teal/10 border-teal/30 text-teal' : 'bg-dark/5 border-dark/15 text-dark/70'
        }`}>
          {statut === 'confirmee'
            ? 'Demande confirmée. L\'email de confirmation a été envoyé au demandeur.'
            : 'Demande refusée.'}
        </section>
      ) : (
        <section className="bg-white rounded-lg border border-dark/10 p-6 space-y-4">
          <h2 className="font-display text-xl">Actions</h2>

          <div className="flex flex-wrap gap-3">
            <Button onClick={handleConfirm} disabled={pending}>
              {pending ? '…' : 'Confirmer la demande'}
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setShowDocRequest((v) => !v); setShowRefus(false); }}
              disabled={pending}
            >
              {showDocRequest ? 'Annuler' : (hasDocRequests ? 'Demander d\'autres documents' : 'Demander des documents')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => { setShowRefus((v) => !v); setShowDocRequest(false); }}
              disabled={pending}
            >
              {showRefus ? 'Annuler' : 'Refuser la demande'}
            </Button>
          </div>

          {/* Form demander documents */}
          {showDocRequest && (
            <form onSubmit={handleRequestDocs} className="space-y-3 pt-4 border-t border-dark/10">
              <p className="text-sm text-dark/70">
                Listez les documents à fournir par le demandeur. Un email lui sera envoyé avec le lien
                vers son espace pour les importer.
              </p>
              {docNames.map((n, i) => (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    <Field
                      label={`Document #${i + 1}`}
                      value={n}
                      onChange={(e) => setDocName(i, e.target.value)}
                      placeholder="Ex. Attestation de financement, Pièce d'identité..."
                      required
                    />
                  </div>
                  {docNames.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDocName(i)}
                      className="text-orange/80 hover:text-orange px-2 pb-2"
                      aria-label="Retirer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addDocName} className="text-sm text-teal hover:underline">
                + Ajouter un document
              </button>
              <div className="pt-2">
                <Button type="submit" disabled={pending}>
                  {pending ? '…' : 'Envoyer la demande de documents'}
                </Button>
              </div>
            </form>
          )}

          {/* Form refus */}
          {showRefus && (
            <form onSubmit={handleRefus} className="space-y-3 pt-4 border-t border-dark/10">
              <Textarea
                label="Motif du refus"
                rows={4}
                required
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Indiquez le motif qui sera communiqué au demandeur."
              />
              <Button type="submit" variant="danger" disabled={pending}>
                {pending ? '…' : 'Envoyer le refus'}
              </Button>
            </form>
          )}

          {error && (
            <div className="bg-orange/10 border border-orange/30 rounded p-3 text-sm text-orange whitespace-pre-line">
              {error}
            </div>
          )}
        </section>
      )}

      {error && isFinalized && (
        <div className="bg-orange/10 border border-orange/30 rounded p-3 text-sm text-orange whitespace-pre-line">
          {error}
        </div>
      )}
    </div>
  );
}
