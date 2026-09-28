'use client';

import { useEffect, useState, useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { Select } from '@/components/app/Field';
import type { EnrollableSessionOption } from '@/lib/companies/queries';
import { enrollEmployeesByAdmin, getEnrolledEmployeeIds } from '../actions';

export function EnrollEmployeesDialog({
  companyId,
  sessions,
  employees,
}: {
  companyId: string;
  sessions: EnrollableSessionOption[];
  employees: { id: string; name: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [taken, setTaken] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    getEnrolledEmployeeIds(companyId, sessionId).then((ids) => {
      if (!cancelled) setTaken(new Set(ids));
    });
    return () => { cancelled = true; };
  }, [companyId, sessionId]);

  function pickSession(id: string) {
    setSessionId(id);
    setSelected(new Set());
    setTaken(new Set());
  }

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function submit() {
    setMsg(null);
    startTransition(async () => {
      const res = await enrollEmployeesByAdmin(companyId, sessionId, [...selected]);
      if (!res.ok) { setMsg({ ok: false, text: res.error }); return; }
      const s = (n: number) => (n > 1 ? 's' : '');
      setMsg({
        ok: true,
        text: `${res.enrolled} salarié${s(res.enrolled)} inscrit${s(res.enrolled)}${res.skipped ? ` (${res.skipped} déjà inscrit${s(res.skipped)})` : ''}.`,
      });
      setOpen(false);
      pickSession('');
    });
  }

  if (!open) {
    return (
      <div className="flex items-center gap-3">
        {msg?.ok && <span className="text-sm text-teal">{msg.text}</span>}
        <Button variant="secondary" onClick={() => { setMsg(null); setOpen(true); }} disabled={employees.length === 0}>
          Inscrire des salariés
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-dark/40 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h3 className="font-display text-xl">Inscrire des salariés à une session</h3>

        {sessions.length === 0 ? (
          <p className="text-sm text-dark/60">Aucune session à venir ouverte à cette entreprise.</p>
        ) : (
          <Select label="Session" value={sessionId} onChange={(e) => pickSession(e.target.value)}>
            <option value="">— Choisir une session —</option>
            {sessions.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        )}

        {sessionId && (
          <fieldset className="space-y-2">
            <legend className="text-xs uppercase tracking-[0.2em] text-dark/60 mb-1">Salariés</legend>
            {employees.map((e) => {
              const isTaken = taken.has(e.id);
              return (
                <label key={e.id} className={`flex items-center gap-2 text-sm ${isTaken ? 'text-dark/40' : ''}`}>
                  <input type="checkbox" disabled={isTaken} checked={selected.has(e.id)} onChange={() => toggle(e.id)} />
                  {e.name}
                  {isTaken && <span className="text-xs">(déjà inscrit)</span>}
                </label>
              );
            })}
          </fieldset>
        )}

        {msg && !msg.ok && <p className="text-sm text-orange">{msg.text}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
          <Button onClick={submit} disabled={pending || !sessionId || selected.size === 0}>
            {pending ? 'Inscription…' : `Inscrire (${selected.size})`}
          </Button>
        </div>
      </div>
    </div>
  );
}
