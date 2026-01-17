/**
 * Test fixtures for dossier builder tests.
 * Contains 3 scenarios for golden fixture testing.
 */

import type {
  CompanyProfileResponse,
  OfficersResponse,
  PSCsResponse,
  ModernSlaveryRegistryResult,
} from '../connector-types';
import type { DossierInput } from '../types';

// ============================================================================
// Scenario 1: Active company with officers and PSCs
// ============================================================================

export const activeCompanyProfile: CompanyProfileResponse = {
  can_file: true,
  company_name: 'EXAMPLE TRADING LIMITED',
  company_number: '12345678',
  company_status: 'active',
  date_of_creation: '2020-01-15',
  type: 'ltd',
  sic_codes: ['62090', '62020'], // Intentionally unsorted to test sorting
  registered_office_address: {
    address_line_1: '123 Business Park',
    address_line_2: 'Enterprise Way',
    locality: 'Manchester',
    postal_code: 'M1 2AB',
    country: 'United Kingdom',
  },
  links: {
    self: '/company/12345678',
  },
};

export const activeCompanyOfficers: OfficersResponse = {
  items: [
    // Intentionally unsorted to test sorting
    {
      name: 'JONES, Sarah Elizabeth',
      officer_role: 'director',
      appointed_on: '2020-02-01',
      nationality: 'British',
      date_of_birth: { month: 11, year: 1978 },
      links: { self: '/company/12345678/appointments/xyz' },
    },
    {
      name: 'SMITH, John David',
      officer_role: 'director',
      appointed_on: '2020-01-15',
      nationality: 'British',
      date_of_birth: { month: 6, year: 1985 },
      links: { self: '/company/12345678/appointments/abc' },
    },
    {
      name: 'BROWN, Michael',
      officer_role: 'secretary',
      appointed_on: '2020-01-15',
      resigned_on: '2023-06-30',
      nationality: 'British',
      links: { self: '/company/12345678/appointments/def' },
    },
  ],
  items_per_page: 35,
  kind: 'officer-list',
  links: { self: '/company/12345678/officers' },
  start_index: 0,
  total_results: 3,
};

export const activeCompanyPSCs: PSCsResponse = {
  items: [
    // Intentionally unsorted to test sorting
    {
      name: 'Ms Jane Doe',
      natures_of_control: ['ownership-of-shares-25-to-50-percent'],
      notified_on: '2021-06-20',
      nationality: 'British',
      kind: 'individual-person-with-significant-control',
      links: { self: '/company/12345678/psc/psc2' },
    },
    {
      name: 'Mr John David Smith',
      natures_of_control: [
        // Intentionally unsorted to test sorting
        'voting-rights-75-to-100-percent',
        'ownership-of-shares-75-to-100-percent',
        'right-to-appoint-and-remove-directors',
      ],
      notified_on: '2020-01-15',
      nationality: 'British',
      kind: 'individual-person-with-significant-control',
      links: { self: '/company/12345678/psc/psc1' },
    },
  ],
  items_per_page: 25,
  kind: 'persons-with-significant-control#list',
  links: { self: '/company/12345678/persons-with-significant-control' },
  start_index: 0,
  total_results: 2,
};

export const noModernSlavery: ModernSlaveryRegistryResult = {
  found: false,
  evidence: [],
};

export const activeCompanyEvidence: DossierInput['evidence'] = {
  profile: {
    apiUrl: 'https://api.company-information.service.gov.uk/company/12345678',
    publicUrl: 'https://find-and-update.company-information.service.gov.uk/company/12345678',
    fetchedAt: '2024-01-15T10:00:00.000Z',
    fromCache: false,
  },
  officers: {
    apiUrl: 'https://api.company-information.service.gov.uk/company/12345678/officers',
    publicUrl:
      'https://find-and-update.company-information.service.gov.uk/company/12345678/officers',
    fetchedAt: '2024-01-15T10:00:01.000Z',
    fromCache: false,
  },
  pscs: {
    apiUrl:
      'https://api.company-information.service.gov.uk/company/12345678/persons-with-significant-control',
    publicUrl:
      'https://find-and-update.company-information.service.gov.uk/company/12345678/persons-with-significant-control',
    fetchedAt: '2024-01-15T10:00:02.000Z',
    fromCache: false,
  },
};

export const scenario1Input: DossierInput = {
  profile: activeCompanyProfile,
  officers: activeCompanyOfficers,
  pscs: activeCompanyPSCs,
  modernSlavery: noModernSlavery,
  evidence: activeCompanyEvidence,
};

// ============================================================================
// Scenario 2: Dissolved company with minimal data
// ============================================================================

export const dissolvedCompanyProfile: CompanyProfileResponse = {
  can_file: false,
  company_name: 'DEFUNCT ENTERPRISES LTD',
  company_number: 'SC654321',
  company_status: 'dissolved',
  date_of_cessation: '2023-06-15',
  date_of_creation: '2015-08-20',
  type: 'ltd',
  sic_codes: ['47110'],
  registered_office_address: {
    address_line_1: '100 George Street',
    locality: 'Edinburgh',
    postal_code: 'EH2 3ES',
    country: 'Scotland',
  },
  links: {
    self: '/company/SC654321',
  },
};

export const emptyOfficers: OfficersResponse = {
  items: [],
  items_per_page: 35,
  kind: 'officer-list',
  links: { self: '/company/SC654321/officers' },
  start_index: 0,
  total_results: 0,
};

export const emptyPSCs: PSCsResponse = {
  items: [],
  items_per_page: 25,
  kind: 'persons-with-significant-control#list',
  links: { self: '/company/SC654321/persons-with-significant-control' },
  start_index: 0,
  total_results: 0,
};

export const dissolvedCompanyEvidence: DossierInput['evidence'] = {
  profile: {
    apiUrl: 'https://api.company-information.service.gov.uk/company/SC654321',
    publicUrl: 'https://find-and-update.company-information.service.gov.uk/company/SC654321',
    fetchedAt: '2024-01-15T11:00:00.000Z',
    fromCache: true,
  },
  officers: {
    apiUrl: 'https://api.company-information.service.gov.uk/company/SC654321/officers',
    publicUrl:
      'https://find-and-update.company-information.service.gov.uk/company/SC654321/officers',
    fetchedAt: '2024-01-15T11:00:01.000Z',
    fromCache: true,
  },
  pscs: {
    apiUrl:
      'https://api.company-information.service.gov.uk/company/SC654321/persons-with-significant-control',
    publicUrl:
      'https://find-and-update.company-information.service.gov.uk/company/SC654321/persons-with-significant-control',
    fetchedAt: '2024-01-15T11:00:02.000Z',
    fromCache: true,
  },
};

export const scenario2Input: DossierInput = {
  profile: dissolvedCompanyProfile,
  officers: emptyOfficers,
  pscs: emptyPSCs,
  modernSlavery: noModernSlavery,
  evidence: dissolvedCompanyEvidence,
};

// ============================================================================
// Scenario 3: Company with modern slavery statement
// ============================================================================

export const largeCompanyProfile: CompanyProfileResponse = {
  can_file: true,
  company_name: 'BIG CORPORATION PLC',
  company_number: '00123456',
  company_status: 'active',
  date_of_creation: '1990-03-01',
  type: 'plc',
  sic_codes: ['10110', '10120', '10130'],
  registered_office_address: {
    address_line_1: '1 Corporate Tower',
    address_line_2: 'Financial District',
    locality: 'London',
    postal_code: 'EC1A 1BB',
    country: 'England',
  },
  links: {
    self: '/company/00123456',
  },
};

export const largeCompanyOfficers: OfficersResponse = {
  items: [
    {
      name: 'LORD CHAIRMAN, Richard',
      officer_role: 'director',
      appointed_on: '2010-01-01',
      nationality: 'British',
      date_of_birth: { month: 1, year: 1955 },
      links: { self: '/company/00123456/appointments/chair' },
    },
  ],
  items_per_page: 35,
  kind: 'officer-list',
  links: { self: '/company/00123456/officers' },
  start_index: 0,
  total_results: 1,
};

export const corporatePSC: PSCsResponse = {
  items: [
    {
      name: 'PARENT HOLDINGS LTD',
      natures_of_control: [
        'ownership-of-shares-75-to-100-percent',
        'voting-rights-75-to-100-percent',
      ],
      notified_on: '2019-04-01',
      nationality: '',
      kind: 'corporate-entity-person-with-significant-control',
      links: { self: '/company/00123456/psc/corp1' },
    },
  ],
  items_per_page: 25,
  kind: 'persons-with-significant-control#list',
  links: { self: '/company/00123456/persons-with-significant-control' },
  start_index: 0,
  total_results: 1,
};

export const modernSlaveryFound: ModernSlaveryRegistryResult = {
  found: true,
  latestYear: 2024,
  statementSummaryUrl:
    'https://modern-slavery-statement-registry.service.gov.uk/statement-summary/12345',
  evidence: [
    {
      csvUrl: 'https://modern-slavery-statement-registry.service.gov.uk/download/2024.csv',
      year: 2024,
      rowIndex: 456,
      matchMethod: 'company_number',
    },
  ],
};

export const largeCompanyEvidence: DossierInput['evidence'] = {
  profile: {
    apiUrl: 'https://api.company-information.service.gov.uk/company/00123456',
    publicUrl: 'https://find-and-update.company-information.service.gov.uk/company/00123456',
    fetchedAt: '2024-01-15T12:00:00.000Z',
    fromCache: false,
  },
  officers: {
    apiUrl: 'https://api.company-information.service.gov.uk/company/00123456/officers',
    publicUrl:
      'https://find-and-update.company-information.service.gov.uk/company/00123456/officers',
    fetchedAt: '2024-01-15T12:00:01.000Z',
    fromCache: false,
  },
  pscs: {
    apiUrl:
      'https://api.company-information.service.gov.uk/company/00123456/persons-with-significant-control',
    publicUrl:
      'https://find-and-update.company-information.service.gov.uk/company/00123456/persons-with-significant-control',
    fetchedAt: '2024-01-15T12:00:02.000Z',
    fromCache: false,
  },
};

export const scenario3Input: DossierInput = {
  profile: largeCompanyProfile,
  officers: largeCompanyOfficers,
  pscs: corporatePSC,
  modernSlavery: modernSlaveryFound,
  evidence: largeCompanyEvidence,
};

// Fixed timestamp for deterministic testing
export const FIXED_GENERATED_AT = '2024-01-15T12:00:00.000Z';
