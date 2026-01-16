import { describe, it, expect } from 'vitest';
import {
  normalizeCompanyName,
  normalizeCompanyNumber,
  namesMatch,
  companyNumbersMatch,
} from '../lib/nameNormalizer';

describe('Name Normalizer', () => {
  describe('normalizeCompanyName', () => {
    it('should convert to uppercase', () => {
      expect(normalizeCompanyName('Acme Solutions')).toBe('ACME SOLUTIONS');
    });

    it('should remove common suffixes', () => {
      expect(normalizeCompanyName('Acme Solutions Ltd')).toBe('ACME SOLUTIONS');
      expect(normalizeCompanyName('Acme Solutions Limited')).toBe('ACME SOLUTIONS');
      expect(normalizeCompanyName('Acme Solutions PLC')).toBe('ACME SOLUTIONS');
      expect(normalizeCompanyName('Acme Solutions LLP')).toBe('ACME SOLUTIONS');
      expect(normalizeCompanyName('Acme Solutions CIC')).toBe('ACME SOLUTIONS');
    });

    it('should normalize & to AND', () => {
      expect(normalizeCompanyName('Smith & Jones')).toBe('SMITH AND JONES');
    });

    it('should normalize + to AND', () => {
      expect(normalizeCompanyName('Alpha + Beta')).toBe('ALPHA AND BETA');
    });

    it('should remove punctuation', () => {
      expect(normalizeCompanyName("Johnson's Foods")).toBe('JOHNSONS FOODS');
      expect(normalizeCompanyName('A.B.C. Corp')).toBe('ABC CORP');
      expect(normalizeCompanyName('Tech-Solutions')).toBe('TECH SOLUTIONS');
    });

    it('should handle parentheses in names', () => {
      expect(normalizeCompanyName('Global Corp (UK)')).toBe('GLOBAL CORP UK');
      expect(normalizeCompanyName('Global Corp (Holdings)')).toBe('GLOBAL CORP HOLDINGS');
    });

    it('should collapse multiple spaces', () => {
      expect(normalizeCompanyName('Acme    Solutions    Ltd')).toBe('ACME SOLUTIONS');
    });

    it('should trim whitespace', () => {
      expect(normalizeCompanyName('  Acme Solutions  ')).toBe('ACME SOLUTIONS');
    });

    it('should handle empty string', () => {
      expect(normalizeCompanyName('')).toBe('');
    });

    it('should handle null/undefined gracefully', () => {
      expect(normalizeCompanyName(null as unknown as string)).toBe('');
      expect(normalizeCompanyName(undefined as unknown as string)).toBe('');
    });

    it('should handle complex company names', () => {
      expect(normalizeCompanyName('SMITH & JONES HOLDINGS (UK) LIMITED')).toBe('SMITH AND JONES HOLDINGS UK');
      expect(normalizeCompanyName("Johnson's Foods & Beverages Ltd")).toBe('JOHNSONS FOODS AND BEVERAGES');
    });

    it('should handle Limited Liability Partnership suffix', () => {
      expect(normalizeCompanyName('Northern Services Limited Liability Partnership')).toBe('NORTHERN SERVICES');
    });
  });

  describe('namesMatch', () => {
    it('should match identical names', () => {
      expect(namesMatch('Acme Solutions', 'Acme Solutions')).toBe(true);
    });

    it('should match names with different cases', () => {
      expect(namesMatch('ACME SOLUTIONS', 'acme solutions')).toBe(true);
    });

    it('should match names with different suffixes', () => {
      expect(namesMatch('Acme Solutions Ltd', 'Acme Solutions Limited')).toBe(true);
      expect(namesMatch('Acme Solutions PLC', 'Acme Solutions')).toBe(true);
    });

    it('should match names with different punctuation', () => {
      expect(namesMatch('Smith & Jones', 'Smith and Jones')).toBe(true);
      expect(namesMatch("Johnson's Foods", 'Johnsons Foods')).toBe(true);
    });

    it('should not match different companies', () => {
      expect(namesMatch('Acme Solutions', 'Beta Technologies')).toBe(false);
      expect(namesMatch('Smith & Jones', 'Smith & Williams')).toBe(false);
    });

    it('should match fixture data variations', () => {
      // From the fixtures: ACME Solutions Ltd vs ACME Solutions Limited
      expect(namesMatch('ACME Solutions Ltd', 'ACME Solutions Limited')).toBe(true);
      // Smith & Jones Holdings vs Smith and Jones Holdings Ltd
      expect(namesMatch('Smith & Jones Holdings Ltd', 'Smith and Jones Holdings Limited')).toBe(true);
      // Global Trading PLC variations
      expect(namesMatch('Global Trading PLC', 'Global Trading Public Limited Company')).toBe(true);
    });
  });

  describe('normalizeCompanyNumber', () => {
    it('should pad numeric company numbers to 8 digits', () => {
      expect(normalizeCompanyNumber('1234567')).toBe('01234567');
      expect(normalizeCompanyNumber('12345')).toBe('00012345');
      expect(normalizeCompanyNumber('01234567')).toBe('01234567');
    });

    it('should handle Scottish company numbers (SC prefix)', () => {
      expect(normalizeCompanyNumber('SC123456')).toBe('SC123456');
      expect(normalizeCompanyNumber('SC12345')).toBe('SC012345');
    });

    it('should handle Northern Irish company numbers (NI prefix)', () => {
      expect(normalizeCompanyNumber('NI123456')).toBe('NI123456');
      expect(normalizeCompanyNumber('NI12345')).toBe('NI012345');
    });

    it('should handle LLP company numbers (OC prefix)', () => {
      expect(normalizeCompanyNumber('OC445566')).toBe('OC445566');
      expect(normalizeCompanyNumber('OC12345')).toBe('OC012345');
    });

    it('should remove whitespace', () => {
      expect(normalizeCompanyNumber('  01234567  ')).toBe('01234567');
      expect(normalizeCompanyNumber(' SC 123456')).toBe('SC123456');
    });

    it('should convert to uppercase', () => {
      expect(normalizeCompanyNumber('sc123456')).toBe('SC123456');
    });

    it('should handle empty input', () => {
      expect(normalizeCompanyNumber('')).toBe('');
      expect(normalizeCompanyNumber(null as unknown as string)).toBe('');
      expect(normalizeCompanyNumber(undefined as unknown as string)).toBe('');
    });

    it('should remove non-alphanumeric characters', () => {
      expect(normalizeCompanyNumber('01-234-567')).toBe('01234567');
    });
  });

  describe('companyNumbersMatch', () => {
    it('should match identical numbers', () => {
      expect(companyNumbersMatch('01234567', '01234567')).toBe(true);
    });

    it('should match numbers with different padding', () => {
      expect(companyNumbersMatch('1234567', '01234567')).toBe(true);
      expect(companyNumbersMatch('12345', '00012345')).toBe(true);
    });

    it('should match prefixed numbers with different padding', () => {
      expect(companyNumbersMatch('SC12345', 'SC012345')).toBe(true);
    });

    it('should not match different numbers', () => {
      expect(companyNumbersMatch('01234567', '09876543')).toBe(false);
    });

    it('should not match numbers with different prefixes', () => {
      expect(companyNumbersMatch('SC123456', 'NI123456')).toBe(false);
    });

    it('should return false for empty inputs', () => {
      expect(companyNumbersMatch('', '01234567')).toBe(false);
      expect(companyNumbersMatch('01234567', '')).toBe(false);
    });
  });
});
