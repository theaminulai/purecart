/**
 * PureCart REST API Barrel Export.
 *
 * Provides a single, clean import surface for all domain modules,
 * HTTP client helpers, and request/response interfaces.
 *
 * @file
 * @since 1.0.0
 */

// Core networking & types
export * from './types';
export * from './client';

// Domain API modules
export * from './modules/analytics.api';
// Subscriptions module has moved to @/modules/subscriptions — import from there.
// Updates module has moved to @/modules/updates — import from there.
