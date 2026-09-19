import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility to merge Tailwind CSS classes cleanly
 * @param  {...any} inputs - class names or conditional objects
 * @returns {string} merged classnames
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
