'use client';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'dark';

interface BaseProps {
  children: ReactNode;
  variant?: Variant;
  className?: string;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-orange text-white hover:bg-orange-l',
  secondary: 'bg-teal text-white hover:bg-teal-l',
  ghost: 'border border-dark text-dark hover:bg-dark hover:text-white',
  dark: 'bg-dark text-white hover:bg-dark-2',
};

const BASE = 'inline-flex items-center justify-center gap-2 rounded-md px-6 py-3 font-sans text-sm font-semibold uppercase tracking-wider transition-all duration-200';

export function Button({ children, variant = 'primary', className, ...rest }: BaseProps & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={cn(BASE, VARIANTS[variant], className)} {...rest}>
      {children}
    </button>
  );
}

export function ButtonLink({ children, variant = 'primary', className, href }: BaseProps & { href: string }) {
  return (
    <Link href={href} className={cn(BASE, VARIANTS[variant], className)}>
      {children}
    </Link>
  );
}
