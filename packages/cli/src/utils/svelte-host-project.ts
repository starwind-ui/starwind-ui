import path from "node:path";
import fs from "fs-extra";
import semver from "semver";

import { updateAstroTailwindConfig } from "./astro-config.js";
import { MIN_ASTRO_VERSION, PATHS } from "./constants.js";
import type { HostEvidence, ProjectPackage } from "./host-planner.js";
import type { HostProjectPlanBase } from "./host-project.js";
import { LAYOUT_PATHS } from "./layout.js";
import { resolveProjectMutationPath } from "./project-path.js";
import {
  type AstCallExpression,
  type AstNode,
  type AstStringLiteral,
  asAstArrayExpression,
  asAstObjectExpression,
  getAstDefaultExportObject,
  getAstDefaultImportBinding,
  getAstDirectCall,
  getAstIdentifierName,
  getAstNamedImportBinding,
  getAstNodeRange,
  getAstObjectProperty,
  getAvailableIdentifier,
  parseSourceModule,
} from "./source-shape.js";
import { createVuePackageRequirementPlanner, isCompatiblePublishedRange } from "./vue-project.js";

const VITE_CONFIG_PATHS = [
  "vite.config.ts",
  "vite.config.js",
  "vite.config.mts",
  "vite.config.mjs",
] as const;
const ASTRO_CONFIG_PATHS = ["astro.config.ts", "astro.config.js", "astro.config.mjs"] as const;
const MAIN_PATHS = ["src/main.ts", "src/main.js"] as const;
const KIT_CONFIG_PATHS = ["svelte.config.js", "svelte.config.ts"] as const;
const KIT_LAYOUT = "src/routes/+layout.svelte";

export function getSvelteHostEvidenceRequests(): Array<{ path: string; readContent: boolean }> {
  return [
    ...VITE_CONFIG_PATHS,
    ...ASTRO_CONFIG_PATHS,
    ...MAIN_PATHS,
    ...KIT_CONFIG_PATHS,
    ...LAYOUT_PATHS,
    KIT_LAYOUT,
    "src/App.svelte",
    "src/app.html",
    "src/routes",
  ].map((path) => ({
    path,
    readContent: path !== "src/routes",
  }));
}

type SvelteHostKind = "vite" | "sveltekit" | "astro";
export type SvelteHostProjectPlan = Readonly<
  HostProjectPlanBase & {
    hostKind: SvelteHostKind;
    isSecondaryTarget: boolean;
    projectFramework: "astro" | "svelte";
    validateChoices: (choices: { componentDir: string; cssFile: string }) => Promise<void>;
  }
>;
export type SvelteHostProjectDetection =
  | { status: "detected"; plan: SvelteHostProjectPlan; readiness: "ready" }
  | { status: "failed"; diagnostic: string; host: { kind: SvelteHostKind; label: string } };

export function detectSvelteHostProject(
  pkg: ProjectPackage,
  evidence: HostEvidence,
  hostKind: string,
): SvelteHostProjectDetection | undefined {
  const declarations = [
    pkg.dependencies,
    pkg.devDependencies,
    pkg.optionalDependencies,
    pkg.peerDependencies,
  ];
  const deps = Object.assign({}, ...declarations.slice().reverse()) as Record<string, string>;
  if (
    !deps.svelte &&
    !deps["@sveltejs/kit"] &&
    !deps["@astrojs/svelte"] &&
    !deps["@sveltejs/vite-plugin-svelte"]
  )
    return undefined;
  const kind: SvelteHostKind =
    hostKind === "astro" ? "astro" : deps["@sveltejs/kit"] ? "sveltekit" : "vite";
  const label = kind === "astro" ? "Astro" : kind === "sveltekit" ? "SvelteKit" : "Vite Svelte";
  try {
    const svelteRanges = declarations.flatMap((field) => (field?.svelte ? [field.svelte] : []));
    if (
      !svelteRanges.length ||
      svelteRanges.some((range) => !isCompatiblePublishedRange(range, ">=5.29.0 <6"))
    ) {
      throw new Error(
        "Declare a Svelte range within >=5.29.0 <6 before running Svelte 5 beta initialization.",
      );
    }
    let configPath: string;
    let entryPath: string;
    let kitConfigPath: string | undefined;
    if (kind === "astro") {
      const astroRanges = declarations.flatMap((field) => (field?.astro ? [field.astro] : []));
      if (
        !astroRanges.length ||
        astroRanges.some((range) => !isCompatiblePublishedRange(range, `>=${MIN_ASTRO_VERSION}`))
      ) {
        throw new Error(
          `Configure Astro ${MIN_ASTRO_VERSION} or later before initializing Svelte. Framework upgrades require a separate step.`,
        );
      }
      if (!deps["@astrojs/svelte"])
        throw new Error(
          "Configure the official @astrojs/svelte integration before initializing Svelte in Astro.",
        );
      configPath = selectPath(ASTRO_CONFIG_PATHS, evidence, "Astro config");
      entryPath = LAYOUT_PATHS.find((candidate) => evidence.existingPaths.has(candidate)) ?? "";
      if (!entryPath)
        throw new Error(
          "Svelte in Astro requires src/layouts/Layout.astro or src/layouts/BaseLayout.astro for the stylesheet import.",
        );
    } else {
      if (!deps.vite) throw new Error("The Svelte host must declare Vite before initialization.");
      configPath = selectPath(VITE_CONFIG_PATHS, evidence, "Vite config");
      if (kind === "sveltekit") {
        kitConfigPath = selectPath(KIT_CONFIG_PATHS, evidence, "SvelteKit config");
        validateKitRoutes(evidence.projectFiles?.[kitConfigPath] ?? "");
        if (
          !evidence.existingPaths.has("src/routes") ||
          !evidence.existingPaths.has("src/app.html")
        )
          throw new Error("SvelteKit requires src/routes and src/app.html before initialization.");
        entryPath = KIT_LAYOUT;
      } else {
        if (!deps["@sveltejs/vite-plugin-svelte"])
          throw new Error(
            "Configure the official @sveltejs/vite-plugin-svelte plugin before initialization.",
          );
        entryPath = selectPath(MAIN_PATHS, evidence, "Svelte src/main entry");
        if (!evidence.existingPaths.has("src/App.svelte"))
          throw new Error("The Vite Svelte host requires src/App.svelte before initialization.");
      }
    }
    const configContent = evidence.projectFiles?.[configPath];
    if (configContent === undefined)
      throw new Error(`Read ${configPath} before planning Svelte 5 beta initialization.`);
    projectConfig(configContent, kind, deps.astro);
    const initialEntry = evidence.projectFiles?.[entryPath];
    if (
      initialEntry === undefined &&
      !(kind === "sveltekit" && !evidence.existingPaths.has(entryPath))
    )
      throw new Error(`Read ${entryPath} before planning Svelte 5 beta initialization.`);
    projectEntry(initialEntry, entryPath, PATHS.LOCAL_CSS_FILE, kind);
    const requirements = createVuePackageRequirementPlanner(pkg);
    const readChanges = async (cssFile: string) => {
      if (kitConfigPath) validateKitRoutes(await fs.readFile(kitConfigPath, "utf8"));
      const config = await fs.readFile(await resolveProjectMutationPath(configPath), "utf8");
      const entryDestination = await resolveProjectMutationPath(entryPath);
      const entry = (await fs.pathExists(entryDestination))
        ? await fs.readFile(entryDestination, "utf8")
        : undefined;
      if (entry === undefined && kind !== "sveltekit")
        throw new Error(`The required host entry ${entryPath} is missing.`);
      return [
        { path: configPath, before: config, after: projectConfig(config, kind, deps.astro) },
        { path: entryPath, before: entry, after: projectEntry(entry, entryPath, cssFile, kind) },
      ];
    };
    return {
      status: "detected",
      readiness: "ready",
      plan: Object.freeze({
        componentDir:
          kind === "astro"
            ? "src/components/starwind-svelte"
            : kind === "sveltekit"
              ? "src/lib/starwind"
              : "src/components/starwind",
        cssFile: PATHS.LOCAL_CSS_FILE,
        hostKind: kind,
        hostLabel: label,
        isSecondaryTarget: kind === "astro",
        projectFramework: kind === "astro" ? "astro" : "svelte",
        prepare: async () => ({ status: "prepared" as const }),
        prepareStylesheet: (content: string) => content,
        requirements,
        setup: async (cssFile: string) => {
          const changes = await readChanges(cssFile);
          for (const change of changes) {
            if (change.before === change.after) continue;
            const destination = await resolveProjectMutationPath(change.path);
            await fs.ensureDir(path.dirname(destination));
            await fs.writeFile(destination, change.after, "utf8");
          }
        },
        setupLabel: `Configure ${label} styles`,
        setupResult: `${label} styles configured`,
        setupTypeScript: async () => true,
        utilsDir: "src/lib/utils",
        validate: async () => {
          await readChanges(PATHS.LOCAL_CSS_FILE);
        },
        validateChoices: async ({
          componentDir,
          cssFile,
        }: {
          componentDir: string;
          cssFile: string;
        }) => {
          if (!cssFile.endsWith(".css"))
            throw new Error("The Starwind stylesheet path must end in .css.");
          for (const file of [componentDir, cssFile, "package.json", "starwind.config.json"])
            await resolveProjectMutationPath(file);
          await readChanges(cssFile);
        },
      }),
    };
  } catch (error) {
    return {
      status: "failed",
      host: { kind, label },
      diagnostic: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Reject configured route directories that would leave the default root layout unused. */
function validateKitRoutes(content: string): void {
  const module = parseSourceModule(content);
  if (!module) throw new Error("The SvelteKit config must parse before initialization.");
  let object = getAstDefaultExportObject(module);
  if (!object) {
    const exported = module.body.find((node) => node.type === "ExportDefaultDeclaration") as
      | (AstNode & { declaration: AstNode })
      | undefined;
    const name = exported && getAstIdentifierName(exported.declaration);
    if (name) {
      for (const node of module.body) {
        if (node.type !== "VariableDeclaration") continue;
        const declaration = node as AstNode & {
          declarations: Array<{ id: AstNode; init: AstNode | null }>;
        };
        const binding = declaration.declarations.find(
          (entry) => getAstIdentifierName(entry.id) === name,
        );
        if (binding?.init) object = asAstObjectExpression(binding.init);
      }
    }
  }
  const unsupportedConfig = () =>
    new Error(
      "Private SvelteKit initialization requires a plain config object with an optional plain kit object. Resolve config spreads and kit bindings before initialization.",
    );
  if (!object) throw unsupportedConfig();
  const kitProperty = getAstObjectProperty(object, "kit");
  if (kitProperty.status === "missing") return;
  if (kitProperty.status === "unsafe") throw unsupportedConfig();
  const kit = asAstObjectExpression(kitProperty.value);
  if (!kit) throw unsupportedConfig();
  const filesProperty = getAstObjectProperty(kit, "files");
  if (filesProperty.status === "missing") return;
  const files = filesProperty.status === "found" && asAstObjectExpression(filesProperty.value);
  const routes = files && getAstObjectProperty(files, "routes", { allowStringKey: true });
  if (routes && routes.status === "missing") return;
  if (
    routes &&
    routes.status === "found" &&
    routes.value.type === "StringLiteral" &&
    path.posix.normalize((routes.value as AstStringLiteral).value) === "src/routes"
  )
    return;
  throw new Error(
    "Private SvelteKit initialization requires kit.files.routes to use src/routes. Configure the default route directory before initialization.",
  );
}

function selectPath(paths: readonly string[], evidence: HostEvidence, label: string): string {
  const matches = paths.filter((candidate) => evidence.existingPaths.has(candidate));
  if (matches.length !== 1)
    throw new Error(
      `Expected one ${label}; found ${matches.length}. Keep one supported host entry before initialization.`,
    );
  return matches[0]!;
}

function projectConfig(content: string, kind: SvelteHostKind, astroRange?: string): string {
  const module = parseSourceModule(content);
  const configImport =
    module &&
    getAstNamedImportBinding(module, kind === "astro" ? "astro/config" : "vite", "defineConfig");
  const object =
    module &&
    getAstDefaultExportObject(
      module,
      configImport?.status === "found" ? configImport.localName : undefined,
    );
  const plugin =
    module &&
    (kind === "astro"
      ? getAstDefaultImportBinding(module, "@astrojs/svelte")
      : getAstNamedImportBinding(
          module,
          kind === "sveltekit" ? "@sveltejs/kit/vite" : "@sveltejs/vite-plugin-svelte",
          kind === "sveltekit" ? "sveltekit" : "svelte",
        ));
  const property =
    object && getAstObjectProperty(object, kind === "astro" ? "integrations" : "plugins");
  const plugins = property?.status === "found" ? asAstArrayExpression(property.value) : undefined;
  if (
    !module ||
    !object ||
    plugin?.status !== "found" ||
    !plugins ||
    !plugins.elements.every(
      (node) =>
        node?.type === "ObjectExpression" ||
        (node?.type === "CallExpression" &&
          getAstIdentifierName((node as AstCallExpression).callee)),
    ) ||
    !getAstDirectCall(plugins, plugin.localName)
  ) {
    throw new Error(
      `The ${kind} config requires a direct object export or object-style defineConfig with its configured official Svelte plugin. Resolve dynamic, duplicate, or missing plugin entries before initialization.`,
    );
  }
  if (kind === "astro") {
    const minimum = astroRange && semver.minVersion(astroRange);
    const updated = updateAstroTailwindConfig(
      content,
      Boolean(minimum && semver.lt(minimum, "5.7.0")),
      { configuredObjectExport: true },
    );
    if (updated === null)
      throw new Error(
        "The Astro Vite options need an object with a plugins array before Tailwind can be configured.",
      );
    return updated;
  }
  const tailwind = getAstDefaultImportBinding(module, "@tailwindcss/vite");
  if (tailwind.status === "unsafe")
    throw new Error("Use one default import from @tailwindcss/vite in the Svelte host config.");
  const name =
    tailwind.status === "found"
      ? tailwind.localName
      : getAvailableIdentifier(
          content,
          ["tailwindcss", "starwindTailwindcss"],
          "starwindTailwindcss",
        );
  const tailwindCalls = plugins.elements.filter(
    (node) =>
      node?.type === "CallExpression" &&
      (node as AstNode & { callee: { name?: string } }).callee.name === name,
  );
  if (tailwindCalls.length > 1)
    throw new Error("Keep one Tailwind plugin entry in the Svelte host config.");
  if (tailwind.status === "found" && tailwindCalls.length === 1) return content;
  const range = getAstNodeRange(plugins)!;
  const updated =
    content.slice(0, range.start + 1) + `${name}(), ` + content.slice(range.start + 1);
  return tailwind.status === "found"
    ? updated
    : `import ${name} from "@tailwindcss/vite";\n${updated}`;
}

function projectEntry(
  content: string | undefined,
  entryPath: string,
  cssFile: string,
  kind: SvelteHostKind,
): string {
  if (kind === "sveltekit") return addSvelteLayoutCssImport(content, entryPath, cssFile);
  if (content === undefined) throw new Error(`The host entry ${entryPath} is missing.`);
  if (kind === "vite") return addScriptCssImport(content, entryPath, cssFile);
  const opening = /^---\r?\n/.exec(content);
  if (!opening) return `---\n${addScriptCssImport("", entryPath, cssFile)}---\n\n${content}`;
  const ending = /^---\s*$/gm;
  ending.lastIndex = opening[0].length;
  const closing = ending.exec(content);
  if (!closing)
    throw new Error("Close the Astro layout frontmatter before initializing Svelte styles.");
  const script = content.slice(opening[0].length, closing.index);
  const updated = addScriptCssImport(script, entryPath, cssFile);
  return content.slice(0, opening[0].length) + updated + content.slice(closing.index);
}

function addScriptCssImport(content: string, entryPath: string, cssFile: string): string {
  const module = parseSourceModule(content);
  if (!module)
    throw new Error(
      `The script in ${entryPath} must parse before adding the Starwind stylesheet import.`,
    );
  const relative = path.posix.relative(
    path.posix.dirname(entryPath),
    cssFile.replaceAll("\\", "/"),
  );
  const source = relative.startsWith(".") ? relative : `./${relative}`;
  const imports = module.body.filter((node) => node.type === "ImportDeclaration") as Array<
    AstNode & { source: AstStringLiteral }
  >;
  if (
    imports.some(
      (entry) =>
        entry.source.value.startsWith(".") &&
        path.posix.normalize(path.posix.join(path.posix.dirname(entryPath), entry.source.value)) ===
          path.posix.normalize(cssFile),
    )
  )
    return content;
  return `import ${JSON.stringify(source)};\n${content}`;
}

/** Locate actual script tags while skipping comments, attributes, and template expressions. */
export function addSvelteLayoutCssImport(
  content: string | undefined,
  entryPath: string,
  cssFile: string,
): string {
  if (content === undefined)
    return `<script>\n${addScriptCssImport("", entryPath, cssFile)}  let { children } = $props();\n</script>\n\n{@render children()}\n`;
  const scripts: Array<{ start: number; end: number; module: boolean }> = [];
  let offset = 0;
  while (offset < content.length) {
    if (content.startsWith("<!--", offset)) {
      const end = content.indexOf("-->", offset + 4);
      if (end < 0) throw new Error("Close the Svelte layout comment before initialization.");
      offset = end + 3;
      continue;
    }
    if (content[offset] === "{") {
      const closingBlock = /^\{\/(?:if|each|await|key|snippet)\s*\}/.exec(content.slice(offset));
      if (closingBlock) {
        offset += closingBlock[0].length;
        continue;
      }
      offset = skipSvelteExpression(content, offset);
      continue;
    }
    if (content[offset] !== "<" || !/^<\/?[a-zA-Z]/.test(content.slice(offset))) {
      offset++;
      continue;
    }
    const opening = /^<script\b([^>]*)>/.exec(content.slice(offset));
    if (!opening) {
      if (/^<style\b/.test(content.slice(offset))) {
        const closing = /<\/style\s*>/g;
        closing.lastIndex = offset;
        const end = closing.exec(content);
        if (!end) throw new Error("Close the Svelte layout style block before initialization.");
        offset = end.index + end[0].length;
      } else offset = skipMarkupTag(content, offset);
      continue;
    }
    const attributes = opening[1]!;
    const moduleScript = /(?:^|\s)module(?:\s|$)|\bcontext\s*=\s*["']module["']/.test(attributes);
    const remaining = attributes
      .replace(/\blang\s*=\s*["'](?:ts|js)["']/g, "")
      .replace(/\bcontext\s*=\s*["']module["']/g, "")
      .replace(/\bmodule\b/g, "")
      .trim();
    if (remaining || scripts.some((script) => script.module === moduleScript))
      throw new Error(
        "Use one instance script and one optional module script in the Svelte layout.",
      );
    const start = offset + opening[0].length;
    const closing = /<\/script\s*>/g;
    closing.lastIndex = start;
    let ending: RegExpExecArray | null;
    do {
      ending = closing.exec(content);
    } while (ending && !parseSourceModule(content.slice(start, ending.index)));
    if (!ending) throw new Error("The Svelte layout script must parse before initialization.");
    scripts.push({ start, end: ending.index, module: moduleScript });
    offset = ending.index + ending[0].length;
  }
  for (const script of scripts) {
    const source = content.slice(script.start, script.end);
    if (addScriptCssImport(source, entryPath, cssFile) === source) return content;
  }
  const instance = scripts.find((script) => !script.module);
  if (!instance)
    return `<script>\n${addScriptCssImport("", entryPath, cssFile)}</script>\n${content}`;
  return (
    content.slice(0, instance.start) +
    "\n" +
    addScriptCssImport(content.slice(instance.start, instance.end), entryPath, cssFile) +
    content.slice(instance.end)
  );
}

function skipQuoted(source: string, start: number): number {
  const quote = source[start];
  for (let cursor = start + 1; cursor < source.length; cursor++) {
    if (source[cursor] === "\\") {
      cursor++;
      continue;
    }
    if (quote === "`" && source.startsWith("${", cursor)) {
      cursor = skipSvelteExpression(source, cursor + 1) - 1;
      continue;
    }
    if (source[cursor] === quote) return cursor + 1;
  }
  throw new Error("Close the quoted value in the Svelte layout before initialization.");
}

function skipMarkupTag(source: string, start: number): number {
  for (let cursor = start + 1; cursor < source.length; cursor++) {
    if (source[cursor] === '"' || source[cursor] === "'") {
      cursor = skipQuoted(source, cursor) - 1;
      continue;
    }
    if (source[cursor] === "{") {
      cursor = skipSvelteExpression(source, cursor) - 1;
      continue;
    }
    if (source[cursor] === ">") return cursor + 1;
  }
  throw new Error("Close the Svelte layout tag before initialization.");
}

function skipSvelteExpression(source: string, start: number): number {
  let depth = 1;
  for (let cursor = start + 1; cursor < source.length; cursor++) {
    const character = source[cursor];
    if (character === '"' || character === "'" || character === "`") {
      cursor = skipQuoted(source, cursor) - 1;
      continue;
    }
    if (source.startsWith("/*", cursor)) {
      const end = source.indexOf("*/", cursor + 2);
      if (end < 0) throw new Error("Close the Svelte expression comment before initialization.");
      cursor = end + 1;
      continue;
    }
    if (source.startsWith("//", cursor)) {
      const end = source.indexOf("\n", cursor + 2);
      if (end < 0) throw new Error("Close the Svelte expression before initialization.");
      cursor = end;
      continue;
    }
    // A regexp can contain braces and tag text. Require a simpler expression for safe edits.
    if (character === "/" && /[({[=,:!?]$/.test(source.slice(start, cursor).trimEnd())) {
      throw new Error(
        "Move the regular expression from Svelte markup into a script before initializing styles.",
      );
    }
    if (character === "{") depth++;
    if (character === "}" && --depth === 0) return cursor + 1;
  }
  throw new Error("Close the Svelte template expression before initialization.");
}
