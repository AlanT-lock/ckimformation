'use client';

import { useState, useTransition } from 'react';
import { Field } from '@/components/app/Field';
import { Button } from '@/components/app/Button';
import { createEmployee } from './actions';

export function AddEmployeeForm() {
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await createEmployee({ prenom, nom, email });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setPrenom('');
      setNom('');
      setEmail('');
      if (res.self) {
        setSuccess(
          'Vous êtes ajouté·e comme salarié·e. Vous pouvez maintenant vous inscrire aux sessions et suivre vos formations depuis « En formation ».',
        );
      } else if (res.invitation === 'sent') {
        setSuccess(
          'Ce salarié a déjà un compte. Une invitation de rattachement lui a été envoyée par email.',
        );
      } else if (res.invitation === 'failed') {
        setSuccess(
          'Salarié ajouté, mais l’email d’invitation n’a pas pu être envoyé. Utilisez « Renvoyer l’invitation ».',
        );
      } else if (!res.created) {
        setSuccess('Ce salarié est déjà dans votre liste.');
      } else {
        setSuccess('Salarié ajouté.');
      }
    });
  }

  return (
    <form onSubmit={submit} className="bg-white border border-dark/10 rounded-lg p-6">
      <h2 className="font-display text-xl mb-4">Ajouter un salarié</h2>
      <p className="text-sm text-dark/60 mb-4">
        S’il a déjà un compte C-KIM, il recevra une invitation pour rattacher ce compte à votre entreprise
        — aucun second profil ne sera créé. Vous suivez vous-même une formation ? Ajoutez-vous avec votre
        propre adresse email.
      </p>
      <div className="grid sm:grid-cols-3 gap-4">
        <Field label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
        <Field label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <div className="mt-4 flex gap-3 items-center flex-wrap">
        <Button type="submit" disabled={pending}>
          {pending ? 'Ajout…' : 'Ajouter le salarié'}
        </Button>
        {error && <p className="text-sm text-orange">{error}</p>}
        {success && <p className="text-sm text-teal">{success}</p>}
      </div>
    </form>
  );
}
