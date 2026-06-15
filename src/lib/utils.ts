import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Re-export resolveStorageUrl as getProxiedUrl for backward compatibility
export { resolveStorageUrl as getProxiedUrl } from '@/lib/urlResolver';
