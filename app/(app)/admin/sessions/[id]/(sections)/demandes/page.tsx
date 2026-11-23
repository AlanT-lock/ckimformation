import Link from 'next/link';
import { loadInscriptions, requireAdminSession } from '../../session-data';
import { SectionHeading } from '../SectionHeading';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminSessionDemandesPage({ params }: PageProps) {
  const { id } = await params;
  const session = await requireAdminSession(id);
  const { inscriptions } = await loadInscriptions(id);

  return (
    <section>
      <SectionHeading title={`Demandes d'inscription (${inscriptions.length})`} />
      <div className="mt-4 bg-white border border-dark/10 rounded-lg overflow-x-auto">
        {inscriptions.length === 0 ? (
          <p className="p-6 text-sm text-dark/60">Aucune demande pour l&apos;instant.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-light text-xs uppercase tracking-[0.15em] text-dark/60">
              <tr>
                <th className="text-left py-2 px-4">Demandeur</th>
                <th className="text-left py-2 px-4">Participants</th>
                <th className="text-left py-2 px-4">Statut</th>
                <th className="text-left py-2 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark/10">
              {inscriptions.map((ins) => (
                <tr key={ins.id}>
                  <td className="py-2 px-4">
                    {ins.payerLabel}
                    {ins.payerIsEntreprise && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-teal/10 text-teal">Entreprise</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-dark/70">
                    <ul className="space-y-0.5">
                      {ins.participants.map((p) => (
                        <li key={p.id}>
                          <Link
                            href={`/admin/sessions/${session.id}/participants/${p.id}`}
                            className="text-teal hover:underline"
                          >
                            {p.label}
                          </Link>
                          {p.email && <span className="text-dark/50 text-xs ml-1">({p.email})</span>}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-2 px-4">{ins.statut}</td>
                  <td className="py-2 px-4 text-right">
                    <Link href={`/admin/demandes/${ins.id}`} className="text-teal hover:underline text-sm">
                      Voir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}
