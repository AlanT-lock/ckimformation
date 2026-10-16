import { FinanceurView } from '../_views/FinanceurView';

export const dynamic = 'force-dynamic';

// Enquête financeur ouverte seule (depuis « Analyses enquêtes »).
export default function AdminEnqueteFinanceurPage() {
  return <FinanceurView formationId={null} />;
}
