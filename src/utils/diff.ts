import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { UpgradeManifest, FileDiff } from '../types.js';

/**
 * Recursively collects all file paths under a directory, relative to baseDir.
 */
function walkDir(dir: string, baseDir: string): string[] {
  const results: string[] = [];
  if (!existsSync(dir)) return results;

  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, baseDir));
    } else {
      results.push(relative(baseDir, fullPath));
    }
  }
  return results;
}

/**
 * Expands a list of file/directory paths into individual file paths.
 * If a path ends with "/" or is a directory in freshDir, expands to all files within.
 */
function expandPaths(paths: string[], freshDir: string): string[] {
  const files: string[] = [];

  for (const p of paths) {
    const fullPath = join(freshDir, p);

    if (p.endsWith('/') || (existsSync(fullPath) && statSync(fullPath).isDirectory())) {
      files.push(...walkDir(fullPath, freshDir));
    } else {
      files.push(p);
    }
  }

  return [...new Set(files)];
}

/**
 * Compares files between the current project and a fresh template download.
 * Only examines files listed in the manifest's "safe" list.
 */
export function diffProjects(
  currentDir: string,
  freshDir: string,
  manifest: UpgradeManifest
): FileDiff[] {
  const diffs: FileDiff[] = [];
  const safeFiles = expandPaths(manifest.files.safe, freshDir);

  for (const filePath of safeFiles) {
    const currentPath = join(currentDir, filePath);
    const freshPath = join(freshDir, filePath);

    // Fresh template file doesn't exist (shouldn't happen, but handle gracefully)
    if (!existsSync(freshPath)) continue;

    if (!existsSync(currentPath)) {
      diffs.push({ path: filePath, status: 'added', category: 'safe' });
    } else {
      const currentContent = readFileSync(currentPath);
      const freshContent = readFileSync(freshPath);

      if (Buffer.compare(currentContent, freshContent) === 0) {
        diffs.push({ path: filePath, status: 'unchanged', category: 'safe' });
      } else {
        diffs.push({ path: filePath, status: 'modified', category: 'safe' });
      }
    }
  }

  return diffs;
}

/**
 * Returns a summary count of diff statuses.
 */
export function summarizeDiffs(diffs: FileDiff[]): {
  added: number;
  modified: number;
  unchanged: number;
} {
  let added = 0;
  let modified = 0;
  let unchanged = 0;

  for (const diff of diffs) {
    switch (diff.status) {
      case 'added':
        added++;
        break;
      case 'modified':
        modified++;
        break;
      case 'unchanged':
        unchanged++;
        break;
    }
  }

  return { added, modified, unchanged };
}
