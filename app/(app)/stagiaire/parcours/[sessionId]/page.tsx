import { redirect } from 'next/navigation';

// Pré-formation : émargements et tests ne sont activés que par le formateur
// le jour de la session. Cette page reviendra avec la prochaine itération.
export default async function ParcoursSession() {
  redirect('/stagiaire/parcours');
}
