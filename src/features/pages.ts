import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
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
 * Generates the i18n-aware page template
 */
function generateI18nPageTemplate(pageName: string, layout: PageLayout): string {
  const title = toTitle(pageName);
  const layoutName = layout === 'landing' ? 'LandingLayout' : 'PageLayout';
  const titleKey = `${pageName.replace(/-/g, '_')}.title`;
  const descKey = `${pageName.replace(/-/g, '_')}.description`;

  return `---
import ${layoutName} from '@/layouts/${layoutName}.astro';
import { locales, isValidLocale, type Locale } from '@/i18n/config';
import { useTranslations } from '@/i18n/index';

export function getStaticPaths() {
  return locales.map((lang) => ({
    params: { lang },
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
      const filePath = join(langDir, `${pageName}.astro`);
      const template = generateI18nPageTemplate(pageName, layout);
      writeFileSync(filePath, template);
      generatedFiles.push(`src/pages/[lang]/${pageName}.astro`);
    }
  }

  return generatedFiles;
}

/**
 * List of page-related files that could be generated
 */
export const PAGES_FILES = [
  'src/pages/{pageName}.astro',
  'src/pages/[lang]/{pageName}.astro',
];
