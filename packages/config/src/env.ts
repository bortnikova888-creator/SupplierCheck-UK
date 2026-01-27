import { z } from 'zod';

/**
 * Base environment schema shared between server and web
 */
const baseEnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

const PENDING_COMPANIES_HOUSE_API_KEY = '__PENDING__';

/**
 * Server-only environment schema
 * Contains sensitive credentials that must never be exposed to the client
 */
const serverEnvSchema = baseEnvSchema.extend({
  // Companies House API key - optional for local dev, server-only
  COMPANIES_HOUSE_API_KEY: z.preprocess(
    (value) => {
      if (typeof value !== 'string') {
        return PENDING_COMPANIES_HOUSE_API_KEY;
      }
      const trimmed = value.trim();
      return trimmed.length === 0 ? PENDING_COMPANIES_HOUSE_API_KEY : trimmed;
    },
    z.string()
  ),

  // Server configuration
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),

  // Optional: Rate limiting
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000),
});

/**
 * Web/client environment schema
 * Only contains non-sensitive configuration
 * IMPORTANT: No API keys or secrets should be added here
 */
const webEnvSchema = baseEnvSchema.extend({
  // API endpoint for the backend server
  VITE_API_URL: z.string().url().default('http://localhost:3001'),

  // Feature flags (non-sensitive)
  VITE_ENABLE_MOCK_MODE: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
export type BaseEnv = z.infer<typeof baseEnvSchema>;

/**
 * Parse and validate server environment variables
 * Fails fast with descriptive error if required variables are missing
 */
export function parseServerEnv(env: Record<string, string | undefined> = process.env): ServerEnv {
  const result = serverEnvSchema.safeParse(env);

  if (!result.success) {
    const formatted = formatZodError(result.error);
    console.error('\n❌ Server environment validation failed:\n');
    console.error(formatted);
    console.error('\nPlease check your .env file or environment variables.\n');
    process.exit(1);
  }

  return result.data;
}

/**
 * Parse and validate web environment variables
 * Safe for client-side use - contains no secrets
 */
export function parseWebEnv(
  env: Record<string, string | undefined> = typeof process !== 'undefined' ? process.env : {}
): WebEnv {
  const result = webEnvSchema.safeParse(env);

  if (!result.success) {
    const formatted = formatZodError(result.error);
    console.error('\n❌ Web environment validation failed:\n');
    console.error(formatted);
    throw new Error('Invalid web environment configuration');
  }

  return result.data;
}

/**
 * Format Zod validation errors for readable output
 */
function formatZodError(error: z.ZodError): string {
  return error.issues
    .map((issue) => {
      const path = issue.path.join('.');
      return `  • ${path}: ${issue.message}`;
    })
    .join('\n');
}

// Export schemas for testing purposes
export { serverEnvSchema, webEnvSchema, baseEnvSchema };
