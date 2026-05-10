import { createClient, getCurrentProfile } from '@/lib/supabase/server';

export default async function FormateurHome() {
  const profile = await getCurrentProfile();
  const supabase = await createClient();
  const { data: sessions } = await supabase
    .from('sessions')
    .select('id, statut, formation:formations(slug, titre)')
    .eq('formateur_id', profile!.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-teal">Espace formateur</p>
        <h1 className="font-display text-4xl md:text-5xl tracking-wide mt-2">
          Bonjour {profile!.full_name?.split(' ')[0] || ''}.
        </h1>
      </div>

      <section>
        <h2 className="font-display text-2xl tracking-wide">Mes sessions</h2>
        <div className="mt-4 bg-white rounded-lg border border-dark/10 divide-y divide-dark/10">
          {(!sessions || sessions.length === 0) && (
            <p className="p-6 text-sm text-dark/60">
              Aucune session ne t&apos;est encore assignée. L&apos;administrateur t&apos;assignera depuis son espace.
            </p>
          )}
          {sessions?.map((s) => {
            const f = Array.isArray(s.formation) ? s.formation[0] : s.formation;
            return (
              <div key={s.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{f?.titre ?? '—'}</p>
                  <p className="text-xs text-dark/50">Statut : {s.statut}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
