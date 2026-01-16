/**
 * @suppliercheck/config
 *
 * Centralized configuration management for SupplierCheck UK
 *
 * Usage:
 *   Server-side (with API keys):
 *     import { getServerConfig } from '@suppliercheck/config/server'
 *
 *   Client-side (no secrets):
 *     import { getWebConfig } from '@suppliercheck/config/web'
 *
 * SECURITY NOTE:
 *   - Never import from '/server' in client-side code
 *   - The server module contains sensitive API keys
 *   - The web module is safe for browser bundles
 */

// Export base types that are safe for both environments
export type { BaseEnv, ServerEnv, WebEnv } from "./env";
export { baseEnvSchema } from "./env";

// Re-export for convenience (type-only exports are safe)
export type { ServerEnv as ServerConfig } from "./server";
export type { WebEnv as WebConfig } from "./web";
