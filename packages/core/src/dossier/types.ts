/**
 * Input types for the Dossier builder.
 * These represent the raw data from connectors that gets normalized into a Dossier.
 */

import type {
  CompanyProfileResponse,
  OfficersResponse,
  PSCsResponse,
  Evidence,
  ModernSlaveryRegistryResult,
} from './connector-types';

/**
 * Raw input data from connectors for building a dossier.
 */
export interface DossierInput {
  /** Company profile from Companies House */
  profile: CompanyProfileResponse;
  /** Officers list from Companies House */
  officers: OfficersResponse;
  /** Persons with Significant Control from Companies House */
  pscs: PSCsResponse;
  /** Modern Slavery Registry lookup result */
  modernSlavery: ModernSlaveryRegistryResult;
  /** Evidence from each connector call */
  evidence: {
    profile: Evidence;
    officers: Evidence;
    pscs: Evidence;
  };
}

/**
 * Evidence with a stable ID (hash of URL).
 */
export interface EvidenceWithId {
  id: string;
  apiUrl: string;
  publicUrl?: string;
  fetchedAt: string;
  fromCache: boolean;
}
