/**
 * Evidence ID generation using stable hashing.
 * Creates deterministic IDs from URLs for evidence tracking.
 */

import { createHash } from 'crypto';
import type { Evidence } from './connector-types';
import type { EvidenceWithId } from './types';

/**
 * Generate a stable evidence ID from a URL.
 * Uses SHA-256 hash truncated to 12 characters for readability.
 */
export function generateEvidenceId(url: string): string {
  const hash = createHash('sha256').update(url).digest('hex');
  return hash.substring(0, 12);
}

/**
 * Add stable ID to evidence object.
 */
export function addEvidenceId(evidence: Evidence): EvidenceWithId {
  return {
    id: generateEvidenceId(evidence.apiUrl),
    apiUrl: evidence.apiUrl,
    publicUrl: evidence.publicUrl,
    fetchedAt: evidence.fetchedAt,
    fromCache: evidence.fromCache,
  };
}

/**
 * Create an evidence map keyed by stable ID.
 * Ensures deterministic ordering when iterating.
 */
export function createEvidenceMap(
  evidenceList: Evidence[]
): Map<string, EvidenceWithId> {
  const map = new Map<string, EvidenceWithId>();

  // Sort by apiUrl first for deterministic ordering
  const sorted = [...evidenceList].sort((a, b) =>
    a.apiUrl.localeCompare(b.apiUrl)
  );

  for (const evidence of sorted) {
    const withId = addEvidenceId(evidence);
    map.set(withId.id, withId);
  }

  return map;
}
