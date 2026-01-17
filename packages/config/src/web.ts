/**
 * Web/client-side configuration module
 *
 * This module provides client-safe environment configuration.
 * It contains ONLY non-sensitive values.
 *
 * SECURITY: No API keys or secrets are exposed through this module.
 * All sensitive credentials must be accessed through the server module.
 */

import { parseWebEnv, type WebEnv, webEnvSchema } from './env';

let webConfig: WebEnv | null = null;

/**
 * Get the web configuration
 * Parses and validates environment variables on first call
 * Caches the result for subsequent calls
 *
 * Safe for use in browser environments
 */
export function getWebConfig(): WebEnv {
  if (!webConfig) {
    // In browser environments, Vite exposes env vars via import.meta.env
    // We merge with process.env for SSR compatibility
    const env =
      typeof window !== 'undefined' && typeof import.meta !== 'undefined'
        ? { ...import.meta.env }
        : process.env;

    webConfig = parseWebEnv(env as Record<string, string | undefined>);
  }
  return webConfig;
}

/**
 * Initialize web config with custom environment
 * Useful for testing or custom scenarios
 */
export function initWebConfig(env: Record<string, string | undefined>): WebEnv {
  webConfig = parseWebEnv(env);
  return webConfig;
}

/**
 * Reset cached config (primarily for testing)
 */
export function resetWebConfig(): void {
  webConfig = null;
}

export { parseWebEnv, webEnvSchema };
export type { WebEnv };
