/**
 * Utility functions for handling dates without timezone issues.
 * 
 * The problem: When parsing "2024-01-15" with new Date(), JavaScript interprets
 * it as UTC midnight, but displays in local timezone, causing a 1-day shift
 * in timezones behind UTC (like Brazil GMT-3).
 * 
 * Solution: Parse date strings as local dates (noon to avoid DST edge cases)
 * and format them back without timezone conversion.
 */

/**
 * Parse a date string (YYYY-MM-DD) from the database into a Date object.
 * Creates the date at noon local time to avoid timezone shift issues.
 */
export function parseDateFromDB(dateString: string | null | undefined): Date | null {
  if (!dateString) return null;
  try {
    // Split the date string to avoid timezone interpretation
    const [year, month, day] = dateString.split('-').map(Number);
    if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
    // Create date at noon to avoid DST edge cases
    return new Date(year, month - 1, day, 12, 0, 0, 0);
  } catch {
    return null;
  }
}

/**
 * Format a Date object to a database-compatible string (YYYY-MM-DD).
 * Extracts local date components to avoid timezone shift.
 */
export function formatDateForDB(date: Date | null | undefined): string | undefined {
  if (!date) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
