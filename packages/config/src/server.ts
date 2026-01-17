/**
 * Server-side configuration module
 *
 * This module provides server-specific environment configuration
 * including sensitive credentials like API keys.
 *
 * IMPORTANT: This module should NEVER be imported in client-side code.
 */

import { parseServerEnv, type ServerEnv, serverEnvSchema } from './env';

let serverConfig: ServerEnv | null = null;

/**
 * Get the server configuration
 * Parses and validates environment variables on first call
 * Caches the result for subsequent calls
 *
 * Will exit the process with error if required variables are missing
 */
export function getServerConfig(): ServerEnv {
  if (!serverConfig) {
    serverConfig = parseServerEnv();
  }
  return serverConfig;
}

/**
 * Initialize server config with custom environment
 * Useful for testing or custom deployment scenarios
 */
export function initServerConfig(env: Record<string, string | undefined>): ServerEnv {
  serverConfig = parseServerEnv(env);
  return serverConfig;
}

/**
 * Reset cached config (primarily for testing)
 */
export function resetServerConfig(): void {
  serverConfig = null;
}

export { parseServerEnv, serverEnvSchema };
export type { ServerEnv };
