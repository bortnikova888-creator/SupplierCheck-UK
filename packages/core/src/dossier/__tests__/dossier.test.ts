/**
 * Dossier builder tests with golden fixture snapshots.
 * Tests 3 scenarios to verify deterministic output.
 */

import { describe, it, expect } from 'vitest';
import { buildDossier, serializeDossier, verifyDeterminism } from '../builder';
import {
  normalizeCompany,
  normalizeOfficers,
  normalizePSCs,
  normalizeAddress,
  normalizeModernSlavery,
} from '../normalizers';
import { sortOfficers, sortPSCs, sortNaturesOfControl, sortSicCodes } from '../sort';
import { generateEvidenceId, addEvidenceId } from '../evidence';
import {
  scenario1Input,
  scenario2Input,
  scenario3Input,
  activeCompanyProfile,
  activeCompanyOfficers,
  activeCompanyPSCs,
  noModernSlavery,
  modernSlaveryFound,
  FIXED_GENERATED_AT,
} from './fixtures';

describe('Dossier Builder', () => {
  describe('buildDossier', () => {
    it('should build dossier for active company (scenario 1)', () => {
      const result = buildDossier(scenario1Input, FIXED_GENERATED_AT);
      expect(result.dossier).toMatchSnapshot('scenario1-active-company');
    });

    it('should build dossier for dissolved company (scenario 2)', () => {
      const result = buildDossier(scenario2Input, FIXED_GENERATED_AT);
      expect(result.dossier).toMatchSnapshot('scenario2-dissolved-company');
    });

    it('should build dossier for company with modern slavery (scenario 3)', () => {
      const result = buildDossier(scenario3Input, FIXED_GENERATED_AT);
      expect(result.dossier).toMatchSnapshot('scenario3-with-modern-slavery');
    });

    it('should produce byte-identical JSON for same inputs', () => {
      const result1 = buildDossier(scenario1Input, FIXED_GENERATED_AT);
      const result2 = buildDossier(scenario1Input, FIXED_GENERATED_AT);

      const json1 = serializeDossier(result1.dossier);
      const json2 = serializeDossier(result2.dossier);

      expect(json1).toBe(json2);
    });

    it('should pass determinism verification', () => {
      const result = buildDossier(scenario1Input, FIXED_GENERATED_AT);
      expect(verifyDeterminism(result.dossier)).toBe(true);
    });

    it('should include evidence with stable IDs', () => {
      const result = buildDossier(scenario1Input, FIXED_GENERATED_AT);
      expect(result.evidence).toHaveLength(3);
      expect(result.evidence.every((e) => e.id.length === 12)).toBe(true);
      // Evidence should be sorted by ID
      const ids = result.evidence.map((e) => e.id);
      expect(ids).toEqual([...ids].sort());
    });
  });

  describe('normalizeCompany', () => {
    it('should normalize company profile correctly', () => {
      const company = normalizeCompany(activeCompanyProfile);
      expect(company.companyNumber).toBe('12345678');
      expect(company.name).toBe('EXAMPLE TRADING LIMITED');
      expect(company.status).toBe('active');
      expect(company.type).toBe('ltd');
      expect(company.incorporationDate).toBe('2020-01-15');
    });

    it('should sort SIC codes', () => {
      const company = normalizeCompany(activeCompanyProfile);
      // Input has ['62090', '62020'], should be sorted
      expect(company.sicCodes).toEqual(['62020', '62090']);
    });
  });

  describe('normalizeAddress', () => {
    it('should normalize address correctly', () => {
      const address = normalizeAddress(activeCompanyProfile.registered_office_address);
      expect(address.line1).toBe('123 Business Park');
      expect(address.line2).toBe('Enterprise Way');
      expect(address.town).toBe('Manchester');
      expect(address.postcode).toBe('M1 2AB');
      expect(address.country).toBe('United Kingdom');
    });

    it('should handle undefined address', () => {
      const address = normalizeAddress(undefined);
      expect(address.line1).toBe('');
      expect(address.town).toBe('');
      expect(address.postcode).toBe('');
      expect(address.country).toBe('');
    });
  });

  describe('normalizeOfficers', () => {
    it('should normalize all officers', () => {
      const officers = normalizeOfficers(activeCompanyOfficers);
      expect(officers).toHaveLength(3);
    });

    it('should normalize officer roles to readable format', () => {
      const officers = normalizeOfficers(activeCompanyOfficers);
      expect(officers[0].role).toBe('Director');
      expect(officers[2].role).toBe('Secretary');
    });

    it('should include birth month/year when available', () => {
      const officers = normalizeOfficers(activeCompanyOfficers);
      expect(officers[0].birthMonth).toBe(11);
      expect(officers[0].birthYear).toBe(1978);
    });

    it('should include resigned date when available', () => {
      const officers = normalizeOfficers(activeCompanyOfficers);
      const resigned = officers.find((o) => o.name === 'BROWN, Michael');
      expect(resigned?.resignedOn).toBe('2023-06-30');
    });
  });

  describe('normalizePSCs', () => {
    it('should normalize all PSCs', () => {
      const pscs = normalizePSCs(activeCompanyPSCs);
      expect(pscs).toHaveLength(2);
    });

    it('should sort natures of control', () => {
      const pscs = normalizePSCs(activeCompanyPSCs);
      const smith = pscs.find((p) => p.name === 'Mr John David Smith');
      // Should be alphabetically sorted
      expect(smith?.natureOfControl).toEqual([
        'ownership-of-shares-75-to-100-percent',
        'right-to-appoint-and-remove-directors',
        'voting-rights-75-to-100-percent',
      ]);
    });
  });

  describe('normalizeModernSlavery', () => {
    it('should return undefined when not found', () => {
      const result = normalizeModernSlavery(noModernSlavery);
      expect(result).toBeUndefined();
    });

    it('should normalize found statement', () => {
      const result = normalizeModernSlavery(modernSlaveryFound);
      expect(result).toBeDefined();
      expect(result?.url).toBe(
        'https://modern-slavery-statement-registry.service.gov.uk/statement-summary/12345'
      );
      expect(result?.compliant).toBe(true);
    });
  });

  describe('sortOfficers', () => {
    it('should sort by appointedOn date first', () => {
      const officers = normalizeOfficers(activeCompanyOfficers);
      const sorted = sortOfficers(officers);

      // 2020-01-15 should come before 2020-02-01
      expect(sorted[0].appointedOn).toBe('2020-01-15');
      expect(sorted[1].appointedOn).toBe('2020-01-15');
      expect(sorted[2].appointedOn).toBe('2020-02-01');
    });

    it('should sort by name when dates are equal', () => {
      const officers = normalizeOfficers(activeCompanyOfficers);
      const sorted = sortOfficers(officers);

      // Both on 2020-01-15, BROWN comes before SMITH alphabetically
      const jan15Officers = sorted.filter((o) => o.appointedOn === '2020-01-15');
      expect(jan15Officers[0].name).toBe('BROWN, Michael');
      expect(jan15Officers[1].name).toBe('SMITH, John David');
    });
  });

  describe('sortPSCs', () => {
    it('should sort by notifiedOn date first', () => {
      const pscs = normalizePSCs(activeCompanyPSCs);
      const sorted = sortPSCs(pscs);

      expect(sorted[0].notifiedOn).toBe('2020-01-15');
      expect(sorted[1].notifiedOn).toBe('2021-06-20');
    });
  });

  describe('sortNaturesOfControl', () => {
    it('should sort alphabetically', () => {
      const input = ['voting-rights', 'ownership', 'appoint-directors'];
      const sorted = sortNaturesOfControl(input);
      expect(sorted).toEqual(['appoint-directors', 'ownership', 'voting-rights']);
    });
  });

  describe('sortSicCodes', () => {
    it('should sort numerically (as strings)', () => {
      const input = ['62090', '62020', '47110'];
      const sorted = sortSicCodes(input);
      expect(sorted).toEqual(['47110', '62020', '62090']);
    });
  });

  describe('generateEvidenceId', () => {
    it('should generate 12-character ID', () => {
      const id = generateEvidenceId('https://example.com/api/test');
      expect(id).toHaveLength(12);
    });

    it('should be deterministic', () => {
      const url = 'https://api.company-information.service.gov.uk/company/12345678';
      const id1 = generateEvidenceId(url);
      const id2 = generateEvidenceId(url);
      expect(id1).toBe(id2);
    });

    it('should produce different IDs for different URLs', () => {
      const id1 = generateEvidenceId('https://example.com/1');
      const id2 = generateEvidenceId('https://example.com/2');
      expect(id1).not.toBe(id2);
    });
  });

  describe('addEvidenceId', () => {
    it('should add ID to evidence', () => {
      const evidence = {
        apiUrl: 'https://example.com/api',
        publicUrl: 'https://example.com/public',
        fetchedAt: '2024-01-01T00:00:00.000Z',
        fromCache: false,
      };
      const withId = addEvidenceId(evidence);
      expect(withId.id).toBeDefined();
      expect(withId.id).toHaveLength(12);
      expect(withId.apiUrl).toBe(evidence.apiUrl);
      expect(withId.publicUrl).toBe(evidence.publicUrl);
    });
  });
});
