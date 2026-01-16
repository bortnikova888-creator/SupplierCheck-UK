/**
 * Type definitions for Companies House API responses.
 * Based on the official Companies House REST API documentation.
 * @see https://developer.company-information.service.gov.uk/
 */

// ============================================================================
// Common Types
// ============================================================================

export interface CompaniesHouseLinks {
  self?: string;
  [key: string]: string | undefined;
}

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
// Search API Types
// ============================================================================

export interface CompanySearchItem {
  company_number: string;
  company_status: string;
  company_type: string;
  title: string;
  address_snippet?: string;
  address?: CompaniesHouseAddress;
  date_of_cessation?: string;
  date_of_creation?: string;
  description?: string;
  description_identifier?: string[];
  kind: string;
  links: {
    self: string;
  };
  matches?: {
    title?: number[];
    snippet?: number[];
  };
  snippet?: string;
}

export interface CompanySearchResponse {
  etag?: string;
  items: CompanySearchItem[];
  items_per_page: number;
  kind: string;
  page_number?: number;
  start_index: number;
  total_results: number;
}

// ============================================================================
// Company Profile API Types
// ============================================================================

export interface AccountsInformation {
  accounting_reference_date?: {
    day: number;
    month: number;
  };
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
}

export interface ConfirmationStatement {
  last_made_up_to?: string;
  next_due?: string;
  next_made_up_to?: string;
  overdue?: boolean;
}

export interface CompanyProfileResponse {
  accounts?: AccountsInformation;
  annual_return?: {
    last_made_up_to?: string;
    next_due?: string;
    next_made_up_to?: string;
    overdue?: boolean;
  };
  can_file: boolean;
  company_name: string;
  company_number: string;
  company_status: string;
  company_status_detail?: string;
  confirmation_statement?: ConfirmationStatement;
  date_of_cessation?: string;
  date_of_creation?: string;
  etag?: string;
  has_been_liquidated?: boolean;
  has_charges?: boolean;
  has_insolvency_history?: boolean;
  is_community_interest_company?: boolean;
  jurisdiction?: string;
  last_full_members_list_date?: string;
  links: CompaniesHouseLinks & {
    filing_history?: string;
    officers?: string;
    persons_with_significant_control?: string;
    persons_with_significant_control_statements?: string;
    registers?: string;
    self: string;
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
// Officers API Types
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
    officer?: {
      appointments?: string;
    };
    self?: string;
  };
  name: string;
  nationality?: string;
  occupation?: string;
  officer_role: string;
  resigned_on?: string;
  former_names?: Array<{
    forenames?: string;
    surname?: string;
  }>;
}

export interface OfficersResponse {
  active_count?: number;
  etag?: string;
  inactive_count?: number;
  items: OfficerItem[];
  items_per_page: number;
  kind: string;
  links: {
    self: string;
  };
  resigned_count?: number;
  start_index: number;
  total_results: number;
}

// ============================================================================
// PSC (Persons with Significant Control) API Types
// ============================================================================

export interface NatureOfControl {
  natures_of_control?: string[];
}

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
  links: {
    self?: string;
    statement?: string;
  };
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
// PSC Statements API Types
// ============================================================================

export interface PSCStatementItem {
  ceased_on?: string;
  etag?: string;
  kind: string;
  linked_psc_name?: string;
  links: {
    person_with_significant_control?: string;
    self: string;
  };
  notified_on?: string;
  restrictions_notice_withdrawal_reason?: string;
  statement?: string;
}

export interface PSCStatementsResponse {
  active_count?: number;
  ceased_count?: number;
  etag?: string;
  items: PSCStatementItem[];
  items_per_page: number;
  kind: string;
  links: {
    persons_with_significant_control?: string;
    self: string;
  };
  start_index: number;
  total_results: number;
}

// ============================================================================
// Connector Result Types (with Evidence)
// ============================================================================

export interface Evidence {
  /** The API URL that was called */
  apiUrl: string;
  /** The public Companies House web URL for viewing this data */
  publicUrl?: string;
  /** When this data was fetched */
  fetchedAt: string;
  /** Whether this data came from cache */
  fromCache: boolean;
}

export interface ConnectorResult<T> {
  success: true;
  data: T;
  evidence: Evidence;
}

export interface ConnectorError {
  success: false;
  error: {
    code: ConnectorErrorCode;
    message: string;
    statusCode?: number;
    details?: unknown;
  };
  evidence: Evidence;
}

export type ConnectorResponse<T> = ConnectorResult<T> | ConnectorError;

export enum ConnectorErrorCode {
  /** Company or resource not found */
  NOT_FOUND = 'NOT_FOUND',
  /** Invalid API key or authentication failed */
  UNAUTHORIZED = 'UNAUTHORIZED',
  /** Rate limit exceeded */
  RATE_LIMITED = 'RATE_LIMITED',
  /** Upstream API error */
  UPSTREAM_ERROR = 'UPSTREAM_ERROR',
  /** Network or connection error */
  NETWORK_ERROR = 'NETWORK_ERROR',
  /** Invalid request parameters */
  INVALID_REQUEST = 'INVALID_REQUEST',
  /** Unknown error */
  UNKNOWN = 'UNKNOWN',
}
