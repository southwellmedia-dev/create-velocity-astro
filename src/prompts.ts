import * as p from '@clack/prompts';
import pc from 'picocolors';
import type { PackageManager, PromptAnswers } from './types.js';
import { validateProjectName, toValidProjectName } from './utils/validate.js';
import { detectPackageManager } from './utils/package-manager.js';

interface PromptDefaults {
  projectName?: string;
  demo?: boolean;
  components?: boolean;
  i18n?: boolean;
}

export async function runPrompts(defaults: PromptDefaults = {}): Promise<PromptAnswers | symbol> {
  const detectedPm = detectPackageManager();

  const answers = await p.group(
    {
      projectName: () =>
        p.text({
          message: 'What is your project name?',
          placeholder: defaults.projectName || 'my-velocity-site',
          defaultValue: defaults.projectName,
          validate: (value) => {
            const name = value || defaults.projectName || 'my-velocity-site';
            const result = validateProjectName(toValidProjectName(name));
            if (!result.valid) return result.message;
          },
        }),

      demo:
        defaults.demo !== undefined
          ? () => Promise.resolve(defaults.demo)
          : () =>
              p.select({
                message: 'Include demo landing page and sample content?',
                options: [
                  {
                    value: false,
                    label: 'No',
                    hint: 'Minimal starter with basic pages',
                  },
                  {
                    value: true,
                    label: 'Yes',
                    hint: 'Full demo with landing page, blog posts',
                  },
                ],
                initialValue: false,
              }),

      components:
        defaults.components !== undefined
          ? () => Promise.resolve(defaults.components)
          : () =>
              p.select({
                message: 'Include UI component library?',
                options: [
                  {
                    value: false,
                    label: 'No',
                    hint: 'Just the basics',
                  },
                  {
                    value: true,
                    label: 'Yes',
                    hint: 'Buttons, forms, cards, dialogs, etc.',
                  },
                ],
                initialValue: true,
              }),

      i18n:
        defaults.i18n !== undefined
          ? () => Promise.resolve(defaults.i18n)
          : () =>
              p.select({
                message: 'Add internationalization (i18n)?',
                options: [
                  {
                    value: false,
                    label: 'No',
                    hint: 'English only',
                  },
                  {
                    value: true,
                    label: 'Yes',
                    hint: 'Locale routing, translations',
                  },
                ],
                initialValue: false,
              }),

      packageManager: () =>
        p.select({
          message: 'Which package manager?',
          options: [
            {
              value: 'pnpm' as PackageManager,
              label: 'pnpm',
              hint: detectedPm === 'pnpm' ? 'detected' : 'recommended',
            },
            {
              value: 'npm' as PackageManager,
              label: 'npm',
              hint: detectedPm === 'npm' ? 'detected' : undefined,
            },
            {
              value: 'yarn' as PackageManager,
              label: 'yarn',
              hint: detectedPm === 'yarn' ? 'detected' : undefined,
            },
            {
              value: 'bun' as PackageManager,
              label: 'bun',
              hint: detectedPm === 'bun' ? 'detected' : undefined,
            },
          ],
          initialValue: detectedPm,
        }),
    },
    {
      onCancel: () => {
        p.cancel('Operation cancelled.');
        process.exit(0);
      },
    }
  );

  return {
    projectName: toValidProjectName(answers.projectName || defaults.projectName || 'my-velocity-site'),
    demo: answers.demo as boolean,
    components: answers.components as boolean,
    i18n: answers.i18n as boolean,
    packageManager: answers.packageManager as PackageManager,
  };
}

export function showIntro(): void {
  console.log();
  p.intro(pc.bgCyan(pc.black(' Create Velocity ')));
}

export function showOutro(projectName: string, packageManager: PackageManager): void {
  const runCmd = packageManager === 'npm' ? 'npm run' : packageManager;

  p.note(
    [
      `cd ${projectName}`,
      `${runCmd} dev`,
    ].join('\n'),
    'Next steps'
  );

  p.outro(pc.green('Happy building!'));
}

export function showError(message: string): void {
  p.log.error(pc.red(message));
}

export function showWarning(message: string): void {
  p.log.warn(pc.yellow(message));
}

export function showSuccess(message: string): void {
  p.log.success(pc.green(message));
}

export function showStep(message: string): void {
  p.log.step(message);
}
