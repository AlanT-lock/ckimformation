import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="text-xs uppercase tracking-[0.2em] text-dark/60">{children}</span>;
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
export function Field({ label, className = '', ...props }: FieldProps) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <input
        {...props}
        className={`mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 text-dark focus:outline-none focus:border-teal ${className}`}
      />
    </label>
  );
}

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
}
export function Textarea({ label, className = '', ...props }: TextareaProps) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <textarea
        {...props}
        className={`mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 text-dark focus:outline-none focus:border-teal ${className}`}
      />
    </label>
  );
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  children: ReactNode;
}
export function Select({ label, className = '', children, ...props }: SelectProps) {
  return (
    <label className="block">
      <FieldLabel>{label}</FieldLabel>
      <select
        {...props}
        className={`mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 text-dark focus:outline-none focus:border-teal ${className}`}
      >
        {children}
      </select>
    </label>
  );
}
