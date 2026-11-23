import { createClient } from '@/lib/supabase/server';
import { SessionForm } from '../../SessionForm';
import { requireAdminSession } from '../session-data';
import { SectionHeading } from './SectionHeading';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSessionInformationsPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireAdminSession(id);

  const supabase = await createClient();
  const [{ data: formations }, { data: formateurs }] = await Promise.all([
    supabase.from('formations').select('id, slug, titre').eq('actif', true).order('titre'),
    supabase.from('profiles').select('id, full_name, email').eq('role', 'formateur').order('full_name'),
  ]);

  return (
    <section>
      <SectionHeading
        title="Informations"
        description={`Formation, formateur, statut, adresse et notes internes. ID ${session.id.slice(0, 8)}…`}
      />
      <div className="mt-4">
        <SessionForm
          formations={formations ?? []}
          formateurs={formateurs ?? []}
          initial={{
            id: session.id,
            formation_id: session.formation_id,
            formateur_id: session.formateur_id,
            statut: session.statut,
            adresse: session.adresse ?? undefined,
            notes_internes: session.notes_internes,
          }}
        />
      </div>
    </section>
  );
}
