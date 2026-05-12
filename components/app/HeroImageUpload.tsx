'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';

// Recommandation alignée sur les visuels existants (1600×1067 — 3:2 paysage).
// Plage tolérée sans alerte : 1.4 (proche 3:2) à 2.0 (paysage cinéma léger).
const RECO = {
  width: 1600,
  height: 1067,
  ratio: 1.5,
  minWidth: 1200,
  ratioMin: 1.4,
  ratioMax: 2.0,
};

interface Props {
  value: string | null;
  onChange: (url: string) => void;
  alt: string;
  onAltChange: (alt: string) => void;
  slugHint?: string;
}

interface PendingFile {
  file: File;
  previewUrl: string;
  width: number;
  height: number;
  ratio: number;
  warning: string | null;
}

function describeRatio(r: number): string {
  if (r < 0.9) return 'portrait (vertical)';
  if (r < 1.1) return 'carré';
  if (r < RECO.ratioMin) return 'paysage léger';
  if (r > RECO.ratioMax) return 'panoramique (très large)';
  return 'paysage';
}

export function HeroImageUpload({
  value,
  onChange,
  alt,
  onAltChange,
  slugHint,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function pickFile() {
    fileRef.current?.click();
  }

  async function readImage(file: File): Promise<PendingFile> {
    const previewUrl = URL.createObjectURL(file);
    return new Promise<PendingFile>((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const { naturalWidth: width, naturalHeight: height } = img;
        const ratio = width / height;
        let warning: string | null = null;
        if (ratio < RECO.ratioMin || ratio > RECO.ratioMax) {
          warning =
            `Votre image est ${describeRatio(ratio)} (ratio ${ratio.toFixed(2)}:1, ${width}×${height}px). ` +
            `Le hero affiche un format paysage 3:2 — l'image risque d'être recadrée (haut/bas ou côtés).`;
        } else if (width < RECO.minWidth) {
          warning =
            `Image trop petite (${width}×${height}px). ` +
            `Recommandé : au moins ${RECO.minWidth}px de large pour éviter le flou sur grands écrans.`;
        }
        resolve({ file, previewUrl, width, height, ratio, warning });
      };
      img.onerror = () => {
        URL.revokeObjectURL(previewUrl);
        reject(new Error("Impossible de lire l'image."));
      };
      img.src = previewUrl;
    });
  }

  async function onFile(file: File) {
    setError(null);
    if (file.size > 5 * 1024 * 1024) {
      setError('Fichier trop volumineux (max 5 MB).');
      return;
    }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      setError('Format non supporté — utilisez JPEG, PNG, WebP ou AVIF.');
      return;
    }
    try {
      const next = await readImage(file);
      // Si pas d'avertissement, on upload directement
      if (!next.warning) {
        await doUpload(next);
      } else {
        setPending(next);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de lecture du fichier.');
    }
  }

  async function doUpload(p: PendingFile) {
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', p.file);
      if (slugHint) fd.append('slug', slugHint);
      const res = await fetch('/api/admin/formations/upload-hero', {
        method: 'POST',
        body: fd,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.error || 'Échec de l\'upload.');
      }
      onChange(json.url);
      URL.revokeObjectURL(p.previewUrl);
      setPending(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur upload.');
    } finally {
      setUploading(false);
    }
  }

  function cancelPending() {
    if (pending) URL.revokeObjectURL(pending.previewUrl);
    setPending(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-dark/70 mb-2">
          Image de la section HERO
        </div>
        <p className="text-xs text-dark/60 mb-3">
          Format recommandé : <strong>paysage 3:2 (idéal {RECO.width}×{RECO.height}px)</strong> — JPEG, PNG, WebP ou AVIF, max 5 MB.
        </p>

        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) onFile(f);
          }}
          className={`relative border-2 border-dashed rounded-lg overflow-hidden transition-colors ${
            dragOver ? 'border-teal bg-teal/5' : 'border-dark/15 bg-light/40'
          }`}
        >
          {value ? (
            <div className="relative">
              {/* Aperçu de l'image actuelle, dans le ratio cible 3:2 (recadré comme sur le site) */}
              <div className="relative w-full aspect-[3/2] bg-dark/5">
                <Image
                  src={value}
                  alt={alt || 'Aperçu hero'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 800px"
                />
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-dark/85 to-transparent p-3 flex items-center justify-between gap-2">
                <span className="text-xs text-white/90 truncate">
                  {value.startsWith('/') ? value : 'Image hébergée'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={pickFile}
                    className="text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded bg-white/90 text-dark hover:bg-white"
                  >
                    Remplacer
                  </button>
                  <button
                    type="button"
                    onClick={() => onChange('')}
                    className="text-xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded bg-white/10 text-white border border-white/30 hover:bg-white/20"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={pickFile}
              className="w-full aspect-[3/2] flex flex-col items-center justify-center gap-2 text-dark/60 hover:text-dark hover:bg-light/70 transition-colors"
            >
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
              <span className="text-sm font-medium">Cliquer pour importer une image</span>
              <span className="text-xs">ou glissez-déposez un fichier ici</span>
            </button>
          )}
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = '';
          }}
        />

        {uploading && (
          <p className="mt-2 text-xs text-teal">Upload en cours…</p>
        )}
        {error && (
          <p className="mt-2 text-xs text-orange bg-orange/10 border border-orange/30 rounded p-2">
            {error}
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-dark/70 mb-1.5">
          Texte alternatif (accessibilité / SEO)
        </label>
        <input
          type="text"
          value={alt}
          onChange={(e) => onAltChange(e.target.value)}
          placeholder="Ex. Formateur expliquant la procédure d'évacuation à un groupe"
          className="w-full rounded border border-dark/15 bg-white px-3 py-2 text-sm focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
        />
      </div>

      {/* Pop-up de confirmation si format hors plage recommandée */}
      {pending && pending.warning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-dark/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-orange/10 border-b border-orange/20 px-5 py-3">
              <div className="flex items-center gap-2 text-orange font-semibold">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                Format de l&apos;image
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-light rounded p-3">
                  <div className="text-dark/50 uppercase tracking-wider mb-1">Recommandé</div>
                  <div className="font-mono font-semibold">{RECO.width} × {RECO.height} px</div>
                  <div className="text-dark/60 mt-0.5">paysage 3:2 (ratio 1.5)</div>
                </div>
                <div className="bg-orange/5 border border-orange/20 rounded p-3">
                  <div className="text-orange/80 uppercase tracking-wider mb-1">Votre image</div>
                  <div className="font-mono font-semibold">{pending.width} × {pending.height} px</div>
                  <div className="text-dark/60 mt-0.5">
                    {describeRatio(pending.ratio)} (ratio {pending.ratio.toFixed(2)})
                  </div>
                </div>
              </div>

              <p className="text-sm text-dark/80 leading-relaxed">{pending.warning}</p>

              <div className="rounded border border-dark/10 overflow-hidden">
                <div className="relative w-full aspect-[3/2] bg-dark/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pending.previewUrl}
                    alt="Aperçu"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
                <p className="text-[10px] text-dark/50 px-2 py-1 bg-light/60 border-t border-dark/5">
                  Aperçu du recadrage tel qu&apos;il apparaîtra sur la page de la formation
                </p>
              </div>
            </div>

            <div className="px-5 py-3 bg-light/60 border-t border-dark/10 flex justify-end gap-2">
              <button
                type="button"
                onClick={cancelPending}
                disabled={uploading}
                className="px-4 py-2 rounded text-sm font-medium border border-dark/20 text-dark hover:bg-white transition disabled:opacity-50"
              >
                Choisir une autre image
              </button>
              <button
                type="button"
                onClick={() => doUpload(pending)}
                disabled={uploading}
                className="px-4 py-2 rounded text-sm font-medium bg-orange text-white hover:bg-orange/90 transition disabled:opacity-50"
              >
                {uploading ? 'Upload…' : 'Utiliser quand même'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
