import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function localizedName(
  locale: string,
  ar: string,
  en: string,
  fallback = ""
) {
  const primary = locale === "ar" ? ar || en : en || ar;
  return primary || fallback;
}
