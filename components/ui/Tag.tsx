import { cn } from '@/lib/utils';

interface TagProps {
  children: React.ReactNode;
  color?: string;
  variant?: 'solid' | 'outline';
  className?: string;
}

export function Tag({ children, color, variant = 'outline', className }: TagProps) {
  const style = color
    ? variant === 'solid'
      ? { backgroundColor: color, color: '#fff' }
      : { borderColor: color, color }
    : undefined;

  return (
    <span
      className={cn(
        'inline-block rounded-sm border px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.15em]',
        !color && variant === 'outline' && 'border-teal text-teal',
        !color && variant === 'solid' && 'border-transparent bg-teal text-white',
        className
      )}
      style={style}
    >
      {children}
    </span>
  );
}
