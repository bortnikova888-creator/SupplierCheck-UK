/**
 * Types for the Risk Flags Engine.
 * Implements PRD 7 - explicit risk flag rules F1-F7.
 */

import type {
  Dossier,
  RiskFlag,
  FlagSeverity,
  CompanyProfileResponse,
  OfficersResponse,
  PSCsResponse,
  ModernSlaveryRegistryResult,
} from '../dossier/connector-types';
import type { DossierInput } from '../dossier/types';

/**
 * Input for the risk flags engine.
 * Includes both the normalized dossier and the raw input data
 * for accessing fields not normalized into the dossier.
 */
export interface RiskFlagsInput {
  /** Normalized dossier from the builder */
  dossier: Dossier;
  /** Raw input data for accessing non-normalized fields */
  rawInput: DossierInput;
  /** Reference date for time-based calculations (e.g., officer changes) */
  referenceDate: string;
}

/**
 * Result of computing risk flags.
 */
export interface RiskFlagsResult {
  /** Computed risk flags, sorted by ID */
  flags: RiskFlag[];
}

/**
 * A risk flag rule function.
 * Returns a RiskFlag if the condition is met, undefined otherwise.
 */
export type RiskFlagRule = (input: RiskFlagsInput) => RiskFlag | undefined;

/**
 * Flag IDs for the 7 explicit rules.
 */
export type FlagId = 'F1' | 'F2' | 'F3' | 'F4' | 'F5' | 'F6' | 'F7';

/**
 * Configuration for the officer changes rule (F6).
 */
export interface OfficerChangesConfig {
  /** Number of months to look back (default: 12) */
  lookbackMonths: number;
  /** Threshold for flagging (default: 3) */
  threshold: number;
}

// Re-export types used by consumers
export type { RiskFlag, FlagSeverity, Dossier, DossierInput };
