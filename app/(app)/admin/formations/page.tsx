import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ButtonLink } from '@/components/app/Button';
import { PageHeader } from '@/components/app/PageHeader';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { PARCOURS_META } from '@/lib/parcours';
import type { Parcours } from '@/lib/types/formation';

export default async function AdminFormationsPage() {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== 'admin') redirect('/login');

  const supabase = await createClient();
  const { data: formations } = await supabase
    .from('formations')
    .select('id, slug, titre, sous_titre, parcours, ref, prix_indicatif, actif, ordre, updated_at')
    .order('ordre', { ascending: true });

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Administration"
        title="Formations"
        description="Crée, édite et supprime les formations affichées sur le site."
        actions={<ButtonLink href="/admin/formations/nouvelle">+ Nouvelle formation</ButtonLink>}
      />

      <div className="bg-white rounded-lg border border-dark/10 overflow-hidden">
        {(!formations || formations.length === 0) ? (
          <p className="p-8 text-sm text-dark/60 text-center">
            Aucune formation pour l&apos;instant.{' '}
            <Link href="/admin/formations/nouvelle" className="text-teal underline">
              Créer la première
            </Link>
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-3 px-4">Titre</th>
                <th className="text-left py-3 px-4">Parcours</th>
                <th className="text-left py-3 px-4">Réf.</th>
                <th className="text-left py-3 px-4">Tarif</th>
                <th className="text-left py-3 px-4">Statut</th>
                <th className="text-right py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {formations.map((f) => {
                const parcoursMeta = PARCOURS_META[f.parcours as Parcours];
                return (
                  <tr key={f.id} className="hover:bg-light/50">
                    <td className="py-3 px-4">
                      <Link href={`/admin/formations/${f.id}`} className="font-medium hover:text-teal">
                        {f.titre}
                        {f.sous_titre && <span className="text-dark/50"> — {f.sous_titre}</span>}
                      </Link>
                      <p className="text-xs text-dark/40 font-mono">{f.slug}</p>
                    </td>
                    <td className="py-3 px-4">
                      {parcoursMeta ? (
                        <span
                          className="text-xs uppercase tracking-wider font-medium"
                          style={{ color: parcoursMeta.couleur }}
                        >
                          {parcoursMeta.label}
                        </span>
                      ) : (
                        <span className="text-dark/40">{f.parcours}</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-dark/70 font-mono text-xs">{f.ref}</td>
                    <td className="py-3 px-4 text-dark/70 text-xs max-w-xs truncate" title={f.prix_indicatif ?? ''}>
                      {f.prix_indicatif}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${
                        f.actif ? 'bg-teal/10 text-teal' : 'bg-dark/10 text-dark/50'
                      }`}>
                        {f.actif ? 'Visible' : 'Masquée'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/formations/${f.id}`}
                        className="text-teal text-xs uppercase tracking-wider hover:underline"
                      >
                        Éditer →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
