export function formatVideoTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export interface AspectOption {
  label: string;
  value: number | undefined;
}

export function getAspectOptions(naturalAspect?: number): AspectOption[] {
  return [
    { label: 'Free', value: undefined },
    { label: 'Original', value: naturalAspect },
    { label: '16:9', value: 16 / 9 },
    { label: '9:16', value: 9 / 16 },
    { label: '4:5', value: 4 / 5 },
    { label: '1:1', value: 1 / 1 },
  ];
}
