/**
 * Route Definitions for Translated URLs
 *
 * This file defines the URL slugs for each route in each supported locale.
 * The route ID (key) is used internally to reference routes, while the values
 * define the actual URL segments for each language.
 *
 * Example:
 * - Route 'about' → /about (en), /es/sobre-nosotros (es), /fr/a-propos (fr)
 *
 * Note: Empty string '' represents the root/home page.
 */

import type { Locale } from './config';

/**
 * A route definition maps each locale to its URL slug
 */
export type RouteDefinition = Record<Locale, string>;

/**
 * Route definitions for all static pages
 *
 * Keys are internal route IDs (use these in LocalizedLink and getLocalizedPath)
 * Values are the URL slugs for each locale
 *
 * Rules:
 * - Use lowercase letters and hyphens only (no underscores, no special chars)
 * - Empty string '' for home/root page
 * - Do not include leading or trailing slashes
 */
export const routes = {
  // Home page (root)
  home: { en: '', es: '', fr: '' },

  // Static pages
  about: { en: 'about', es: 'sobre-nosotros', fr: 'a-propos' },
  contact: { en: 'contact', es: 'contacto', fr: 'contact' },

  // Blog section
  blog: { en: 'blog', es: 'blog', fr: 'blogue' },

  // Components showcase
  components: { en: 'components', es: 'componentes', fr: 'composants' },
} as const satisfies Record<string, RouteDefinition>;

/**
 * Type-safe route identifier
 */
export type RouteId = keyof typeof routes;

/**
 * Get all available route IDs
 */
export const routeIds = Object.keys(routes) as RouteId[];

/**
 * Validate if a string is a valid route ID
 */
export function isValidRouteId(id: string): id is RouteId {
  return id in routes;
}
