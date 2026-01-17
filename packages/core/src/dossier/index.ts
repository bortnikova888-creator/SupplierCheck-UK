/**
 * Dossier builder module.
 *
 * Provides functionality for building deterministic Dossier objects
 * from Companies House and Modern Slavery Registry connector outputs.
 */

export { buildDossier, serializeDossier, verifyDeterminism } from './builder';
export type { DossierResult } from './builder';

export {
  normalizeCompany,
  normalizeOfficers,
  normalizeOfficer,
  normalizePSCs,
  normalizePSC,
  normalizeAddress,
  normalizeModernSlavery,
} from './normalizers';

export { sortOfficers, sortPSCs, sortNaturesOfControl, sortSicCodes } from './sort';

export { generateEvidenceId, addEvidenceId, createEvidenceMap } from './evidence';

export type { DossierInput, EvidenceWithId } from './types';

// Re-export connector types for consumers
export type {
  CompanyProfileResponse,
  OfficersResponse,
  PSCsResponse,
  Evidence,
  Dossier,
  Company,
  Officer,
  PSC,
  Address,
  RiskFlag,
  FlagSeverity,
  ModernSlaveryStatement,
  ModernSlaveryRegistryResult,
} from './connector-types';
