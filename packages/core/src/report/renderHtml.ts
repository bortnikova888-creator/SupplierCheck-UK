/**
 * Render a Dossier to clean HTML.
 *
 * PRD 8 - Generates a self-contained HTML report with:
 * - Header identity (company name, number, status)
 * - Risk flags table
 * - Company details section
 * - Officers section
 * - PSCs section
 * - Modern slavery statement section
 * - Evidence appendix with links
 * - Print CSS included inline
 *
 * No external assets required. Deterministic output (no dynamic timestamps).
 */

import type { Dossier, Address, Officer, PSC, RiskFlag, FlagSeverity } from '../dossier';
import type { EvidenceWithId } from '../dossier/types';

/**
 * Options for rendering HTML.
 */
export interface RenderHtmlOptions {
  /** Optional title override (defaults to company name) */
  title?: string;
}

/**
 * Escape HTML special characters to prevent XSS.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Format a date string (YYYY-MM-DD) to a readable format.
 */
function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const [year, month, day] = dateStr.split('-');
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const monthName = months[parseInt(month, 10) - 1] || month;
  return `${parseInt(day, 10)} ${monthName} ${year}`;
}

/**
 * Format an address to a single line or multiple lines.
 */
function formatAddress(address: Address): string {
  const parts = [address.line1, address.line2, address.town, address.postcode, address.country]
    .filter(Boolean)
    .map((part) => escapeHtml(part || ''));
  return parts.join(', ');
}

/**
 * Get severity badge class and color.
 */
function getSeverityBadge(severity: FlagSeverity): { class: string; color: string } {
  const map: Record<FlagSeverity, { class: string; color: string }> = {
    HIGH: { class: 'severity-high', color: '#dc3545' },
    MEDIUM: { class: 'severity-medium', color: '#fd7e14' },
    LOW: { class: 'severity-low', color: '#ffc107' },
    INFO: { class: 'severity-info', color: '#17a2b8' },
  };
  return map[severity] || { class: 'severity-info', color: '#6c757d' };
}

/**
 * Format a nature of control string to human-readable form.
 */
function formatNatureOfControl(nature: string): string {
  return nature
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/Psc/g, 'PSC')
    .replace(/Of /g, 'of ')
    .replace(/To /g, 'to ')
    .replace(/And /g, 'and ');
}

/**
 * Generate inline CSS styles for the report.
 */
function generateStyles(): string {
  return `
    * {
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.5;
      color: #212529;
      background: #fff;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #1a1a1a;
    }
    h2 {
      font-size: 18px;
      font-weight: 600;
      margin: 24px 0 12px 0;
      padding-bottom: 8px;
      border-bottom: 2px solid #e9ecef;
      color: #1a1a1a;
    }
    h3 {
      font-size: 16px;
      font-weight: 600;
      margin: 16px 0 8px 0;
      color: #343a40;
    }
    .header {
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 3px solid #1a1a1a;
    }
    .header-meta {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 8px;
    }
    .header-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .header-label {
      font-weight: 600;
      color: #6c757d;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-active {
      background: #d4edda;
      color: #155724;
    }
    .status-dissolved {
      background: #f8d7da;
      color: #721c24;
    }
    .status-other {
      background: #fff3cd;
      color: #856404;
    }
    .flags-section {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
    }
    .flags-section h2 {
      margin-top: 0;
      border-bottom: none;
      padding-bottom: 0;
    }
    .flag-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #dee2e6;
    }
    .flag-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
    .flag-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #fff;
      white-space: nowrap;
    }
    .severity-high { background: #dc3545; }
    .severity-medium { background: #fd7e14; }
    .severity-low { background: #ffc107; color: #212529; }
    .severity-info { background: #17a2b8; }
    .flag-content {
      flex: 1;
    }
    .flag-title {
      font-weight: 600;
      margin-bottom: 4px;
    }
    .flag-explanation {
      color: #6c757d;
      font-size: 13px;
    }
    .flag-link {
      margin-top: 4px;
    }
    .no-flags {
      color: #28a745;
      font-weight: 500;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }
    th, td {
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #dee2e6;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
      font-size: 13px;
      color: #495057;
    }
    td {
      font-size: 13px;
    }
    tr:nth-child(even) {
      background: #f8f9fa;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 12px;
      margin: 12px 0;
    }
    .detail-item {
      padding: 8px 12px;
      background: #f8f9fa;
      border-radius: 4px;
    }
    .detail-label {
      font-size: 12px;
      color: #6c757d;
      font-weight: 600;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .detail-value {
      color: #212529;
    }
    .nature-list {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .nature-list li {
      font-size: 12px;
      padding: 2px 0;
    }
    .modern-slavery-found {
      padding: 12px 16px;
      background: #d4edda;
      border-radius: 8px;
      border-left: 4px solid #28a745;
    }
    .modern-slavery-missing {
      padding: 12px 16px;
      background: #fff3cd;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
    }
    .evidence-section {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 2px solid #e9ecef;
    }
    .evidence-item {
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
      font-size: 13px;
    }
    .evidence-item:last-child {
      border-bottom: none;
    }
    .evidence-id {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
      background: #e9ecef;
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 12px;
    }
    .evidence-meta {
      color: #6c757d;
      font-size: 12px;
      margin-top: 2px;
    }
    a {
      color: #0056b3;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    .footer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #e9ecef;
      font-size: 12px;
      color: #6c757d;
      text-align: center;
    }
    .empty-state {
      color: #6c757d;
      font-style: italic;
      padding: 12px;
    }

    /* Print styles */
    @media print {
      body {
        padding: 0;
        font-size: 12px;
      }
      .container {
        max-width: none;
      }
      h2 {
        break-after: avoid;
      }
      table {
        break-inside: avoid;
      }
      .flag-item {
        break-inside: avoid;
      }
      a {
        color: #000;
      }
      a[href]::after {
        content: " (" attr(href) ")";
        font-size: 10px;
        color: #6c757d;
      }
    }
  `;
}

/**
 * Render the header section with company identity.
 */
function renderHeader(dossier: Dossier): string {
  const { company } = dossier;
  const statusClass =
    company.status === 'active'
      ? 'status-active'
      : company.status === 'dissolved'
        ? 'status-dissolved'
        : 'status-other';

  return `
    <div class="header">
      <h1>${escapeHtml(company.name)}</h1>
      <div class="header-meta">
        <div class="header-item">
          <span class="header-label">Company No:</span>
          <span>${escapeHtml(company.companyNumber)}</span>
        </div>
        <div class="header-item">
          <span class="header-label">Status:</span>
          <span class="status-badge ${statusClass}">${escapeHtml(company.status)}</span>
        </div>
        <div class="header-item">
          <span class="header-label">Type:</span>
          <span>${escapeHtml(company.type.toUpperCase())}</span>
        </div>
        <div class="header-item">
          <span class="header-label">Incorporated:</span>
          <span>${formatDate(company.incorporationDate)}</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the risk flags section.
 */
function renderRiskFlags(flags: RiskFlag[]): string {
  if (flags.length === 0) {
    return `
      <section class="flags-section">
        <h2>Risk Flags</h2>
        <p class="no-flags">No risk flags identified</p>
      </section>
    `;
  }

  const flagsHtml = flags
    .map((flag) => {
      const badge = getSeverityBadge(flag.severity);
      const evidenceLink = flag.evidenceUrl
        ? `<div class="flag-link"><a href="${escapeHtml(flag.evidenceUrl)}" target="_blank">View evidence</a></div>`
        : '';

      return `
        <div class="flag-item">
          <span class="flag-badge ${badge.class}">${escapeHtml(flag.severity)}</span>
          <div class="flag-content">
            <div class="flag-title">${escapeHtml(flag.id)}: ${escapeHtml(flag.title)}</div>
            <div class="flag-explanation">${escapeHtml(flag.explanation)}</div>
            ${evidenceLink}
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <section class="flags-section">
      <h2>Risk Flags (${flags.length})</h2>
      ${flagsHtml}
    </section>
  `;
}

/**
 * Render the company details section.
 */
function renderCompanySection(dossier: Dossier): string {
  const { company } = dossier;
  const sicCodesHtml =
    company.sicCodes.length > 0
      ? company.sicCodes.map((code) => escapeHtml(code)).join(', ')
      : '<em>None</em>';

  return `
    <section>
      <h2>Company Details</h2>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">Registered Office</div>
          <div class="detail-value">${formatAddress(company.registeredOffice)}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">SIC Codes</div>
          <div class="detail-value">${sicCodesHtml}</div>
        </div>
      </div>
    </section>
  `;
}

/**
 * Render the officers table.
 */
function renderOfficersSection(officers: Officer[]): string {
  if (officers.length === 0) {
    return `
      <section>
        <h2>Officers</h2>
        <p class="empty-state">No officers on record</p>
      </section>
    `;
  }

  const rows = officers
    .map((officer) => {
      const birthInfo =
        officer.birthMonth && officer.birthYear
          ? `${officer.birthMonth}/${officer.birthYear}`
          : '—';
      const resigned = officer.resignedOn ? formatDate(officer.resignedOn) : '—';

      return `
        <tr>
          <td>${escapeHtml(officer.name)}</td>
          <td>${escapeHtml(officer.role)}</td>
          <td>${formatDate(officer.appointedOn)}</td>
          <td>${resigned}</td>
          <td>${escapeHtml(officer.nationality || '—')}</td>
          <td>${birthInfo}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <section>
      <h2>Officers (${officers.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>Appointed</th>
            <th>Resigned</th>
            <th>Nationality</th>
            <th>DOB</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

/**
 * Render the PSCs table.
 */
function renderPSCsSection(pscs: PSC[]): string {
  if (pscs.length === 0) {
    return `
      <section>
        <h2>Persons with Significant Control</h2>
        <p class="empty-state">No PSCs on record</p>
      </section>
    `;
  }

  const rows = pscs
    .map((psc) => {
      const controlList = psc.natureOfControl
        .map((n) => `<li>${escapeHtml(formatNatureOfControl(n))}</li>`)
        .join('');
      const ceased = psc.ceasedOn ? formatDate(psc.ceasedOn) : '—';

      return `
        <tr>
          <td>${escapeHtml(psc.name)}</td>
          <td><ul class="nature-list">${controlList}</ul></td>
          <td>${formatDate(psc.notifiedOn)}</td>
          <td>${ceased}</td>
          <td>${escapeHtml(psc.nationality || '—')}</td>
        </tr>
      `;
    })
    .join('');

  return `
    <section>
      <h2>Persons with Significant Control (${pscs.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Nature of Control</th>
            <th>Notified</th>
            <th>Ceased</th>
            <th>Nationality</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </section>
  `;
}

/**
 * Render the modern slavery section.
 */
function renderModernSlaverySection(dossier: Dossier): string {
  const { modernSlavery } = dossier;

  if (!modernSlavery) {
    return `
      <section>
        <h2>Modern Slavery Statement</h2>
        <div class="modern-slavery-missing">
          No modern slavery statement found in the registry.
        </div>
      </section>
    `;
  }

  return `
    <section>
      <h2>Modern Slavery Statement</h2>
      <div class="modern-slavery-found">
        <p><strong>Statement found</strong></p>
        <p><a href="${escapeHtml(modernSlavery.url)}" target="_blank">View statement</a></p>
        ${modernSlavery.signedBy ? `<p>Signed by: ${escapeHtml(modernSlavery.signedBy)}</p>` : ''}
        ${modernSlavery.dateSigned ? `<p>Date signed: ${formatDate(modernSlavery.dateSigned)}</p>` : ''}
      </div>
    </section>
  `;
}

/**
 * Render the evidence appendix.
 */
function renderEvidenceSection(evidence: EvidenceWithId[]): string {
  if (evidence.length === 0) {
    return '';
  }

  const items = evidence
    .map((e) => {
      const linkUrl = e.publicUrl || e.apiUrl;
      const cacheStatus = e.fromCache ? 'Cached' : 'Fresh';

      return `
        <div class="evidence-item">
          <span class="evidence-id">${escapeHtml(e.id)}</span>
          <a href="${escapeHtml(linkUrl)}" target="_blank">${escapeHtml(linkUrl)}</a>
          <div class="evidence-meta">
            Fetched: ${escapeHtml(e.fetchedAt)} (${cacheStatus})
          </div>
        </div>
      `;
    })
    .join('');

  return `
    <section class="evidence-section">
      <h2>Evidence Appendix</h2>
      <p>Data sources used to compile this dossier:</p>
      ${items}
    </section>
  `;
}

/**
 * Render a Dossier to a self-contained HTML document.
 *
 * The output is deterministic - same inputs produce identical HTML output.
 * Uses the dossier's generatedAt timestamp (no dynamic timestamps).
 *
 * @param dossier - The normalized dossier to render
 * @param evidence - Evidence metadata with stable IDs
 * @param options - Optional rendering options
 * @returns Complete HTML document as a string
 */
export function renderDossierHtml(
  dossier: Dossier,
  evidence: EvidenceWithId[],
  options: RenderHtmlOptions = {}
): string {
  const title = options.title || `Dossier: ${dossier.company.name}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>${generateStyles()}</style>
</head>
<body>
  <div class="container">
    ${renderHeader(dossier)}
    ${renderRiskFlags(dossier.riskFlags)}
    ${renderCompanySection(dossier)}
    ${renderOfficersSection(dossier.officers)}
    ${renderPSCsSection(dossier.pscs)}
    ${renderModernSlaverySection(dossier)}
    ${renderEvidenceSection(evidence)}
    <footer class="footer">
      Generated: ${escapeHtml(dossier.generatedAt)}
    </footer>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Normalize HTML whitespace for deterministic comparisons in tests.
 * Collapses multiple whitespace characters and trims lines.
 */
export function normalizeHtmlWhitespace(html: string): string {
  return html
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join('\n');
}
