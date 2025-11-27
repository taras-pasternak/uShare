import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function normalizeUrl(value: string) {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^https?:\/\//i, '')}`;
}

export function deriveUsernameFromUrl(url: string) {
  try {
    const parsed = new URL(normalizeUrl(url));
    const path = parsed.pathname.replace(/^\/+/, '');
    return path || parsed.hostname;
  } catch {
    return url;
  }
}
