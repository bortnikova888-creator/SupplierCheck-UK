/**
 * Types from connectors, copied here to avoid external imports.
 * These types define the raw API responses from Companies House
 * and the domain types used by the dossier builder.
 */

// ============================================================================
// Companies House Address Types
// ============================================================================

export interface CompaniesHouseAddress {
  address_line_1?: string;
  address_line_2?: string;
  care_of?: string;
  country?: string;
  locality?: string;
  po_box?: string;
  postal_code?: string;
  premises?: string;
  region?: string;
}

export interface DateOfBirth {
  day?: number;
  month: number;
  year: number;
}

// ============================================================================
// Company Profile Types
// ============================================================================

export interface CompanyProfileResponse {
  accounts?: {
    accounting_reference_date?: { day: number; month: number };
    last_accounts?: {
      made_up_to?: string;
      period_end_on?: string;
      period_start_on?: string;
      type?: string;
    };
    next_accounts?: {
      due_on?: string;
      overdue?: boolean;
      period_end_on?: string;
      period_start_on?: string;
    };
    next_due?: string;
    next_made_up_to?: string;
    overdue?: boolean;
  };
  can_file: boolean;
  company_name: string;
  company_number: string;
  company_status: string;
  company_status_detail?: string;
  confirmation_statement?: {
    last_made_up_to?: string;
    next_due?: string;
    next_made_up_to?: string;
    overdue?: boolean;
  };
  date_of_cessation?: string;
  date_of_creation?: string;
  etag?: string;
  has_been_liquidated?: boolean;
  has_charges?: boolean;
  has_insolvency_history?: boolean;
  is_community_interest_company?: boolean;
  jurisdiction?: string;
  last_full_members_list_date?: string;
  links: {
    self: string;
    [key: string]: string | undefined;
  };
  previous_company_names?: Array<{
    ceased_on: string;
    effective_from: string;
    name: string;
  }>;
  registered_office_address?: CompaniesHouseAddress;
  registered_office_is_in_dispute?: boolean;
  sic_codes?: string[];
  type: string;
  undeliverable_registered_office_address?: boolean;
}

// ============================================================================
// Officers Types
// ============================================================================

export interface OfficerItem {
  address?: CompaniesHouseAddress;
  appointed_on?: string;
  country_of_residence?: string;
  date_of_birth?: DateOfBirth;
  identification?: {
    identification_type?: string;
    legal_authority?: string;
    legal_form?: string;
    place_registered?: string;
    registration_number?: string;
  };
  links: {
    officer?: { appointments?: string };
    self?: string;
  };
  name: string;
  nationality?: string;
  occupation?: string;
  officer_role: string;
  resigned_on?: string;
  former_names?: Array<{ forenames?: string; surname?: string }>;
}

export interface OfficersResponse {
  active_count?: number;
  etag?: string;
  inactive_count?: number;
  items: OfficerItem[];
  items_per_page: number;
  kind: string;
  links: { self: string };
  resigned_count?: number;
  start_index: number;
  total_results: number;
}

// ============================================================================
// PSC Types
// ============================================================================

export interface PSCItem {
  address?: CompaniesHouseAddress;
  ceased_on?: string;
  country_of_residence?: string;
  date_of_birth?: DateOfBirth;
  etag?: string;
  identification?: {
    country_registered?: string;
    legal_authority?: string;
    legal_form?: string;
    place_registered?: string;
    registration_number?: string;
  };
  kind: string;
  links: { self?: string; statement?: string };
  name?: string;
  name_elements?: {
    forename?: string;
    middle_name?: string;
    surname?: string;
    title?: string;
  };
  nationality?: string;
  natures_of_control?: string[];
  notified_on?: string;
}

export interface PSCsResponse {
  active_count?: number;
  ceased_count?: number;
  etag?: string;
  items: PSCItem[];
  items_per_page: number;
  kind: string;
  links: {
    persons_with_significant_control_statements?: string;
    self: string;
  };
  start_index: number;
  total_results: number;
}

// ============================================================================
// Evidence Types
// ============================================================================

export interface Evidence {
  apiUrl: string;
  publicUrl?: string;
  fetchedAt: string;
  fromCache: boolean;
}

// ============================================================================
// Domain Types
// ============================================================================

export interface Address {
  line1: string;
  line2?: string;
  town: string;
  postcode: string;
  country: string;
}

export interface Officer {
  name: string;
  role: string;
  appointedOn: string;
  resignedOn?: string;
  nationality: string;
  birthMonth?: number;
  birthYear?: number;
}

export interface PSC {
  name: string;
  natureOfControl: string[];
  notifiedOn: string;
  ceasedOn?: string;
  nationality: string;
}

export enum FlagSeverity {
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

export interface RiskFlag {
  id: string;
  title: string;
  severity: FlagSeverity;
  explanation: string;
  evidenceUrl?: string;
}

export interface ModernSlaveryStatement {
  url: string;
  signedBy: string;
  dateSigned: string;
  compliant: boolean;
}

export interface Company {
  companyNumber: string;
  name: string;
  status: string;
  type: string;
  incorporationDate: string;
  registeredOffice: Address;
  sicCodes: string[];
}

export interface Dossier {
  company: Company;
  officers: Officer[];
  pscs: PSC[];
  riskFlags: RiskFlag[];
  modernSlavery?: ModernSlaveryStatement;
  generatedAt: string;
}

// ============================================================================
// Modern Slavery Registry Types
// ============================================================================

export interface RegistryEvidence {
  csvUrl: string;
  year: number;
  rowIndex?: number;
  matchMethod: 'company_number' | 'normalized_name';
}

export interface ModernSlaveryRegistryResult {
  found: boolean;
  latestYear?: number;
  statementSummaryUrl?: string;
  evidence: RegistryEvidence[];
}
