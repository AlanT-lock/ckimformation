import Link from 'next/link';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { redirectEmployeeStagiaire } from '@/lib/auth/employee-guard';
import type { InscriptionStatut } from '@/lib/supabase/types';

const STATUT_LABEL: Record<string, { label: string; className: string }> = {
  en_attente:      { label: 'En attente',  className: 'bg-orange/10 text-orange' },
  confirmee:       { label: 'Confirmée',   className: 'bg-teal/10 text-teal' },
  refusee:         { label: 'Refusée',     className: 'bg-dark/10 text-dark/60' },
  pending_payment: { label: 'En attente',  className: 'bg-orange/10 text-orange' },
  paid:            { label: 'Confirmée',   className: 'bg-teal/10 text-teal' },
  cancelled:       { label: 'Annulée',     className: 'bg-dark/10 text-dark/50' },
  refunded:        { label: 'Remboursée',  className: 'bg-dark/5 text-dark/40' },
};

const FR_DATE = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

interface PageProps { searchParams: Promise<{ demande?: string; warn?: string }> }

interface ParticipantRow {
  employee: { prenom: string; nom: string; email: string } | { prenom: string; nom: string; email: string }[] | null;
  profile: { full_name: string; email: string } | { full_name: string; email: string }[] | null;
}

interface InscriptionListItem {
  id: string;
  statut: string;
  created_at: string;
  refus_motif: string | null;
  analyse_besoins: string | null;
  session: unknown;
  participants: ParticipantRow[] | null;
}

async function loadInscriptions(payerId: string): Promise<
  | { ok: true; rows: InscriptionListItem[] }
  | { ok: false; error: string }
> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('inscriptions')
      .select(`
        id, statut, created_at, refus_motif, analyse_besoins,
        session:sessions(
          id, statut,
          formation:formations(slug, titre),
          creneaux:session_creneaux(date, ordre)
        ),
        participants:inscription_participants(
          id,
          employee:employees(prenom, nom, email),
          profile:profiles!inscription_participants_participant_profile_id_fkey(full_name, email)
        )
      `)
      .eq('payer_profile_id', payerId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[stagiaire/inscriptions] query failed', error);
      return { ok: false, error: `${error.code ?? 'PG'} — ${error.message}${error.details ? ` (${error.details})` : ''}` };
    }
    return { ok: true, rows: (data ?? []) as unknown as InscriptionListItem[] };
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    console.error('[stagiaire/inscriptions] unexpected', err);
    return { ok: false, error: msg };
  }
}

export default async function StagiaireDemandesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;
  redirectEmployeeStagiaire(profile);

  const result = await loadInscriptions(profile.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mon espace"
        title="Mes demandes"
        description={
          profile.account_type === 'entreprise'
            ? 'Toutes les demandes d\'inscription envoyées pour vos salariés.'
            : 'Toutes vos demandes d\'inscription.'
        }
        actions={<ButtonLink href="/stagiaire/formations" variant="secondary">+ Catalogue</ButtonLink>}
      />

      {sp.demande && (
        <div className="bg-teal/10 border border-teal/30 rounded-lg p-4 text-sm text-teal">
          Demande envoyée{Number(sp.demande) > 1 ? ` pour ${sp.demande} participants` : ''}. Nous vous recontactons après vérification.
        </div>
      )}
      {sp.warn && (
        <div className="bg-orange/10 border border-orange/30 rounded-lg p-4 text-sm text-orange whitespace-pre-line">
          {sp.warn}
        </div>
      )}

      {!result.ok && (
        <div className="bg-orange/10 border border-orange/30 rounded-lg p-4 text-sm">
          <p className="font-medium text-orange">Impossible de charger vos demandes.</p>
          <p className="mt-1 text-dark/70 font-mono text-xs whitespace-pre-wrap">{result.error}</p>
        </div>
      )}

      {result.ok && (
        <div className="bg-white rounded-lg border border-dark/10 overflow-hidden">
          {result.rows.length === 0 ? (
            <p className="p-8 text-sm text-dark/60 text-center">
              Aucune demande pour le moment.{' '}
              <Link href="/stagiaire/formations" className="text-teal underline">
                Voir le catalogue
              </Link>
            </p>
          ) : (
            <ul className="divide-y divide-dark/10">
              {result.rows.map((ins) => {
                const sess = Array.isArray(ins.session) ? (ins.session as { id?: string; formation?: unknown; creneaux?: { date: string; ordre: number }[] }[])[0] : (ins.session as { id?: string; formation?: unknown; creneaux?: { date: string; ordre: number }[] } | null);
                const formationRaw = sess?.formation;
                const form = Array.isArray(formationRaw) ? (formationRaw[0] as { titre?: string } | undefined) : (formationRaw as { titre?: string } | undefined);
                const creneaux = sess?.creneaux ?? [];
                const sortedCreneaux = [...creneaux].sort((a, b) => a.ordre - b.ordre);
                const first = sortedCreneaux[0]?.date;
                const last = sortedCreneaux[sortedCreneaux.length - 1]?.date;
                const statut = STATUT_LABEL[ins.statut as InscriptionStatut] ?? STATUT_LABEL.en_attente;
                const participants = (ins.participants ?? []) as ParticipantRow[];
                return (
                  <li key={ins.id} className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="font-medium">{form?.titre ?? '—'}</div>
                        <div className="text-xs text-dark/60 mt-1">
                          {first ? FR_DATE.format(new Date(first)) : '—'}
                          {last && last !== first && <> → {FR_DATE.format(new Date(last))}</>}
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium ${statut.className}`}>
                        {statut.label}
                      </span>
                    </div>

                    <div className="mt-3 text-sm">
                      <span className="text-xs uppercase tracking-[0.15em] text-dark/50">Participants</span>
                      <ul className="mt-1 text-dark/80">
                        {participants.map((p, idx) => {
                          const emp = Array.isArray(p.employee) ? p.employee[0] : p.employee;
                          const prof = Array.isArray(p.profile) ? p.profile[0] : p.profile;
                          if (emp) return <li key={`emp-${idx}`}>{emp.prenom} {emp.nom} — <span className="text-dark/60">{emp.email}</span></li>;
                          if (prof) return <li key={`prof-${idx}`}>{prof.full_name} — <span className="text-dark/60">{prof.email}</span></li>;
                          return null;
                        })}
                      </ul>
                    </div>

                    {ins.statut === 'refusee' && ins.refus_motif && (
                      <div className="mt-3 p-3 rounded bg-orange/10 border border-orange/30 text-sm text-orange whitespace-pre-line">
                        <span className="font-medium">Motif du refus : </span>
                        {ins.refus_motif}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
