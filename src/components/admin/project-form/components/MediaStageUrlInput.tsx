interface MediaStageUrlInputProps {
  value: string;
  placeholder: string;
  label: string;
  onValueChange: (value: string) => void;
}

export default function MediaStageUrlInput({
  value,
  placeholder,
  label,
  onValueChange,
}: MediaStageUrlInputProps) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="font-mono text-[8px] font-bold uppercase tracking-[0.22em] text-slate-600 dark:text-slate-400">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className="h-8 min-w-0 rounded-md border border-slate-200 bg-white/90 px-2.5 text-[11px] text-slate-800 outline-none backdrop-blur-md transition-colors placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-0 dark:border-slate-800 dark:bg-slate-950/90 dark:text-slate-100 dark:placeholder:text-slate-600 dark:focus:border-slate-700"
        placeholder={placeholder}
      />
    </label>
  );
}
