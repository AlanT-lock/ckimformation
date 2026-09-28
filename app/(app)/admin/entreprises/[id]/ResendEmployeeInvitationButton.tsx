'use client';

import { useState, useTransition } from 'react';
import { resendEmployeeInvitationByAdmin } from '../actions';

export function ResendEmployeeInvitationButton({ companyId, employeeId }: { companyId: string; employeeId: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  if (msg) return <span className={`text-xs ${msg.ok ? 'text-teal' : 'text-orange'}`}>{msg.text}</span>;
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(async () => {
        const res = await resendEmployeeInvitationByAdmin(companyId, employeeId);
        setMsg(res.ok ? { ok: true, text: res.message } : { ok: false, text: res.error });
      })}
      className="text-xs uppercase tracking-[0.15em] text-teal hover:underline disabled:opacity-50 whitespace-nowrap"
    >
      {pending ? 'Envoi…' : "Renvoyer l'invitation"}
    </button>
  );
}
