import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { PageLayout } from '../types.js';

/**
 * Converts a page slug to a display title
 * e.g., 'about-us' -> 'About Us'
 */
function toTitle(slug: string): string {
  return slug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Converts a page slug to a route ID (snake_case)
 * e.g., 'about-us' -> 'about_us'
 */
function toRouteId(slug: string): string {
  return slug.replace(/-/g, '_');
}

/**
 * Adds a new route entry to routes.ts
 * Creates the route with the same English slug for all locales (user customizes later)
 */
function addRouteEntry(targetDir: string, pageName: string): void {
  const routesPath = join(targetDir, 'src', 'i18n', 'routes.ts');

  if (!existsSync(routesPath)) {
    return; // routes.ts doesn't exist, skip
  }

  const routeId = toRouteId(pageName);
  const content = readFileSync(routesPath, 'utf-8');

  // Check if route already exists
  if (content.includes(`${routeId}:`)) {
    return; // Route already defined
  }

  // Find the closing of routes object (before "} as const satisfies")
  const insertPoint = content.indexOf('} as const satisfies');
  if (insertPoint === -1) {
    return; // Can't find insertion point
  }

  // Create new route entry with same slug for all locales
  const newRoute = `  // Custom page: ${pageName}\n  ${routeId}: { en: '${pageName}', es: '${pageName}', fr: '${pageName}' },\n`;

  const newContent = content.slice(0, insertPoint) + newRoute + content.slice(insertPoint);
  writeFileSync(routesPath, newContent);
}

/**
 * Generates the standard page template (non-i18n)
 */
function generatePageTemplate(pageName: string, layout: PageLayout): string {
  const title = toTitle(pageName);
  const layoutName = layout === 'landing' ? 'LandingLayout' : 'PageLayout';

  return `---
import ${layoutName} from '@/layouts/${layoutName}.astro';
---

<${layoutName}
  title="${title}"
  description="Add your description here"
>
  <!-- Hero Section -->
  <section class="py-20 bg-secondary">
    <div class="container">
      <h1 class="text-4xl font-bold text-foreground">${title}</h1>
      <p class="mt-4 text-foreground-muted max-w-2xl">
        Add your content here.
      </p>
    </div>
  </section>

  <!-- Content Section -->
  <section class="py-16">
    <div class="container">
      <!-- Your content -->
    </div>
  </section>
</${layoutName}>
`;
}

/**
 * Generates the i18n-aware page template with translated URL support
 */
function generateI18nPageTemplate(pageName: string, layout: PageLayout): string {
  const title = toTitle(pageName);
  const layoutName = layout === 'landing' ? 'LandingLayout' : 'PageLayout';
  const routeId = toRouteId(pageName);
  const titleKey = `${routeId}.title`;
  const descKey = `${routeId}.description`;

  return `---
import ${layoutName} from '@/layouts/${layoutName}.astro';
import { locales, isValidLocale, defaultLocale, type Locale } from '@/i18n/config';
import { useTranslations } from '@/i18n/index';
import { routes } from '@/i18n/routes';

export function getStaticPaths() {
  return locales
    .filter((lang) => lang !== defaultLocale)
    .map((lang) => ({
      params: {
        lang,
        ${routeId}: routes.${routeId}[lang],
      },
    }));
}

const { lang } = Astro.params;

if (!lang || !isValidLocale(lang)) {
  return Astro.redirect('/');
}

const locale = lang as Locale;
const t = useTranslations(locale);
---

<${layoutName}
  title={t('${titleKey}') || '${title}'}
  description={t('${descKey}') || 'Add your description here'}
  lang={locale}
  routeId="${routeId}"
>
  <!-- Hero Section -->
  <section class="py-20 bg-secondary">
    <div class="container">
      <h1 class="text-4xl font-bold text-foreground">
        {t('${titleKey}') || '${title}'}
      </h1>
      <p class="mt-4 text-foreground-muted max-w-2xl">
        {t('${descKey}') || 'Add your content here.'}
      </p>
    </div>
  </section>

  <!-- Content Section -->
  <section class="py-16">
    <div class="container">
      <!-- Your content -->
    </div>
  </section>
</${layoutName}>
`;
}

/**
 * Generates pages in the target directory
 */
export async function generatePages(
  targetDir: string,
  pages: string[],
  layout: PageLayout,
  isI18n: boolean
): Promise<string[]> {
  const generatedFiles: string[] = [];

  if (pages.length === 0) {
    return generatedFiles;
  }

  // Ensure pages directory exists
  const pagesDir = join(targetDir, 'src', 'pages');
  if (!existsSync(pagesDir)) {
    mkdirSync(pagesDir, { recursive: true });
  }

  // Generate standard pages
  for (const pageName of pages) {
    const filePath = join(pagesDir, `${pageName}.astro`);
    const template = generatePageTemplate(pageName, layout);
    writeFileSync(filePath, template);
    generatedFiles.push(`src/pages/${pageName}.astro`);
  }

  // Generate i18n pages if enabled
  if (isI18n) {
    const langDir = join(pagesDir, '[lang]');
    if (!existsSync(langDir)) {
      mkdirSync(langDir, { recursive: true });
    }

    for (const pageName of pages) {
      const routeId = toRouteId(pageName);
      // Use rest parameter syntax for translated URL slugs
      const filePath = join(langDir, `[...${routeId}].astro`);
      const template = generateI18nPageTemplate(pageName, layout);
      writeFileSync(filePath, template);
      generatedFiles.push(`src/pages/[lang]/[...${routeId}].astro`);

      // Add route entry to routes.ts
      addRouteEntry(targetDir, pageName);
    }
  }

  return generatedFiles;
}

/**
 * List of page-related files that could be generated
 */
export const PAGES_FILES = [
  'src/pages/{pageName}.astro',
  'src/pages/[lang]/[...{routeId}].astro',
];
