import { redirect } from 'next/navigation';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { getCurrentProfile } from '@/lib/supabase/server';
import { getAllSecteurs } from '@/lib/db/secteurs';
import { NewCompanyForm } from './NewCompanyForm';

export const dynamic = 'force-dynamic';

export default async function NouvelleEntreprisePage() {
  const me = await getCurrentProfile();
  if (!me || me.role !== 'admin') redirect('/login');
  const secteurs = await getAllSecteurs();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Entreprises"
        title="Ajouter une entreprise"
        description="Renseignez les informations de l'entreprise. Un email d'invitation sera envoyé au contact pour valider l'inscription et définir son mot de passe."
        actions={<ButtonLink href="/admin/entreprises" variant="secondary">← Liste</ButtonLink>}
      />
      <NewCompanyForm secteurs={secteurs} />
    </div>
  );
}
