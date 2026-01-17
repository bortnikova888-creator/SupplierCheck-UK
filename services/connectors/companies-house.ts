/**
 * Companies House API Connector
 *
 * Provides methods for interacting with the Companies House REST API.
 * Includes caching, structured error handling, and evidence tracking.
 *
 * @see https://developer.company-information.service.gov.uk/
 */

import { Cache, COMPANIES_HOUSE_TTL } from './cache';
import {
  CompanySearchResponse,
  CompanyProfileResponse,
  OfficersResponse,
  PSCsResponse,
  PSCStatementsResponse,
  ConnectorResponse,
  ConnectorError,
  ConnectorErrorCode,
  Evidence,
} from './companies-house.types';

// ============================================================================
// Configuration
// ============================================================================

const COMPANIES_HOUSE_API_BASE = 'https://api.company-information.service.gov.uk';
const COMPANIES_HOUSE_WEB_BASE = 'https://find-and-update.company-information.service.gov.uk';

export interface CompaniesHouseConnectorConfig {
  /** Companies House API key */
  apiKey: string;
  /** Optional custom cache instance */
  cache?: Cache;
  /** Optional custom fetch implementation (for testing) */
  fetch?: typeof fetch;
}

// ============================================================================
// Connector Class
// ============================================================================

export class CompaniesHouseConnector {
  private apiKey: string;
  private cache: Cache;
  private fetchFn: typeof fetch;

  constructor(config: CompaniesHouseConnectorConfig) {
    if (!config.apiKey) {
      throw new Error('Companies House API key is required');
    }

    this.apiKey = config.apiKey;
    this.cache = config.cache ?? new Cache();
    this.fetchFn = config.fetch ?? fetch;
  }

  // --------------------------------------------------------------------------
  // Public Methods
  // --------------------------------------------------------------------------

  /**
   * Search for companies by name or company number.
   * @param query Search query string
   * @returns Search results with evidence
   */
  async searchCompanies(query: string): Promise<ConnectorResponse<CompanySearchResponse>> {
    if (!query || query.trim().length === 0) {
      return this.createError(
        ConnectorErrorCode.INVALID_REQUEST,
        'Search query cannot be empty',
        undefined,
        this.buildApiUrl('/search/companies', { q: query })
      );
    }

    const apiUrl = this.buildApiUrl('/search/companies', { q: query.trim() });
    const cacheKey = `search:${query.trim().toLowerCase()}`;

    return this.fetchWithCache<CompanySearchResponse>(apiUrl, cacheKey, COMPANIES_HOUSE_TTL.SEARCH);
  }

  /**
   * Get company profile by company number.
   * @param companyNumber Company registration number
   * @returns Company profile with evidence
   */
  async getCompanyProfile(
    companyNumber: string
  ): Promise<ConnectorResponse<CompanyProfileResponse>> {
    const normalizedNumber = this.normalizeCompanyNumber(companyNumber);

    if (!normalizedNumber) {
      return this.createError(
        ConnectorErrorCode.INVALID_REQUEST,
        'Invalid company number',
        undefined,
        this.buildApiUrl(`/company/${companyNumber}`)
      );
    }

    const apiUrl = this.buildApiUrl(`/company/${normalizedNumber}`);
    const cacheKey = `profile:${normalizedNumber}`;
    const publicUrl = `${COMPANIES_HOUSE_WEB_BASE}/company/${normalizedNumber}`;

    return this.fetchWithCache<CompanyProfileResponse>(
      apiUrl,
      cacheKey,
      COMPANIES_HOUSE_TTL.PROFILE,
      publicUrl
    );
  }

  /**
   * Get officers for a company.
   * @param companyNumber Company registration number
   * @returns Officers list with evidence
   */
  async getOfficers(companyNumber: string): Promise<ConnectorResponse<OfficersResponse>> {
    const normalizedNumber = this.normalizeCompanyNumber(companyNumber);

    if (!normalizedNumber) {
      return this.createError(
        ConnectorErrorCode.INVALID_REQUEST,
        'Invalid company number',
        undefined,
        this.buildApiUrl(`/company/${companyNumber}/officers`)
      );
    }

    const apiUrl = this.buildApiUrl(`/company/${normalizedNumber}/officers`);
    const cacheKey = `officers:${normalizedNumber}`;
    const publicUrl = `${COMPANIES_HOUSE_WEB_BASE}/company/${normalizedNumber}/officers`;

    return this.fetchWithCache<OfficersResponse>(
      apiUrl,
      cacheKey,
      COMPANIES_HOUSE_TTL.OFFICERS,
      publicUrl
    );
  }

  /**
   * Get persons with significant control for a company.
   * @param companyNumber Company registration number
   * @returns PSCs list with evidence
   */
  async getPscs(companyNumber: string): Promise<ConnectorResponse<PSCsResponse>> {
    const normalizedNumber = this.normalizeCompanyNumber(companyNumber);

    if (!normalizedNumber) {
      return this.createError(
        ConnectorErrorCode.INVALID_REQUEST,
        'Invalid company number',
        undefined,
        this.buildApiUrl(`/company/${companyNumber}/persons-with-significant-control`)
      );
    }

    const apiUrl = this.buildApiUrl(
      `/company/${normalizedNumber}/persons-with-significant-control`
    );
    const cacheKey = `pscs:${normalizedNumber}`;
    const publicUrl = `${COMPANIES_HOUSE_WEB_BASE}/company/${normalizedNumber}/persons-with-significant-control`;

    return this.fetchWithCache<PSCsResponse>(apiUrl, cacheKey, COMPANIES_HOUSE_TTL.PSCS, publicUrl);
  }

  /**
   * Get PSC statements for a company.
   * @param companyNumber Company registration number
   * @returns PSC statements list with evidence
   */
  async getPscStatements(companyNumber: string): Promise<ConnectorResponse<PSCStatementsResponse>> {
    const normalizedNumber = this.normalizeCompanyNumber(companyNumber);

    if (!normalizedNumber) {
      return this.createError(
        ConnectorErrorCode.INVALID_REQUEST,
        'Invalid company number',
        undefined,
        this.buildApiUrl(`/company/${companyNumber}/persons-with-significant-control-statements`)
      );
    }

    const apiUrl = this.buildApiUrl(
      `/company/${normalizedNumber}/persons-with-significant-control-statements`
    );
    const cacheKey = `psc-statements:${normalizedNumber}`;
    const publicUrl = `${COMPANIES_HOUSE_WEB_BASE}/company/${normalizedNumber}/persons-with-significant-control`;

    return this.fetchWithCache<PSCStatementsResponse>(
      apiUrl,
      cacheKey,
      COMPANIES_HOUSE_TTL.PSC_STATEMENTS,
      publicUrl
    );
  }

  /**
   * Clear all cached data.
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clean up expired cache entries.
   * @returns Number of entries cleaned
   */
  cleanupCache(): number {
    return this.cache.cleanup();
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  /**
   * Build API URL with query parameters.
   */
  private buildApiUrl(path: string, params?: Record<string, string>): string {
    const url = new URL(path, COMPANIES_HOUSE_API_BASE);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  /**
   * Normalize company number to uppercase and handle common formats.
   */
  private normalizeCompanyNumber(companyNumber: string): string | null {
    if (!companyNumber || typeof companyNumber !== 'string') {
      return null;
    }

    // Remove whitespace and convert to uppercase
    const normalized = companyNumber.trim().toUpperCase();

    // Basic validation: 6-8 alphanumeric characters
    if (!/^[A-Z0-9]{6,8}$/.test(normalized)) {
      return null;
    }

    return normalized;
  }

  /**
   * Create Basic Auth header value.
   * Companies House API uses the API key as username with empty password.
   */
  private getAuthHeader(): string {
    return 'Basic ' + Buffer.from(`${this.apiKey}:`).toString('base64');
  }

  /**
   * Map HTTP status codes to connector error codes.
   */
  private mapHttpStatusToErrorCode(status: number): ConnectorErrorCode {
    switch (status) {
      case 400:
        return ConnectorErrorCode.INVALID_REQUEST;
      case 401:
        return ConnectorErrorCode.UNAUTHORIZED;
      case 404:
        return ConnectorErrorCode.NOT_FOUND;
      case 429:
        return ConnectorErrorCode.RATE_LIMITED;
      default:
        if (status >= 500) {
          return ConnectorErrorCode.UPSTREAM_ERROR;
        }
        return ConnectorErrorCode.UNKNOWN;
    }
  }

  /**
   * Create an error response with evidence.
   */
  private createError(
    code: ConnectorErrorCode,
    message: string,
    statusCode: number | undefined,
    apiUrl: string,
    details?: unknown
  ): ConnectorError {
    return {
      success: false,
      error: {
        code,
        message,
        statusCode,
        details,
      },
      evidence: {
        apiUrl,
        fetchedAt: new Date().toISOString(),
        fromCache: false,
      },
    };
  }

  /**
   * Create a success response with evidence.
   */
  private createSuccess<T>(
    data: T,
    apiUrl: string,
    fromCache: boolean,
    publicUrl?: string
  ): ConnectorResponse<T> {
    return {
      success: true,
      data,
      evidence: {
        apiUrl,
        publicUrl,
        fetchedAt: new Date().toISOString(),
        fromCache,
      },
    };
  }

  /**
   * Fetch data from API with caching.
   */
  private async fetchWithCache<T>(
    apiUrl: string,
    cacheKey: string,
    ttl: number,
    publicUrl?: string
  ): Promise<ConnectorResponse<T>> {
    // Check cache first
    const cached = this.cache.get<T>(cacheKey);

    if (cached !== undefined) {
      return this.createSuccess(cached, apiUrl, true, publicUrl);
    }

    // Fetch from API
    try {
      const response = await this.fetchFn(apiUrl, {
        method: 'GET',
        headers: {
          Authorization: this.getAuthHeader(),
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const errorCode = this.mapHttpStatusToErrorCode(response.status);
        let errorMessage = `Companies House API error: ${response.status}`;
        let details: unknown;

        // Try to get error details from response
        try {
          const errorBody = await response.json();
          if (errorBody.errors && Array.isArray(errorBody.errors)) {
            errorMessage = errorBody.errors.map((e: { error?: string }) => e.error).join('; ');
          }
          details = errorBody;
        } catch {
          // Ignore JSON parse errors
        }

        return this.createError(errorCode, errorMessage, response.status, apiUrl, details);
      }

      const data = (await response.json()) as T;

      // Cache successful response
      this.cache.set(cacheKey, data, ttl);

      return this.createSuccess(data, apiUrl, false, publicUrl);
    } catch (error) {
      // Handle network errors
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';

      return this.createError(
        ConnectorErrorCode.NETWORK_ERROR,
        errorMessage,
        undefined,
        apiUrl,
        error
      );
    }
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new Companies House connector instance.
 * @param apiKey Companies House API key
 * @returns Configured connector instance
 */
export function createCompaniesHouseConnector(apiKey: string): CompaniesHouseConnector {
  return new CompaniesHouseConnector({ apiKey });
}
