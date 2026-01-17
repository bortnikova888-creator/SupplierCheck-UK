/**
 * Risk Flags Engine tests with golden fixture snapshots.
 *
 * PRD 7 - Tests the complete engine with the 3 fixture dossiers.
 */

import { describe, it, expect } from 'vitest';
import { buildDossier } from '../../dossier/builder';
import { computeRiskFlags, applyRiskFlags, buildDossierWithRiskFlags } from '../engine';
import {
  scenario1Input,
  scenario2Input,
  scenario3Input,
  FIXED_GENERATED_AT,
} from '../../dossier/__tests__/fixtures';

describe('Risk Flags Engine', () => {
  describe('computeRiskFlags', () => {
    it('should compute flags for scenario 1 (active company)', () => {
      const dossierResult = buildDossier(scenario1Input, FIXED_GENERATED_AT);
      const result = computeRiskFlags(dossierResult.dossier, scenario1Input, FIXED_GENERATED_AT);

      expect(result.flags).toMatchSnapshot('scenario1-risk-flags');
    });

    it('should compute flags for scenario 2 (dissolved company)', () => {
      const dossierResult = buildDossier(scenario2Input, FIXED_GENERATED_AT);
      const result = computeRiskFlags(dossierResult.dossier, scenario2Input, FIXED_GENERATED_AT);

      expect(result.flags).toMatchSnapshot('scenario2-risk-flags');
    });

    it('should compute flags for scenario 3 (company with modern slavery)', () => {
      const dossierResult = buildDossier(scenario3Input, FIXED_GENERATED_AT);
      const result = computeRiskFlags(dossierResult.dossier, scenario3Input, FIXED_GENERATED_AT);

      expect(result.flags).toMatchSnapshot('scenario3-risk-flags');
    });

    it('should return flags in stable order by ID', () => {
      const dossierResult = buildDossier(scenario2Input, FIXED_GENERATED_AT);
      const result = computeRiskFlags(dossierResult.dossier, scenario2Input, FIXED_GENERATED_AT);

      const ids = result.flags.map((f) => f.id);
      expect(ids).toEqual([...ids].sort());
    });

    it('should produce identical flags for same inputs', () => {
      const dossierResult = buildDossier(scenario1Input, FIXED_GENERATED_AT);

      const result1 = computeRiskFlags(dossierResult.dossier, scenario1Input, FIXED_GENERATED_AT);
      const result2 = computeRiskFlags(dossierResult.dossier, scenario1Input, FIXED_GENERATED_AT);

      expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
    });
  });

  describe('applyRiskFlags', () => {
    it('should apply flags to dossier without mutation', () => {
      const dossierResult = buildDossier(scenario1Input, FIXED_GENERATED_AT);
      const { flags } = computeRiskFlags(dossierResult.dossier, scenario1Input, FIXED_GENERATED_AT);

      const originalDossier = dossierResult.dossier;
      const withFlags = applyRiskFlags(originalDossier, flags);

      // Original should be unchanged
      expect(originalDossier.riskFlags).toEqual([]);
      // New dossier should have flags
      expect(withFlags.riskFlags).toEqual(flags);
    });

    it('should maintain stable flag ordering', () => {
      const dossierResult = buildDossier(scenario2Input, FIXED_GENERATED_AT);
      const { flags } = computeRiskFlags(dossierResult.dossier, scenario2Input, FIXED_GENERATED_AT);

      const withFlags = applyRiskFlags(dossierResult.dossier, flags);

      const ids = withFlags.riskFlags.map((f) => f.id);
      expect(ids).toEqual([...ids].sort());
    });
  });

  describe('buildDossierWithRiskFlags', () => {
    it('should build complete dossier with flags for scenario 1', () => {
      const dossierResult = buildDossier(scenario1Input, FIXED_GENERATED_AT);
      const dossierWithFlags = buildDossierWithRiskFlags(
        dossierResult.dossier,
        scenario1Input,
        FIXED_GENERATED_AT
      );

      expect(dossierWithFlags).toMatchSnapshot('scenario1-dossier-with-flags');
    });

    it('should build complete dossier with flags for scenario 2', () => {
      const dossierResult = buildDossier(scenario2Input, FIXED_GENERATED_AT);
      const dossierWithFlags = buildDossierWithRiskFlags(
        dossierResult.dossier,
        scenario2Input,
        FIXED_GENERATED_AT
      );

      expect(dossierWithFlags).toMatchSnapshot('scenario2-dossier-with-flags');
    });

    it('should build complete dossier with flags for scenario 3', () => {
      const dossierResult = buildDossier(scenario3Input, FIXED_GENERATED_AT);
      const dossierWithFlags = buildDossierWithRiskFlags(
        dossierResult.dossier,
        scenario3Input,
        FIXED_GENERATED_AT
      );

      expect(dossierWithFlags).toMatchSnapshot('scenario3-dossier-with-flags');
    });
  });

  describe('Expected flags per scenario', () => {
    it('scenario 1 should flag F7 (modern slavery missing)', () => {
      const dossierResult = buildDossier(scenario1Input, FIXED_GENERATED_AT);
      const { flags } = computeRiskFlags(dossierResult.dossier, scenario1Input, FIXED_GENERATED_AT);

      // Active company without modern slavery statement
      const flagIds = flags.map((f) => f.id);
      expect(flagIds).toContain('F7');
      expect(flagIds).not.toContain('F1'); // Active company
    });

    it('scenario 2 should flag F1 (not active) and F5 (no PSCs)', () => {
      const dossierResult = buildDossier(scenario2Input, FIXED_GENERATED_AT);
      const { flags } = computeRiskFlags(dossierResult.dossier, scenario2Input, FIXED_GENERATED_AT);

      const flagIds = flags.map((f) => f.id);
      expect(flagIds).toContain('F1'); // Dissolved company
      expect(flagIds).toContain('F5'); // No PSCs
      expect(flagIds).not.toContain('F7'); // Not active, so no modern slavery check
    });

    it('scenario 3 should have no flags (active with modern slavery)', () => {
      const dossierResult = buildDossier(scenario3Input, FIXED_GENERATED_AT);
      const { flags } = computeRiskFlags(dossierResult.dossier, scenario3Input, FIXED_GENERATED_AT);

      const flagIds = flags.map((f) => f.id);
      expect(flagIds).not.toContain('F1'); // Active
      expect(flagIds).not.toContain('F7'); // Has modern slavery
    });
  });
});
