/**
 * System-wide constants for Trading Farm Dashboard
 */

// Default system user UUID (matches Python's DEFAULT_USER_UUID)
export const DEFAULT_USER_UUID = '09c1de86-05fc-4326-a62b-fd5ff1c8b8f3';

// System configuration constants
export const SYSTEM_CONFIG = {
  VERSION: 'v9.0.0',
  BUILD_DATE: '2025-07-08',
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  API_TIMEOUT_MS: 30000,
  DEFAULT_REFRESH_INTERVAL_MS: 60000,
};

// Health check constants
export const HEALTH_CHECK = {
  INTERVAL_MS: 30000,
  TIMEOUT_MS: 5000,
  MAX_FAILURES: 3,
};