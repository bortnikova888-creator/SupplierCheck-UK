/**
 * Connectors index - exports all API connectors
 */

// Cache
export { Cache, COMPANIES_HOUSE_TTL } from './cache';
export type { CacheOptions } from './cache';

// Companies House Connector
export {
  CompaniesHouseConnector,
  createCompaniesHouseConnector,
} from './companies-house';
export type { CompaniesHouseConnectorConfig } from './companies-house';

// Companies House Types
export {
  ConnectorErrorCode,
} from './companies-house.types';

export type {
  // API Response Types
  CompanySearchResponse,
  CompanySearchItem,
  CompanyProfileResponse,
  OfficersResponse,
  OfficerItem,
  PSCsResponse,
  PSCItem,
  PSCStatementsResponse,
  PSCStatementItem,
  // Common Types
  CompaniesHouseAddress,
  CompaniesHouseLinks,
  DateOfBirth,
  AccountsInformation,
  ConfirmationStatement,
  // Connector Types
  ConnectorResponse,
  ConnectorResult,
  ConnectorError,
  Evidence,
} from './companies-house.types';
