'use client';

import { useState, useTransition } from 'react';
import { Field } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { inviteFormateur } from './actions';

export function InviteFormateurForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [full_name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        await inviteFormateur({ email, full_name, phone: phone || undefined });
        setSuccess(`Invitation envoyée à ${email}.`);
        setName(''); setEmail(''); setPhone('');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur');
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-2xl">
      {error && (
        <div className="text-sm text-orange bg-orange/10 border border-orange/30 rounded p-3">{error}</div>
      )}
      {success && (
        <div className="text-sm text-teal bg-teal/10 border border-teal/30 rounded p-3">{success}</div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Field label="Nom et prénom" value={full_name} onChange={(e) => setName(e.target.value)} required />
        <Field label="Téléphone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>
      <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <Button type="submit" disabled={pending}>
        {pending ? 'Envoi…' : 'Envoyer l\'invitation'}
      </Button>
    </form>
  );
}
