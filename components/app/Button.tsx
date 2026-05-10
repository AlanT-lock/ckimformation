import Link from 'next/link';
import type { ButtonHTMLAttributes, AnchorHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const STYLES: Record<Variant, string> = {
  primary:   'bg-teal hover:bg-teal-l text-white',
  secondary: 'bg-white border border-dark/15 hover:border-dark/40 text-dark',
  danger:    'bg-orange/90 hover:bg-orange text-white',
  ghost:     'text-dark/70 hover:text-dark',
};

const BASE = 'inline-flex items-center justify-center px-4 py-2 rounded text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: ReactNode;
}
export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button {...props} className={`${BASE} ${STYLES[variant]} ${className}`}>
      {children}
    </button>
  );
}

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  variant?: Variant;
  href: string;
  children: ReactNode;
}
export function ButtonLink({ variant = 'primary', className = '', href, children, ...props }: ButtonLinkProps) {
  return (
    <Link href={href} {...props} className={`${BASE} ${STYLES[variant]} ${className}`}>
      {children}
    </Link>
  );
}
