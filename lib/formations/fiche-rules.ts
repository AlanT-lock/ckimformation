// Règles pures de la fiche PDF d'une formation (partagées serveur / tests).

/** Limite imposée par la taille max d'une requête sur Vercel (4,5 Mo). */
export const MAX_FICHE_BYTES = 4 * 1024 * 1024;

export function validateFichePdf(
  file: { size: number; type: string; name: string },
  head: Uint8Array,
): string | null {
  if (file.size === 0) return 'Fichier vide.';
  if (file.size > MAX_FICHE_BYTES) return 'Fichier trop volumineux (4 Mo maximum).';
  const looksPdf = file.type === 'application/pdf' || (file.type === '' && /\.pdf$/i.test(file.name));
  const magic = String.fromCharCode(...head.slice(0, 5));
  if (!looksPdf || magic !== '%PDF-') return 'Le fichier doit être un PDF.';
  return null;
}

function slugifyFilename(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function ficheFilename(f: { ref: string | null; slug: string }): string {
  return `${slugifyFilename(`CKIM-${f.ref || 'CKIM'}-${f.slug}`)}.pdf`;
}

/** inline = affiché dans le navigateur ; attachment = téléchargement. */
export function ficheContentDisposition(filename: string, download: boolean): string {
  return `${download ? 'attachment' : 'inline'}; filename="${filename}"`;
}
