'use client';

import { useRef } from 'react';

export interface AdminDocDraft {
  file: File;
  label: string;
}

interface Props {
  value: AdminDocDraft[];
  onChange: (v: AdminDocDraft[]) => void;
}

export function AdminDocumentsUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function onPick(files: FileList | null) {
    if (!files) return;
    const next = [...value, ...Array.from(files).map((f) => ({ file: f, label: '' }))];
    onChange(next);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-700">
        Documents à transmettre à l&apos;établissement (téléchargeables dans son espace).
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        onChange={(e) => onPick(e.target.files)}
        className="block"
      />
      {value.length > 0 && (
        <ul className="border rounded divide-y">
          {value.map((d, i) => (
            <li key={i} className="px-3 py-2 flex items-center gap-3">
              <div className="flex-1 text-sm">
                {d.file.name}{' '}
                <span className="text-gray-500">({Math.round(d.file.size / 1024)} ko)</span>
              </div>
              <input
                placeholder="Intitulé optionnel"
                className="border rounded px-2 py-1 text-sm"
                value={d.label}
                onChange={(e) =>
                  onChange(value.map((x, idx) => (idx === i ? { ...x, label: e.target.value } : x)))
                }
              />
              <button
                type="button"
                className="text-sm text-red-600"
                onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
