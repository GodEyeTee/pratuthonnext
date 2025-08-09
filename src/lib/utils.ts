/*
 * Utility functions
 *
 * This file defines helper utilities used throughout the project. At the
 * moment it contains a `cn` function for concatenating CSS class names
 * conditionally. You can add more helpers here as needed.
 */

/**
 * Concatenate class names conditionally. Accepts any number of arguments
 * (strings, booleans, null/undefined). Falsy values are ignored.
 */
export function cn(
  ...args: Array<string | boolean | undefined | null>
): string {
  return args.filter(Boolean).join(' ');
}
