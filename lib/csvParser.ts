/**
 * CSV Parser for Modern Slavery Registry data
 *
 * Provides robust, header-driven CSV parsing with flexible column detection.
 * Designed to handle schema changes gracefully.
 */

import type { ModernSlaveryCSVRow, CSVColumnMapping } from '../types';

/**
 * Parse a CSV string into rows with header-driven field names.
 * Handles quoted fields, embedded commas, and newlines within quotes.
 */
export function parseCSV(csvText: string): ModernSlaveryCSVRow[] {
  const lines = splitCSVLines(csvText);
  if (lines.length < 2) {
    return [];
  }

  const headers = parseCSVLine(lines[0]);
  const rows: ModernSlaveryCSVRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === 0 || (values.length === 1 && values[0] === '')) {
      continue; // Skip empty lines
    }

    const row: ModernSlaveryCSVRow = {};
    for (let j = 0; j < headers.length; j++) {
      const header = headers[j].trim();
      if (header) {
        row[header] = values[j]?.trim() ?? '';
      }
    }
    rows.push(row);
  }

  return rows;
}

/**
 * Split CSV text into lines, handling quoted newlines correctly.
 */
function splitCSVLines(text: string): string[] {
  const lines: string[] = [];
  let currentLine = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && text[i + 1] === '\n') {
        i++; // Skip \n in \r\n
      }
      if (currentLine.trim()) {
        lines.push(currentLine);
      }
      currentLine = '';
    } else {
      currentLine += char;
    }
  }

  if (currentLine.trim()) {
    lines.push(currentLine);
  }

  return lines;
}

/**
 * Parse a single CSV line into an array of values.
 * Handles quoted fields with embedded commas.
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current);
  return values;
}

/** Known patterns for company number columns */
const COMPANY_NUMBER_PATTERNS = [
  /^company[\s_-]?number$/i,
  /^company[\s_-]?no$/i,
  /^company[\s_-]?id$/i,
  /^companies[\s_-]?house[\s_-]?number$/i,
  /^ch[\s_-]?number$/i,
  /^registration[\s_-]?number$/i,
  /^crn$/i,
];

/** Known patterns for company name columns */
const COMPANY_NAME_PATTERNS = [
  /^company[\s_-]?name$/i,
  /^organisation[\s_-]?name$/i,
  /^organization[\s_-]?name$/i,
  /^name$/i,
  /^business[\s_-]?name$/i,
  /^entity[\s_-]?name$/i,
];

/** Known patterns for statement URL columns */
const STATEMENT_URL_PATTERNS = [
  /^statement[\s_-]?url$/i,
  /^url$/i,
  /^statement[\s_-]?link$/i,
  /^link$/i,
  /^summary[\s_-]?url$/i,
  /^document[\s_-]?url$/i,
];

/** Known patterns for year columns */
const YEAR_PATTERNS = [
  /^year$/i,
  /^financial[\s_-]?year$/i,
  /^reporting[\s_-]?year$/i,
  /^statement[\s_-]?year$/i,
  /^period[\s_-]?year$/i,
];

/** Known patterns for signed date columns */
const SIGNED_DATE_PATTERNS = [
  /^signed[\s_-]?date$/i,
  /^date[\s_-]?signed$/i,
  /^sign[\s_-]?date$/i,
  /^published[\s_-]?date$/i,
  /^date[\s_-]?published$/i,
];

/**
 * Detect column mappings from CSV headers.
 * Uses pattern matching to find relevant columns regardless of exact naming.
 */
export function detectColumnMapping(headers: string[]): CSVColumnMapping {
  const mapping: CSVColumnMapping = {};

  for (const header of headers) {
    const trimmedHeader = header.trim();

    if (!mapping.companyNumber && matchesAnyPattern(trimmedHeader, COMPANY_NUMBER_PATTERNS)) {
      mapping.companyNumber = trimmedHeader;
    }

    if (!mapping.companyName && matchesAnyPattern(trimmedHeader, COMPANY_NAME_PATTERNS)) {
      mapping.companyName = trimmedHeader;
    }

    if (!mapping.statementUrl && matchesAnyPattern(trimmedHeader, STATEMENT_URL_PATTERNS)) {
      mapping.statementUrl = trimmedHeader;
    }

    if (!mapping.year && matchesAnyPattern(trimmedHeader, YEAR_PATTERNS)) {
      mapping.year = trimmedHeader;
    }

    if (!mapping.signedDate && matchesAnyPattern(trimmedHeader, SIGNED_DATE_PATTERNS)) {
      mapping.signedDate = trimmedHeader;
    }
  }

  return mapping;
}

/**
 * Check if a string matches any of the given patterns.
 */
function matchesAnyPattern(value: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(value));
}

/**
 * Extract headers from parsed CSV rows.
 */
export function getHeadersFromRows(rows: ModernSlaveryCSVRow[]): string[] {
  if (rows.length === 0) {
    return [];
  }
  return Object.keys(rows[0]);
}

/**
 * Get the value of a mapped column from a row.
 * Returns undefined if column is not mapped or value is empty.
 */
export function getMappedValue(
  row: ModernSlaveryCSVRow,
  mapping: CSVColumnMapping,
  field: keyof CSVColumnMapping
): string | undefined {
  const columnName = mapping[field];
  if (!columnName) {
    return undefined;
  }
  const value = row[columnName];
  return value && value.trim() !== '' ? value.trim() : undefined;
}
