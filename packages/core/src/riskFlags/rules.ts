/**
 * Risk flag rules F1-F7.
 * Each rule returns a RiskFlag if the condition is met, undefined otherwise.
 *
 * PRD 7 - Risk flags engine (explicit rules)
 */

import { FlagSeverity, type RiskFlag } from '../dossier/connector-types';
import type { RiskFlagsInput, OfficerChangesConfig } from './types';

/**
 * F1: Company status is not active.
 * Flags companies that are dissolved, liquidated, or in other non-active states.
 */
export function checkF1StatusNotActive(input: RiskFlagsInput): RiskFlag | undefined {
  const { status } = input.dossier.company;
  const profileEvidence = input.rawInput.evidence.profile;

  if (status !== 'active') {
    return {
      id: 'F1',
      title: 'Company not active',
      severity: FlagSeverity.HIGH,
      explanation: `Company status is "${status}". The company is not currently active and may not be able to fulfil obligations.`,
      evidenceUrl: profileEvidence.publicUrl,
    };
  }

  return undefined;
}

/**
 * F2: Accounts are overdue.
 * Checks both the overall accounts.overdue flag and next_accounts.overdue.
 */
export function checkF2AccountsOverdue(input: RiskFlagsInput): RiskFlag | undefined {
  const { profile } = input.rawInput;
  const profileEvidence = input.rawInput.evidence.profile;

  const accountsOverdue =
    profile.accounts?.overdue === true || profile.accounts?.next_accounts?.overdue === true;

  if (accountsOverdue) {
    const dueDate = profile.accounts?.next_accounts?.due_on;
    const dueDateInfo = dueDate ? ` (due: ${dueDate})` : '';

    return {
      id: 'F2',
      title: 'Accounts overdue',
      severity: FlagSeverity.MEDIUM,
      explanation: `The company has overdue accounts${dueDateInfo}. This may indicate financial difficulties or poor governance.`,
      evidenceUrl: profileEvidence.publicUrl,
    };
  }

  return undefined;
}

/**
 * F3: Confirmation statement is overdue.
 * Checks if the confirmation statement is overdue per Companies House data.
 */
export function checkF3ConfirmationStatementOverdue(input: RiskFlagsInput): RiskFlag | undefined {
  const { profile } = input.rawInput;
  const profileEvidence = input.rawInput.evidence.profile;

  if (profile.confirmation_statement?.overdue === true) {
    const nextDue = profile.confirmation_statement.next_due;
    const dueInfo = nextDue ? ` (due: ${nextDue})` : '';

    return {
      id: 'F3',
      title: 'Confirmation statement overdue',
      severity: FlagSeverity.MEDIUM,
      explanation: `The company has an overdue confirmation statement${dueInfo}. This is a legal requirement and may indicate poor governance.`,
      evidenceUrl: profileEvidence.publicUrl,
    };
  }

  return undefined;
}

/**
 * F4: Insolvency indicator present.
 * Checks has_insolvency_history and has_been_liquidated flags.
 */
export function checkF4InsolvencyIndicator(input: RiskFlagsInput): RiskFlag | undefined {
  const { profile } = input.rawInput;
  const profileEvidence = input.rawInput.evidence.profile;

  const hasInsolvencyHistory = profile.has_insolvency_history === true;
  const hasBeenLiquidated = profile.has_been_liquidated === true;

  if (hasInsolvencyHistory || hasBeenLiquidated) {
    const indicators: string[] = [];
    if (hasInsolvencyHistory) indicators.push('insolvency history');
    if (hasBeenLiquidated) indicators.push('liquidation history');

    return {
      id: 'F4',
      title: 'Insolvency indicator',
      severity: FlagSeverity.HIGH,
      explanation: `The company has ${indicators.join(' and ')}. This indicates significant financial distress.`,
      evidenceUrl: profileEvidence.publicUrl,
    };
  }

  return undefined;
}

/**
 * F5: PSC missing with no valid statement.
 * Flags when there are no active PSCs and no valid exemption statement.
 *
 * A company must have at least one active PSC, or have filed a valid
 * statement explaining why (e.g., PSC details not confirmed, steps being taken).
 */
export function checkF5PSCMissing(input: RiskFlagsInput): RiskFlag | undefined {
  const { pscs } = input.dossier;
  const { pscs: rawPscs } = input.rawInput;
  const pscsEvidence = input.rawInput.evidence.pscs;

  // Check if there are any active PSCs (not ceased)
  const activePSCs = pscs.filter((psc) => !psc.ceasedOn);

  // Check if there's a valid PSC statement link in the raw data
  const hasStatementsLink = !!rawPscs.links.persons_with_significant_control_statements;

  // If no active PSCs and no statements link, flag it
  if (activePSCs.length === 0 && !hasStatementsLink) {
    return {
      id: 'F5',
      title: 'PSC missing',
      severity: FlagSeverity.HIGH,
      explanation:
        'The company has no active Persons with Significant Control (PSCs) and no valid statement explaining why. This is a legal requirement.',
      evidenceUrl: pscsEvidence.publicUrl,
    };
  }

  return undefined;
}

/**
 * Calculate date N months before reference date.
 */
function subtractMonths(dateStr: string, months: number): Date {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() - months);
  return date;
}

/**
 * Check if a date is within the lookback window.
 */
function isWithinWindow(dateStr: string, windowStart: Date, windowEnd: Date): boolean {
  const date = new Date(dateStr);
  return date >= windowStart && date <= windowEnd;
}

/**
 * F6: Frequent officer changes in last 12 months.
 * Flags companies with many officer appointments or resignations.
 *
 * @param config - Optional configuration for lookback period and threshold
 */
export function checkF6FrequentOfficerChanges(
  input: RiskFlagsInput,
  config: OfficerChangesConfig = { lookbackMonths: 12, threshold: 3 }
): RiskFlag | undefined {
  const { officers } = input.dossier;
  const officersEvidence = input.rawInput.evidence.officers;

  const windowEnd = new Date(input.referenceDate);
  const windowStart = subtractMonths(input.referenceDate, config.lookbackMonths);

  // Count appointments within the window
  const appointmentsInWindow = officers.filter(
    (officer) => officer.appointedOn && isWithinWindow(officer.appointedOn, windowStart, windowEnd)
  ).length;

  // Count resignations within the window
  const resignationsInWindow = officers.filter(
    (officer) => officer.resignedOn && isWithinWindow(officer.resignedOn, windowStart, windowEnd)
  ).length;

  const totalChanges = appointmentsInWindow + resignationsInWindow;

  if (totalChanges >= config.threshold) {
    return {
      id: 'F6',
      title: 'Frequent officer changes',
      severity: FlagSeverity.MEDIUM,
      explanation: `${totalChanges} officer changes in the last ${config.lookbackMonths} months (${appointmentsInWindow} appointments, ${resignationsInWindow} resignations). This may indicate instability.`,
      evidenceUrl: officersEvidence.publicUrl,
    };
  }

  return undefined;
}

/**
 * F7: Modern slavery statement missing.
 * Flags active companies that have no modern slavery statement on record.
 *
 * Note: In reality, this obligation only applies to companies meeting
 * certain size thresholds (turnover > £36M). Since we don't have turnover
 * data, we flag all active companies without a statement as informational.
 */
export function checkF7ModernSlaveryMissing(input: RiskFlagsInput): RiskFlag | undefined {
  const { company, modernSlavery } = input.dossier;
  const profileEvidence = input.rawInput.evidence.profile;

  // Only flag active companies
  if (company.status !== 'active') {
    return undefined;
  }

  // Check if modern slavery statement is present
  if (!modernSlavery) {
    return {
      id: 'F7',
      title: 'Modern slavery statement missing',
      severity: FlagSeverity.MEDIUM,
      explanation:
        'No modern slavery statement found. Large companies (turnover > £36M) are legally required to publish one annually.',
      evidenceUrl: profileEvidence.publicUrl,
    };
  }

  return undefined;
}
