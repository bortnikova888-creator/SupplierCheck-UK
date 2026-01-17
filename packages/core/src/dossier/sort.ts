/**
 * Stable sorting utilities for deterministic output.
 * All sorts use multiple keys to ensure stable ordering.
 */

import type { Officer, PSC } from './connector-types';

/**
 * Compare function for stable string comparison.
 * Handles undefined values by sorting them last.
 */
function compareStrings(a: string | undefined, b: string | undefined): number {
  if (a === undefined && b === undefined) return 0;
  if (a === undefined) return 1;
  if (b === undefined) return -1;
  return a.localeCompare(b);
}

/**
 * Sort officers with stable ordering.
 * Primary: appointedOn (ascending, earliest first)
 * Secondary: name (ascending, alphabetical)
 * Tertiary: role (ascending, alphabetical)
 */
export function sortOfficers(officers: Officer[]): Officer[] {
  return [...officers].sort((a, b) => {
    // Primary: appointedOn date
    const dateCompare = compareStrings(a.appointedOn, b.appointedOn);
    if (dateCompare !== 0) return dateCompare;

    // Secondary: name
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;

    // Tertiary: role
    return a.role.localeCompare(b.role);
  });
}

/**
 * Sort PSCs with stable ordering.
 * Primary: notifiedOn (ascending, earliest first)
 * Secondary: name (ascending, alphabetical)
 * Tertiary: first nature of control (ascending, alphabetical)
 */
export function sortPSCs(pscs: PSC[]): PSC[] {
  return [...pscs].sort((a, b) => {
    // Primary: notifiedOn date
    const dateCompare = compareStrings(a.notifiedOn, b.notifiedOn);
    if (dateCompare !== 0) return dateCompare;

    // Secondary: name
    const nameCompare = a.name.localeCompare(b.name);
    if (nameCompare !== 0) return nameCompare;

    // Tertiary: first nature of control
    const controlA = a.natureOfControl[0] || '';
    const controlB = b.natureOfControl[0] || '';
    return controlA.localeCompare(controlB);
  });
}

/**
 * Sort natures of control array for deterministic output.
 */
export function sortNaturesOfControl(natures: string[]): string[] {
  return [...natures].sort((a, b) => a.localeCompare(b));
}

/**
 * Sort SIC codes for deterministic output.
 */
export function sortSicCodes(codes: string[]): string[] {
  return [...codes].sort((a, b) => a.localeCompare(b));
}
