/**
 * Unit tests for individual risk flag rules (F1-F7).
 *
 * PRD 7 - Each rule is tested in isolation.
 */

import { describe, it, expect } from 'vitest';
import { FlagSeverity } from '../../dossier/connector-types';
import type { RiskFlagsInput } from '../types';
import {
  checkF1StatusNotActive,
  checkF2AccountsOverdue,
  checkF3ConfirmationStatementOverdue,
  checkF4InsolvencyIndicator,
  checkF5PSCMissing,
  checkF6FrequentOfficerChanges,
  checkF7ModernSlaveryMissing,
} from '../rules';

// Helper to create minimal test input
function createTestInput(
  overrides: Partial<{
    companyStatus: string;
    accountsOverdue: boolean;
    nextAccountsOverdue: boolean;
    nextAccountsDueOn: string;
    confirmationOverdue: boolean;
    confirmationNextDue: string;
    hasInsolvencyHistory: boolean;
    hasBeenLiquidated: boolean;
    pscs: Array<{ name: string; ceasedOn?: string }>;
    pscStatementsLink: boolean;
    officers: Array<{ appointedOn: string; resignedOn?: string }>;
    modernSlavery: boolean;
  }> = {}
): RiskFlagsInput {
  const {
    companyStatus = 'active',
    accountsOverdue = false,
    nextAccountsOverdue = false,
    nextAccountsDueOn,
    confirmationOverdue = false,
    confirmationNextDue,
    hasInsolvencyHistory = false,
    hasBeenLiquidated = false,
    pscs = [{ name: 'Test PSC' }],
    pscStatementsLink = false,
    officers = [],
    modernSlavery = true,
  } = overrides;

  return {
    dossier: {
      company: {
        companyNumber: 'TEST123',
        name: 'TEST COMPANY LTD',
        status: companyStatus,
        type: 'ltd',
        incorporationDate: '2020-01-01',
        registeredOffice: {
          line1: '1 Test Street',
          town: 'London',
          postcode: 'SW1A 1AA',
          country: 'England',
        },
        sicCodes: ['62020'],
      },
      officers: officers.map((o, i) => ({
        name: `Officer ${i + 1}`,
        role: 'Director',
        appointedOn: o.appointedOn,
        resignedOn: o.resignedOn,
        nationality: 'British',
      })),
      pscs: pscs.map((p, i) => ({
        name: p.name,
        natureOfControl: ['ownership-of-shares-25-to-50-percent'],
        notifiedOn: '2020-01-01',
        ceasedOn: p.ceasedOn,
        nationality: 'British',
      })),
      riskFlags: [],
      modernSlavery: modernSlavery
        ? {
            url: 'https://example.com/statement',
            signedBy: 'CEO',
            dateSigned: '2024-01-01',
            compliant: true,
          }
        : undefined,
      generatedAt: '2024-01-15T12:00:00.000Z',
    },
    rawInput: {
      profile: {
        company_name: 'TEST COMPANY LTD',
        company_number: 'TEST123',
        company_status: companyStatus,
        can_file: true,
        type: 'ltd',
        date_of_creation: '2020-01-01',
        links: { self: '/company/TEST123' },
        accounts: {
          overdue: accountsOverdue,
          next_accounts: {
            overdue: nextAccountsOverdue,
            due_on: nextAccountsDueOn,
          },
        },
        confirmation_statement: {
          overdue: confirmationOverdue,
          next_due: confirmationNextDue,
        },
        has_insolvency_history: hasInsolvencyHistory,
        has_been_liquidated: hasBeenLiquidated,
      },
      officers: {
        items: [],
        items_per_page: 35,
        kind: 'officer-list',
        links: { self: '/company/TEST123/officers' },
        start_index: 0,
        total_results: 0,
      },
      pscs: {
        items: [],
        items_per_page: 25,
        kind: 'persons-with-significant-control#list',
        links: {
          self: '/company/TEST123/persons-with-significant-control',
          ...(pscStatementsLink
            ? {
                persons_with_significant_control_statements:
                  '/company/TEST123/persons-with-significant-control-statements',
              }
            : {}),
        },
        start_index: 0,
        total_results: 0,
      },
      modernSlavery: {
        found: modernSlavery,
        evidence: [],
      },
      evidence: {
        profile: {
          apiUrl: 'https://api.company-information.service.gov.uk/company/TEST123',
          publicUrl: 'https://find-and-update.company-information.service.gov.uk/company/TEST123',
          fetchedAt: '2024-01-15T10:00:00.000Z',
          fromCache: false,
        },
        officers: {
          apiUrl: 'https://api.company-information.service.gov.uk/company/TEST123/officers',
          publicUrl:
            'https://find-and-update.company-information.service.gov.uk/company/TEST123/officers',
          fetchedAt: '2024-01-15T10:00:01.000Z',
          fromCache: false,
        },
        pscs: {
          apiUrl:
            'https://api.company-information.service.gov.uk/company/TEST123/persons-with-significant-control',
          publicUrl:
            'https://find-and-update.company-information.service.gov.uk/company/TEST123/persons-with-significant-control',
          fetchedAt: '2024-01-15T10:00:02.000Z',
          fromCache: false,
        },
      },
    },
    referenceDate: '2024-01-15T12:00:00.000Z',
  };
}

describe('F1: Status != Active', () => {
  it('should NOT flag active companies', () => {
    const input = createTestInput({ companyStatus: 'active' });
    const result = checkF1StatusNotActive(input);
    expect(result).toBeUndefined();
  });

  it('should flag dissolved companies', () => {
    const input = createTestInput({ companyStatus: 'dissolved' });
    const result = checkF1StatusNotActive(input);

    expect(result).toBeDefined();
    expect(result?.id).toBe('F1');
    expect(result?.title).toBe('Company not active');
    expect(result?.severity).toBe(FlagSeverity.HIGH);
    expect(result?.explanation).toContain('dissolved');
    expect(result?.evidenceUrl).toBeDefined();
  });

  it('should flag liquidated companies', () => {
    const input = createTestInput({ companyStatus: 'liquidation' });
    const result = checkF1StatusNotActive(input);

    expect(result).toBeDefined();
    expect(result?.id).toBe('F1');
    expect(result?.explanation).toContain('liquidation');
  });

  it('should flag companies in receivership', () => {
    const input = createTestInput({ companyStatus: 'receivership' });
    const result = checkF1StatusNotActive(input);

    expect(result).toBeDefined();
    expect(result?.id).toBe('F1');
  });
});

describe('F2: Accounts Overdue', () => {
  it('should NOT flag when accounts are not overdue', () => {
    const input = createTestInput({
      accountsOverdue: false,
      nextAccountsOverdue: false,
    });
    const result = checkF2AccountsOverdue(input);
    expect(result).toBeUndefined();
  });

  it('should flag when accounts.overdue is true', () => {
    const input = createTestInput({ accountsOverdue: true });
    const result = checkF2AccountsOverdue(input);

    expect(result).toBeDefined();
    expect(result?.id).toBe('F2');
    expect(result?.title).toBe('Accounts overdue');
    expect(result?.severity).toBe(FlagSeverity.MEDIUM);
  });

  it('should flag when next_accounts.overdue is true', () => {
    const input = createTestInput({ nextAccountsOverdue: true });
    const result = checkF2AccountsOverdue(input);

    expect(result).toBeDefined();
    expect(result?.id).toBe('F2');
  });

  it('should include due date in explanation when available', () => {
    const input = createTestInput({
      nextAccountsOverdue: true,
      nextAccountsDueOn: '2023-12-01',
    });
    const result = checkF2AccountsOverdue(input);

    expect(result?.explanation).toContain('2023-12-01');
  });
});

describe('F3: Confirmation Statement Overdue', () => {
  it('should NOT flag when confirmation statement is not overdue', () => {
    const input = createTestInput({ confirmationOverdue: false });
    const result = checkF3ConfirmationStatementOverdue(input);
    expect(result).toBeUndefined();
  });

  it('should flag when confirmation statement is overdue', () => {
    const input = createTestInput({ confirmationOverdue: true });
    const result = checkF3ConfirmationStatementOverdue(input);

    expect(result).toBeDefined();
    expect(result?.id).toBe('F3');
    expect(result?.title).toBe('Confirmation statement overdue');
    expect(result?.severity).toBe(FlagSeverity.MEDIUM);
  });

  it('should include due date in explanation when available', () => {
    const input = createTestInput({
      confirmationOverdue: true,
      confirmationNextDue: '2023-11-15',
    });
    const result = checkF3ConfirmationStatementOverdue(input);

    expect(result?.explanation).toContain('2023-11-15');
  });
});

describe('F4: Insolvency Indicator', () => {
  it('should NOT flag when no insolvency indicators present', () => {
    const input = createTestInput({
      hasInsolvencyHistory: false,
      hasBeenLiquidated: false,
    });
    const result = checkF4InsolvencyIndicator(input);
    expect(result).toBeUndefined();
  });

  it('should flag when has_insolvency_history is true', () => {
    const input = createTestInput({ hasInsolvencyHistory: true });
    const result = checkF4InsolvencyIndicator(input);

    expect(result).toBeDefined();
    expect(result?.id).toBe('F4');
    expect(result?.title).toBe('Insolvency indicator');
    expect(result?.severity).toBe(FlagSeverity.HIGH);
    expect(result?.explanation).toContain('insolvency history');
  });

  it('should flag when has_been_liquidated is true', () => {
    const input = createTestInput({ hasBeenLiquidated: true });
    const result = checkF4InsolvencyIndicator(input);

    expect(result).toBeDefined();
    expect(result?.id).toBe('F4');
    expect(result?.explanation).toContain('liquidation history');
  });

  it('should mention both indicators when both are true', () => {
    const input = createTestInput({
      hasInsolvencyHistory: true,
      hasBeenLiquidated: true,
    });
    const result = checkF4InsolvencyIndicator(input);

    expect(result?.explanation).toContain('insolvency history');
    expect(result?.explanation).toContain('liquidation history');
  });
});

describe('F5: PSC Missing', () => {
  it('should NOT flag when active PSCs exist', () => {
    const input = createTestInput({
      pscs: [{ name: 'Active PSC' }],
    });
    const result = checkF5PSCMissing(input);
    expect(result).toBeUndefined();
  });

  it('should NOT flag when no PSCs but statements link exists', () => {
    const input = createTestInput({
      pscs: [],
      pscStatementsLink: true,
    });
    const result = checkF5PSCMissing(input);
    expect(result).toBeUndefined();
  });

  it('should flag when no active PSCs and no statements link', () => {
    const input = createTestInput({
      pscs: [],
      pscStatementsLink: false,
    });
    const result = checkF5PSCMissing(input);

    expect(result).toBeDefined();
    expect(result?.id).toBe('F5');
    expect(result?.title).toBe('PSC missing');
    expect(result?.severity).toBe(FlagSeverity.HIGH);
  });

  it('should flag when all PSCs have ceased', () => {
    const input = createTestInput({
      pscs: [
        { name: 'Former PSC 1', ceasedOn: '2023-06-01' },
        { name: 'Former PSC 2', ceasedOn: '2023-07-01' },
      ],
      pscStatementsLink: false,
    });
    const result = checkF5PSCMissing(input);

    expect(result).toBeDefined();
    expect(result?.id).toBe('F5');
  });
});

describe('F6: Frequent Officer Changes', () => {
  it('should NOT flag when no officer changes in window', () => {
    const input = createTestInput({
      officers: [{ appointedOn: '2020-01-01' }], // Well before window
    });
    const result = checkF6FrequentOfficerChanges(input);
    expect(result).toBeUndefined();
  });

  it('should NOT flag when changes below threshold', () => {
    const input = createTestInput({
      officers: [
        { appointedOn: '2023-06-01' }, // Within window
        { appointedOn: '2023-08-01' }, // Within window
      ],
    });
    // Default threshold is 3
    const result = checkF6FrequentOfficerChanges(input);
    expect(result).toBeUndefined();
  });

  it('should flag when appointments exceed threshold', () => {
    const input = createTestInput({
      officers: [
        { appointedOn: '2023-03-01' },
        { appointedOn: '2023-06-01' },
        { appointedOn: '2023-09-01' },
      ],
    });
    const result = checkF6FrequentOfficerChanges(input);

    expect(result).toBeDefined();
    expect(result?.id).toBe('F6');
    expect(result?.title).toBe('Frequent officer changes');
    expect(result?.severity).toBe(FlagSeverity.MEDIUM);
    expect(result?.explanation).toContain('3 officer changes');
    expect(result?.explanation).toContain('3 appointments');
  });

  it('should count resignations in the window', () => {
    const input = createTestInput({
      officers: [
        { appointedOn: '2020-01-01', resignedOn: '2023-04-01' },
        { appointedOn: '2020-01-01', resignedOn: '2023-07-01' },
        { appointedOn: '2020-01-01', resignedOn: '2023-10-01' },
      ],
    });
    const result = checkF6FrequentOfficerChanges(input);

    expect(result).toBeDefined();
    expect(result?.id).toBe('F6');
    expect(result?.explanation).toContain('3 resignations');
  });

  it('should count both appointments and resignations', () => {
    const input = createTestInput({
      officers: [
        { appointedOn: '2023-04-01' }, // 1 appointment
        { appointedOn: '2020-01-01', resignedOn: '2023-08-01' }, // 1 resignation
        { appointedOn: '2020-01-01', resignedOn: '2023-10-01' }, // 1 resignation
      ],
    });
    const result = checkF6FrequentOfficerChanges(input);

    expect(result).toBeDefined();
    expect(result?.explanation).toContain('3 officer changes');
    expect(result?.explanation).toContain('1 appointments');
    expect(result?.explanation).toContain('2 resignations');
  });

  it('should respect custom threshold', () => {
    const input = createTestInput({
      officers: [{ appointedOn: '2023-06-01' }],
    });
    const result = checkF6FrequentOfficerChanges(input, {
      lookbackMonths: 12,
      threshold: 1, // Lower threshold
    });

    expect(result).toBeDefined();
    expect(result?.id).toBe('F6');
  });

  it('should respect custom lookback window', () => {
    const input = createTestInput({
      officers: [
        { appointedOn: '2023-02-01' }, // 11 months ago
        { appointedOn: '2023-03-01' }, // 10 months ago
        { appointedOn: '2023-04-01' }, // 9 months ago
      ],
    });
    // With 6 month lookback, these should be outside the window
    const result = checkF6FrequentOfficerChanges(input, {
      lookbackMonths: 6,
      threshold: 3,
    });

    expect(result).toBeUndefined();
  });
});

describe('F7: Modern Slavery Missing', () => {
  it('should NOT flag when modern slavery statement exists', () => {
    const input = createTestInput({ modernSlavery: true });
    const result = checkF7ModernSlaveryMissing(input);
    expect(result).toBeUndefined();
  });

  it('should flag active company without modern slavery statement', () => {
    const input = createTestInput({
      companyStatus: 'active',
      modernSlavery: false,
    });
    const result = checkF7ModernSlaveryMissing(input);

    expect(result).toBeDefined();
    expect(result?.id).toBe('F7');
    expect(result?.title).toBe('Modern slavery statement missing');
    expect(result?.severity).toBe(FlagSeverity.MEDIUM);
    expect(result?.explanation).toContain('£36M');
  });

  it('should NOT flag non-active company without statement', () => {
    const input = createTestInput({
      companyStatus: 'dissolved',
      modernSlavery: false,
    });
    const result = checkF7ModernSlaveryMissing(input);

    expect(result).toBeUndefined();
  });
});
