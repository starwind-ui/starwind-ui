import fs from "fs-extra";
import semver from "semver";

import { fileExists } from "./fs.js";
import { resolveProjectMutationPath } from "./project-path.js";
import { starwindStylesheetPackageRequirements } from "@/templates/starwind.css.js";
import { addVueCssImport, updateVueViteConfigContent } from "./vite-config.js";

type ProjectPackage = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export type VueProjectPlan = {
  componentDir: string;
  cssEntry: string;
  cssFile: string;
  kind: "vite";
  sourceRoot: "src";
  utilsDir: string;
  viteConfig: string;
  vueUpgradeRequired: boolean;
};

const VITE_CONFIG_PATHS = [
  "vite.config.ts",
  "vite.config.js",
  "vite.config.mts",
  "vite.config.mjs",
] as const;
const VUE_ENTRY_PATHS = ["src/main.ts", "src/main.js"] as const;

export const VUE_PROJECT_CANDIDATE_PATHS = [
  ...VITE_CONFIG_PATHS,
  ...VUE_ENTRY_PATHS,
  "src/App.vue",
] as const;

export function getVueProjectPlan(
  pkg: ProjectPackage,
  existingPaths: ReadonlySet<string>,
): VueProjectPlan {
  const dependencies = {
    ...pkg.peerDependencies,
    ...pkg.optionalDependencies,
    ...pkg.devDependencies,
    ...pkg.dependencies,
  };
  if (!dependencies.vue) {
    throw new Error("The Vue project must declare Vue 3.5 or later.");
  }
  if (!dependencies["@vitejs/plugin-vue"]) {
    throw new Error("The Vite Vue project must declare the official @vitejs/plugin-vue plugin.");
  }

  const viteConfig = VITE_CONFIG_PATHS.find((candidate) => existingPaths.has(candidate));
  const cssEntry = VUE_ENTRY_PATHS.find((candidate) => existingPaths.has(candidate));
  if (!viteConfig || !cssEntry || !existingPaths.has("src/App.vue")) {
    throw new Error(
      "The Vue project is missing an official Vite config, src/main entry, or src/App.vue.",
    );
  }

  return {
    componentDir: "src/components/starwind",
    cssEntry,
    cssFile: "src/styles/starwind.css",
    kind: "vite",
    sourceRoot: "src",
    utilsDir: "src/lib/utils",
    viteConfig,
    vueUpgradeRequired: !meetsVueVersionFloor(dependencies.vue),
  };
}

export function meetsVueVersionFloor(range: string): boolean {
  if (/^(?:file|link|portal|workspace):/i.test(range)) return false;
  try {
    const minimum = semver.minVersion(range);
    return Boolean(minimum && semver.gte(minimum, "3.5.0"));
  } catch {
    return false;
  }
}

export async function detectVueProjectPaths(
  pathExists: (filePath: string) => Promise<boolean> = fileExists,
): Promise<ReadonlySet<string>> {
  const existingPaths = new Set<string>();
  await Promise.all(
    VUE_PROJECT_CANDIDATE_PATHS.map(async (candidate) => {
      if (await pathExists(candidate)) existingPaths.add(candidate);
    }),
  );
  return existingPaths;
}

export async function validateVueProjectSetup(plan: VueProjectPlan): Promise<void> {
  const config = await fs.readFile(plan.viteConfig, "utf8");
  if (!updateVueViteConfigContent(config)) {
    throw new Error(
      "The Vite Vue config shape is not supported automatically. Expected the official object-style defineConfig setup with @vitejs/plugin-vue and a plugins array.",
    );
  }
  await fs.readFile(plan.cssEntry, "utf8");
}

export async function setupVueProject(plan: VueProjectPlan, cssFile: string): Promise<void> {
  const config = await fs.readFile(plan.viteConfig, "utf8");
  const updatedConfig = updateVueViteConfigContent(config);
  if (!updatedConfig) {
    throw new Error("The Vite Vue config changed after Starwind preflight validation.");
  }
  if (updatedConfig !== config) {
    await fs.writeFile(await resolveProjectMutationPath(plan.viteConfig), updatedConfig, "utf8");
  }

  const entry = await fs.readFile(plan.cssEntry, "utf8");
  const updatedEntry = addVueCssImport(entry, plan.cssEntry, cssFile);
  if (updatedEntry !== entry) {
    await fs.writeFile(await resolveProjectMutationPath(plan.cssEntry), updatedEntry, "utf8");
  }
}

export function getVuePackageRequirements(
  requirements: string[],
  projectPackage?: ProjectPackage,
): string[] {
  const declarationView = projectPackage
    ? createVuePackageDeclarationView(projectPackage)
    : undefined;
  return resolveVuePackageRequirements(requirements, declarationView);
}

export function createVuePackageRequirementPlanner(
  projectPackage: ProjectPackage,
): (requirements: string[]) => string[] {
  const declarationView = createVuePackageDeclarationView(projectPackage);
  return (requirements) => resolveVuePackageRequirements(requirements, declarationView);
}

export function isCompatiblePublishedRange(
  declaredRange: string,
  requiredRange: string,
  packageName?: string,
): boolean {
  const range = declaredRange.trim();
  if (/^(?:file|link|portal|workspace|npm|git|https?):/i.test(range)) return false;
  try {
    const declared = semver.validRange(range);
    const required = semver.validRange(
      packageName === "vue" ? requiredRange + " <4" : requiredRange,
    );
    return Boolean(declared && required && semver.subset(declared, required));
  } catch {
    return false;
  }
}

type VuePackageDeclarationView = Readonly<Record<string, readonly string[]>>;

function resolveVuePackageRequirements(
  requirements: string[],
  declarations?: VuePackageDeclarationView,
): string[] {
  const next = [...requirements];
  for (const requirement of starwindStylesheetPackageRequirements) {
    const packageName = requirement.slice(0, requirement.lastIndexOf("@"));
    if (!next.some((candidate) => candidate.startsWith(packageName + "@"))) {
      next.push(requirement);
    }
  }
  if (!declarations) return next;

  return next.filter((requirement) => {
    const parsed = parseVersionedPackageRequirement(requirement);
    if (!parsed) return true;
    const declaredRanges = declarations[parsed.name] ?? [];
    return (
      declaredRanges.length === 0 ||
      !declaredRanges.every((range) => isCompatiblePublishedRange(range, parsed.range, parsed.name))
    );
  });
}

function parseVersionedPackageRequirement(
  requirement: string,
): { name: string; range: string } | undefined {
  const separator = requirement.lastIndexOf("@");
  if (separator <= 0 || separator === requirement.length - 1) return undefined;
  return { name: requirement.slice(0, separator), range: requirement.slice(separator + 1) };
}

function createVuePackageDeclarationView(pkg: ProjectPackage): VuePackageDeclarationView {
  const declarations: Record<string, string[]> = {};
  for (const field of [
    pkg.dependencies,
    pkg.devDependencies,
    pkg.optionalDependencies,
    pkg.peerDependencies,
  ]) {
    for (const [packageName, range] of Object.entries(field ?? {})) {
      (declarations[packageName] ??= []).push(range);
    }
  }
  return Object.freeze(
    Object.fromEntries(
      Object.entries(declarations).map(([packageName, ranges]) => [
        packageName,
        Object.freeze([...ranges]),
      ]),
    ),
  );
}
