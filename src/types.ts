export interface CliOptions {
  projectName?: string;
  demo?: boolean;
  components?: boolean;
  i18n?: boolean;
  help?: boolean;
  version?: boolean;
  yes?: boolean;
}

export interface ScaffoldOptions {
  projectName: string;
  targetDir: string;
  demo: boolean;
  components: boolean;
  i18n: boolean;
  packageManager: PackageManager;
}

export type PackageManager = 'pnpm' | 'npm' | 'yarn' | 'bun';

export interface PromptAnswers {
  projectName: string;
  demo: boolean;
  components: boolean;
  i18n: boolean;
  packageManager: PackageManager;
}
