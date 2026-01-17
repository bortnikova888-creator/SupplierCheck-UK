/**
 * Normalizers for converting raw API responses to domain types.
 * All normalizers produce deterministic output with stable ordering.
 */

import type {
  CompanyProfileResponse,
  OfficersResponse,
  PSCsResponse,
  OfficerItem,
  PSCItem,
  CompaniesHouseAddress,
  Company,
  Officer,
  PSC,
  Address,
  ModernSlaveryStatement,
  ModernSlaveryRegistryResult,
} from './connector-types';
import { sortNaturesOfControl, sortSicCodes } from './sort';

/**
 * Normalize Companies House address to domain Address.
 */
export function normalizeAddress(
  addr: CompaniesHouseAddress | undefined
): Address {
  return {
    line1: addr?.address_line_1 || addr?.premises || '',
    line2: addr?.address_line_2,
    town: addr?.locality || '',
    postcode: addr?.postal_code || '',
    country: addr?.country || '',
  };
}

/**
 * Normalize company profile to domain Company.
 */
export function normalizeCompany(profile: CompanyProfileResponse): Company {
  return {
    companyNumber: profile.company_number,
    name: profile.company_name,
    status: profile.company_status,
    type: profile.type,
    incorporationDate: profile.date_of_creation || '',
    registeredOffice: normalizeAddress(profile.registered_office_address),
    sicCodes: sortSicCodes(profile.sic_codes || []),
  };
}

/**
 * Normalize officer role to readable format.
 */
function normalizeOfficerRole(role: string): string {
  // Convert from API format (e.g., 'corporate-secretary') to readable format
  return role
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Normalize single officer item to domain Officer.
 */
export function normalizeOfficer(item: OfficerItem): Officer {
  return {
    name: item.name,
    role: normalizeOfficerRole(item.officer_role),
    appointedOn: item.appointed_on || '',
    resignedOn: item.resigned_on,
    nationality: item.nationality || '',
    birthMonth: item.date_of_birth?.month,
    birthYear: item.date_of_birth?.year,
  };
}

/**
 * Normalize all officers from response.
 */
export function normalizeOfficers(response: OfficersResponse): Officer[] {
  return response.items.map(normalizeOfficer);
}

/**
 * Normalize single PSC item to domain PSC.
 */
export function normalizePSC(item: PSCItem): PSC {
  return {
    name: item.name || '',
    natureOfControl: sortNaturesOfControl(item.natures_of_control || []),
    notifiedOn: item.notified_on || '',
    ceasedOn: item.ceased_on,
    nationality: item.nationality || '',
  };
}

/**
 * Normalize all PSCs from response.
 */
export function normalizePSCs(response: PSCsResponse): PSC[] {
  return response.items.map(normalizePSC);
}

/**
 * Normalize Modern Slavery Registry result to domain statement.
 * Returns undefined if no statement found.
 */
export function normalizeModernSlavery(
  result: ModernSlaveryRegistryResult
): ModernSlaveryStatement | undefined {
  if (!result.found) {
    return undefined;
  }

  // Build statement from registry result
  // Note: The registry only tells us IF a statement exists and the URL,
  // not the detailed content (signedBy, dateSigned, compliant).
  // Those fields would need to be scraped from the statement page.
  return {
    url: result.statementSummaryUrl || '',
    signedBy: '', // Not available from CSV registry
    dateSigned: '', // Not available from CSV registry
    compliant: true, // Assume compliant if found in registry
  };
}
