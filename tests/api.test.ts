import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import nock from 'nock';
import supertest from 'supertest';
import fetch from 'node-fetch';
import type { FastifyInstance } from 'fastify';
import { buildApiApp } from '../apps/api/src/app';
import {
  profileFixture,
  officersFixture,
  pscsFixture,
  searchFixture,
} from '../services/connectors/__fixtures__';
import { CompaniesHouseConnector } from '../services/connectors';

describe('API Health Check', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
    const connector = new CompaniesHouseConnector({
      apiKey: 'test-key',
      fetch: fetch as unknown as typeof globalThis.fetch,
    });
    app = await buildApiApp({
      env: {
        COMPANIES_HOUSE_API_KEY: 'test-key',
        HOST: '127.0.0.1',
        LOG_LEVEL: 'info',
        NODE_ENV: 'test',
        PORT: 0,
        RATE_LIMIT_MAX: 100,
        RATE_LIMIT_WINDOW_MS: 60000,
      },
      connector,
      registryConfig: {
        baseUrl: 'https://registry.example.test',
        years: [2024],
        urlPattern: 'https://registry.example.test/statements/{year}.csv',
      },
    });
    await app.ready();
    nock.disableNetConnect();
    nock.enableNetConnect('127.0.0.1');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(async () => {
    nock.enableNetConnect();
    await app.close();
  });

  it('GET /api/healthz returns ok status', async () => {
    const response = await supertest(app.server).get('/api/healthz');

    expect(response.statusCode).toBe(200);
    const body = response.body;
    expect(body.status).toBe('ok');
    expect(body.service).toBe('api');
    expect(body.timestamp).toBeDefined();
  });

  it('GET /api/search returns search results', async () => {
    nock('https://api.company-information.service.gov.uk')
      .get('/search/companies')
      .query({ q: 'Marine' })
      .reply(200, searchFixture);

    const response = await supertest(app.server).get('/api/search').query({ q: 'Marine' });

    expect(response.statusCode).toBe(200);
    expect(response.body.query).toBe('Marine');
    expect(response.body.results.length).toBeGreaterThan(0);
  });

  it('GET /api/company/:companyNumber returns dossier and report URLs', async () => {
    nock('https://api.company-information.service.gov.uk')
      .get('/company/12345678')
      .reply(200, profileFixture)
      .get('/company/12345678/officers')
      .reply(200, officersFixture)
      .get('/company/12345678/persons-with-significant-control')
      .reply(200, pscsFixture);

    nock('https://registry.example.test')
      .get('/statements/2024.csv')
      .reply(
        200,
        'Company Number,Company Name,Statement URL,Date Signed\n12345678,ACME LTD,https://example.com,2024-01-01'
      );

    const response = await supertest(app.server).get('/api/company/12345678');

    expect(response.statusCode).toBe(200);
    expect(response.body.dossier.company.companyNumber).toBe('12345678');
    expect(response.body.report.htmlUrl).toContain('/api/company/12345678/report.html');
    expect(response.body.report.pdfUrl).toContain('/api/company/12345678/report.pdf');
  });

  it('GET /api/company/:companyNumber/report.html returns HTML', async () => {
    nock('https://api.company-information.service.gov.uk')
      .get('/company/12345678')
      .reply(200, profileFixture)
      .get('/company/12345678/officers')
      .reply(200, officersFixture)
      .get('/company/12345678/persons-with-significant-control')
      .reply(200, pscsFixture);

    nock('https://registry.example.test')
      .get('/statements/2024.csv')
      .reply(
        200,
        'Company Number,Company Name,Statement URL,Date Signed\n12345678,ACME LTD,https://example.com,2024-01-01'
      );

    const response = await supertest(app.server).get('/api/company/12345678/report.html');

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.text).toContain('<html');
  });

  it('GET /api/company/:companyNumber/report.pdf returns PDF content', async () => {
    nock('https://api.company-information.service.gov.uk')
      .get('/company/12345678')
      .reply(200, profileFixture)
      .get('/company/12345678/officers')
      .reply(200, officersFixture)
      .get('/company/12345678/persons-with-significant-control')
      .reply(200, pscsFixture);

    nock('https://registry.example.test')
      .get('/statements/2024.csv')
      .reply(
        200,
        'Company Number,Company Name,Statement URL,Date Signed\n12345678,ACME LTD,https://example.com,2024-01-01'
      );

    const response = await supertest(app.server)
      .get('/api/company/12345678/report.pdf')
      .buffer(true);

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/pdf');
    const pdfBody = Buffer.isBuffer(response.body)
      ? response.body
      : Buffer.from(response.text ?? '', 'utf8');
    expect(pdfBody.subarray(0, 4).toString('utf8')).toBe('%PDF');
    expect(pdfBody.length).toBeGreaterThan(1_000);
  });

  it('GET /api/search without query returns structured error', async () => {
    const response = await supertest(app.server).get('/api/search');

    expect(response.statusCode).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
