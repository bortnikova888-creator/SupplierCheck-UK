/**
 * Risk Flags Engine module.
 *
 * PRD 7 - Implements explicit risk flag rules F1-F7.
 *
 * Usage:
 *   import { computeRiskFlags, buildDossierWithRiskFlags } from '@suppliercheck/core/riskFlags';
 *
 *   // Compute flags for a dossier
 *   const { flags } = computeRiskFlags(dossier, rawInput, referenceDate);
 *
 *   // Or build a dossier with flags in one step
 *   const dossierWithFlags = buildDossierWithRiskFlags(dossier, rawInput, referenceDate);
 */

// Engine exports
export { computeRiskFlags, applyRiskFlags, buildDossierWithRiskFlags } from './engine';
export type { RiskFlagsEngineConfig } from './engine';

// Individual rule exports (for testing and advanced usage)
export {
  checkF1StatusNotActive,
  checkF2AccountsOverdue,
  checkF3ConfirmationStatementOverdue,
  checkF4InsolvencyIndicator,
  checkF5PSCMissing,
  checkF6FrequentOfficerChanges,
  checkF7ModernSlaveryMissing,
} from './rules';

// Type exports
export type {
  RiskFlagsInput,
  RiskFlagsResult,
  RiskFlagRule,
  FlagId,
  OfficerChangesConfig,
} from './types';
