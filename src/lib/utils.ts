import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getProxiedUrl = (url?: string) => {
  if (!url) return "";

  // Convert storage.googleapis.com/<bucket>/<path> format (403 Forbidden)
  // to firebasestorage.googleapis.com/v0/b/<bucket>/o/<path>?alt=media format (works)
  const gcsMatch = url.match(
    /^https?:\/\/storage\.googleapis\.com\/([^/]+)\/(.+)$/
  );
  if (gcsMatch) {
    const bucket = gcsMatch[1];
    const path = gcsMatch[2];
    return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(path)}?alt=media`;
  }

  return url;
};