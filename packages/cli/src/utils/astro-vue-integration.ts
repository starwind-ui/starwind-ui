import * as p from "@clack/prompts";
import fs from "fs-extra";

import { findAstroConfig } from "./astro-config.js";
import { readJsonFile } from "./fs.js";
import { installDependencies, type PackageManager } from "./package-manager.js";
import { resolveProjectMutationPath } from "./project-path.js";
import {
  asAstArrayExpression,
  getAstDefaultExportCallObject,
  getAstDefaultImportBinding,
  getAstNodeRange,
  getAstObjectProperty,
  getAvailableIdentifier,
  hasAstDirectCall,
  parseSourceModule,
  type AstArrayExpression,
  type AstObjectExpression,
  type ParsedSourceModule,
} from "./source-shape.js";

type ProjectPackage = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

export type AstroVueConfigReadiness =
  | { status: "ready" }
  | { status: "configurable" }
  | { status: "manual-action-required"; guidance: string };

export type AstroVuePreflight =
  | { status: "ready"; packages: string[] }
  | { status: "configurable"; packages: string[] }
  | { status: "manual-action-required"; guidance: string };

export type AstroVueSetupOutcome = {
  status: "cancelled" | "configured" | "declined" | "ready";
};

export type AstroVuePreparation =
  | { status: "cancelled" }
  | { status: "declined" }
  | { status: "ready" }
  | { status: "prepared"; packages: string[] };

type EnsureAstroVueIntegrationOptions = {
  packageManager?: PackageManager;
  projectPackage?: ProjectPackage;
  skipPrompts?: boolean;
};

type AstroConfigShape = {
  config: AstObjectExpression;
  integrations?: AstArrayExpression;
};

type TextEdit = { end: number; start: number; text: string };

const GUIDANCE =
  'Update the Astro config manually: import vue from "@astrojs/vue" and add vue() to the integrations array.';

export function inspectAstroVueConfig(content: string): AstroVueConfigReadiness {
  const module = parseSourceModule(content);
  return module
    ? inspectAstroVueConfigModule(module)
    : { status: "manual-action-required", guidance: GUIDANCE };
}

function inspectAstroVueConfigModule(module: ParsedSourceModule): AstroVueConfigReadiness {
  const shape = getAstroConfigShape(module);
  const imported = getAstDefaultImportBinding(module, "@astrojs/vue");
  if (!shape || imported.status === "unsafe") {
    return { status: "manual-action-required", guidance: GUIDANCE };
  }
  if (
    imported.status === "found" &&
    shape.integrations &&
    hasAstDirectCall(shape.integrations, imported.localName)
  ) {
    return { status: "ready" };
  }
  return { status: "configurable" };
}

export function updateAstroVueConfigContent(content: string): string | null {
  const module = parseSourceModule(content);
  if (!module) return null;
  const readiness = inspectAstroVueConfigModule(module);
  if (readiness.status === "ready") return content;
  if (readiness.status === "manual-action-required") return null;

  const shape = getAstroConfigShape(module);
  if (!shape) return null;
  const existingImport = getAstDefaultImportBinding(module, "@astrojs/vue");
  if (existingImport.status === "unsafe") return null;
  const importName =
    existingImport.status === "found"
      ? existingImport.localName
      : getAvailableIdentifier(
          content,
          ["vue", "astroVue", "astroVueIntegration"],
          "astroVueIntegration",
        );
  const edits: TextEdit[] = [];
  if (existingImport.status === "missing") {
    edits.push({ end: 0, start: 0, text: `import ${importName} from "@astrojs/vue";\n` });
  }
  if (shape.integrations) {
    const range = getAstNodeRange(shape.integrations)!;
    const hasEntries = content.slice(range.start + 1, range.end - 1).trim().length > 0;
    edits.push({
      end: range.start + 1,
      start: range.start + 1,
      text: `${importName}()${hasEntries ? ", " : ""}`,
    });
  } else {
    const range = getAstNodeRange(shape.config)!;
    const objectBody = content.slice(range.start + 1, range.end - 1);
    const needsComma = objectBody.trim().length > 0 && !objectBody.trimEnd().endsWith(",");
    edits.push({
      end: range.end - 1,
      start: range.end - 1,
      text: `${needsComma ? "," : ""}\n  integrations: [${importName}()],\n`,
    });
  }
  return applyTextEdits(content, edits);
}
export async function inspectAstroVueConfigFile(): Promise<AstroVueConfigReadiness> {
  const configPath = await findAstroConfig();
  if (!configPath) return { status: "configurable" };
  if (configPath.endsWith(".cjs")) {
    return {
      status: "manual-action-required",
      guidance: `${GUIDANCE} Starwind cannot safely update CommonJS Astro config files.`,
    };
  }
  return inspectAstroVueConfig(await fs.readFile(configPath, "utf8"));
}

export async function preflightAstroVueIntegration(
  projectPackage?: ProjectPackage,
): Promise<AstroVuePreflight> {
  const pkg = projectPackage ?? ((await readJsonFile("package.json")) as ProjectPackage);
  const dependencies = {
    ...pkg.optionalDependencies,
    ...pkg.devDependencies,
    ...pkg.dependencies,
  };
  const config = await inspectAstroVueConfigFile();
  if (config.status === "manual-action-required") return config;
  const packages = dependencies["@astrojs/vue"] ? [] : ["@astrojs/vue"];
  return {
    status: config.status === "ready" && packages.length === 0 ? "ready" : "configurable",
    packages,
  };
}

export async function ensureAstroVueIntegration(
  options: EnsureAstroVueIntegrationOptions = {},
): Promise<AstroVueSetupOutcome> {
  const preparation = await prepareAstroVueIntegration(options);
  if (preparation.status === "cancelled" || preparation.status === "declined") {
    return preparation;
  }
  return applyAstroVueIntegration(preparation, options.packageManager);
}

export async function prepareAstroVueIntegration(
  options: EnsureAstroVueIntegrationOptions = {},
): Promise<AstroVuePreparation> {
  const preflight = await preflightAstroVueIntegration(options.projectPackage);
  if (preflight.status === "manual-action-required") throw new Error(preflight.guidance);
  if (preflight.status === "ready") return { status: "ready" };

  const shouldConfigure = options.skipPrompts
    ? true
    : await p.confirm({
        message:
          "Vue components in Astro require the official Astro Vue integration. Configure Astro Vue now?",
        initialValue: true,
      });
  if (p.isCancel(shouldConfigure)) {
    p.cancel("Operation cancelled");
    return { status: "cancelled" };
  }
  if (!shouldConfigure) {
    p.log.warn('Vue setup was skipped. Run "astro add vue" or select Vue again to continue.');
    return { status: "declined" };
  }

  return { status: "prepared", packages: preflight.packages };
}

export async function applyAstroVueIntegration(
  preparation: Extract<AstroVuePreparation, { status: "prepared" | "ready" }>,
  packageManager?: PackageManager,
): Promise<AstroVueSetupOutcome> {
  if (preparation.status === "ready") return { status: "ready" };
  if (preparation.packages.length > 0) {
    await installDependencies(preparation.packages, packageManager);
  }
  if (!(await setupAstroVueConfig())) {
    throw new Error(
      "Astro Vue packages were installed, but the Astro config could not be updated. Add vue() to the integrations array manually.",
    );
  }
  return { status: "configured" };
}

export async function setupAstroVueConfig(): Promise<boolean> {
  let configPath = await findAstroConfig();
  let content: string;
  if (configPath) {
    if (configPath.endsWith(".cjs")) return false;
    content = await fs.readFile(configPath, "utf8");
  } else {
    configPath = "astro.config.ts";
    content = 'import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n';
  }
  const updated = updateAstroVueConfigContent(content);
  if (updated === null) return false;
  if (updated !== content) {
    await fs.writeFile(await resolveProjectMutationPath(configPath), updated, "utf8");
  }
  return true;
}

function getAstroConfigShape(module: ParsedSourceModule): AstroConfigShape | undefined {
  if (module.hasRegularExpression) return undefined;
  const config = getAstDefaultExportCallObject(module, "defineConfig");
  if (!config) return undefined;
  const integrationsProperty = getAstObjectProperty(config, "integrations");
  if (integrationsProperty.status === "unsafe") return undefined;
  if (integrationsProperty.status === "missing") return { config };
  const integrations = asAstArrayExpression(integrationsProperty.value);
  return integrations ? { config, integrations } : undefined;
}

function applyTextEdits(source: string, edits: TextEdit[]): string {
  return [...edits]
    .sort((left, right) => right.start - left.start)
    .reduce(
      (result, edit) => result.slice(0, edit.start) + edit.text + result.slice(edit.end),
      source,
    );
}
