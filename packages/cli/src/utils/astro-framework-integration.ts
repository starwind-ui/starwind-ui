import * as p from "@clack/prompts";
import fs from "fs-extra";

import { findAstroConfig } from "./astro-config.js";
import {
  ASTRO_INTEGRATION_RANGES,
  defaultInstalledVersionReader,
  type InstalledVersionReader,
  meetsIntegrationPolicyFloor,
  resolveAstroMajor,
  type SupportedAstroMajor,
} from "./astro-integration-version.js";
import { readJsonFile } from "./fs.js";
import type { HostProjectPreparation } from "./host-project.js";
import { installDependencies, type PackageManager } from "./package-manager.js";
import { resolveProjectMutationPath } from "./project-path.js";
import {
  asAstArrayExpression,
  getAstDefaultExportCallObject,
  getAstDefaultImportBinding,
  getAstNamedImportBinding,
  getAstNodeRange,
  getAstObjectProperty,
  getAvailableIdentifier,
  hasAstDirectCall,
  parseSourceModule,
  type AstArrayExpression,
  type AstObjectExpression,
  type ParsedSourceModule,
} from "./source-shape.js";

export type AstroIntegrationProjectPackage = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

export type AstroIntegrationConfigReadiness =
  | { status: "ready" }
  | { status: "configurable" }
  | { status: "manual-action-required"; guidance: string };

export type AstroIntegrationPreflight =
  | { status: "ready"; packages: string[] }
  | { status: "configurable"; packages: string[] }
  | { status: "manual-action-required"; guidance: string };

export type AstroIntegrationSetupOutcome = {
  status: "cancelled" | "configured" | "declined" | "ready";
};

export type AstroIntegrationPreparation =
  | { status: "cancelled" }
  | { status: "declined" }
  | { status: "ready" }
  | { status: "prepared"; packages: string[] };

export type EnsureAstroIntegrationOptions = {
  packageManager?: PackageManager;
  projectPackage?: AstroIntegrationProjectPackage;
  readInstalledVersion?: InstalledVersionReader;
  skipPrompts?: boolean;
};

export type AstroFrameworkIntegrationSpec = {
  /** Local names tried, in order, for the default import when the config has no binding yet. */
  importNames: readonly string[];
  fallbackImportName: string;
  label: "Svelte" | "Vue";
  /** The `astro add` name, which is also the call that enables the integration. */
  callName: "svelte" | "vue";
  packageName: "@astrojs/svelte" | "@astrojs/vue";
  /** Keep a declared, configured integration when the Astro major cannot be read. */
  keepConfiguredWithUnknownAstro?: boolean;
  /** Returns guidance when the project cannot take the integration chosen for this Astro major. */
  checkPeers?: (context: {
    astroMajor: SupportedAstroMajor;
    dependencies: Record<string, string>;
    readInstalledVersion: InstalledVersionReader;
  }) => Promise<string | undefined>;
};

type AstroConfigShape = {
  config: AstObjectExpression;
  integrations?: AstArrayExpression;
};

type TextEdit = { end: number; start: number; text: string };

/** Builds the detect, install, and config-edit steps for one official Astro framework integration. */
export function createAstroFrameworkIntegration(spec: AstroFrameworkIntegrationSpec) {
  const { callName, label, packageName } = spec;
  const guidance = `Update the Astro config manually: import ${callName} from "${packageName}" and add ${callName}() to the integrations array.`;

  function inspectConfig(content: string): AstroIntegrationConfigReadiness {
    const module = parseSourceModule(content);
    return module ? inspectConfigModule(module) : { status: "manual-action-required", guidance };
  }

  function inspectConfigModule(module: ParsedSourceModule): AstroIntegrationConfigReadiness {
    const shape = getAstroConfigShape(module);
    const imported = getAstDefaultImportBinding(module, packageName);
    if (!shape || imported.status === "unsafe") {
      return { status: "manual-action-required", guidance };
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

  function updateConfigContent(content: string): string | null {
    const module = parseSourceModule(content);
    if (!module) return null;
    const readiness = inspectConfigModule(module);
    if (readiness.status === "ready") return content;
    if (readiness.status === "manual-action-required") return null;

    const shape = getAstroConfigShape(module);
    if (!shape) return null;
    const existingImport = getAstDefaultImportBinding(module, packageName);
    if (existingImport.status === "unsafe") return null;
    const importName =
      existingImport.status === "found"
        ? existingImport.localName
        : getAvailableIdentifier(content, spec.importNames, spec.fallbackImportName);
    const edits: TextEdit[] = [];
    if (existingImport.status === "missing") {
      edits.push({ end: 0, start: 0, text: `import ${importName} from "${packageName}";\n` });
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

  async function inspectConfigFile(): Promise<AstroIntegrationConfigReadiness> {
    const configPath = await findAstroConfig();
    if (!configPath) return { status: "configurable" };
    if (configPath.endsWith(".cjs")) {
      return {
        status: "manual-action-required",
        guidance: `${guidance} Starwind cannot safely update CommonJS Astro config files.`,
      };
    }
    return inspectConfig(await fs.readFile(configPath, "utf8"));
  }

  async function preflight(
    projectPackage?: AstroIntegrationProjectPackage,
    readInstalledVersion: InstalledVersionReader = defaultInstalledVersionReader,
  ): Promise<AstroIntegrationPreflight> {
    const pkg =
      projectPackage ?? ((await readJsonFile("package.json")) as AstroIntegrationProjectPackage);
    const dependencies = {
      ...pkg.optionalDependencies,
      ...pkg.devDependencies,
      ...pkg.dependencies,
    };
    const config = await inspectConfigFile();
    if (config.status === "manual-action-required") return config;
    const astroMajor = await resolveAstroMajor(dependencies.astro, readInstalledVersion, label);
    if (typeof astroMajor !== "number") {
      if (
        spec.keepConfiguredWithUnknownAstro &&
        config.status === "ready" &&
        dependencies[packageName]
      ) {
        return { status: "ready", packages: [] };
      }
      return { status: "manual-action-required", guidance: astroMajor };
    }
    const integrationRange = ASTRO_INTEGRATION_RANGES[packageName][astroMajor];
    const needsIntegration = !meetsIntegrationPolicyFloor(
      dependencies[packageName],
      await readInstalledVersion(packageName),
      integrationRange,
    );
    if (needsIntegration) {
      const peerGuidance = await spec.checkPeers?.({
        astroMajor,
        dependencies,
        readInstalledVersion,
      });
      if (peerGuidance) return { status: "manual-action-required", guidance: peerGuidance };
    }
    const packages = needsIntegration ? [`${packageName}@${integrationRange}`] : [];
    return {
      status: config.status === "ready" && packages.length === 0 ? "ready" : "configurable",
      packages,
    };
  }

  async function prepare(
    options: EnsureAstroIntegrationOptions = {},
  ): Promise<AstroIntegrationPreparation> {
    const result = await preflight(options.projectPackage, options.readInstalledVersion);
    if (result.status === "manual-action-required") throw new Error(result.guidance);
    if (result.status === "ready") return { status: "ready" };

    const shouldConfigure = options.skipPrompts
      ? true
      : await p.confirm({
          message: `${label} components in Astro require the official Astro ${label} integration. Configure Astro ${label} now?`,
          initialValue: true,
        });
    if (p.isCancel(shouldConfigure)) {
      p.cancel("Operation cancelled");
      return { status: "cancelled" };
    }
    if (!shouldConfigure) {
      p.log.warn(
        `${label} setup was skipped. Run "astro add ${callName}" or select ${label} again to continue.`,
      );
      return { status: "declined" };
    }

    return { status: "prepared", packages: result.packages };
  }

  async function setupConfig(): Promise<boolean> {
    let configPath = await findAstroConfig();
    let content: string;
    if (configPath) {
      if (configPath.endsWith(".cjs")) return false;
      content = await fs.readFile(configPath, "utf8");
    } else {
      configPath = "astro.config.ts";
      content =
        'import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n';
    }
    const updated = updateConfigContent(content);
    if (updated === null) return false;
    if (updated !== content) {
      await fs.writeFile(await resolveProjectMutationPath(configPath), updated, "utf8");
    }
    return true;
  }

  async function apply(
    preparation: Extract<AstroIntegrationPreparation, { status: "prepared" | "ready" }>,
    packageManager?: PackageManager,
  ): Promise<AstroIntegrationSetupOutcome> {
    if (preparation.status === "ready") return { status: "ready" };
    if (preparation.packages.length > 0) {
      await installDependencies(preparation.packages, packageManager);
    }
    if (!(await setupConfig())) {
      throw new Error(
        `Astro ${label} packages were installed, but the Astro config could not be updated. Add ${callName}() to the integrations array manually.`,
      );
    }
    return { status: "configured" };
  }

  async function ensure(
    options: EnsureAstroIntegrationOptions = {},
  ): Promise<AstroIntegrationSetupOutcome> {
    const preparation = await prepare(options);
    if (preparation.status === "cancelled" || preparation.status === "declined") {
      return preparation;
    }
    return apply(preparation, options.packageManager);
  }

  return {
    apply,
    ensure,
    inspectConfig,
    inspectConfigFile,
    prepare,
    preflight,
    setupConfig,
    updateConfigContent,
  };
}

function getAstroConfigShape(module: ParsedSourceModule): AstroConfigShape | undefined {
  if (module.hasRegularExpression) return undefined;
  const defineConfig = getAstNamedImportBinding(module, "astro/config", "defineConfig");
  const config = getAstDefaultExportCallObject(
    module,
    defineConfig.status === "found" ? defineConfig.localName : "defineConfig",
  );
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

/** Maps an integration preparation onto the host plan step that init runs before its own setup. */
export function toHostProjectPreparation(
  preparation: AstroIntegrationPreparation,
  apply: (
    preparation: Extract<AstroIntegrationPreparation, { status: "prepared" }>,
  ) => Promise<unknown>,
  label: "Svelte" | "Vue",
): HostProjectPreparation {
  if (preparation.status === "cancelled" || preparation.status === "declined") {
    return Object.freeze({ status: preparation.status });
  }
  if (preparation.status === "ready") {
    return Object.freeze({ status: "prepared" as const });
  }
  return Object.freeze({
    applyIntegration: async () => {
      await apply(preparation);
    },
    integrationLabel: `Setup Astro ${label} integration`,
    integrationResult: `Astro ${label} integration configured`,
    status: "prepared" as const,
  });
}
