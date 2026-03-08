/**
 * Utility functions for exporting data to CSV format compatible with Excel.
 * Uses UTF-8 BOM and semicolon separator for Brazilian Excel compatibility.
 */

interface ExportColumn<T> {
  header: string;
  accessor: (item: T) => string | number | null | undefined;
}

/**
 * Escapes a CSV field value for Excel compatibility.
 * - Wraps in quotes if contains semicolon, quote, or newline
 * - Doubles any existing quotes
 */
function escapeField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  
  const str = String(value);
  
  // Check if needs escaping
  if (str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    // Double quotes and wrap in quotes
    return `"${str.replace(/"/g, '""')}"`;
  }
  
  return str;
}

/**
 * Generates a CSV string from data array using specified columns.
 * Uses UTF-8 BOM for Excel compatibility and semicolon as separator.
 */
export function generateCsv<T>(
  data: T[],
  columns: ExportColumn<T>[]
): string {
  // UTF-8 BOM for Excel to recognize encoding
  const BOM = '\uFEFF';
  
  // Header row
  const headerRow = columns.map(col => escapeField(col.header)).join(';');
  
  // Data rows
  const dataRows = data.map(item => 
    columns.map(col => escapeField(col.accessor(item))).join(';')
  );
  
  return BOM + [headerRow, ...dataRows].join('\r\n');
}

/**
 * Triggers a download of the CSV file.
 */
export function downloadCsv(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Formats a date string (YYYY-MM-DD) to Brazilian format (DD/MM/YYYY).
 */
export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const parts = dateStr.split('T')[0].split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}
