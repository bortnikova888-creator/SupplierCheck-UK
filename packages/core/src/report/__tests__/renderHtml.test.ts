/**
 * Tests for renderHtml - HTML report generation.
 * Uses snapshot testing with normalized whitespace for deterministic comparisons.
 */

import { describe, it, expect } from 'vitest';
import { renderDossierHtml, normalizeHtmlWhitespace } from '../renderHtml';
import { buildDossier } from '../../dossier';
import { computeRiskFlags, applyRiskFlags } from '../../riskFlags';
import {
  scenario1Input,
  scenario2Input,
  scenario3Input,
  FIXED_GENERATED_AT,
} from '../../dossier/__tests__/fixtures';
import type { Dossier } from '../../dossier';
import type { EvidenceWithId } from '../../dossier/types';

// Reference date for risk flags computation
const REFERENCE_DATE = '2024-01-15';

/**
 * Build a complete dossier with risk flags for testing.
 */
function buildTestDossier(input: typeof scenario1Input): {
  dossier: Dossier;
  evidence: EvidenceWithId[];
} {
  const result = buildDossier(input, FIXED_GENERATED_AT);
  const flagsResult = computeRiskFlags(result.dossier, input, REFERENCE_DATE);
  const dossierWithFlags = applyRiskFlags(result.dossier, flagsResult.flags);
  return { dossier: dossierWithFlags, evidence: result.evidence };
}

describe('renderDossierHtml', () => {
  describe('snapshot tests', () => {
    it('should render active company dossier (scenario 1)', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      const normalized = normalizeHtmlWhitespace(html);
      expect(normalized).toMatchSnapshot('scenario1-active-company-html');
    });

    it('should render dissolved company dossier (scenario 2)', () => {
      const { dossier, evidence } = buildTestDossier(scenario2Input);
      const html = renderDossierHtml(dossier, evidence);
      const normalized = normalizeHtmlWhitespace(html);
      expect(normalized).toMatchSnapshot('scenario2-dissolved-company-html');
    });

    it('should render company with modern slavery statement (scenario 3)', () => {
      const { dossier, evidence } = buildTestDossier(scenario3Input);
      const html = renderDossierHtml(dossier, evidence);
      const normalized = normalizeHtmlWhitespace(html);
      expect(normalized).toMatchSnapshot('scenario3-with-modern-slavery-html');
    });
  });

  describe('determinism', () => {
    it('should produce identical output for same inputs', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html1 = renderDossierHtml(dossier, evidence);
      const html2 = renderDossierHtml(dossier, evidence);
      expect(html1).toBe(html2);
    });

    it('should produce identical normalized output for same inputs', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html1 = normalizeHtmlWhitespace(renderDossierHtml(dossier, evidence));
      const html2 = normalizeHtmlWhitespace(renderDossierHtml(dossier, evidence));
      expect(html1).toBe(html2);
    });
  });

  describe('HTML structure', () => {
    it('should include DOCTYPE and html tags', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="en">');
      expect(html).toContain('</html>');
    });

    it('should include meta charset and viewport', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('<meta charset="UTF-8">');
      expect(html).toContain('<meta name="viewport"');
    });

    it('should include inline styles (no external assets)', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
      // Should not have external stylesheet links
      expect(html).not.toMatch(/<link[^>]+stylesheet/);
    });

    it('should include print CSS', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('@media print');
    });
  });

  describe('header section', () => {
    it('should render company name', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('EXAMPLE TRADING LIMITED');
    });

    it('should render company number', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('12345678');
    });

    it('should render status badge with correct class', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('status-active');

      const { dossier: dossier2, evidence: evidence2 } = buildTestDossier(scenario2Input);
      const html2 = renderDossierHtml(dossier2, evidence2);
      expect(html2).toContain('status-dissolved');
    });

    it('should render incorporation date formatted', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('15 Jan 2020');
    });
  });

  describe('risk flags section', () => {
    it('should render "no risk flags" when empty', () => {
      const { dossier, evidence } = buildTestDossier(scenario3Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('No risk flags identified');
    });

    it('should render risk flags with severity badges', () => {
      const { dossier, evidence } = buildTestDossier(scenario2Input);
      const html = renderDossierHtml(dossier, evidence);
      // Scenario 2 should have F1 (HIGH) and F5 (HIGH)
      expect(html).toContain('severity-high');
      expect(html).toContain('F1');
    });

    it('should render evidence links when available', () => {
      const { dossier, evidence } = buildTestDossier(scenario2Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('View evidence');
    });
  });

  describe('company section', () => {
    it('should render registered address', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('123 Business Park');
      expect(html).toContain('Manchester');
    });

    it('should render SIC codes', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('62020');
      expect(html).toContain('62090');
    });
  });

  describe('officers section', () => {
    it('should render officers table', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('Officers (3)');
      expect(html).toContain('SMITH, John David');
      expect(html).toContain('JONES, Sarah Elizabeth');
    });

    it('should render "no officers" when empty', () => {
      const { dossier, evidence } = buildTestDossier(scenario2Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('No officers on record');
    });

    it('should render officer roles', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('Director');
      expect(html).toContain('Secretary');
    });

    it('should render resignation dates when applicable', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('30 Jun 2023');
    });
  });

  describe('PSCs section', () => {
    it('should render PSCs table', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('Persons with Significant Control (2)');
      expect(html).toContain('Mr John David Smith');
    });

    it('should render "no PSCs" when empty', () => {
      const { dossier, evidence } = buildTestDossier(scenario2Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('No PSCs on record');
    });

    it('should render natures of control', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('Ownership of Shares 75 to 100 Percent');
    });
  });

  describe('modern slavery section', () => {
    it('should render "no statement" when missing', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('No modern slavery statement found');
    });

    it('should render statement link when found', () => {
      const { dossier, evidence } = buildTestDossier(scenario3Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('Statement found');
      expect(html).toContain('View statement');
      expect(html).toContain('modern-slavery-statement-registry.service.gov.uk');
    });
  });

  describe('evidence appendix', () => {
    it('should render evidence items', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('Evidence Appendix');
      expect(html).toContain('evidence-id');
    });

    it('should render evidence IDs', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      // Evidence IDs are 12-character hex strings
      evidence.forEach((e) => {
        expect(html).toContain(e.id);
      });
    });

    it('should render evidence URLs', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('company-information.service.gov.uk');
    });

    it('should show cache status', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('Fresh');

      // Scenario 2 has cached evidence
      const { dossier: dossier2, evidence: evidence2 } = buildTestDossier(scenario2Input);
      const html2 = renderDossierHtml(dossier2, evidence2);
      expect(html2).toContain('Cached');
    });
  });

  describe('footer', () => {
    it('should render generated timestamp', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('Generated:');
      expect(html).toContain(FIXED_GENERATED_AT);
    });
  });

  describe('options', () => {
    it('should use custom title when provided', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence, { title: 'Custom Report Title' });
      expect(html).toContain('<title>Custom Report Title</title>');
    });

    it('should use default title from company name', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const html = renderDossierHtml(dossier, evidence);
      expect(html).toContain('<title>Dossier: EXAMPLE TRADING LIMITED</title>');
    });
  });

  describe('XSS prevention', () => {
    it('should escape HTML in company name', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      // Modify dossier to test XSS prevention
      const maliciousDossier: Dossier = {
        ...dossier,
        company: {
          ...dossier.company,
          name: '<script>alert("xss")</script>',
        },
      };
      const html = renderDossierHtml(maliciousDossier, evidence);
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });

    it('should escape HTML in officer names', () => {
      const { dossier, evidence } = buildTestDossier(scenario1Input);
      const maliciousDossier: Dossier = {
        ...dossier,
        officers: [
          {
            ...dossier.officers[0],
            name: '<img src=x onerror=alert("xss")>',
          },
        ],
      };
      const html = renderDossierHtml(maliciousDossier, evidence);
      expect(html).not.toContain('<img');
      expect(html).toContain('&lt;img');
    });
  });
});

describe('normalizeHtmlWhitespace', () => {
  it('should collapse multiple whitespace', () => {
    const input = 'foo    bar\n\n\nbaz';
    const normalized = normalizeHtmlWhitespace(input);
    expect(normalized).toBe('foo    bar\nbaz');
  });

  it('should trim lines', () => {
    const input = '  foo  \n  bar  ';
    const normalized = normalizeHtmlWhitespace(input);
    expect(normalized).toBe('foo\nbar');
  });

  it('should remove empty lines', () => {
    const input = 'foo\n\n\nbar';
    const normalized = normalizeHtmlWhitespace(input);
    expect(normalized).toBe('foo\nbar');
  });

  it('should be deterministic', () => {
    const input = `
      <div>
        <span>test</span>
      </div>
    `;
    const result1 = normalizeHtmlWhitespace(input);
    const result2 = normalizeHtmlWhitespace(input);
    expect(result1).toBe(result2);
  });
});
