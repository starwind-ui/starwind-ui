import path from "node:path";

import * as p from "@clack/prompts";
import fs from "fs-extra";

import {
  CONFIG_SCHEMA_V2_URL,
  type ComponentConfig,
  getConfigState,
  type StarwindConfig,
  updateConfig,
} from "@/utils/config.js";
import { highlighter } from "@/utils/highlighter.js";
import { detectPackageManager, type PackageManager } from "@/utils/package-manager.js";
import { resolveProjectMutationPath } from "@/utils/project-path.js";
import {
  type Component,
  type ComponentPublicRenames,
  loadRegistry,
  type RegistryPublicRename,
  type RegistryTarget,
  type StarwindRegistry,
} from "@/utils/registry.js";
import { installRuntimeComponents } from "@/utils/runtime-component.js";
import {
  readStarwindProRegistryFromComponentsJson,
  resolveStarwindProRegistryImport,
} from "@/utils/shadcn-config.js";
import { sleep } from "@/utils/sleep.js";

interface MigrateOptions {
  packageManager?: PackageManager;
  withinInit?: boolean;
  yes?: boolean;
}

type MigrationReport = {
  backedUpTo?: string;
  custom: string[];
  legacy: string[];
  migrated: string[];
  skipped: string[];
  codemods: {
    applied: string[];
    skipped: string[];
    unavailable: string[];
  };
};

type MigrationPlanItem = {
  component: Component;
  legacyComponent?: ComponentConfig;
  rename?: RenameCodemodPlan;
  target: RegistryTarget;
};

type RenameCodemodPlan = {
  componentName: string;
  paths: RegistryPublicRename[];
  usages: RegistryPublicRename[];
};

type RenameCodemodResult = "applied" | "skipped" | "unavailable";

export async function migrate(options?: MigrateOptions): Promise<void> {
  if (!options?.withinInit) {
    p.intro(highlighter.title(" Starwind Runtime Migration "));
  }

  try {
    const configState = await getConfigState();

    if (configState.status === "missing") {
      p.log.error("No Starwind configuration found. Please run starwind init first.");
      process.exit(1);
    }

    if (configState.status === "current") {
      p.log.info("This project is already using the Starwind Runtime config.");
      return;
    }

    const legacyConfig = configState.config;
    const registry = await loadRegistry({ type: "bundled" });
    const packageManager = options?.packageManager ?? detectPackageManager().name;
    const componentDir = resolveStarwindComponentDir(legacyConfig.componentDir);
    const backupDir = path.posix.join(path.posix.dirname(componentDir), "starwind-legacy");
    const backupDirs = [backupDir];
    const report: MigrationReport = {
      custom: [],
      legacy: [],
      migrated: [],
      skipped: [],
      codemods: {
        applied: [],
        skipped: [],
        unavailable: [],
      },
    };

    const existingFolders = await listDirectories(componentDir);
    const legacyComponentNames = new Set(
      legacyConfig.components.map((component) => component.name),
    );
    report.custom = existingFolders.filter((folder) => !legacyComponentNames.has(folder)).sort();

    const shouldBackup = options?.yes
      ? true
      : await p.confirm({
          message: `Back up existing Starwind components to ${highlighter.info(formatProjectPath(backupDir))}?`,
          initialValue: true,
        });

    if (p.isCancel(shouldBackup)) {
      p.cancel("Operation cancelled");
      process.exit(0);
    }

    if (shouldBackup && (await fs.pathExists(componentDir))) {
      const actualBackupDir = await resolveBackupDirectory(backupDir, options?.yes);

      if (actualBackupDir) {
        await p.tasks([
          {
            title: "Backing up existing components",
            task: async () => {
              const backupDestination = await resolveProjectMutationPath(actualBackupDir);
              await fs.copy(componentDir, backupDestination, {
                overwrite: false,
                errorOnExist: true,
              });
              return `Backed up components to ${formatProjectPath(actualBackupDir)}`;
            },
          },
        ]);
        backupDirs.push(actualBackupDir);
        report.backedUpTo = actualBackupDir;
      }
    }

    const migrationPlan = new Map<string, MigrationPlanItem>();
    const legacyComponents = new Map<string, ComponentConfig>();

    for (const component of legacyConfig.components) {
      const collected = collectMigrationPlan({
        componentName: component.name,
        legacyComponent: component,
        plan: migrationPlan,
        registry,
      });

      if (!collected) {
        report.legacy.push(component.name);
        legacyComponents.set(component.name, toLegacyComponent(component));
      }
    }

    const componentsToMigrate: string[] = [];
    const conflicts: MigrationPlanItem[] = [];

    for (const item of migrationPlan.values()) {
      const componentPath = path.join(componentDir, item.component.name);
      const hasExistingFolder = await fs.pathExists(componentPath);

      if (!hasExistingFolder) {
        componentsToMigrate.push(item.component.name);
        continue;
      }

      conflicts.push(item);
    }

    const overwriteAllConflicts = await promptForBulkOverwrite({
      componentDir,
      conflicts,
      skipPrompts: options?.yes || Boolean(report.backedUpTo),
    });

    for (const item of conflicts) {
      const shouldOverwrite =
        overwriteAllConflicts ??
        (await p.confirm({
          message: `Overwrite ${highlighter.info(item.component.name)} in ${formatProjectPath(componentDir)}?`,
          initialValue: false,
        }));

      if (p.isCancel(shouldOverwrite)) {
        p.cancel("Operation cancelled");
        process.exit(0);
      }

      if (!shouldOverwrite) {
        report.skipped.push(item.component.name);
        report.legacy.push(item.legacyComponent?.name ?? item.component.name);
        legacyComponents.set(
          item.component.name,
          toLegacyComponent(
            item.legacyComponent ?? { name: item.component.name, version: "0.0.0" },
          ),
        );
        continue;
      }

      componentsToMigrate.push(item.component.name);
    }

    const finalComponents = new Map<string, ComponentConfig>(legacyComponents);
    const proImport = resolveStarwindProRegistryImport(
      legacyConfig,
      await readStarwindProRegistryFromComponentsJson(),
      (message) => p.log.warn(message),
    );

    if (componentsToMigrate.length > 0) {
      const runtimeConfig: StarwindConfig = {
        ...legacyConfig,
        $schema: CONFIG_SCHEMA_V2_URL,
        version: 2,
        framework: "astro",
        registry: {
          source: "bundled",
          version: registry.version,
        },
        pro: proImport.pro,
        componentDir,
        components: [],
      };

      let result: Awaited<ReturnType<typeof installRuntimeComponents>> | undefined;

      await p.tasks([
        {
          title: "Migrating Starwind components",
          task: async () => {
            result = await installRuntimeComponents(componentsToMigrate, {
              config: runtimeConfig,
              includeDependencies: false,
              overwrite: true,
              packageManager,
              registry,
              skipPrompts: true,
              writeConfig: false,
            });

            return "Migrated Starwind components";
          },
        },
      ]);

      if (!result) {
        throw new Error("Failed to migrate Starwind components");
      }

      if (result.failed.length > 0) {
        for (const failed of result.failed) {
          p.log.warn(`Could not migrate ${failed.name}: ${failed.error ?? "Unknown error"}`);
          report.legacy.push(failed.name);
          const planned = migrationPlan.get(failed.name);
          finalComponents.set(
            failed.name,
            toLegacyComponent(planned?.legacyComponent ?? { name: failed.name, version: "0.0.0" }),
          );
        }
      }

      report.migrated = result.installed.map((item) => item.name);

      for (const installed of result.installed) {
        finalComponents.set(installed.name, {
          framework: "astro",
          name: installed.name,
          version: installed.version!,
        });
      }

      const installedNames = new Set(result.installed.map((item) => item.name));
      for (const item of migrationPlan.values()) {
        if (!item.rename || !installedNames.has(item.component.name)) continue;

        const codemodResult = await promptAndApplyRenameCodemod({
          backupDirs,
          componentDir,
          plan: item.rename,
          skipPrompts: options?.yes,
        });
        report.codemods[codemodResult].push(formatRenameCodemodLabel(item.rename));
      }
    }

    await p.tasks([
      {
        title: "Updating Starwind configuration",
        task: async () => {
          await updateConfig(
            {
              $schema: CONFIG_SCHEMA_V2_URL,
              version: 2,
              framework: "astro",
              registry: {
                source: "bundled",
                version: registry.version,
              },
              pro: proImport.pro,
              tailwind: legacyConfig.tailwind,
              componentDir,
              utilsDir: legacyConfig.utilsDir,
              components: [...finalComponents.values()],
            },
            { appendComponents: false },
          );

          return "Updated Starwind configuration";
        },
      },
    ]);

    logMigrationSummary(report);
    await sleep(250);
    if (!options?.withinInit) {
      p.outro("Starwind migration complete 🚀");
    }
  } catch (error) {
    p.log.error(error instanceof Error ? error.message : "Failed to migrate Starwind");
    p.cancel("Operation cancelled");
    process.exit(1);
  }
}

function resolveStarwindComponentDir(componentDir: string): string {
  const normalized = componentDir.replace(/\\/g, "/").replace(/\/+$/, "");

  if (normalized.endsWith("/starwind") || normalized === "starwind") {
    return normalized;
  }

  return path.posix.join(normalized, "starwind");
}

async function listDirectories(directory: string): Promise<string[]> {
  if (!(await fs.pathExists(directory))) {
    return [];
  }

  const entries = await fs.readdir(directory, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
}

async function promptForBulkOverwrite(options: {
  componentDir: string;
  conflicts: MigrationPlanItem[];
  skipPrompts?: boolean;
}): Promise<boolean | undefined> {
  if (options.conflicts.length === 0) return undefined;
  if (options.skipPrompts) return true;

  const componentList = options.conflicts.map((item) => item.component.name).join(", ");
  const shouldOverwriteAll = await p.confirm({
    message: `Overwrite all existing Starwind registry components in ${formatProjectPath(options.componentDir)}? ${highlighter.info(componentList)}`,
    initialValue: false,
  });

  if (p.isCancel(shouldOverwriteAll)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  return shouldOverwriteAll ? true : undefined;
}

function collectMigrationPlan(options: {
  componentName: string;
  legacyComponent?: ComponentConfig;
  plan: Map<string, MigrationPlanItem>;
  registry: StarwindRegistry;
}): boolean {
  const match = findRegistryMigrationMatch(options.componentName, options.registry);

  if (!match) {
    return false;
  }

  const { component, rename } = match;
  const target = component.targets?.astro;

  if (!target) {
    return false;
  }

  if (options.plan.has(component.name)) {
    const existing = options.plan.get(component.name);
    if (existing && options.legacyComponent) {
      existing.legacyComponent = options.legacyComponent;
    }
    if (existing && rename) {
      existing.rename = rename;
    }
    return true;
  }

  for (const dependency of target.componentDependencies) {
    collectMigrationPlan({
      componentName: dependency,
      plan: options.plan,
      registry: options.registry,
    });
  }

  options.plan.set(component.name, {
    component,
    legacyComponent: options.legacyComponent,
    rename,
    target,
  });
  return true;
}

function findRegistryMigrationMatch(
  componentName: string,
  registry: StarwindRegistry,
): { component: Component; rename?: RenameCodemodPlan } | undefined {
  const directComponent = registry.components.find((component) => component.name === componentName);

  if (directComponent) {
    return {
      component: directComponent,
      rename: buildRenameCodemodPlan(directComponent, componentName),
    };
  }

  for (const component of registry.components) {
    const matchingPathRename = component.publicRenames?.paths?.find(
      (rename) => rename.from === componentName && rename.to === component.name,
    );

    if (!matchingPathRename) continue;

    return {
      component,
      rename: buildRenameCodemodPlan(component, componentName),
    };
  }

  return undefined;
}

function buildRenameCodemodPlan(
  component: Component,
  requestedName: string,
): RenameCodemodPlan | undefined {
  const publicRenames: ComponentPublicRenames | undefined = component.publicRenames;

  if (!publicRenames) return undefined;

  const paths =
    publicRenames.paths?.filter(
      (rename) => rename.from === requestedName || rename.to === component.name,
    ) ?? [];
  const usages = publicRenames.usages ?? [];

  if (paths.length === 0 && usages.length === 0) return undefined;

  return {
    componentName: component.name,
    paths,
    usages,
  };
}

async function resolveBackupDirectory(
  backupDir: string,
  skipPrompts?: boolean,
): Promise<string | undefined> {
  if (!(await fs.pathExists(backupDir))) {
    return backupDir;
  }

  const nextBackupDir = await getAvailableBackupDirectory(backupDir);
  const shouldCreateNewBackup = skipPrompts
    ? true
    : await p.confirm({
        message: `${formatProjectPath(backupDir)} already exists. Create a new backup at ${formatProjectPath(nextBackupDir)}?`,
        initialValue: true,
      });

  if (p.isCancel(shouldCreateNewBackup)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  return shouldCreateNewBackup ? nextBackupDir : undefined;
}

async function getAvailableBackupDirectory(backupDir: string): Promise<string> {
  let index = 1;
  let nextBackupDir = `${backupDir}-${index}`;

  while (await fs.pathExists(nextBackupDir)) {
    index += 1;
    nextBackupDir = `${backupDir}-${index}`;
  }

  return nextBackupDir;
}

function toLegacyComponent(component: ComponentConfig): ComponentConfig {
  return {
    name: component.name,
    source: "legacy",
    version: component.version,
  };
}

function logMigrationSummary(report: MigrationReport): void {
  const legacy = [...new Set(report.legacy)];
  const fullyMigrated =
    report.migrated.length > 0 && report.skipped.length === 0 && legacy.length === 0;

  p.log.message(`\n\n${highlighter.underline("Migration Summary")}`);

  if (report.backedUpTo) {
    p.log.success(
      `${highlighter.success("Backed up legacy components to:")}
  ${formatProjectPath(report.backedUpTo)}`,
    );
  }

  if (report.migrated.length > 0) {
    p.log.success(
      fullyMigrated
        ? highlighter.success("Successfully migrated all components.")
        : `${highlighter.success("Successfully migrated components:")}
${formatIndentedList(report.migrated)}`,
    );
  }

  if (report.skipped.length > 0) {
    p.log.warn(
      `${highlighter.warn("Skipped components:")}
${formatIndentedList(report.skipped)}`,
    );
  }

  if (legacy.length > 0) {
    p.log.warn(
      `${highlighter.warn("Kept legacy components:")}
${formatIndentedList(legacy)}`,
    );
  }

  if (report.codemods.applied.length > 0) {
    p.log.success(
      `${highlighter.success("Updated project imports/usages:")}
${formatIndentedList(report.codemods.applied)}`,
    );
  }

  if (report.codemods.skipped.length > 0) {
    p.log.warn(
      `${highlighter.warn("Skipped import/usage updates:")}
${formatIndentedList(report.codemods.skipped)}`,
    );
  }

  if (report.codemods.unavailable.length > 0) {
    p.log.warn(
      `${highlighter.warn("No matching imports/usages found for:")}
${formatIndentedList(report.codemods.unavailable)}`,
    );
  }

  if (report.custom.length > 0) {
    p.log.info(
      `${highlighter.info("Left custom component folders untouched:")}
${formatIndentedList(report.custom)}`,
    );
  }
}

function formatIndentedList(items: string[]): string {
  return items.map((item) => `  ${item}`).join("\n");
}

function formatProjectPath(filePath: string): string {
  return filePath.replace(/\\/g, "/");
}

async function promptAndApplyRenameCodemod(options: {
  backupDirs: string[];
  componentDir: string;
  plan: RenameCodemodPlan;
  skipPrompts?: boolean;
}): Promise<RenameCodemodResult> {
  const summary = formatRenameCodemodLabel(options.plan);

  p.log.info(`Registry rename detected: ${summary}.`);

  const shouldCodemod = options.skipPrompts
    ? true
    : await p.confirm({
        message: `Update project imports/usages for ${summary}?`,
        initialValue: true,
      });

  if (p.isCancel(shouldCodemod)) {
    p.cancel("Operation cancelled");
    process.exit(0);
  }

  if (!shouldCodemod) {
    return "skipped";
  }

  const changedFiles = await applyRenameCodemod({
    backupDirs: options.backupDirs,
    componentDir: options.componentDir,
    plan: options.plan,
  });

  return changedFiles.length > 0 ? "applied" : "unavailable";
}

async function applyRenameCodemod(options: {
  backupDirs: string[];
  componentDir: string;
  plan: RenameCodemodPlan;
}): Promise<string[]> {
  const replacements = createRenameReplacements(options.plan);
  const files = await listCodemodFiles({
    backupRootName: path.basename(options.backupDirs[0] ?? "starwind-legacy"),
    excludeRoots: [options.componentDir, ...options.backupDirs],
    root: process.cwd(),
    starwindParentDir: path.dirname(options.componentDir),
  });
  const changedFiles: string[] = [];

  for (const file of files) {
    const content = await fs.readFile(file, "utf-8");
    const updated = applyReplacements(content, replacements);

    if (updated === content) continue;

    const codemodDestination = await resolveProjectMutationPath(path.relative(process.cwd(), file));
    await fs.writeFile(codemodDestination, updated, "utf-8");
    changedFiles.push(file);
  }

  return changedFiles;
}

function createRenameReplacements(plan: RenameCodemodPlan): Array<{
  apply: (content: string) => string;
}> {
  return [
    ...plan.paths.flatMap((rename) => [
      {
        apply: (content: string) =>
          replacePathSegment(content, `starwind/${rename.from}`, `starwind/${rename.to}`),
      },
      {
        apply: (content: string) =>
          replacePathSegment(content, `starwind\\${rename.from}`, `starwind\\${rename.to}`),
      },
    ]),
    ...plan.usages.map((rename) => ({
      apply: (content: string) =>
        content.replace(new RegExp(`\\b${escapeRegExp(rename.from)}\\b`, "g"), rename.to),
    })),
  ];
}

function replacePathSegment(content: string, from: string, to: string): string {
  return content.replace(new RegExp(`${escapeRegExp(from)}(?=$|[^A-Za-z0-9_-])`, "g"), () => to);
}

function applyReplacements(
  content: string,
  replacements: Array<{ apply: (content: string) => string }>,
): string {
  return replacements.reduce((currentContent, replacement) => {
    return replacement.apply(currentContent);
  }, content);
}

const CODEMOD_EXCLUDED_DIRECTORIES = new Set([
  ".astro",
  ".git",
  ".next",
  "build",
  "coverage",
  "dist",
  "node_modules",
]);

const CODEMOD_FILE_EXTENSIONS = new Set([
  ".astro",
  ".cjs",
  ".cts",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mdx",
  ".mjs",
  ".mts",
  ".ts",
  ".tsx",
]);

async function listCodemodFiles(options: {
  backupRootName: string;
  excludeRoots: string[];
  root: string;
  starwindParentDir: string;
}): Promise<string[]> {
  const root = path.resolve(options.root);
  const excludeRoots = options.excludeRoots.map((excludeRoot) =>
    path.resolve(options.root, excludeRoot),
  );
  const backupParentDir = path.resolve(options.root, options.starwindParentDir);
  const files: string[] = [];

  async function walk(directory: string): Promise<void> {
    const entries = await fs.readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        if (
          CODEMOD_EXCLUDED_DIRECTORIES.has(entry.name) ||
          isBackupDirectorySibling({
            backupParentDir,
            backupRootName: options.backupRootName,
            directory: entryPath,
          }) ||
          isExcludedPath(entryPath, excludeRoots)
        ) {
          continue;
        }

        await walk(entryPath);
        continue;
      }

      if (!entry.isFile() || entry.name === "starwind.config.json") continue;
      if (!CODEMOD_FILE_EXTENSIONS.has(path.extname(entry.name))) continue;

      files.push(entryPath);
    }
  }

  await walk(root);
  return files;
}

function isBackupDirectorySibling(options: {
  backupParentDir: string;
  backupRootName: string;
  directory: string;
}): boolean {
  if (path.dirname(options.directory) !== options.backupParentDir) {
    return false;
  }

  const directoryName = path.basename(options.directory);
  return (
    directoryName === options.backupRootName ||
    new RegExp(`^${escapeRegExp(options.backupRootName)}-\\d+$`).test(directoryName)
  );
}

function isExcludedPath(filePath: string, excludedRoots: string[]): boolean {
  const resolvedFilePath = path.resolve(filePath);

  return excludedRoots.some((excludedRoot) => {
    const relative = path.relative(excludedRoot, resolvedFilePath);
    return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
  });
}

function formatRenameCodemodLabel(plan: RenameCodemodPlan): string {
  const renames = [
    ...plan.paths.map((rename) => `${rename.from} -> ${rename.to}`),
    ...plan.usages.map((rename) => `${rename.from} -> ${rename.to}`),
  ];

  return `${plan.componentName} (${renames.join(", ")})`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
