'use client';

import Link from 'next/link';
import { useState } from 'react';

export interface TestsExportRow {
  participantId: string;
  nom: string;
  entreprise: string | null;
  completedCount: number;
}

export function TestsExportPanel({ sessionId, rows }: { sessionId: string; rows: TestsExportRow[] }) {
  const [target, setTarget] = useState<string>('');
  const base = `/api/pdf/tests/session/${sessionId}`;
  const href = target ? `${base}?participant=${target}` : base;

  if (rows.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-dark/10 p-6 text-sm text-dark/60">
        Aucun stagiaire confirmé sur cette session.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-dark/10 rounded-lg p-4 flex flex-wrap items-end gap-3">
        <label className="block flex-1 min-w-[220px]">
          <span className="text-xs uppercase tracking-[0.15em] text-dark/60">Exporter</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 text-sm focus:outline-none focus:border-teal"
          >
            <option value="">Tous les stagiaires (un seul PDF)</option>
            {rows.map((r) => (
              <option key={r.participantId} value={r.participantId}>
                {r.nom}
              </option>
            ))}
          </select>
        </label>
        <a
          href={href}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center px-4 py-2 rounded text-sm font-medium bg-teal hover:bg-teal-l text-white transition whitespace-nowrap"
        >
          Exporter en PDF
        </a>
      </div>

      <div className="bg-white border border-dark/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
            <tr>
              <th className="text-left py-2 px-4">Stagiaire</th>
              <th className="text-left py-2 px-4">Tests &amp; enquêtes complétés</th>
              <th className="py-2 px-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark/10">
            {rows.map((r) => (
              <tr key={r.participantId}>
                <td className="py-2 px-4">
                  <Link
                    href={`/admin/sessions/${sessionId}/participants/${r.participantId}`}
                    className="font-medium text-teal hover:underline"
                  >
                    {r.nom}
                  </Link>
                  {r.entreprise && <div className="text-xs text-dark/50">{r.entreprise}</div>}
                </td>
                <td className="py-2 px-4 text-dark/70">{r.completedCount}</td>
                <td className="py-2 px-4 text-right">
                  <a
                    href={`${base}?participant=${r.participantId}`}
                    target="_blank"
                    rel="noopener"
                    className="text-xs px-2.5 py-1 rounded border border-teal/40 text-teal hover:bg-teal hover:text-white transition"
                  >
                    PDF
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
