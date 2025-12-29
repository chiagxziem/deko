import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names using clsx and resolves Tailwind conflicts with twMerge.
 * @param inputs - Class values (strings, arrays, objects) accepted by clsx.
 * @returns A deduplicated, Tailwind-merged className string.
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};

/**
 * URLs to variable font files used by the app (WOFF2). Useful for preloading.
 */
export const fontsHref = [
  "https://cdn.jsdelivr.net/fontsource/fonts/inter:vf@latest/latin-wght-normal.woff2",
  "https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono:vf@latest/latin-wght-normal.woff2",
];
