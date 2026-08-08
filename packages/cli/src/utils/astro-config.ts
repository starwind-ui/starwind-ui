import * as p from "@clack/prompts";
import fs from "fs-extra";
import semver from "semver";

import { readJsonFile } from "@/utils/fs.js";
import { highlighter } from "@/utils/highlighter.js";

import { fileExists } from "./fs.js";

const CONFIG_EXTENSIONS = ["ts", "js", "mjs", "cjs"] as const;
// type ConfigExtension = (typeof CONFIG_EXTENSIONS)[number];

/**
 * Finds the Astro config file in the current directory
 * @returns The path to the config file if found, null otherwise
 */
export async function findAstroConfig(): Promise<string | null> {
  for (const ext of CONFIG_EXTENSIONS) {
    const configPath = `astro.config.${ext}`;
    if (await fileExists(configPath)) {
      return configPath;
    }
  }
  return null;
}

export type AstroReactConfigReadiness =
  | { status: "ready" }
  | { status: "configurable" }
  | { status: "manual-action-required"; guidance: string };

type AstroConfigShape = {
  objectEnd: number;
  objectStart: number;
  integrations?: { arrayEnd: number; arrayStart: number };
};

const ASTRO_REACT_CONFIG_GUIDANCE =
  'Update the Astro config manually: import react from "@astrojs/react" and add react() to the integrations array.';
const ASTRO_REACT_KEY_GUIDANCE = `Starwind cannot safely update quoted or computed integrations keys. ${ASTRO_REACT_CONFIG_GUIDANCE}`;

export function inspectAstroReactConfig(content: string): AstroReactConfigReadiness {
  if (
    /["']integrations["']\s*:/.test(content) ||
    /\[\s*["']?integrations["']?\s*\]\s*:/.test(content)
  ) {
    return { status: "manual-action-required", guidance: ASTRO_REACT_KEY_GUIDANCE };
  }
  const importedName = stripJavaScriptComments(content).match(
    /^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+["']@astrojs\/react["']\s*;?/m,
  )?.[1];
  const shape = getAstroConfigShape(content);

  if (!shape) {
    return { status: "manual-action-required", guidance: ASTRO_REACT_CONFIG_GUIDANCE };
  }

  if (!shape.integrations) {
    return hasTopLevelIntegrationsShorthand(content, shape)
      ? { status: "manual-action-required", guidance: ASTRO_REACT_CONFIG_GUIDANCE }
      : { status: "configurable" };
  }

  if (importedName) {
    if (hasDirectIntegrationCall(content, shape.integrations, importedName)) {
      return { status: "ready" };
    }
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
      content = `import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n`;
    }

    const readiness = inspectAstroReactConfig(content);
    if (readiness.status === "ready") return true;
    if (readiness.status === "manual-action-required") return false;

    const shape = getAstroConfigShape(content);
    if (!shape) return false;

    const existingImport = stripJavaScriptComments(content).match(
      /^\s*import\s+([A-Za-z_$][\w$]*)\s+from\s+["']@astrojs\/react["']\s*;?/m,
    )?.[1];
    const importName = existingImport ?? getAvailableReactImportName(content);

    if (shape.integrations) {
      content =
        content.slice(0, shape.integrations.arrayStart + 1) +
        `${importName}()` +
        (content.slice(shape.integrations.arrayStart + 1, shape.integrations.arrayEnd).trim()
          ? ", "
          : "") +
        content.slice(shape.integrations.arrayStart + 1);
    } else {
      const objectBody = content.slice(shape.objectStart + 1, shape.objectEnd);
      const needsComma = objectBody.trim().length > 0 && !objectBody.trimEnd().endsWith(",");
      content =
        content.slice(0, shape.objectEnd) +
        `${needsComma ? "," : ""}\n\tintegrations: [${importName}()],\n` +
        content.slice(shape.objectEnd);
    }

    if (!existingImport) {
      content = `import ${importName} from "@astrojs/react";\n${content}`;
    }

    await fs.writeFile(configPath, content, "utf-8");
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    p.log.error(highlighter.error(`Failed to setup Astro React integration: ${errorMessage}`));
    return false;
  }
}

function getAstroConfigShape(source: string): AstroConfigShape | undefined {
  const masked = maskNonCode(source);
  if (!masked) return undefined;
  const defineConfigMatch = /\bexport\s+default\s+defineConfig\s*\(\s*\{/.exec(masked);
  if (!defineConfigMatch) return undefined;
  const objectStart = masked.indexOf("{", defineConfigMatch.index);
  const objectEnd = findMatchingDelimiter(masked, objectStart, "{", "}");
  if (objectEnd < 0) return undefined;
  if (masked.slice(objectEnd + 1).trimStart()[0] !== ")") return undefined;
  if (hasTopLevelToken(masked, objectStart, objectEnd, "...")) return undefined;
  if (hasTopLevelComputedKey(masked, objectStart, objectEnd)) return undefined;

  const property = findTopLevelProperty(masked, objectStart, objectEnd, "integrations");
  if (!property) return { objectStart, objectEnd };
  const arrayStart = skipWhitespace(masked, property.valueStart);
  if (masked[arrayStart] !== "[") return undefined;
  const arrayEnd = findMatchingDelimiter(masked, arrayStart, "[", "]");
  if (arrayEnd < 0 || arrayEnd > objectEnd) return undefined;
  return { objectStart, objectEnd, integrations: { arrayStart, arrayEnd } };
}

function hasDirectIntegrationCall(
  source: string,
  integrations: { arrayEnd: number; arrayStart: number },
  importedName: string,
): boolean {
  const masked = maskNonCode(source);
  if (!masked) return false;
  const entryRanges: Array<{ end: number; start: number }> = [];
  let entryStart = integrations.arrayStart + 1;
  let braces = 0;
  let brackets = 0;
  let parentheses = 0;

  for (let index = entryStart; index < integrations.arrayEnd; index += 1) {
    const character = masked[index];
    if (character === "{") braces += 1;
    if (character === "}") braces -= 1;
    if (character === "[") brackets += 1;
    if (character === "]") brackets -= 1;
    if (character === "(") parentheses += 1;
    if (character === ")") parentheses -= 1;
    if (character === "," && braces === 0 && brackets === 0 && parentheses === 0) {
      entryRanges.push({ start: entryStart, end: index });
      entryStart = index + 1;
    }
  }
  entryRanges.push({ start: entryStart, end: integrations.arrayEnd });

  return entryRanges.some(({ start, end }) => {
    const entry = masked.slice(start, end);
    const leadingWhitespace = entry.length - entry.trimStart().length;
    const callStart = start + leadingWhitespace;
    const callMatch = new RegExp(`^${escapeRegExp(importedName)}\\s*\\(`).exec(
      masked.slice(callStart, end),
    );
    if (!callMatch) return false;
    const openParen = masked.indexOf("(", callStart + importedName.length);
    const closeParen = findMatchingDelimiter(masked, openParen, "(", ")");
    return closeParen >= 0 && closeParen < end && masked.slice(closeParen + 1, end).trim() === "";
  });
}

function hasTopLevelToken(
  masked: string,
  objectStart: number,
  objectEnd: number,
  token: string,
): boolean {
  let index = masked.indexOf(token, objectStart + 1);
  while (index >= 0 && index < objectEnd) {
    if (getObjectDepth(masked, objectStart, index) === 1) return true;
    index = masked.indexOf(token, index + token.length);
  }
  return false;
}

function hasTopLevelComputedKey(masked: string, objectStart: number, objectEnd: number): boolean {
  for (let index = objectStart + 1; index < objectEnd; index += 1) {
    if (masked[index] !== "[" || getObjectDepth(masked, objectStart, index) !== 1) continue;
    let previous = index - 1;
    while (previous > objectStart && /\s/.test(masked[previous] ?? "")) previous -= 1;
    if (masked[previous] === "{" || masked[previous] === ",") return true;
  }
  return false;
}

function findTopLevelProperty(
  masked: string,
  objectStart: number,
  objectEnd: number,
  propertyName: string,
): { valueStart: number } | undefined {
  const matcher = new RegExp(`\\b${propertyName}\\s*:`, "g");
  matcher.lastIndex = objectStart + 1;
  for (
    let match = matcher.exec(masked);
    match && match.index < objectEnd;
    match = matcher.exec(masked)
  ) {
    if (getObjectDepth(masked, objectStart, match.index) === 1) {
      return { valueStart: match.index + match[0].length };
    }
  }
  return undefined;
}

function hasTopLevelIntegrationsShorthand(source: string, shape: AstroConfigShape): boolean {
  const masked = maskNonCode(source);
  if (!masked) return true;
  const matcher = /\bintegrations\b/g;
  matcher.lastIndex = shape.objectStart + 1;
  for (
    let match = matcher.exec(masked);
    match && match.index < shape.objectEnd;
    match = matcher.exec(masked)
  ) {
    if (getObjectDepth(masked, shape.objectStart, match.index) === 1) return true;
  }
  return false;
}

function getObjectDepth(source: string, start: number, end: number): number {
  let depth = 0;
  for (let index = start; index < end; index += 1) {
    if (source[index] === "{") depth += 1;
    if (source[index] === "}") depth -= 1;
  }
  return depth;
}

function findMatchingDelimiter(
  source: string,
  start: number,
  open: "{" | "[" | "(",
  close: "}" | "]" | ")",
): number {
  let depth = 0;
  for (let index = start; index < source.length; index += 1) {
    if (source[index] === open) depth += 1;
    if (source[index] === close) {
      depth -= 1;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function skipWhitespace(source: string, start: number): number {
  let index = start;
  while (/\s/.test(source[index] ?? "")) index += 1;
  return index;
}

function getAvailableReactImportName(source: string): string {
  const identifiers = new Set(source.match(/[A-Za-z_$][\w$]*/g) ?? []);
  for (const candidate of ["react", "astroReact", "astroReactIntegration"]) {
    if (!identifiers.has(candidate)) return candidate;
  }
  let suffix = 2;
  while (identifiers.has(`astroReactIntegration${suffix}`)) suffix += 1;
  return `astroReactIntegration${suffix}`;
}

function maskNonCode(source: string): string | undefined {
  let result = "";
  let quote: '"' | "'" | "`" | undefined;
  for (let index = 0; index < source.length; index += 1) {
    const character = source[index]!;
    const next = source[index + 1];
    if (quote) {
      result += character === "\n" ? "\n" : " ";
      if (character === "\\") {
        index += 1;
        if (index < source.length) result += " ";
      } else if (character === quote) quote = undefined;
      continue;
    }
    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      result += " ";
      continue;
    }
    if (character === "/" && next === "/") {
      result += "  ";
      index += 2;
      while (index < source.length && source[index] !== "\n") {
        result += " ";
        index += 1;
      }
      if (index < source.length) result += "\n";
      continue;
    }
    if (character === "/" && next === "*") {
      result += "  ";
      index += 2;
      while (index < source.length) {
        if (source[index] === "*" && source[index + 1] === "/") {
          result += "  ";
          index += 1;
          break;
        }
        result += source[index] === "\n" ? "\n" : " ";
        index += 1;
      }
      continue;
    }
    if (character === "/") return undefined;
    result += character;
  }
  return result;
}

function stripJavaScriptComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Gets the installed Astro version from the project's package.json
 * @returns The installed Astro version or null if not found
 */
async function getAstroVersion(): Promise<string | null> {
  try {
    const pkg = await readJsonFile("package.json");
    if (pkg.dependencies?.astro) {
      const astroVersion = pkg.dependencies.astro.replace(/^\^|~/, "");
      return astroVersion;
    }

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

/**
 * Updates or creates the Astro configuration file
 * @returns true if successful, false otherwise
 */
export async function setupAstroConfig(): Promise<boolean> {
  try {
    let configPath = await findAstroConfig();
    let content = "";

    if (configPath) {
      content = await fs.readFile(configPath, "utf-8");
    } else {
      configPath = "astro.config.ts";
      content = `import { defineConfig } from "astro/config";\n\nexport default defineConfig({});\n`;
    }

    // Add tailwindcss import if not present
    if (!content.includes('import tailwindcss from "@tailwindcss/vite"')) {
      content = `import tailwindcss from "@tailwindcss/vite";\n${content}`;
    }

    // Parse the configuration object
    const configStart = content.indexOf("defineConfig(") + "defineConfig(".length;
    const configEnd = content.lastIndexOf(");");
    let config = content.slice(configStart, configEnd);

    // Remove outer braces and trim
    config = config.trim().replace(/^{|}$/g, "").trim();

    const astroVersion = await getAstroVersion();

    if (astroVersion && semver.lt(astroVersion, "5.7.0")) {
      // Add experimental configuration
      if (!config.includes("experimental")) {
        // Ensure there's a comma before adding new property if config is not empty
        const needsComma = config.length > 0 && !config.trimEnd().endsWith(",");
        config +=
          (needsComma ? "," : "") +
          `\n\texperimental: {
		svg: true,
	},`;
      } else if (!config.includes("svg: true") && !config.includes("svg: {")) {
        // Insert svg config into existing experimental block
        const expEnd = config.indexOf("experimental:") + "experimental:".length;
        const blockStart = config.indexOf("{", expEnd) + 1;
        config = config.slice(0, blockStart) + `\n\t\tsvg: true,` + config.slice(blockStart);
      }
    }

    // Add vite configuration
    if (!config.includes("vite:")) {
      // Ensure there's a comma before adding new property if config is not empty
      const needsComma = config.length > 0 && !config.trimEnd().endsWith(",");
      config +=
        (needsComma ? "," : "") +
        `\n\tvite: {
		plugins: [tailwindcss()],
	},`;
    } else if (!config.includes("plugins: [")) {
      // Insert plugins into existing vite block
      const viteEnd = config.indexOf("vite:") + "vite:".length;
      const blockStart = config.indexOf("{", viteEnd) + 1;
      config =
        config.slice(0, blockStart) + `\n\t\tplugins: [tailwindcss()],` + config.slice(blockStart);
    } else if (!config.includes("tailwindcss()")) {
      // Add tailwindcss to existing plugins array
      const pluginsStart = config.indexOf("plugins:") + "plugins:".length;
      const arrayStart = config.indexOf("[", pluginsStart) + 1;
      config = config.slice(0, arrayStart) + `tailwindcss(), ` + config.slice(arrayStart);
    }

    // Reconstruct the file content
    const newContent = `${content.slice(0, configStart)}{\n\t${config}\n}${content.slice(configEnd)}`;

    await fs.writeFile(configPath, newContent, "utf-8");
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    p.log.error(highlighter.error(`Failed to setup Astro config: ${errorMessage}`));
    return false;
  }
}
