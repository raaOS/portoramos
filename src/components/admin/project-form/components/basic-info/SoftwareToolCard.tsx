import { Check } from 'lucide-react';
import { getIconMap } from '@/constants/skillIcons';

interface SoftwareToolCardProps {
  tool: string;
  isSelected: boolean;
  variant: 'summary' | 'picker';
  onToggle: (tool: string) => void;
}

function getToolLabel(tool: string) {
  return tool.replace('affinity_', '').replace('_', ' ');
}

function getFallbackIcon(tool: string, variant: SoftwareToolCardProps['variant']) {
  const sizeClass = variant === 'summary' ? 'h-9 w-9 text-[10px]' : 'h-7 w-7 text-[9px]';

  return (
    <div
      className={`${sizeClass} flex items-center justify-center !rounded-md border border-slate-200/50 bg-slate-100 !font-semibold uppercase text-slate-500`}
    >
      {tool.substring(0, 2)}
    </div>
  );
}

export default function SoftwareToolCard({
  tool,
  isSelected,
  variant,
  onToggle,
}: SoftwareToolCardProps) {
  const iconClass =
    variant === 'summary'
      ? 'h-9 w-9 !rounded-md !text-[10px] !font-semibold tracking-normal'
      : 'h-7 w-7 !rounded-md !text-[9px] !font-semibold tracking-normal';
  const iconNode = getIconMap(iconClass)[tool] || getFallbackIcon(tool, variant);
  const cardClass =
    variant === 'summary'
      ? `flex flex-col items-center justify-center p-2 rounded-lg border transition-all w-[94px] h-[90px] flex-shrink-0 ${
          isSelected
            ? 'border-slate-300 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40 opacity-100 scale-102 font-semibold shadow-xs'
            : 'border-slate-200/60 bg-white/40 dark:border-slate-900/20 dark:bg-transparent opacity-65 hover:opacity-95 hover:border-slate-300'
        }`
      : `flex flex-col items-center justify-center p-2 rounded-lg border text-center transition-all h-[80px] w-full ${
          isSelected
            ? 'border-emerald-500 bg-emerald-50/20 text-slate-900 shadow-xs scale-102 font-semibold'
            : 'border-slate-200/60 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50/30'
        }`;

  return (
    <button
      type="button"
      onClick={() => onToggle(tool)}
      className={cardClass}
      title={tool.replace('_', ' ').toUpperCase()}
    >
      <div className="flex items-center justify-center">{iconNode}</div>

      <div className="mt-2.5 flex w-full items-center justify-center gap-1.5 px-1">
        {isSelected ? (
          <div className="shadow-xs flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="h-1.5 w-1.5 stroke-[4]" />
          </div>
        ) : (
          <div className="h-3 w-3 flex-shrink-0 rounded-full border border-slate-300 bg-white" />
        )}
        <span className="truncate text-center font-mono text-[8.5px] font-bold uppercase tracking-wider text-slate-500">
          {getToolLabel(tool)}
        </span>
        <div className="pointer-events-none h-3 w-3 flex-shrink-0 opacity-0" />
      </div>
    </button>
  );
}
