/**
 * Formats a date/datetime string to Brasília timezone (America/Sao_Paulo).
 * Use this for all time-tracking display to ensure consistent -3 offset.
 */
const BRASILIA_TZ = "America/Sao_Paulo";

export function formatInBrasilia(dateStr: string, formatOptions: Intl.DateTimeFormatOptions): string {
  const date = new Date(dateStr);
  return date.toLocaleString("pt-BR", { ...formatOptions, timeZone: BRASILIA_TZ });
}

export function formatTimeBrasilia(dateStr: string): string {
  return formatInBrasilia(dateStr, { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDateBrasilia(dateStr: string): string {
  return formatInBrasilia(dateStr, { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTimeBrasilia(dateStr: string): string {
  return formatInBrasilia(dateStr, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Returns a Date object adjusted to represent Brasília local time.
 * Useful for date-fns operations that need Brasília context.
 */
export function toBrasiliaDate(dateStr: string): Date {
  const date = new Date(dateStr);
  return new Date(date.toLocaleString("en-US", { timeZone: BRASILIA_TZ }));
}
