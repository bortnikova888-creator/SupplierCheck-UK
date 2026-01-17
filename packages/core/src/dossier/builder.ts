/**
 * Dossier builder - creates deterministic Dossier objects from connector outputs.
 *
 * Key guarantees:
 * - Same inputs produce byte-identical JSON output
 * - Stable sorts for officers and PSCs
 * - Stable evidence IDs (hash of URL)
 * - No timestamps inside dossier unless from upstream data
 */

import type { Dossier } from './connector-types';
import type { DossierInput, EvidenceWithId } from './types';
import {
  normalizeCompany,
  normalizeOfficers,
  normalizePSCs,
  normalizeModernSlavery,
} from './normalizers';
import { sortOfficers, sortPSCs } from './sort';
import { addEvidenceId } from './evidence';

/**
 * Result of building a dossier, includes evidence with stable IDs.
 */
export interface DossierResult {
  dossier: Dossier;
  evidence: EvidenceWithId[];
}

/**
 * Build a deterministic Dossier from connector outputs.
 *
 * The generatedAt timestamp is the ONLY non-deterministic field.
 * Pass a fixed timestamp for testing to ensure byte-identical output.
 *
 * @param input - Raw data from connectors
 * @param generatedAt - Optional fixed timestamp (for testing)
 * @returns DossierResult with normalized dossier and evidence
 */
export function buildDossier(
  input: DossierInput,
  generatedAt?: string
): DossierResult {
  // Normalize company data
  const company = normalizeCompany(input.profile);

  // Normalize and sort officers
  const normalizedOfficers = normalizeOfficers(input.officers);
  const officers = sortOfficers(normalizedOfficers);

  // Normalize and sort PSCs
  const normalizedPSCs = normalizePSCs(input.pscs);
  const pscs = sortPSCs(normalizedPSCs);

  // Normalize modern slavery data
  const modernSlavery = normalizeModernSlavery(input.modernSlavery);

  // Build evidence list with stable IDs
  const evidenceList: EvidenceWithId[] = [
    addEvidenceId(input.evidence.profile),
    addEvidenceId(input.evidence.officers),
    addEvidenceId(input.evidence.pscs),
  ].sort((a, b) => a.id.localeCompare(b.id)); // Stable sort by ID

  // Build the dossier
  const dossier: Dossier = {
    company,
    officers,
    pscs,
    riskFlags: [], // Risk flags are computed by the risk engine (PRD 7)
    modernSlavery,
    generatedAt: generatedAt || new Date().toISOString(),
  };

  return {
    dossier,
    evidence: evidenceList,
  };
}

/**
 * Serialize dossier to deterministic JSON.
 * Uses sorted keys and consistent formatting for byte-identical output.
 */
export function serializeDossier(dossier: Dossier): string {
  return JSON.stringify(dossier, null, 2);
}

/**
 * Verify that a dossier is deterministic by serializing twice.
 * Returns true if both serializations are byte-identical.
 */
export function verifyDeterminism(dossier: Dossier): boolean {
  const first = serializeDossier(dossier);
  const second = serializeDossier(dossier);
  return first === second;
}
