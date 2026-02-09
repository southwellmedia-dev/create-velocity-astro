import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { FileDiff, MigrationStep, UpgradeManifest } from './types.js';
import { summarizeDiffs } from './utils/diff.js';

/**
 * Shows the upgrade intro with version info.
 */
export function showUpgradeIntro(currentVersion: string, latestVersion: string): void {
  console.log();
  p.intro(pc.bgCyan(pc.black(' Velocity Upgrade ')));
  p.log.info(
    `Current version: ${pc.dim(`v${currentVersion}`)}\n` +
    `Latest version:  ${pc.green(`v${latestVersion}`)}`
  );
}

/**
 * Shows a summary of changes that will be applied.
 */
export function showChangeSummary(
  diffs: FileDiff[],
  manifest: UpgradeManifest
): void {
  const { added, modified } = summarizeDiffs(diffs);
  const depUpdated = Object.keys(manifest.dependencies.update).length;
  const depRemoved = manifest.dependencies.remove.length;
  const depAdded = Object.keys(manifest.dependencies.add).length;
  const migrationCount = manifest.migrations.length;

  const lines: string[] = [];

  if (modified > 0) {
    lines.push(`  ${pc.yellow(`${modified}`)} file${modified !== 1 ? 's' : ''} modified ${pc.dim('(framework components, layouts, utilities)')}`);
  }
  if (added > 0) {
    lines.push(`  ${pc.green(`${added}`)} file${added !== 1 ? 's' : ''} added ${pc.dim('(new framework files)')}`);
  }
  if (depUpdated > 0) {
    lines.push(`  ${pc.cyan(`${depUpdated}`)} dependenc${depUpdated !== 1 ? 'ies' : 'y'} updated`);
  }
  if (depRemoved > 0) {
    lines.push(`  ${pc.red(`${depRemoved}`)} dependenc${depRemoved !== 1 ? 'ies' : 'y'} removed`);
  }
  if (depAdded > 0) {
    lines.push(`  ${pc.green(`${depAdded}`)} dependenc${depAdded !== 1 ? 'ies' : 'y'} added`);
  }
  if (migrationCount > 0) {
    lines.push(`  ${pc.yellow(`${migrationCount}`)} manual migration step${migrationCount !== 1 ? 's' : ''}`);
  }

  if (lines.length > 0) {
    p.log.message(pc.bold('Changes to apply:') + '\n' + lines.join('\n'));
  }
}

/**
 * Asks user to confirm the upgrade. Returns true to proceed.
 * In dry-run mode, shows what would happen without asking.
 */
export async function confirmUpgrade(dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    p.log.info(pc.dim('Dry run — no changes will be made.'));
    return false;
  }

  const proceed = await p.confirm({
    message: 'Proceed with upgrade?',
    initialValue: true,
  });

  if (p.isCancel(proceed) || !proceed) {
    p.cancel('Upgrade cancelled.');
    return false;
  }

  return true;
}

/**
 * Shows manual migration steps with file matches.
 */
export function showManualSteps(
  migrations: MigrationStep[],
  matchResults: Map<string, string[]>
): void {
  if (migrations.length === 0) return;

  const lines: string[] = [];

  for (let i = 0; i < migrations.length; i++) {
    const step = migrations[i]!;
    const matches = matchResults.get(step.title) ?? [];

    lines.push(`${pc.bold(`${i + 1}. ${step.title}`)}`);
    lines.push(`   ${step.description}`);

    if (matches.length > 0) {
      lines.push(`   ${pc.yellow('⚠')} Found matches in: ${matches.join(', ')}`);
    }

    lines.push('');
  }

  p.log.warning(pc.bold('Manual steps required:') + '\n\n' + lines.join('\n'));
}

/**
 * Shows the upgrade completion message.
 */
export function showUpgradeOutro(hasDepChanges: boolean): void {
  if (hasDepChanges) {
    p.log.info(`Run ${pc.cyan('pnpm install')} to update dependencies.`);
  }
  p.outro(pc.green('Upgrade complete! Review the manual steps above.'));
}

/**
 * Warns about dirty git state.
 */
export async function warnDirtyGit(yes: boolean): Promise<boolean> {
  if (yes) {
    p.log.warn(pc.yellow('You have uncommitted changes. Proceeding anyway (--yes).'));
    return true;
  }

  p.log.warn(pc.yellow('You have uncommitted changes. We recommend committing or stashing first.'));

  const proceed = await p.confirm({
    message: 'Continue anyway?',
    initialValue: false,
  });

  if (p.isCancel(proceed) || !proceed) {
    p.cancel('Upgrade cancelled.');
    return false;
  }

  return true;
}
