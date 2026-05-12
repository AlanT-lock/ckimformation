'use client';

import { useRef, useState, useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { Textarea } from '@/components/app/Field';
import { declineDocument, clearDocumentResponse } from './actions';

export interface DocumentRequestData {
  id: string;
  nom: string;
  storage_path: string | null;
  file_name: string | null;
  file_size: number | null;
  declined: boolean;
  decline_reason: string | null;
  uploaded_at: string | null;
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

export function DocumentRequestItem({
  demande,
  disabled,
}: {
  demande: DocumentRequestData;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showDecline, setShowDecline] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // États locaux pour l'affichage live après upload
  const [localState, setLocalState] = useState({
    hasFile: !!demande.storage_path,
    fileName: demande.file_name,
    fileSize: demande.file_size,
    declined: demande.declined,
    declineReason: demande.decline_reason,
  });

  async function uploadFile(file: File) {
    setError(null);
    if (file.size > 10 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 10 Mo).');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('demandeId', demande.id);

    setUploadProgress(0);
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', '/api/documents/upload-payer');
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      const result = await new Promise<{ ok: boolean; fileName?: string; fileSize?: number; error?: string }>((resolve, reject) => {
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)); } catch { reject(new Error('Réponse invalide.')); }
        };
        xhr.onerror = () => reject(new Error('Erreur réseau.'));
        xhr.send(fd);
      });
      setUploadProgress(null);
      if (!result.ok) {
        setError(result.error ?? 'Échec de l\'upload.');
        return;
      }
      setLocalState({
        hasFile: true,
        fileName: result.fileName ?? file.name,
        fileSize: result.fileSize ?? file.size,
        declined: false,
        declineReason: null,
      });
    } catch (e) {
      setUploadProgress(null);
      setError(e instanceof Error ? e.message : 'Erreur réseau.');
    }
  }

  function onPickFile() {
    inputRef.current?.click();
  }

  function clear() {
    setError(null);
    startTransition(async () => {
      const res = await clearDocumentResponse(demande.id);
      if (!res.ok) { setError(res.error); return; }
      setLocalState({ hasFile: false, fileName: null, fileSize: null, declined: false, declineReason: null });
      setShowDecline(false);
    });
  }

  function submitDecline(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await declineDocument(demande.id, declineReason);
      if (!res.ok) { setError(res.error); return; }
      setLocalState({
        hasFile: false,
        fileName: null,
        fileSize: null,
        declined: true,
        declineReason: declineReason.trim(),
      });
      setShowDecline(false);
    });
  }

  const isLocked = !!disabled;

  return (
    <li className="bg-white border border-dark/10 rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <p className="font-medium">{demande.nom}</p>
        {localState.hasFile && (
          <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-teal/10 text-teal whitespace-nowrap">
            Importé
          </span>
        )}
        {localState.declined && (
          <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-orange/10 text-orange whitespace-nowrap">
            Non transmis
          </span>
        )}
        {!localState.hasFile && !localState.declined && (
          <span className="text-xs px-2 py-0.5 rounded-full uppercase tracking-wider font-medium bg-dark/10 text-dark/60 whitespace-nowrap">
            En attente
          </span>
        )}
      </div>

      {uploadProgress !== null && (
        <div className="h-2 bg-light rounded-full overflow-hidden">
          <div className="h-full bg-teal transition-all" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {localState.hasFile && (
        <div className="text-sm text-dark/70 flex items-center gap-2 flex-wrap">
          <span className="break-all">{localState.fileName}</span>
          {localState.fileSize && <span className="text-xs text-dark/50">({fmtSize(localState.fileSize)})</span>}
          {!isLocked && (
            <button
              type="button"
              onClick={clear}
              disabled={pending}
              className="text-xs text-orange hover:underline ml-auto"
            >
              Remplacer / annuler
            </button>
          )}
        </div>
      )}

      {localState.declined && (
        <div className="bg-orange/5 border border-orange/30 rounded p-3 text-sm">
          <p className="text-xs uppercase tracking-[0.15em] text-orange mb-1">Justification</p>
          <p className="whitespace-pre-wrap text-dark/80">{localState.declineReason}</p>
          {!isLocked && (
            <button
              type="button"
              onClick={clear}
              disabled={pending}
              className="text-xs text-orange hover:underline mt-2"
            >
              Modifier ma réponse
            </button>
          )}
        </div>
      )}

      {!localState.hasFile && !localState.declined && !isLocked && (
        <>
          {!showDecline ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={onPickFile} disabled={pending}>
                Importer un fichier
              </Button>
              <Button variant="secondary" onClick={() => setShowDecline(true)} disabled={pending}>
                Je ne peux pas fournir ce document
              </Button>
              <input
                ref={inputRef}
                type="file"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) uploadFile(f);
                  e.currentTarget.value = '';
                }}
              />
            </div>
          ) : (
            <form onSubmit={submitDecline} className="space-y-2">
              <Textarea
                label="Justification"
                rows={3}
                required
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Pourquoi ne pouvez-vous pas fournir ce document ?"
              />
              <div className="flex gap-2 flex-wrap">
                <Button type="submit" disabled={pending}>Valider la justification</Button>
                <Button type="button" variant="ghost" onClick={() => { setShowDecline(false); setDeclineReason(''); setError(null); }}>
                  Annuler
                </Button>
              </div>
            </form>
          )}
        </>
      )}

      {error && <p className="text-xs text-orange">{error}</p>}
    </li>
  );
}
