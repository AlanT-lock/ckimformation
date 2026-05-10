import { createClient } from '@/lib/supabase/server';

export default async function AdminHome() {
  const supabase = await createClient();
  const [{ count: cFormations }, { count: cSessions }, { count: cInscriptions }] = await Promise.all([
    supabase.from('formations').select('*', { count: 'exact', head: true }),
    supabase.from('sessions').select('*', { count: 'exact', head: true }),
    supabase.from('inscriptions').select('*', { count: 'exact', head: true }),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal">Administration</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-wide mt-2">Tableau de bord.</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Stat label="Formations" value={cFormations ?? 0} />
        <Stat label="Sessions programmées" value={cSessions ?? 0} />
        <Stat label="Inscriptions" value={cInscriptions ?? 0} />
      </div>

      <div className="bg-white rounded-lg border border-dark/10 p-6">
        <h2 className="font-display text-2xl tracking-wide">Prochaines étapes</h2>
        <ul className="mt-4 space-y-2 text-sm text-dark/70 list-disc pl-5">
          <li>Créer une session : <code className="bg-light px-1 rounded">/admin/sessions/nouvelle</code> (à venir)</li>
          <li>Configurer un test pour une formation : <code className="bg-light px-1 rounded">/admin/tests</code> (à venir)</li>
          <li>Inviter un formateur : <code className="bg-light px-1 rounded">/admin/utilisateurs</code> (à venir)</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white rounded-lg border border-dark/10 p-6">
      <p className="text-xs uppercase tracking-[0.3em] text-dark/50">{label}</p>
      <p className="font-display text-5xl mt-2 text-teal">{value}</p>
    </div>
  );
}
