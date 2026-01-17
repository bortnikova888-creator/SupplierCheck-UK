import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  parseCSV,
  detectColumnMapping,
  getHeadersFromRows,
  getMappedValue,
} from '../lib/csvParser';

// Load test fixtures
const fixturesDir = join(__dirname, 'fixtures');
const csvWithCompanyNumber = readFileSync(
  join(fixturesDir, 'registry-with-company-number.csv'),
  'utf-8'
);
const csvNameOnly = readFileSync(join(fixturesDir, 'registry-name-only.csv'), 'utf-8');

describe('CSV Parser', () => {
  describe('parseCSV', () => {
    it('should parse CSV with company number column', () => {
      const rows = parseCSV(csvWithCompanyNumber);

      expect(rows.length).toBe(8);
      expect(rows[0]['Company Name']).toBe('ACME Solutions Ltd');
      expect(rows[0]['Company Number']).toBe('01234567');
      expect(rows[0]['Statement URL']).toBe(
        'https://registry.example.com/statements/01234567/2023'
      );
    });

    it('should parse CSV without company number column (name only)', () => {
      const rows = parseCSV(csvNameOnly);

      expect(rows.length).toBe(10);
      expect(rows[0]['Organisation Name']).toBe('ACME Solutions Limited');
      expect(rows[0]['Statement Link']).toBe('https://registry.example.com/statements/acme-2022');
    });

    it('should handle quoted fields with commas', () => {
      const csv = `Name,Description,Value
"Smith, John","A person, named John",100
"Doe, Jane","Another person, with commas",200`;

      const rows = parseCSV(csv);

      expect(rows.length).toBe(2);
      expect(rows[0]['Name']).toBe('Smith, John');
      expect(rows[0]['Description']).toBe('A person, named John');
      expect(rows[1]['Name']).toBe('Doe, Jane');
    });

    it('should handle escaped quotes in fields', () => {
      const csv = `Name,Quote
"Test Company","They said ""hello"" to us"`;

      const rows = parseCSV(csv);

      expect(rows.length).toBe(1);
      expect(rows[0]['Quote']).toBe('They said "hello" to us');
    });

    it('should handle empty lines', () => {
      const csv = `Name,Value
Row1,100

Row2,200

`;

      const rows = parseCSV(csv);

      expect(rows.length).toBe(2);
      expect(rows[0]['Name']).toBe('Row1');
      expect(rows[1]['Name']).toBe('Row2');
    });

    it('should return empty array for empty CSV', () => {
      const rows = parseCSV('');

      expect(rows).toEqual([]);
    });

    it('should return empty array for header-only CSV', () => {
      const rows = parseCSV('Name,Value');

      expect(rows).toEqual([]);
    });

    it('should handle Windows line endings (CRLF)', () => {
      const csv = 'Name,Value\r\nRow1,100\r\nRow2,200';

      const rows = parseCSV(csv);

      expect(rows.length).toBe(2);
    });
  });

  describe('detectColumnMapping', () => {
    it('should detect company number column variations', () => {
      const testCases = [
        ['Company Number', 'Name'],
        ['company_number', 'name'],
        ['CompanyNo', 'name'],
        ['CH Number', 'name'],
        ['Registration Number', 'name'],
        ['CRN', 'name'],
      ];

      for (const headers of testCases) {
        const mapping = detectColumnMapping(headers);
        expect(mapping.companyNumber).toBeDefined();
      }
    });

    it('should detect company name column variations', () => {
      const testCases = [
        ['Company Name', 'Number'],
        ['Organisation Name', 'Number'],
        ['organization_name', 'Number'],
        ['Name', 'Number'],
        ['Business Name', 'Number'],
      ];

      for (const headers of testCases) {
        const mapping = detectColumnMapping(headers);
        expect(mapping.companyName).toBeDefined();
      }
    });

    it('should detect statement URL column variations', () => {
      const testCases = [
        ['Statement URL', 'Name'],
        ['URL', 'Name'],
        ['Statement Link', 'Name'],
        ['Link', 'Name'],
        ['Summary URL', 'Name'],
      ];

      for (const headers of testCases) {
        const mapping = detectColumnMapping(headers);
        expect(mapping.statementUrl).toBeDefined();
      }
    });

    it('should detect year column variations', () => {
      const testCases = [
        ['Year', 'Name'],
        ['Financial Year', 'Name'],
        ['Reporting Year', 'Name'],
        ['Statement Year', 'Name'],
      ];

      for (const headers of testCases) {
        const mapping = detectColumnMapping(headers);
        expect(mapping.year).toBeDefined();
      }
    });

    it('should map columns from fixture with company number', () => {
      const rows = parseCSV(csvWithCompanyNumber);
      const headers = getHeadersFromRows(rows);
      const mapping = detectColumnMapping(headers);

      expect(mapping.companyNumber).toBe('Company Number');
      expect(mapping.companyName).toBe('Company Name');
      expect(mapping.statementUrl).toBe('Statement URL');
      expect(mapping.year).toBe('Year');
      expect(mapping.signedDate).toBe('Date Signed');
    });

    it('should map columns from fixture without company number', () => {
      const rows = parseCSV(csvNameOnly);
      const headers = getHeadersFromRows(rows);
      const mapping = detectColumnMapping(headers);

      expect(mapping.companyNumber).toBeUndefined();
      expect(mapping.companyName).toBe('Organisation Name');
      expect(mapping.statementUrl).toBe('Statement Link');
      expect(mapping.year).toBe('Financial Year');
      expect(mapping.signedDate).toBe('Published Date');
    });

    it('should return empty mapping for unrecognized headers', () => {
      const mapping = detectColumnMapping(['Foo', 'Bar', 'Baz']);

      expect(mapping.companyNumber).toBeUndefined();
      expect(mapping.companyName).toBeUndefined();
      expect(mapping.statementUrl).toBeUndefined();
    });
  });

  describe('getHeadersFromRows', () => {
    it('should extract headers from parsed rows', () => {
      const rows = parseCSV(csvWithCompanyNumber);
      const headers = getHeadersFromRows(rows);

      expect(headers).toContain('Company Name');
      expect(headers).toContain('Company Number');
      expect(headers).toContain('Statement URL');
      expect(headers).toContain('Year');
      expect(headers).toContain('Date Signed');
    });

    it('should return empty array for empty rows', () => {
      const headers = getHeadersFromRows([]);

      expect(headers).toEqual([]);
    });
  });

  describe('getMappedValue', () => {
    it('should get value using column mapping', () => {
      const rows = parseCSV(csvWithCompanyNumber);
      const mapping = detectColumnMapping(getHeadersFromRows(rows));

      const companyName = getMappedValue(rows[0], mapping, 'companyName');
      const companyNumber = getMappedValue(rows[0], mapping, 'companyNumber');

      expect(companyName).toBe('ACME Solutions Ltd');
      expect(companyNumber).toBe('01234567');
    });

    it('should return undefined for unmapped columns', () => {
      const rows = parseCSV(csvNameOnly);
      const mapping = detectColumnMapping(getHeadersFromRows(rows));

      const companyNumber = getMappedValue(rows[0], mapping, 'companyNumber');

      expect(companyNumber).toBeUndefined();
    });

    it('should return undefined for empty values', () => {
      const row = { 'Company Name': '', 'Company Number': '  ' };
      const mapping = { companyName: 'Company Name', companyNumber: 'Company Number' };

      expect(getMappedValue(row, mapping, 'companyName')).toBeUndefined();
      expect(getMappedValue(row, mapping, 'companyNumber')).toBeUndefined();
    });
  });
});
