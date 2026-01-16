/**
 * Modern Slavery Registry Connector (CSV-based)
 *
 * Determines statement existence and latest year via registry CSV files.
 * Supports caching per year and robust column detection.
 */

import type {
  ModernSlaveryRegistryResult,
  ModernSlaveryCSVRow,
  CSVColumnMapping,
  RegistryEvidence,
} from '../types';
import { parseCSV, detectColumnMapping, getHeadersFromRows, getMappedValue } from '../lib/csvParser';
import {
  normalizeCompanyName,
  normalizeCompanyNumber,
  companyNumbersMatch,
  namesMatch,
} from '../lib/nameNormalizer';

/** Configuration for registry CSV sources */
export interface RegistryConfig {
  /** Base URL for CSV files (year will be appended) */
  baseUrl: string;
  /** Available years to check */
  years: number[];
  /** URL pattern - use {year} as placeholder */
  urlPattern: string;
}

/** Default registry configuration */
export const DEFAULT_REGISTRY_CONFIG: RegistryConfig = {
  baseUrl: 'https://modern-slavery-statement-registry.service.gov.uk',
  years: [2024, 2023, 2022, 2021, 2020],
  urlPattern: 'https://modern-slavery-statement-registry.service.gov.uk/statements/{year}.csv',
};

/** Cache entry for a single year's CSV data */
interface CSVCacheEntry {
  rows: ModernSlaveryCSVRow[];
  mapping: CSVColumnMapping;
  fetchedAt: number;
  csvUrl: string;
}

/** In-memory cache for CSV data, keyed by year */
const csvCache = new Map<number, CSVCacheEntry>();

/** Cache TTL in milliseconds (1 hour default) */
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Get the CSV URL for a specific year.
 */
export function getCSVUrl(year: number, config: RegistryConfig = DEFAULT_REGISTRY_CONFIG): string {
  return config.urlPattern.replace('{year}', year.toString());
}

/**
 * Fetch and parse CSV data for a specific year.
 * Uses cache if available and not expired.
 *
 * @param year - The year to fetch CSV for
 * @param config - Registry configuration
 * @returns Parsed CSV data or null if fetch fails
 */
export async function fetchCSVForYear(
  year: number,
  config: RegistryConfig = DEFAULT_REGISTRY_CONFIG
): Promise<CSVCacheEntry | null> {
  // Check cache first
  const cached = csvCache.get(year);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached;
  }

  const csvUrl = getCSVUrl(year, config);

  try {
    const response = await fetch(csvUrl);
    if (!response.ok) {
      return null;
    }

    const csvText = await response.text();
    const rows = parseCSV(csvText);

    if (rows.length === 0) {
      return null;
    }

    const headers = getHeadersFromRows(rows);
    const mapping = detectColumnMapping(headers);

    const entry: CSVCacheEntry = {
      rows,
      mapping,
      fetchedAt: Date.now(),
      csvUrl,
    };

    csvCache.set(year, entry);
    return entry;
  } catch {
    // Network or parsing error - return null (graceful degradation)
    return null;
  }
}

/**
 * Search for a company in CSV data.
 *
 * Strategy:
 * 1. If company number column exists, match by exact company number
 * 2. Otherwise, match by normalized company name
 *
 * @param entry - Parsed CSV data
 * @param companyNumber - Company number to search for
 * @param companyName - Company name to search for
 * @returns Match result with row index and match method, or null if not found
 */
export function findCompanyInCSV(
  entry: CSVCacheEntry,
  companyNumber: string,
  companyName: string
): { row: ModernSlaveryCSVRow; rowIndex: number; matchMethod: 'company_number' | 'normalized_name' } | null {
  const { rows, mapping } = entry;

  // Normalize inputs
  const normalizedNumber = normalizeCompanyNumber(companyNumber);
  const normalizedName = normalizeCompanyName(companyName);

  // Strategy 1: Match by company number if column exists
  if (mapping.companyNumber) {
    for (let i = 0; i < rows.length; i++) {
      const rowNumber = getMappedValue(rows[i], mapping, 'companyNumber');
      if (rowNumber && companyNumbersMatch(rowNumber, normalizedNumber)) {
        return { row: rows[i], rowIndex: i, matchMethod: 'company_number' };
      }
    }
  }

  // Strategy 2: Match by normalized company name
  if (mapping.companyName) {
    for (let i = 0; i < rows.length; i++) {
      const rowName = getMappedValue(rows[i], mapping, 'companyName');
      if (rowName && namesMatch(rowName, normalizedName)) {
        return { row: rows[i], rowIndex: i, matchMethod: 'normalized_name' };
      }
    }
  }

  return null;
}

/**
 * Extract the year from a CSV row if possible.
 */
function extractYear(row: ModernSlaveryCSVRow, mapping: CSVColumnMapping, fallbackYear: number): number {
  const yearValue = getMappedValue(row, mapping, 'year');
  if (yearValue) {
    const parsed = parseInt(yearValue, 10);
    if (!isNaN(parsed) && parsed >= 2015 && parsed <= 2100) {
      return parsed;
    }
  }

  // Try to extract from signed date
  const signedDate = getMappedValue(row, mapping, 'signedDate');
  if (signedDate) {
    const yearMatch = signedDate.match(/\b(20\d{2})\b/);
    if (yearMatch) {
      return parseInt(yearMatch[1], 10);
    }
  }

  return fallbackYear;
}

/**
 * Look up a company in the Modern Slavery Registry.
 *
 * Checks CSV files for each configured year, starting from most recent.
 * Returns information about the latest statement found.
 *
 * @param companyNumber - The company's registration number
 * @param companyName - The company's name (used for fallback matching)
 * @param config - Registry configuration
 * @returns Registry lookup result
 */
export async function lookupModernSlaveryRegistry(
  companyNumber: string,
  companyName: string,
  config: RegistryConfig = DEFAULT_REGISTRY_CONFIG
): Promise<ModernSlaveryRegistryResult> {
  const evidence: RegistryEvidence[] = [];
  let latestYear: number | undefined;
  let statementSummaryUrl: string | undefined;

  // Sort years descending (most recent first)
  const sortedYears = [...config.years].sort((a, b) => b - a);

  for (const year of sortedYears) {
    let entry: CSVCacheEntry | null = null;

    try {
      entry = await fetchCSVForYear(year, config);
    } catch {
      // Fetch error - continue to next year
      continue;
    }

    if (!entry) {
      continue;
    }

    const match = findCompanyInCSV(entry, companyNumber, companyName);

    if (match) {
      const matchYear = extractYear(match.row, entry.mapping, year);

      // Record evidence
      evidence.push({
        csvUrl: entry.csvUrl,
        year: matchYear,
        rowIndex: match.rowIndex,
        matchMethod: match.matchMethod,
      });

      // Update latest year if this is more recent
      if (latestYear === undefined || matchYear > latestYear) {
        latestYear = matchYear;
        // Get statement URL if available
        const url = getMappedValue(match.row, entry.mapping, 'statementUrl');
        if (url) {
          statementSummaryUrl = url;
        }
      }
    }
  }

  return {
    found: evidence.length > 0,
    latestYear,
    statementSummaryUrl,
    evidence,
  };
}

/**
 * Clear the CSV cache.
 * Useful for testing or forcing a refresh.
 */
export function clearCSVCache(): void {
  csvCache.clear();
}

/**
 * Set a cache entry manually.
 * Useful for testing with mock data.
 */
export function setCSVCacheEntry(year: number, entry: CSVCacheEntry): void {
  csvCache.set(year, entry);
}

/**
 * Get the current cache state.
 * Useful for debugging.
 */
export function getCSVCacheState(): Map<number, CSVCacheEntry> {
  return new Map(csvCache);
}
