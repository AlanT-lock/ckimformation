import { HashHandler } from './HashHandler';

interface Props { searchParams: Promise<{ redirect?: string }> }

export default async function CallbackHashPage({ searchParams }: Props) {
  const sp = await searchParams;
  return (
    <div className="text-center text-sm text-muted">
      <p>Connexion en cours…</p>
      <HashHandler redirect={sp.redirect ?? '/stagiaire'} />
    </div>
  );
}
