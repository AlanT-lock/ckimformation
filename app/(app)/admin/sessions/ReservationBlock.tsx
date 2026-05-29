'use client';

import { EtablissementSearch } from './EtablissementSearch';
import { DocumentRequestsEditor, type DocRequestDraft } from './DocumentRequestsEditor';
import { AdminDocumentsUploader, type AdminDocDraft } from './AdminDocumentsUploader';
import type { EtablissementSearchResult } from './reservation-actions';

export interface ReservationData {
  mode: 'public' | 'reserved';
  selectedEtab: EtablissementSearchResult | null;
  invitation: {
    enabled: boolean;
    email: string;
    raison_sociale: string;
    siret: string;
    contact_nom: string;
    contact_fonction: string;
    contact_phone: string;
  };
  docRequests: DocRequestDraft[];
  adminDocs: AdminDocDraft[];
}

export const EMPTY_RESERVATION: ReservationData = {
  mode: 'public',
  selectedEtab: null,
  invitation: { enabled: false, email: '', raison_sociale: '', siret: '', contact_nom: '', contact_fonction: '', contact_phone: '' },
  docRequests: [],
  adminDocs: [],
};

interface Props {
  value: ReservationData;
  onChange: (v: ReservationData) => void;
  hideMode?: boolean;
}

export function ReservationBlock({ value, onChange, hideMode = false }: Props) {
  function patch<K extends keyof ReservationData>(k: K, v: ReservationData[K]) {
    onChange({ ...value, [k]: v });
  }

  return (
    <div className="space-y-6 border-2 border-emerald-200 rounded-lg p-4 bg-emerald-50/30">
      {!hideMode && (
        <div>
          <div className="font-semibold mb-2">Visibilité de la session</div>
          <div className="flex gap-2">
            <button type="button"
              className={`px-4 py-2 rounded border ${value.mode === 'public' ? 'bg-emerald-600 text-white' : 'bg-white'}`}
              onClick={() => onChange({ ...EMPTY_RESERVATION })}>
              Publique
            </button>
            <button type="button"
              className={`px-4 py-2 rounded border ${value.mode === 'reserved' ? 'bg-emerald-600 text-white' : 'bg-white'}`}
              onClick={() => patch('mode', 'reserved')}>
              Réservée à un établissement
            </button>
          </div>
        </div>
      )}

      {value.mode === 'reserved' && (
        <>
          <div>
            <div className="font-semibold mb-2">Établissement</div>
            <EtablissementSearch
              selected={value.selectedEtab}
              onSelect={(e) => onChange({ ...value, selectedEtab: e, invitation: { ...value.invitation, enabled: false } })}
            />
            {!value.selectedEtab && (
              <div className="mt-3">
                <button type="button"
                  className="text-sm text-emerald-700 underline"
                  onClick={() => patch('invitation', { ...value.invitation, enabled: !value.invitation.enabled })}>
                  {value.invitation.enabled ? '— Masquer le formulaire d&apos;invitation' : '+ Inviter un nouvel établissement'}
                </button>
                {value.invitation.enabled && (
                  <div className="mt-3 space-y-2 border rounded p-3 bg-white">
                    {([
                      ['email', 'Email'],
                      ['raison_sociale', 'Raison sociale'],
                      ['siret', 'SIRET'],
                      ['contact_nom', 'Contact (nom)'],
                      ['contact_fonction', 'Contact (fonction)'],
                      ['contact_phone', 'Téléphone'],
                    ] as const).map(([k, label]) => (
                      <label key={k} className="block text-sm font-medium">{label}
                        <input className="mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 focus:outline-none focus:border-teal"
                          value={value.invitation[k] as string}
                          onChange={(e) => patch('invitation', { ...value.invitation, [k]: e.target.value })} />
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <div className="font-semibold mb-2">Documents demandés à l&apos;établissement</div>
            <DocumentRequestsEditor value={value.docRequests} onChange={(v) => patch('docRequests', v)} />
          </div>

          <div>
            <div className="font-semibold mb-2">Documents à transmettre à l&apos;établissement</div>
            <AdminDocumentsUploader value={value.adminDocs} onChange={(v) => patch('adminDocs', v)} />
          </div>
        </>
      )}
    </div>
  );
}
