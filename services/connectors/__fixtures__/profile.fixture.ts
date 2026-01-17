import type { CompanyProfileResponse } from '../companies-house.types';

export const profileFixture: CompanyProfileResponse = {
  accounts: {
    accounting_reference_date: {
      day: 31,
      month: 12,
    },
    last_accounts: {
      made_up_to: '2023-12-31',
      period_end_on: '2023-12-31',
      period_start_on: '2023-01-01',
      type: 'full',
    },
    next_accounts: {
      due_on: '2025-09-30',
      overdue: false,
      period_end_on: '2024-12-31',
      period_start_on: '2024-01-01',
    },
    next_due: '2025-09-30',
    next_made_up_to: '2024-12-31',
    overdue: false,
  },
  can_file: true,
  company_name: 'EXAMPLE TRADING LIMITED',
  company_number: '12345678',
  company_status: 'active',
  confirmation_statement: {
    last_made_up_to: '2024-03-15',
    next_due: '2025-03-29',
    next_made_up_to: '2025-03-15',
    overdue: false,
  },
  date_of_creation: '2020-01-15',
  etag: 'profile-etag-123',
  has_been_liquidated: false,
  has_charges: false,
  has_insolvency_history: false,
  is_community_interest_company: false,
  jurisdiction: 'england-wales',
  links: {
    filing_history: '/company/12345678/filing-history',
    officers: '/company/12345678/officers',
    persons_with_significant_control: '/company/12345678/persons-with-significant-control',
    persons_with_significant_control_statements:
      '/company/12345678/persons-with-significant-control-statements',
    self: '/company/12345678',
  },
  previous_company_names: [
    {
      ceased_on: '2021-06-30',
      effective_from: '2020-01-15',
      name: 'ORIGINAL NAME LIMITED',
    },
  ],
  registered_office_address: {
    address_line_1: '123 Business Park',
    address_line_2: 'Enterprise Way',
    locality: 'Manchester',
    postal_code: 'M1 2AB',
    country: 'United Kingdom',
  },
  registered_office_is_in_dispute: false,
  sic_codes: ['62020', '62090'],
  type: 'ltd',
  undeliverable_registered_office_address: false,
};

export const dissolvedProfileFixture: CompanyProfileResponse = {
  can_file: false,
  company_name: 'DEFUNCT ENTERPRISES LTD',
  company_number: 'SC654321',
  company_status: 'dissolved',
  company_status_detail: 'Company has been dissolved',
  date_of_cessation: '2023-06-15',
  date_of_creation: '2015-08-20',
  etag: 'dissolved-etag-456',
  has_been_liquidated: true,
  has_charges: false,
  has_insolvency_history: true,
  jurisdiction: 'scotland',
  links: {
    filing_history: '/company/SC654321/filing-history',
    self: '/company/SC654321',
  },
  registered_office_address: {
    address_line_1: '100 George Street',
    locality: 'Edinburgh',
    postal_code: 'EH2 3ES',
    country: 'Scotland',
  },
  sic_codes: ['47110'],
  type: 'ltd',
};
