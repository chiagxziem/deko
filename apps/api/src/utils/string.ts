/**
 * Strips all hyphens from a string (useful for UUID formatting).
 * @param str - The string to process
 * @returns The string without hyphens
 */
export const stripHyphens = (str: string): string => str.replace(/-/g, "");
