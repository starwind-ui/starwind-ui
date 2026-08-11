import * as p from "@clack/prompts";
import fs from "fs-extra";
import semver from "semver";

import { readJsonFile } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";

import { fileExists } from "./fs.js";
import {
  asAstArrayExpression,
  asAstObjectExpression,
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

const CONFIG_EXTENSIONS = ["ts", "js", "mjs", "cjs"] as const;

export async function findAstroConfig(): Promise<string | null> {
  for (const ext of CONFIG_EXTENSIONS) {
    const configPath = `astro.config.${ext}`;
    if (await fileExists(configPath)) return configPath;
  }
  return null;
}

export type AstroReactConfigReadiness =
  | { status: "ready" }
  | { status: "configurable" }
  | { status: "manual-action-required"; guidance: string };

type AstroConfigShape = {
  config: AstObjectExpression;
  integrations?: AstArrayExpression;
};

type TextEdit = { end: number; start: number; text: string };

const ASTRO_REACT_CONFIG_GUIDANCE =
  'Update the Astro config manually: import react from "@astrojs/react" and add react() to the integrations array.';

export function inspectAstroReactConfig(content: string): AstroReactConfigReadiness {
  const module = parseSourceModule(content);
  return module
    ? inspectAstroReactConfigModule(module)
    : { status: "manual-action-required", guidance: ASTRO_REACT_CONFIG_GUIDANCE };
}

function inspectAstroReactConfigModule(module: ParsedSourceModule): AstroReactConfigReadiness {
  const shape = getAstroConfigShape(module);
  const imported = getAstDefaultImportBinding(module, "@astrojs/react");
  if (!shape || imported.status === "unsafe") {
    return { status: "manual-action-required", guidance: ASTRO_REACT_CONFIG_GUIDANCE };
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

export async function inspectAstroReactConfigFile(): Promise<AstroReactConfigReadiness> {
  const configPath = await findAstroConfig();
  if (!configPath) return { status: "configurable" };
  if (configPath.endsWith(".cjs")) {
    return {
      status: "manual-action-required",
      guidance: `${ASTRO_REACT_CONFIG_GUIDANCE} Starwind cannot safely update CommonJS Astro config files.`,
    };
  }
  return inspectAstroReactConfig(await fs.readFile(configPath, "utf-8"));
}

export async function setupAstroReactConfig(): Promise<boolean> {
  try {
    let configPath = await findAstroConfig();
    let content: string;
    if (configPath) {
      if (configPath.endsWith(".cjs")) return false;
      content = await fs.readFile(configPath, "utf-8");
    } else {
      configPath = "astro.config.ts";
      content =
        'import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n';
    }

    const module = parseSourceModule(content);
    if (!module) return false;
    const readiness = inspectAstroReactConfigModule(module);
    if (readiness.status === "ready") return true;
    if (readiness.status === "manual-action-required") return false;

    const shape = getAstroConfigShape(module);
    if (!shape) return false;
    const existingImport = getAstDefaultImportBinding(module, "@astrojs/react");
    if (existingImport.status === "unsafe") return false;
    const importName =
      existingImport.status === "found"
        ? existingImport.localName
        : getAvailableIdentifier(
            content,
            ["react", "astroReact", "astroReactIntegration"],
            "astroReactIntegration",
          );
    const edits: TextEdit[] = [];
    if (existingImport.status === "missing") {
      edits.push({
        end: 0,
        start: 0,
        text: `import ${importName} from "@astrojs/react";\n`,
      });
    }
    addIntegrationEdit(edits, content, shape, importName, "\t");
    await fs.writeFile(configPath, applyTextEdits(content, edits), "utf-8");
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    p.log.error(highlighter.error(`Failed to setup Astro React integration: ${errorMessage}`));
    return false;
  }
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

function addIntegrationEdit(
  edits: TextEdit[],
  source: string,
  shape: AstroConfigShape,
  importName: string,
  indent: string,
): void {
  if (shape.integrations) {
    const range = getAstNodeRange(shape.integrations)!;
    const hasEntries = source.slice(range.start + 1, range.end - 1).trim().length > 0;
    edits.push({
      end: range.start + 1,
      start: range.start + 1,
      text: `${importName}()${hasEntries ? ", " : ""}`,
    });
    return;
  }
  const range = getAstNodeRange(shape.config)!;
  const objectBody = source.slice(range.start + 1, range.end - 1);
  const needsComma = objectBody.trim().length > 0 && !objectBody.trimEnd().endsWith(",");
  edits.push({
    end: range.end - 1,
    start: range.end - 1,
    text: `${needsComma ? "," : ""}\n${indent}integrations: [${importName}()],\n`,
  });
}

async function getAstroVersion(): Promise<string | null> {
  try {
    const pkg = await readJsonFile("package.json");
    if (pkg.dependencies?.astro) return pkg.dependencies.astro.replace(/^\^|~/, "");
    p.log.error(
      highlighter.error(
        "Astro seems not installed in your project, please check your package.json",
      ),
    );
    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    p.log.error(highlighter.error(`Failed to check Astro version: ${errorMessage}`));
    return null;
  }
}

export async function setupAstroConfig(): Promise<boolean> {
  try {
    let configPath = await findAstroConfig();
    let content: string;
    if (configPath) {
      content = await fs.readFile(configPath, "utf-8");
    } else {
      configPath = "astro.config.ts";
      content =
        'import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n';
    }

    const astroVersion = await getAstroVersion();
    const includeSvg = Boolean(astroVersion && semver.lt(astroVersion, "5.7.0"));
    const updated = updateAstroTailwindConfig(content, includeSvg);
    if (updated === null) return false;
    await fs.writeFile(configPath, updated, "utf-8");
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    p.log.error(highlighter.error(`Failed to setup Astro config: ${errorMessage}`));
    return false;
  }
}

export function updateAstroTailwindConfig(content: string, includeSvg: boolean): string | null {
  const module = parseSourceModule(content);
  if (!module) return null;
  const config = getAstDefaultExportCallObject(module, "defineConfig");
  if (!config) return null;
  const tailwindImport = getAstDefaultImportBinding(module, "@tailwindcss/vite");
  if (tailwindImport.status === "unsafe") return null;
  const tailwindName =
    tailwindImport.status === "found"
      ? tailwindImport.localName
      : getAvailableIdentifier(
          content,
          ["tailwindcss", "starwindTailwindcss"],
          "starwindTailwindcss",
        );
  const edits: TextEdit[] = [];
  if (tailwindImport.status === "missing") {
    edits.push({
      end: 0,
      start: 0,
      text: `import ${tailwindName} from "@tailwindcss/vite";\n`,
    });
  }

  const rootAdditions: string[] = [];
  if (includeSvg) {
    const experimentalProperty = getAstObjectProperty(config, "experimental");
    if (experimentalProperty.status === "unsafe") return null;
    if (experimentalProperty.status === "missing") {
      rootAdditions.push("experimental: {\n\t\tsvg: true,\n\t}");
    } else {
      const experimental = asAstObjectExpression(experimentalProperty.value);
      if (!experimental) return null;
      const svgProperty = getAstObjectProperty(experimental, "svg");
      if (svgProperty.status === "unsafe") return null;
      if (svgProperty.status === "missing") {
        const range = getAstNodeRange(experimental)!;
        edits.push({
          end: range.start + 1,
          start: range.start + 1,
          text: "\n\t\tsvg: true,",
        });
      }
    }
  }

  const viteProperty = getAstObjectProperty(config, "vite");
  if (viteProperty.status === "unsafe") return null;
  if (viteProperty.status === "missing") {
    rootAdditions.push(`vite: {\n\t\tplugins: [${tailwindName}()],\n\t}`);
  } else {
    const vite = asAstObjectExpression(viteProperty.value);
    if (!vite) return null;
    const pluginsProperty = getAstObjectProperty(vite, "plugins");
    if (pluginsProperty.status === "unsafe") return null;
    if (pluginsProperty.status === "missing") {
      const range = getAstNodeRange(vite)!;
      edits.push({
        end: range.start + 1,
        start: range.start + 1,
        text: `\n\t\tplugins: [${tailwindName}()],`,
      });
    } else {
      const plugins = asAstArrayExpression(pluginsProperty.value);
      if (!plugins) return null;
      if (!hasAstDirectCall(plugins, tailwindName)) {
        const range = getAstNodeRange(plugins)!;
        edits.push({
          end: range.start + 1,
          start: range.start + 1,
          text: `${tailwindName}(), `,
        });
      }
    }
  }

  if (rootAdditions.length > 0) {
    const range = getAstNodeRange(config)!;
    const body = content.slice(range.start + 1, range.end - 1);
    const needsComma = body.trim().length > 0 && !body.trimEnd().endsWith(",");
    edits.push({
      end: range.end - 1,
      start: range.end - 1,
      text: `${needsComma ? "," : ""}\n\t${rootAdditions.join(",\n\t")},\n`,
    });
  }
  return applyTextEdits(content, edits);
}

function applyTextEdits(source: string, edits: TextEdit[]): string {
  return [...edits]
    .sort((left, right) => right.start - left.start)
    .reduce(
      (result, edit) => result.slice(0, edit.start) + edit.text + result.slice(edit.end),
      source,
    );
}
