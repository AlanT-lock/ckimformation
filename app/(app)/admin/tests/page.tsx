import { redirect } from 'next/navigation';

// Les tests & enquêtes se gèrent désormais depuis l'onglet de chaque formation.
export default function AdminTestsPage() {
  redirect('/admin/formations');
}
