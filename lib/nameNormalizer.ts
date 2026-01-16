/**
 * Company Name Normalization for Matching
 *
 * Normalizes company names to enable fuzzy matching when company numbers
 * are not available. Handles common UK company suffixes and variations.
 */

/** Common UK company legal suffixes to remove during normalization */
const COMPANY_SUFFIXES = [
  // Full forms (order matters - longer first)
  'PUBLIC LIMITED COMPANY',
  'LIMITED LIABILITY PARTNERSHIP',
  'COMMUNITY INTEREST COMPANY',
  'SOCIETAS EUROPAEA',
  'LIMITED',
  'LTD',
  'PLC',
  'LLP',
  'CIC',
  'UNLIMITED',
  'UNLTD',
  // European forms (pre-Brexit, may still appear)
  'SE',
];

/** Common words/characters to normalize */
const NORMALIZATION_REPLACEMENTS: [RegExp, string][] = [
  [/&/g, ' AND '],
  [/\+/g, ' AND '],
  [/'/g, ''],
  [/'/g, ''],
  [/"/g, ''],
  [/"/g, ''],
  [/"/g, ''],
  [/\./g, ''],
  [/,/g, ''],
  [/-/g, ' '],
  [/_/g, ' '],
  [/\(/g, ' '],
  [/\)/g, ' '],
  [/\[/g, ' '],
  [/\]/g, ' '],
];

/**
 * Normalize a company name for matching purposes.
 *
 * Process:
 * 1. Convert to uppercase
 * 2. Replace special characters and punctuation
 * 3. Remove common company suffixes
 * 4. Collapse multiple spaces to single space
 * 5. Trim whitespace
 *
 * @param name - The company name to normalize
 * @returns Normalized company name suitable for comparison
 */
export function normalizeCompanyName(name: string): string {
  if (!name) {
    return '';
  }

  let normalized = name.toUpperCase();

  // Apply character replacements
  for (const [pattern, replacement] of NORMALIZATION_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }

  // Remove company suffixes (process longer ones first to avoid partial matches)
  const sortedSuffixes = [...COMPANY_SUFFIXES].sort((a, b) => b.length - a.length);
  for (const suffix of sortedSuffixes) {
    // Match suffix at end of string, optionally preceded by space or punctuation
    const suffixPattern = new RegExp(`\\s*\\b${escapeRegExp(suffix)}\\b\\s*$`, 'i');
    normalized = normalized.replace(suffixPattern, '');
  }

  // Collapse multiple spaces and trim
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Check if two company names match after normalization.
 *
 * @param name1 - First company name
 * @param name2 - Second company name
 * @returns True if normalized names are equal
 */
export function namesMatch(name1: string, name2: string): boolean {
  return normalizeCompanyName(name1) === normalizeCompanyName(name2);
}

/**
 * Normalize a UK company number for comparison.
 *
 * UK company numbers are 8 characters, left-padded with zeros.
 * Handles various input formats.
 *
 * @param companyNumber - The company number to normalize
 * @returns Normalized 8-character company number, or empty string if invalid
 */
export function normalizeCompanyNumber(companyNumber: string): string {
  if (!companyNumber) {
    return '';
  }

  // Remove whitespace and convert to uppercase
  let normalized = companyNumber.trim().toUpperCase();

  // Remove any non-alphanumeric characters
  normalized = normalized.replace(/[^A-Z0-9]/g, '');

  // Handle Scottish (SC), Northern Irish (NI), and other prefixes
  const prefixMatch = normalized.match(/^([A-Z]{2})(\d+)$/);
  if (prefixMatch) {
    const [, prefix, digits] = prefixMatch;
    // Pad digits to 6 characters for prefixed numbers (total 8 with prefix)
    return prefix + digits.padStart(6, '0');
  }

  // Standard numeric company number - pad to 8 digits
  if (/^\d+$/.test(normalized)) {
    return normalized.padStart(8, '0');
  }

  // Return as-is if it doesn't match expected patterns
  return normalized;
}

/**
 * Check if two company numbers match after normalization.
 *
 * @param num1 - First company number
 * @param num2 - Second company number
 * @returns True if normalized company numbers are equal
 */
export function companyNumbersMatch(num1: string, num2: string): boolean {
  const normalized1 = normalizeCompanyNumber(num1);
  const normalized2 = normalizeCompanyNumber(num2);

  if (!normalized1 || !normalized2) {
    return false;
  }

  return normalized1 === normalized2;
}

/**
 * Escape special regex characters in a string.
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
