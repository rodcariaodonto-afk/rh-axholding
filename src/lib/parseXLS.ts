import ExcelJS from 'exceljs';

export interface SolidesRow {
  [key: string]: string | undefined;
}

export async function parseXLSFile(file: File): Promise<SolidesRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount < 2) {
    return [];
  }

  // First row is headers
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = String(cell.value ?? '');
  });

  const results: SolidesRow[] = [];
  for (let i = 2; i <= worksheet.rowCount; i++) {
    const row = worksheet.getRow(i);
    const obj: SolidesRow = {};
    let hasData = false;

    headers.forEach((header, idx) => {
      const cell = row.getCell(idx + 1);
      const value = cell.value;
      if (value != null && String(value).trim() !== '') {
        hasData = true;
      }
      obj[header] = value != null ? String(value) : '';
    });

    if (hasData) {
      results.push(obj);
    }
  }

  return results;
}

// Parse date from DD/MM/YYYY to YYYY-MM-DD
export function parseDateBR(dateStr: string | undefined): string | null {
  if (!dateStr) return null;

  const cleanDate = dateStr.trim();

  // DD/MM/YYYY format
  const brMatch = cleanDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (brMatch) {
    const [, day, month, year] = brMatch;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // YYYY-MM-DD format (already correct)
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
    return cleanDate;
  }

  return null;
}

// Parse currency from R$ X.XXX,XX to number
export function parseCurrencyBR(value: string | undefined): number | null {
  if (!value) return null;

  const cleanValue = value
    .replace(/R\$\s*/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');

  const num = parseFloat(cleanValue);
  return isNaN(num) ? null : num;
}
