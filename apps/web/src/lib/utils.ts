import { BetterFetchError } from "@better-fetch/fetch";
import { type ClassValue, clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

import { AppBetterFetchError } from "./error";

/**
 * Merges class names using clsx and resolves Tailwind conflicts with twMerge.
 * @param inputs - Class values (strings, arrays, objects) accepted by clsx.
 * @returns A deduplicated, Tailwind-merged className string.
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};

/**
 * Copies the provided text to the clipboard and shows a toast notification.
 * @param text - The text to copy to the clipboard.
 */
export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } catch {
    toast.error("Failed to copy");
  }
};

/**
 * Handles errors and shows a toast notification with a default message if necessary.
 * @param err - The error object to handle.
 * @param defaultMessage - The default message to show if the error does not have specific details.
 */
export const handleError = (err: Error, defaultMessage: string) => {
  if (err instanceof BetterFetchError) {
    const appErr = err as AppBetterFetchError;
    toast.error(appErr.error?.details ?? defaultMessage);
  } else {
    toast.error(defaultMessage);
  }
};

/**
 * Truncates a string to show the first `head` and last `tail` characters with an ellipsis in between.
 * If the string is short enough to fit without truncation, it is returned as-is.
 */
export const truncateMiddle = (str: string, head = 10, tail = 10): string => {
  if (str.length <= head + tail + 1) return str;
  return `${str.slice(0, head)}\u2026${str.slice(-tail)}`;
};
