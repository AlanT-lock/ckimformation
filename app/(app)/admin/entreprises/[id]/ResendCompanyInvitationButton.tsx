'use client';

import { useState, useTransition } from 'react';
import { Button } from '@/components/app/Button';
import { resendCompanyInvitation } from '../actions';

export function ResendCompanyInvitationButton({ companyId }: { companyId: string }) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <Button
        variant="secondary"
        disabled={pending}
        onClick={() => startTransition(async () => {
          const res = await resendCompanyInvitation(companyId);
          setMsg(res.ok ? { ok: true, text: 'Invitation renvoyée.' } : { ok: false, text: res.error });
        })}
      >
        {pending ? 'Envoi…' : "Renvoyer l'invitation"}
      </Button>
      {msg && <span className={`text-sm ${msg.ok ? 'text-teal' : 'text-orange'}`}>{msg.text}</span>}
    </div>
  );
}
