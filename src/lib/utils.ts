/*
 * Utility functions
 * - broadened `cn` types to avoid TS errors when passing ReactNode-derived values
 */

export function cn(
  ...args: Array<string | number | bigint | boolean | null | undefined>
): string {
  // keep only non-empty strings; ignore numbers/booleans at runtime
  const classes: string[] = [];
  for (const v of args) {
    if (typeof v === 'string' && v) classes.push(v);
  }
  return classes.join(' ');
}
