import Fastify, { type FastifyInstance, type FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import {
  buildDossier,
  buildDossierWithRiskFlags,
  renderDossierHtml,
  type DossierInput,
} from '@pkg/core';
import { renderReportPdf } from './report/renderPdf';
import {
  createCompaniesHouseConnector,
  ConnectorErrorCode,
  type CompaniesHouseConnector,
  type ConnectorError,
  type ConnectorResponse,
  type CompanySearchItem,
} from '../../../services/connectors';
import {
  DEFAULT_REGISTRY_CONFIG,
  lookupModernSlaveryRegistry,
  type RegistryConfig,
} from '../../../services/modernSlaveryRegistry';

const COMPANIES_HOUSE_API_KEY_PENDING_VALUE = '__PENDING__';
const COMPANIES_HOUSE_API_KEY_PENDING_CODE = 'COMPANIES_HOUSE_API_KEY_PENDING';
const COMPANIES_HOUSE_API_KEY_PENDING_MESSAGE = 'Companies House API key pending';

export interface ServerEnv {
  COMPANIES_HOUSE_API_KEY: string;
  PORT: number;
  HOST: string;
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  NODE_ENV: 'development' | 'production' | 'test';
  RATE_LIMIT_MAX: number;
  RATE_LIMIT_WINDOW_MS: number;
}

export interface ApiAppOptions {
  env: ServerEnv;
  connector?: CompaniesHouseConnector;
  registryConfig?: RegistryConfig;
}

interface ApiErrorPayload {
  error: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

function isConnectorError<T>(result: ConnectorResponse<T>): result is ConnectorError {
  return result.success === false;
}

function isCompaniesHouseApiKeyPending(apiKey: string | undefined): boolean {
  const trimmed = (apiKey ?? '').trim();
  return trimmed.length === 0 || trimmed === COMPANIES_HOUSE_API_KEY_PENDING_VALUE;
}

function sendError(
  reply: FastifyReply,
  statusCode: number,
  code: string,
  message: string,
  details?: unknown
): ApiErrorPayload {
  const payload: ApiErrorPayload = {
    error: {
      code,
      message,
      statusCode,
      details,
    },
  };
  reply.status(statusCode);
  return payload;
}

function sendCompaniesHouseKeyPending(reply: FastifyReply): ApiErrorPayload {
  return sendError(
    reply,
    503,
    COMPANIES_HOUSE_API_KEY_PENDING_CODE,
    COMPANIES_HOUSE_API_KEY_PENDING_MESSAGE
  );
}

function mapConnectorError(error: ConnectorError['error']): {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
} {
  const statusCode =
    error.statusCode ??
    (error.code === ConnectorErrorCode.INVALID_REQUEST
      ? 400
      : error.code === ConnectorErrorCode.NOT_FOUND
        ? 404
        : error.code === ConnectorErrorCode.UNAUTHORIZED
          ? 401
          : error.code === ConnectorErrorCode.RATE_LIMITED
            ? 429
            : 502);

  return {
    statusCode,
    code: error.code,
    message: error.message,
    details: error.details,
  };
}

function mapSearchResult(item: CompanySearchItem) {
  return {
    companyNumber: item.company_number,
    name: item.title,
    status: item.company_status,
    addressSnippet:
      item.address_snippet ??
      [item.address?.address_line_1, item.address?.locality, item.address?.postal_code]
        .filter(Boolean)
        .join(', '),
  };
}

async function buildDossierInput(
  connector: CompaniesHouseConnector,
  companyNumber: string,
  registryConfig: RegistryConfig
): Promise<{ input: DossierInput; error?: ApiErrorPayload }> {
  const profileResult = await connector.getCompanyProfile(companyNumber);
  if (isConnectorError(profileResult)) {
    const mapped = mapConnectorError(profileResult.error);
    return {
      input: undefined as unknown as DossierInput,
      error: {
        error: mapped,
      },
    };
  }

  const [officersResult, pscsResult] = await Promise.all([
    connector.getOfficers(companyNumber),
    connector.getPscs(companyNumber),
  ]);

  if (isConnectorError(officersResult)) {
    const mapped = mapConnectorError(officersResult.error);
    return {
      input: undefined as unknown as DossierInput,
      error: {
        error: mapped,
      },
    };
  }

  if (isConnectorError(pscsResult)) {
    const mapped = mapConnectorError(pscsResult.error);
    return {
      input: undefined as unknown as DossierInput,
      error: {
        error: mapped,
      },
    };
  }

  const modernSlavery = await lookupModernSlaveryRegistry(
    profileResult.data.company_number,
    profileResult.data.company_name,
    registryConfig
  );

  const input: DossierInput = {
    profile: profileResult.data,
    officers: officersResult.data,
    pscs: pscsResult.data,
    modernSlavery,
    evidence: {
      profile: profileResult.evidence,
      officers: officersResult.evidence,
      pscs: pscsResult.evidence,
    },
  };

  return { input };
}

export async function buildApiApp(options: ApiAppOptions): Promise<FastifyInstance> {
  const env = options.env;
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL === 'true';
  const apiKeyPending =
    !options.connector && isCompaniesHouseApiKeyPending(env.COMPANIES_HOUSE_API_KEY);
  const connector =
    options.connector ?? (apiKeyPending ? undefined : createCompaniesHouseConnector(env.COMPANIES_HOUSE_API_KEY));
  const registryConfig = options.registryConfig ?? DEFAULT_REGISTRY_CONFIG;

  const app = Fastify({
    logger: true,
  });

  await app.register(cors, { origin: true });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
  });

  app.get('/', async () => {
    return { status: 'ok', service: 'api' };
  });

  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString(), service: 'api' };
  });

  app.get('/api/healthz', async () => {
    return { status: 'ok', timestamp: new Date().toISOString(), service: 'api' };
  });

  app.get('/_debug', async () => {
    return {
      node: process.version,
      vercel: process.env.VERCEL ?? null,
      envPresent: {
        COMPANIES_HOUSE_API_KEY: Boolean(process.env.COMPANIES_HOUSE_API_KEY),
        PORT: Boolean(process.env.PORT),
        HOST: Boolean(process.env.HOST),
      },
    };
  });

  app.get('/api/search', async (request, reply) => {
    if (apiKeyPending || !connector) {
      return sendCompaniesHouseKeyPending(reply);
    }

    const query = String((request.query as { q?: string }).q ?? '').trim();
    if (!query) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Query parameter "q" is required.');
    }

    const result = await connector.searchCompanies(query);
    if (isConnectorError(result)) {
      const mapped = mapConnectorError(result.error);
      return sendError(reply, mapped.statusCode, mapped.code, mapped.message, mapped.details);
    }

    return {
      query,
      results: result.data.items.map(mapSearchResult),
    };
  });

  app.get('/api/company/:companyNumber', async (request, reply) => {
    if (apiKeyPending || !connector) {
      return sendCompaniesHouseKeyPending(reply);
    }

    const companyNumber = String((request.params as { companyNumber?: string }).companyNumber ?? '')
      .trim()
      .toUpperCase();
    if (!companyNumber) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Company number is required.');
    }

    const { input, error } = await buildDossierInput(connector, companyNumber, registryConfig);
    if (error) {
      return sendError(reply, error.error.statusCode, error.error.code, error.error.message, error.error.details);
    }

    const dossierResult = buildDossier(input);
    const dossierWithFlags = buildDossierWithRiskFlags(
      dossierResult.dossier,
      input,
      dossierResult.dossier.generatedAt
    );

    const baseUrl = `${request.protocol}://${request.headers.host}`;
    const reportBase = `${baseUrl}/api/company/${companyNumber}/report`;

    return {
      dossier: dossierWithFlags,
      report: {
        htmlUrl: `${reportBase}.html`,
        pdfUrl: `${reportBase}.pdf`,
      },
    };
  });

  app.get('/api/company/:companyNumber/report.html', async (request, reply) => {
    if (apiKeyPending || !connector) {
      return sendCompaniesHouseKeyPending(reply);
    }

    const companyNumber = String((request.params as { companyNumber?: string }).companyNumber ?? '')
      .trim()
      .toUpperCase();
    if (!companyNumber) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Company number is required.');
    }

    const { input, error } = await buildDossierInput(connector, companyNumber, registryConfig);
    if (error) {
      return sendError(reply, error.error.statusCode, error.error.code, error.error.message, error.error.details);
    }

    const dossierResult = buildDossier(input);
    const dossierWithFlags = buildDossierWithRiskFlags(
      dossierResult.dossier,
      input,
      dossierResult.dossier.generatedAt
    );
    const html = renderDossierHtml(dossierWithFlags, dossierResult.evidence);

    reply.type('text/html; charset=utf-8');
    return html;
  });

  app.get('/api/company/:companyNumber/report.pdf', async (request, reply) => {
    if (isVercel) {
      return sendError(
        reply,
        501,
        'PDF_DISABLED_ON_VERCEL',
        'Use /report.html and print to PDF, or run PDF service off-Vercel.'
      );
    }

    if (apiKeyPending || !connector) {
      return sendCompaniesHouseKeyPending(reply);
    }

    const companyNumber = String((request.params as { companyNumber?: string }).companyNumber ?? '')
      .trim()
      .toUpperCase();
    if (!companyNumber) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Company number is required.');
    }

    const { input, error } = await buildDossierInput(connector, companyNumber, registryConfig);
    if (error) {
      return sendError(reply, error.error.statusCode, error.error.code, error.error.message, error.error.details);
    }

    const dossierResult = buildDossier(input);
    const dossierWithFlags = buildDossierWithRiskFlags(
      dossierResult.dossier,
      input,
      dossierResult.dossier.generatedAt
    );
    const html = renderDossierHtml(dossierWithFlags, dossierResult.evidence);
    const pdfBuffer = await renderReportPdf(html);

    reply.type('application/pdf');
    return pdfBuffer;
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    return sendError(reply, 500, 'INTERNAL_ERROR', 'Unexpected server error.');
  });

  return app;
}
