import Fastify, { type FastifyInstance, type FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import {
  buildDossier,
  buildDossierWithRiskFlags,
  renderDossierHtml,
  type DossierInput,
} from '@pkg/core';
import {
  createCompaniesHouseConnector,
  ConnectorErrorCode,
  type CompaniesHouseConnector,
  type ConnectorError,
  type CompanySearchItem,
} from '../../../services/connectors';
import {
  DEFAULT_REGISTRY_CONFIG,
  lookupModernSlaveryRegistry,
  type RegistryConfig,
} from '../../../services/modernSlaveryRegistry';

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
  if (!profileResult.success) {
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

  if (!officersResult.success) {
    const mapped = mapConnectorError(officersResult.error);
    return {
      input: undefined as unknown as DossierInput,
      error: {
        error: mapped,
      },
    };
  }

  if (!pscsResult.success) {
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
  const connector = options.connector ?? createCompaniesHouseConnector(env.COMPANIES_HOUSE_API_KEY);
  const registryConfig = options.registryConfig ?? DEFAULT_REGISTRY_CONFIG;

  const app = Fastify({
    logger: true,
  });

  await app.register(cors, { origin: true });
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
  });

  app.get('/api/healthz', async () => {
    return { status: 'ok', timestamp: new Date().toISOString(), service: 'api' };
  });

  app.get('/api/search', async (request, reply) => {
    const query = String((request.query as { q?: string }).q ?? '').trim();
    if (!query) {
      return sendError(reply, 400, 'VALIDATION_ERROR', 'Query parameter "q" is required.');
    }

    const result = await connector.searchCompanies(query);
    if (!result.success) {
      const mapped = mapConnectorError(result.error);
      return sendError(reply, mapped.statusCode, mapped.code, mapped.message, mapped.details);
    }

    return {
      query,
      results: result.data.items.map(mapSearchResult),
    };
  });

  app.get('/api/company/:companyNumber', async (request, reply) => {
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

    reply.type('application/pdf');
    return html;
  });

  app.setErrorHandler((error, _request, reply) => {
    app.log.error(error);
    return sendError(reply, 500, 'INTERNAL_ERROR', 'Unexpected server error.');
  });

  return app;
}
