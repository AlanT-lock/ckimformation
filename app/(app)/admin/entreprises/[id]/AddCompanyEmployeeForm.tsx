'use client';

import { useState, useTransition } from 'react';
import { Field } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { addEmployeeByAdmin } from '../actions';

export function AddCompanyEmployeeForm({ companyId }: { companyId: string }) {
  const [open, setOpen] = useState(false);
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return (
      <div className="px-6 pb-4">
        <Button variant="secondary" onClick={() => { setMsg(null); setOpen(true); }}>+ Ajouter un salarié</Button>
        {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-teal' : 'text-orange'}`}>{msg.text}</p>}
      </div>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    startTransition(async () => {
      const res = await addEmployeeByAdmin(companyId, { prenom, nom, email });
      if (!res.ok) { setMsg({ ok: false, text: res.error }); return; }
      setPrenom(''); setNom(''); setEmail('');
      setOpen(false);
      setMsg({ ok: true, text: res.message });
    });
  }

  return (
    <form onSubmit={submit} className="mx-6 mb-4 border border-dark/10 rounded p-4 bg-light/40">
      <p className="text-sm text-dark/60 mb-3">
        Le salarié recevra un email pour créer son mot de passe. S’il a déjà un compte C-KIM, il recevra une invitation de rattachement.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
        <Field label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="mt-4 flex gap-3 items-center flex-wrap">
        <Button type="submit" disabled={pending}>{pending ? 'Ajout…' : 'Ajouter et inviter'}</Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
        {msg && !msg.ok && <p className="text-sm text-orange">{msg.text}</p>}
      </div>
    </form>
  );
}
