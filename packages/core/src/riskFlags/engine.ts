/**
 * Risk Flags Engine - computes deterministic risk flags from dossier data.
 *
 * PRD 7 - Risk flags engine (explicit rules)
 *
 * Key guarantees:
 * - Same inputs produce identical flags
 * - Flags are sorted by ID (F1, F2, F3, ...)
 * - No scores, only explicit rule-based flags
 * - Each flag includes explanation and evidence URL
 */

import type { Dossier, RiskFlag } from '../dossier/connector-types';
import type { DossierInput } from '../dossier/types';
import type { RiskFlagsInput, RiskFlagsResult, OfficerChangesConfig } from './types';
import {
  checkF1StatusNotActive,
  checkF2AccountsOverdue,
  checkF3ConfirmationStatementOverdue,
  checkF4InsolvencyIndicator,
  checkF5PSCMissing,
  checkF6FrequentOfficerChanges,
  checkF7ModernSlaveryMissing,
} from './rules';

/**
 * Configuration for the risk flags engine.
 */
export interface RiskFlagsEngineConfig {
  /** Configuration for F6 officer changes rule */
  officerChanges?: OfficerChangesConfig;
}

const DEFAULT_CONFIG: RiskFlagsEngineConfig = {
  officerChanges: {
    lookbackMonths: 12,
    threshold: 3,
  },
};

/**
 * Compute risk flags for a dossier.
 *
 * This is the main entry point for the risk flags engine.
 * It runs all 7 rules (F1-F7) and returns the flags in stable order.
 *
 * @param dossier - The normalized dossier
 * @param rawInput - The raw input data (for accessing non-normalized fields)
 * @param referenceDate - Reference date for time-based calculations
 * @param config - Optional engine configuration
 * @returns Risk flags sorted by ID
 */
export function computeRiskFlags(
  dossier: Dossier,
  rawInput: DossierInput,
  referenceDate: string,
  config: RiskFlagsEngineConfig = DEFAULT_CONFIG
): RiskFlagsResult {
  const input: RiskFlagsInput = {
    dossier,
    rawInput,
    referenceDate,
  };

  // Run all rules
  const potentialFlags: (RiskFlag | undefined)[] = [
    checkF1StatusNotActive(input),
    checkF2AccountsOverdue(input),
    checkF3ConfirmationStatementOverdue(input),
    checkF4InsolvencyIndicator(input),
    checkF5PSCMissing(input),
    checkF6FrequentOfficerChanges(input, config.officerChanges),
    checkF7ModernSlaveryMissing(input),
  ];

  // Filter out undefined flags and sort by ID
  const flags = potentialFlags
    .filter((flag): flag is RiskFlag => flag !== undefined)
    .sort((a, b) => a.id.localeCompare(b.id));

  return { flags };
}

/**
 * Apply computed risk flags to a dossier.
 *
 * This creates a new dossier with the risk flags populated.
 * The original dossier is not modified.
 *
 * @param dossier - The original dossier (with empty riskFlags)
 * @param flags - The computed risk flags
 * @returns A new dossier with risk flags
 */
export function applyRiskFlags(dossier: Dossier, flags: RiskFlag[]): Dossier {
  return {
    ...dossier,
    riskFlags: [...flags].sort((a, b) => a.id.localeCompare(b.id)),
  };
}

/**
 * Build a dossier with risk flags in one step.
 *
 * Convenience function that computes and applies risk flags.
 *
 * @param dossier - The normalized dossier
 * @param rawInput - The raw input data
 * @param referenceDate - Reference date for time-based calculations
 * @param config - Optional engine configuration
 * @returns Dossier with risk flags populated
 */
export function buildDossierWithRiskFlags(
  dossier: Dossier,
  rawInput: DossierInput,
  referenceDate: string,
  config?: RiskFlagsEngineConfig
): Dossier {
  const { flags } = computeRiskFlags(dossier, rawInput, referenceDate, config);
  return applyRiskFlags(dossier, flags);
}
