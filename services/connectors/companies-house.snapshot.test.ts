/**
 * Snapshot tests for Companies House connector responses.
 * These tests capture the raw API response structure to detect breaking changes.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import nock from 'nock';
import { CompaniesHouseConnector } from './companies-house';
import { Cache } from './cache';
import {
  searchFixture,
  profileFixture,
  dissolvedProfileFixture,
  officersFixture,
  corporateOfficerFixture,
  pscsFixture,
  corporatePscFixture,
  pscStatementsFixture,
  statementsOnlyFixture,
} from './__fixtures__';

const API_BASE = 'https://api.company-information.service.gov.uk';

describe('Companies House Connector Snapshots', () => {
  let connector: CompaniesHouseConnector;

  beforeEach(() => {
    connector = new CompaniesHouseConnector({
      apiKey: 'test-key',
      cache: new Cache(),
    });
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
    nock.enableNetConnect();
  });

  describe('searchCompanies snapshots', () => {
    it('should match search results snapshot', async () => {
      nock(API_BASE)
        .get('/search/companies')
        .query({ q: 'marine' })
        .reply(200, searchFixture);

      const result = await connector.searchCompanies('marine');

      expect(result.success).toBe(true);
      if (result.success) {
        // Remove dynamic fields
        const { fetchedAt, ...evidence } = result.evidence;
        expect({
          data: result.data,
          evidence,
        }).toMatchSnapshot();
      }
    });
  });

  describe('getCompanyProfile snapshots', () => {
    it('should match active company profile snapshot', async () => {
      nock(API_BASE)
        .get('/company/12345678')
        .reply(200, profileFixture);

      const result = await connector.getCompanyProfile('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        const { fetchedAt, ...evidence } = result.evidence;
        expect({
          data: result.data,
          evidence,
        }).toMatchSnapshot();
      }
    });

    it('should match dissolved company profile snapshot', async () => {
      nock(API_BASE)
        .get('/company/SC654321')
        .reply(200, dissolvedProfileFixture);

      const result = await connector.getCompanyProfile('SC654321');

      expect(result.success).toBe(true);
      if (result.success) {
        const { fetchedAt, ...evidence } = result.evidence;
        expect({
          data: result.data,
          evidence,
        }).toMatchSnapshot();
      }
    });
  });

  describe('getOfficers snapshots', () => {
    it('should match officers list snapshot', async () => {
      nock(API_BASE)
        .get('/company/12345678/officers')
        .reply(200, officersFixture);

      const result = await connector.getOfficers('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        const { fetchedAt, ...evidence } = result.evidence;
        expect({
          data: result.data,
          evidence,
        }).toMatchSnapshot();
      }
    });

    it('should match corporate officer snapshot', async () => {
      nock(API_BASE)
        .get('/company/12345678/officers')
        .reply(200, corporateOfficerFixture);

      const result = await connector.getOfficers('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        const { fetchedAt, ...evidence } = result.evidence;
        expect({
          data: result.data,
          evidence,
        }).toMatchSnapshot();
      }
    });
  });

  describe('getPscs snapshots', () => {
    it('should match PSCs list snapshot', async () => {
      nock(API_BASE)
        .get('/company/12345678/persons-with-significant-control')
        .reply(200, pscsFixture);

      const result = await connector.getPscs('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        const { fetchedAt, ...evidence } = result.evidence;
        expect({
          data: result.data,
          evidence,
        }).toMatchSnapshot();
      }
    });

    it('should match corporate PSC snapshot', async () => {
      nock(API_BASE)
        .get('/company/12345678/persons-with-significant-control')
        .reply(200, corporatePscFixture);

      const result = await connector.getPscs('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        const { fetchedAt, ...evidence } = result.evidence;
        expect({
          data: result.data,
          evidence,
        }).toMatchSnapshot();
      }
    });
  });

  describe('getPscStatements snapshots', () => {
    it('should match PSC statements snapshot', async () => {
      nock(API_BASE)
        .get('/company/12345678/persons-with-significant-control-statements')
        .reply(200, pscStatementsFixture);

      const result = await connector.getPscStatements('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        const { fetchedAt, ...evidence } = result.evidence;
        expect({
          data: result.data,
          evidence,
        }).toMatchSnapshot();
      }
    });

    it('should match statements-only snapshot', async () => {
      nock(API_BASE)
        .get('/company/12345678/persons-with-significant-control-statements')
        .reply(200, statementsOnlyFixture);

      const result = await connector.getPscStatements('12345678');

      expect(result.success).toBe(true);
      if (result.success) {
        const { fetchedAt, ...evidence } = result.evidence;
        expect({
          data: result.data,
          evidence,
        }).toMatchSnapshot();
      }
    });
  });

  describe('error response snapshots', () => {
    it('should match not found error snapshot', async () => {
      nock(API_BASE)
        .get('/company/99999999')
        .reply(404, { errors: [{ error: 'Company not found' }] });

      const result = await connector.getCompanyProfile('99999999');

      expect(result.success).toBe(false);
      if (!result.success) {
        const { fetchedAt, ...evidence } = result.evidence;
        expect({
          error: result.error,
          evidence,
        }).toMatchSnapshot();
      }
    });

    it('should match unauthorized error snapshot', async () => {
      nock(API_BASE)
        .get('/company/12345678')
        .reply(401, { errors: [{ error: 'Invalid API key' }] });

      const result = await connector.getCompanyProfile('12345678');

      expect(result.success).toBe(false);
      if (!result.success) {
        const { fetchedAt, ...evidence } = result.evidence;
        expect({
          error: result.error,
          evidence,
        }).toMatchSnapshot();
      }
    });

    it('should match rate limited error snapshot', async () => {
      nock(API_BASE)
        .get('/company/12345678')
        .reply(429, { errors: [{ error: 'Rate limit exceeded' }] });

      const result = await connector.getCompanyProfile('12345678');

      expect(result.success).toBe(false);
      if (!result.success) {
        const { fetchedAt, ...evidence } = result.evidence;
        expect({
          error: result.error,
          evidence,
        }).toMatchSnapshot();
      }
    });

    it('should match invalid request error snapshot', async () => {
      const result = await connector.getCompanyProfile('invalid!!');

      expect(result.success).toBe(false);
      if (!result.success) {
        const { fetchedAt, ...evidence } = result.evidence;
        expect({
          error: result.error,
          evidence,
        }).toMatchSnapshot();
      }
    });
  });
});
