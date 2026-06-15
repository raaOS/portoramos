import { cn } from '@/lib/utils';

type ExplorerFormatBadgeProps = {
  format: string;
  className?: string;
  variant?: 'default' | 'selected';
};

export function ExplorerFormatBadge({
  format,
  className,
  variant = 'default',
}: ExplorerFormatBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
        variant === 'selected'
          ? 'bg-white/15 text-white/85'
          : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-slate-300',
        className
      )}
    >
      {format}
    </span>
  );
}
