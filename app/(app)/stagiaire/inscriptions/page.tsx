import Link from 'next/link';
import { PageHeader } from '@/components/app/PageHeader';
import { ButtonLink } from '@/components/app/Button';
import { createClient, getCurrentProfile } from '@/lib/supabase/server';
import { redirectEmployeeStagiaire } from '@/lib/auth/employee-guard';
import type { InscriptionStatut } from '@/lib/supabase/types';

const STATUT_LABEL: Record<string, { label: string; className: string }> = {
  en_attente:          { label: 'En attente',          className: 'bg-orange/10 text-orange' },
  documents_demandes:  { label: 'Documents demandés',  className: 'bg-orange/15 text-orange' },
  documents_recus:     { label: 'Documents reçus',     className: 'bg-teal/10 text-teal' },
  confirmee:           { label: 'Confirmée',           className: 'bg-teal/10 text-teal' },
  refusee:             { label: 'Refusée',             className: 'bg-dark/10 text-dark/60' },
  pending_payment:     { label: 'En attente',          className: 'bg-orange/10 text-orange' },
  paid:                { label: 'Confirmée',           className: 'bg-teal/10 text-teal' },
  cancelled:           { label: 'Annulée',             className: 'bg-dark/10 text-dark/50' },
  refunded:            { label: 'Remboursée',          className: 'bg-dark/5 text-dark/40' },
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

interface ReservedSessionItem {
  id: string;
  formationTitre: string;
  firstDate: string | null;
  completedAt: string | null;
}

async function loadReservedSessions(companyId: string): Promise<ReservedSessionItem[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id,
        formations(titre, slug),
        session_creneaux(date),
        session_reserved_details(completed_at)
      `)
      .eq('reserved_company_id', companyId)
      .eq('statut', 'published');
    if (error) {
      console.error('[stagiaire/inscriptions] reserved sessions query failed', error);
      return [];
    }
    type RawRow = {
      id: string;
      formations: { titre: string; slug: string } | { titre: string; slug: string }[] | null;
      session_creneaux: { date: string }[] | null;
      session_reserved_details: { completed_at: string | null } | { completed_at: string | null }[] | null;
    };
    return ((data ?? []) as RawRow[]).map((row) => {
      const formation = Array.isArray(row.formations) ? row.formations[0] : row.formations;
      const creneaux = row.session_creneaux ?? [];
      const sortedDates = [...creneaux].map((c) => c.date).filter(Boolean).sort();
      const details = Array.isArray(row.session_reserved_details)
        ? row.session_reserved_details[0]
        : row.session_reserved_details;
      return {
        id: row.id,
        formationTitre: formation?.titre ?? '—',
        firstDate: sortedDates[0] ?? null,
        completedAt: details?.completed_at ?? null,
      };
    });
  } catch (err) {
    console.error('[stagiaire/inscriptions] reserved sessions unexpected', err);
    return [];
  }
}

export default async function StagiaireDemandesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const profile = await getCurrentProfile();
  if (!profile) return null;
  redirectEmployeeStagiaire(profile);

  const result = await loadInscriptions(profile.id);
  const reservedSessions = profile.account_type === 'entreprise'
    ? await loadReservedSessions(profile.id)
    : [];

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

      {reservedSessions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Sessions dédiées à mon établissement</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {reservedSessions.map((s) => {
              const completed = !!s.completedAt;
              const firstDate = s.firstDate ? new Date(s.firstDate).toLocaleDateString('fr-FR') : null;
              return (
                <li key={s.id}>
                  <a href={`/stagiaire/session-dediee/${s.id}`}
                     className="block border rounded p-3 hover:bg-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">{s.formationTitre}</div>
                      {!completed && (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">à compléter</span>
                      )}
                    </div>
                    {firstDate && <div className="text-sm text-gray-600 mt-1">À partir du {firstDate}</div>}
                  </a>
                </li>
              );
            })}
          </ul>
        </section>
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
                  <li key={ins.id}>
                    <Link
                      href={`/stagiaire/inscriptions/${ins.id}`}
                      className="block p-5 hover:bg-light/40 transition"
                    >
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium">{form?.titre ?? '—'}</div>
                          <div className="text-xs text-dark/60 mt-1">
                            {first ? FR_DATE.format(new Date(first)) : '—'}
                            {last && last !== first && <> → {FR_DATE.format(new Date(last))}</>}
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full uppercase tracking-wider font-medium whitespace-nowrap ${statut.className}`}>
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

                      {ins.statut === 'documents_demandes' && (
                        <p className="mt-3 text-xs text-orange font-medium">
                          → Cliquez pour transmettre les documents demandés
                        </p>
                      )}

                      {ins.statut === 'refusee' && ins.refus_motif && (
                        <div className="mt-3 p-3 rounded bg-orange/10 border border-orange/30 text-sm text-orange whitespace-pre-line">
                          <span className="font-medium">Motif du refus : </span>
                          {ins.refus_motif}
                        </div>
                      )}
                    </Link>
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
