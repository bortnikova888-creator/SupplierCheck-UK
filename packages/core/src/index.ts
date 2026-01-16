/**
 * Core shared utilities for SupplierCheck-UK
 */

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  service: string;
}

export function createHealthResponse(service: string): HealthResponse {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service,
  };
}
