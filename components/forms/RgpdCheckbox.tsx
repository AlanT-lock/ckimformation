'use client';

import Link from 'next/link';

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  /** Variant 'light' pour les formulaires publics (texte sombre sur fond clair).
   *  Variant 'dark' pour les pages auth (texte clair sur fond sombre). */
  variant?: 'light' | 'dark';
  required?: boolean;
}

export function RgpdCheckbox({ checked, onChange, variant = 'light', required = true }: Props) {
  const labelClass = variant === 'dark'
    ? 'text-xs text-muted leading-relaxed'
    : 'text-xs text-dark/70 leading-relaxed';
  const linkClass = variant === 'dark'
    ? 'text-teal-l hover:underline'
    : 'text-teal hover:underline';

  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required={required}
        className="h-4 w-4 accent-teal mt-0.5 shrink-0"
      />
      <span className={labelClass}>
        J&apos;ai lu et j&apos;accepte la{' '}
        <Link href="/confidentialite" target="_blank" rel="noopener" className={linkClass}>
          politique de confidentialité
        </Link>
        {' '}de C-KIM Formation
        {required && <span className="text-orange ml-0.5">*</span>}
      </span>
    </label>
  );
}
