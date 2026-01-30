import { existsSync, mkdirSync, readdirSync, copyFileSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import { execa } from 'execa';
import { downloadTemplate } from 'giget';
import type { ScaffoldOptions } from './types.js';
import { getI18nTemplatePath, getBaseTemplatePath } from './template.js';
import { getInstallCommand } from './utils/package-manager.js';
import { initGit } from './utils/git.js';
import { showSuccess, showWarning } from './prompts.js';
import { generatePages } from './features/pages.js';

// GitHub repository for the Velocity template
const TEMPLATE_REPO = 'github:southwellmedia-dev/velocity';

// Files/directories to remove after download
const CLEANUP_ITEMS = [
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lockb',
  '.git',
];

// Demo-specific content to remove when --demo is false
const DEMO_CONTENT = [
  'src/components/landing',
  'src/pages/about.astro',
  'src/pages/contact.astro',
  'src/content/blog',
  'src/content/faqs',
  'src/content/authors',
  'src/content/pages',
];

// UI component library content to remove when --components is false
const COMPONENTS_CONTENT = [
  'src/components/ui',
  'src/components/patterns',
  'src/pages/components.astro',
];

/**
 * Copies template files recursively
 */
function copyTemplateFiles(src: string, dest: string): void {
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const entries = readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);

    if (entry.isDirectory()) {
      copyTemplateFiles(srcPath, destPath);
    } else {
      copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Removes files/directories from the target
 */
function removeItems(targetDir: string, items: string[]): void {
  for (const item of items) {
    const itemPath = join(targetDir, item);
    if (existsSync(itemPath)) {
      try {
        rmSync(itemPath, { recursive: true, force: true });
      } catch {
        // Ignore errors - item may not exist or be locked
      }
    }
  }
}

/**
 * Updates the package.json with the new project name
 */
function updatePackageJson(targetDir: string, projectName: string): void {
  const pkgPath = join(targetDir, 'package.json');

  if (!existsSync(pkgPath)) {
    throw new Error('package.json not found in template');
  }

  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  pkg.name = projectName;
  pkg.version = '0.1.0';
  delete pkg.repository;
  delete pkg.bugs;
  delete pkg.homepage;

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

/**
 * Applies base template (minimal pages) when demo is not selected
 */
function applyBaseTemplate(targetDir: string): void {
  const baseTemplate = getBaseTemplatePath();
  if (existsSync(baseTemplate)) {
    copyTemplateFiles(baseTemplate, targetDir);
  }
}

/**
 * Applies the i18n overlay to the project
 */
function applyI18nOverlay(targetDir: string): void {
  const i18nTemplate = getI18nTemplatePath();
  copyTemplateFiles(i18nTemplate, targetDir);
}

/**
 * Creates empty content directories with .gitkeep files
 */
function createContentDirectories(targetDir: string): void {
  const contentDirs = [
    'src/content/blog',
  ];

  for (const dir of contentDirs) {
    const dirPath = join(targetDir, dir);
    if (!existsSync(dirPath)) {
      mkdirSync(dirPath, { recursive: true });
      writeFileSync(join(dirPath, '.gitkeep'), '');
    }
  }
}

/**
 * Main scaffold function
 */
export async function scaffold(options: ScaffoldOptions): Promise<void> {
  const { projectName, targetDir, demo, components, i18n, pages, pageLayout, packageManager } = options;
  const spinner = p.spinner();

  // Step 1: Download base template from GitHub
  spinner.start('Downloading template from GitHub...');

  try {
    await downloadTemplate(TEMPLATE_REPO, {
      dir: targetDir,
      force: true,
    });
    removeItems(targetDir, CLEANUP_ITEMS);
    spinner.stop('Template downloaded');
  } catch (error) {
    spinner.stop('Failed to download template');
    throw new Error(
      `Could not download template from GitHub. Please check your internet connection.\n${error instanceof Error ? error.message : ''}`
    );
  }

  // Step 2: Remove demo content if not requested
  if (!demo) {
    spinner.start('Configuring minimal template...');
    removeItems(targetDir, DEMO_CONTENT);
    applyBaseTemplate(targetDir);
    createContentDirectories(targetDir);
    spinner.stop('Minimal template configured');
  }

  // Step 3: Remove UI components if not requested
  if (!components) {
    spinner.start('Removing UI component library...');
    removeItems(targetDir, COMPONENTS_CONTENT);
    spinner.stop('UI components removed');
  }

  // Step 4: Apply i18n overlay if requested
  if (i18n) {
    spinner.start('Adding i18n support...');
    try {
      applyI18nOverlay(targetDir);
      spinner.stop('i18n support added');
    } catch (error) {
      spinner.stop('Failed to add i18n support');
      throw error;
    }
  }

  // Step 5: Generate starter pages if requested
  if (pages.length > 0) {
    spinner.start(`Generating ${pages.length} starter page${pages.length > 1 ? 's' : ''}...`);
    try {
      const generatedFiles = await generatePages(targetDir, pages, pageLayout, i18n);
      spinner.stop(`Generated ${generatedFiles.length} page file${generatedFiles.length > 1 ? 's' : ''}`);
    } catch (error) {
      spinner.stop('Failed to generate pages');
      throw error;
    }
  }

  // Step 6: Update package.json
  spinner.start('Configuring project...');
  try {
    updatePackageJson(targetDir, projectName);
    spinner.stop('Project configured');
  } catch (error) {
    spinner.stop('Failed to configure project');
    throw error;
  }

  // Step 7: Initialize git
  spinner.start('Initializing git repository...');
  const gitInitialized = await initGit(targetDir);
  if (gitInitialized) {
    spinner.stop('Git repository initialized');
  } else {
    spinner.stop('Git not available, skipping');
  }

  // Step 8: Install dependencies
  spinner.start(`Installing dependencies with ${packageManager}...`);
  try {
    const installCmd = getInstallCommand(packageManager);
    const [cmd, ...args] = installCmd.split(' ');
    await execa(cmd!, args, { cwd: targetDir });
    spinner.stop('Dependencies installed');
  } catch {
    spinner.stop('Failed to install dependencies');
    showWarning(`Run "${getInstallCommand(packageManager)}" manually to install dependencies`);
  }

  showSuccess(`Project "${projectName}" created successfully!`);
}
