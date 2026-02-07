import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getProxiedUrl = (url?: string) => {
  if (!url) return "";

  // Only proxy githubusercontent links
  if (url.includes('raw.githubusercontent.com')) {
    return `/api/media?url=${encodeURIComponent(url)}`;
  }
  return url;
};