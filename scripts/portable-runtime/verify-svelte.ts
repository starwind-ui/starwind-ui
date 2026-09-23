import { execFile, spawn } from "node:child_process";
import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { starwindStyledContracts } from "./contracts/styled/starwind.js";
import {
  getImplementedSvelteStyledRoots,
  svelteInventory,
} from "./renderers/framework-adapters/svelte/inventory.js";
import {
  analyzeStyledOutputGroup,
  projectStyledOutputComponentGroup,
} from "./renderers/styled-output-model/index.js";

const execute = promisify(execFile);
const home = "scripts/portable-runtime/renderers/framework-adapters/svelte/";
const proof = "scripts/portable-runtime/tests/generate-svelte-proof/";
const styled = "scripts/portable-runtime/tests/generate-svelte-styled/";
const primitiveEntries = new Map<string, { component: string; testOwner: string }>(
  svelteInventory.primitives.map((entry) => [entry.component, entry]),
);
const styledEntries = new Map<string, { component: string; testOwner: string; demoOwner: string }>(
  svelteInventory.styled
    .filter((entry) => entry.status === "implemented")
    .map((entry) => [entry.component, entry]),
);
const styledRoots = getImplementedSvelteStyledRoots();
const portalInputs = new Set([
  "apps/svelte-demo/src/lib/review/PortalCompositions.svelte",
  "apps/svelte-demo/src/routes/review/portals/+page.svelte",
  "apps/svelte-demo/tests/portal-compositions.mjs",
]);
// Styled roots imported by the existing PortalCompositions.svelte review owner.
const portalStyledRoots = [
  "button",
  "color-picker",
  "select",
  "dialog",
  "sheet",
  "popover",
  "dropdown",
];

// These are printer ownership facts. Shared imports expand through the source dependency graph.
const printers: Record<string, readonly string[]> = {
  "color-picker": ["color-picker"],
  sidebar: ["sidebar"],
  "action-surface": ["button"],
  "boolean-form-control": ["checkbox"],
  "native-overlay": ["dialog", "alert-dialog", "drawer"],
  "option-collection-overlay": ["select"],
  "repeated-disclosure": ["accordion"],
  "range-control": ["slider"],
  "engine-viewport": ["carousel"],
  "notification-system": ["toast"],
  "media-status": ["avatar"],
  "range-status": ["progress"],
  "viewport-measurement": ["scroll-area"],
  "disclosure-presence": ["collapsible"],
  "native-input-value": ["input"],
  "native-disabled": ["fieldset"],
  "form-field-coordinator": ["form"],
  switch: ["switch"],
  "checkbox-group": ["checkbox-group"],
  radio: ["radio"],
  "radio-group": ["radio-group"],
  toggle: ["toggle"],
  "toggle-group": ["toggle-group"],
  "field-composition": ["field"],
  "file-drop-control": ["dropzone"],
  "hidden-input-visual-slot": ["input-otp"],
  "controlled-value-presence": ["tabs"],
  "presence-floating-overlay": ["popover"],
  "timed-floating-overlay": ["tooltip", "preview-card"],
  "composite-menu-overlay": ["menu"],
  "anchored-menu-overlay": ["context-menu"],
  "shared-viewport-navigation": ["navigation-menu"],
  "editable-collection-overlay": ["combobox"],
  "manual-primitives": ["theme"],
};
const styledForPrimitive: Record<string, string> = {
  drawer: "sheet",
  "preview-card": "hover-card",
  menu: "dropdown",
  radio: "radio-group",
  fieldset: "form",
  theme: "theme-toggle",
  carousel: "carousel",
  toast: "toast",
};

export interface SvelteSelection {
  primitives: string[];
  styled: string[];
  tests: string[];
  demo: string[];
  layout: boolean;
  portalCompositions: boolean;
  package: boolean;
  generator: boolean;
  all: boolean;
  reasons: string[];
  additional: string[];
}

async function testFiles(repo: string): Promise<string[]> {
  const names = await Promise.all(
    [proof, styled].map(async (directory) =>
      (await readdir(path.join(repo, directory)))
        .filter((name) => /\.test\.ts$/.test(name))
        .map((name) => directory + name),
    ),
  );
  return names.flat();
}

function dependencyReader(repo: string) {
  const cache = new Map<string, Promise<string[]>>();
  function imports(file: string) {
    if (!cache.has(file))
      cache.set(
        file,
        readFile(path.join(repo, file), "utf8")
          .then((source) =>
            [...source.matchAll(/(?:from\s*|import\s*)["'](\.[^"']+)["']/g)]
              .map((match) =>
                path.posix.normalize(
                  path.posix.join(path.posix.dirname(file), match[1]!.replace(/\.js$/, ".ts")),
                ),
              )
              .filter(
                (name) =>
                  name.endsWith(".ts") &&
                  (name.startsWith(home) ||
                    name.startsWith("packages/svelte/tests/") ||
                    name.startsWith(proof) ||
                    name.startsWith(styled)),
              ),
          )
          .catch((error: NodeJS.ErrnoException) => {
            if (error.code === "ENOENT") return [];
            throw error;
          }),
      );
    return cache.get(file)!;
  }
  return async function dependsOn(
    entry: string,
    target: string,
    seen = new Set<string>(),
  ): Promise<boolean> {
    if (entry === target) return true;
    if (seen.has(entry)) return false;
    seen.add(entry);
    for (const child of await imports(entry)) if (await dependsOn(child, target, seen)) return true;
    return false;
  };
}

export async function selectSvelteVerification(
  files: readonly string[],
  options: { repo?: string; all?: boolean; components?: readonly string[] } = {},
): Promise<SvelteSelection> {
  const repo = options.repo ?? process.cwd();
  const allTests = await testFiles(repo);
  const dependsOn = dependencyReader(repo);
  const primitives = new Set<string>(),
    groups = new Set<string>(),
    tests = new Set<string>(),
    demo = new Set<string>();
  const reasons = new Set<string>(),
    additional = new Set<string>();
  let all = options.all ?? false,
    packageCheck = all,
    generator = all,
    portalCompositions = false,
    layout = false;
  function primitive(name: string) {
    if (!primitiveEntries.has(name)) return false;
    primitives.add(name);
    const wrapper = styledForPrimitive[name] ?? name;
    if (styledEntries.has(wrapper)) groups.add(wrapper);
    return true;
  }
  for (const name of options.components ?? []) {
    if (!primitive(name) && !styledEntries.has(name))
      throw new Error(`Unknown Svelte component: ${name}`);
    if (styledEntries.has(name)) groups.add(name);
    reasons.add(`Requested component: ${name}`);
  }
  for (const raw of files) {
    const file = raw.replaceAll("\\", "/").replace(/^\.\//, "");
    if (/\.(?:md|mdx)$/.test(file)) continue;
    if (file === "packages/cli/tests/commands/svelte-delivery.integration.test.ts") {
      additional.add(
        "pnpm --filter=starwind exec env -u npm_execpath vitest run tests/commands/svelte-delivery.integration.test.ts",
      );
      reasons.add(`Private Svelte CLI delivery input: ${file}`);
      continue;
    }
    if (
      file === "scripts/portable-runtime/check-svelte-hosts.ts" ||
      file.startsWith("scripts/portable-runtime/tests/svelte-hosts/")
    ) {
      tests.add("scripts/portable-runtime/tests/svelte-hosts/runner.test.ts");
      generator = true;
      additional.add("pnpm svelte:hosts --host=<affected-host>");
      reasons.add(`Host harness input: ${file}`);
      continue;
    }
    if (
      file === "scripts/portable-runtime/check-svelte-compatibility.ts" ||
      /packages\/svelte\/tests\/(?:styled-compatibility|compatibility-hydration)\.ts$/.test(file)
    ) {
      tests.add(proof + "compatibility.test.ts");
      additional.add("pnpm svelte:compatibility");
      reasons.add(`Compiler harness input: ${file}`);
      continue;
    }
    if (allTests.includes(file)) {
      tests.add(file);
      reasons.add(`Changed test: ${file}`);
      continue;
    }
    const part = file.match(
      /^(?:packages\/svelte\/src\/|packages\/runtime\/src\/components\/|scripts\/portable-runtime\/contracts\/primitive\/components\/)([^/.]+)/,
    )?.[1];
    if (part && primitive(part)) {
      reasons.add(`Primitive input: ${file}`);
      continue;
    }
    const root = file.match(
      /^(?:apps\/svelte-demo\/src\/lib\/starwind-runtime\/|scripts\/portable-runtime\/contracts\/styled\/components\/)([^/.]+)/,
    )?.[1];
    if (root && styledEntries.has(root)) {
      groups.add(root);
      reasons.add(`Styled input: ${file}`);
      continue;
    }
    if (file.startsWith(home)) {
      generator = true;
      if (file.startsWith(home + "styled/")) {
        styledRoots.forEach((name) => groups.add(name));
        reasons.add(`Shared Styled printer: ${file}`);
      } else {
        let matched = false;
        for (const [printer, names] of Object.entries(printers))
          if (await dependsOn(home + printer + ".ts", file)) {
            names.forEach(primitive);
            matched = true;
          }
        if (!matched) {
          all = true;
          reasons.add(`Shared target input without a narrower owner: ${file}`);
        } else reasons.add(`Printer dependency: ${file}`);
        if (/attachments|button-child|anchor-child|overlay-portal/.test(file))
          tests.add(proof + "forwarded-attachments.test.ts");
        if (/attachments|child|model|lifecycle/.test(file))
          additional.add("pnpm svelte:compatibility");
      }
      continue;
    }
    if (file.startsWith("packages/svelte/tests/")) {
      let matched = false;
      for (const test of allTests)
        if (await dependsOn(test, file)) {
          tests.add(test);
          matched = true;
        }
      reasons.add(`Consumer dependency: ${file}`);
      if (!matched) {
        packageCheck = true;
      }
      continue;
    }
    if (portalInputs.has(file)) {
      portalCompositions = true;
      reasons.add(`Portal composition input: ${file}`);
      continue;
    }
    if (file.startsWith("apps/svelte-demo/")) {
      const entry = [...styledEntries.values()].find((entry) => entry.demoOwner === file);
      const slug = path.posix
        .basename(file)
        .replace(/(?:Docs)?(?:Review|Example)\.svelte$/, "")
        .replace(/[A-Z]/g, (letter, index) => (index ? "-" : "") + letter.toLowerCase());
      if (entry) demo.add(entry.component);
      else if (styledEntries.has(slug)) demo.add(slug);
      else {
        layout = true;
      }
      reasons.add(`Demo input: ${file}`);
      continue;
    }
    if (file === "packages/svelte/package.json" || file.startsWith("packages/svelte/")) {
      packageCheck = true;
      all = true;
      additional.add("pnpm svelte:hosts --host=vite");
      reasons.add(`Package input: ${file}`);
      continue;
    }
    if (file.startsWith("packages/runtime/src/")) {
      all = true;
      reasons.add(`Shared Runtime input: ${file}`);
      continue;
    }
    if (file === "package.json") {
      // Root script edits are cheap to inspect; dependency changes also need explicit compatibility.
      all = true;
      reasons.add(`Workspace command or tool input: ${file}`);
      continue;
    }
    if (file === "pnpm-lock.yaml" || file === "pnpm-workspace.yaml") {
      all = true;
      packageCheck = true;
      additional.add("pnpm svelte:compatibility");
      reasons.add(`Toolchain input: ${file}`);
      continue;
    }
    if (/^scripts\/portable-runtime\/(?:check|generate|verify)-svelte/.test(file)) {
      all = true;
      generator = true;
      reasons.add(`Verification or generation entry point: ${file}`);
      continue;
    }
    if (
      (file.startsWith("scripts/portable-runtime/renderers/") &&
        !/framework-adapters\/(?:astro|react|vue|solid)\//.test(file)) ||
      file.startsWith("scripts/portable-runtime/contracts/")
    ) {
      all = true;
      generator = true;
      reasons.add(`Shared generator: ${file}`);
    }
  }
  // Generated cross-component imports also affect Primitive compositions such as FieldControl.
  if (primitives.size && !all) {
    const dependencies = await Promise.all(
      [...primitiveEntries.keys()].map(async (name) => {
        const directory = path.join(repo, "packages/svelte/src", name);
        const sources = await Promise.all(
          (await readdir(directory))
            .filter((file) => /\.(?:ts|svelte)$/.test(file))
            .map((file) => readFile(path.join(directory, file), "utf8")),
        );
        return [
          name,
          sources.flatMap((source) =>
            [...source.matchAll(/from\s*["']\.\.\/([\w-]+)\//g)].map((match) => match[1]!),
          ),
        ] as const;
      }),
    );
    let added = true;
    while (added) {
      added = false;
      for (const [name, imports] of dependencies)
        if (!primitives.has(name) && imports.some((dependency) => primitives.has(dependency))) {
          primitive(name);
          reasons.add(`Primitive composition depends on selected input: ${name}`);
          added = true;
        }
    }
  }
  // A changed Styled dependency affects each composition that includes it.
  let expanded = true;
  while (expanded) {
    expanded = false;
    for (const contract of starwindStyledContracts) {
      if (!styledEntries.has(contract.component) || groups.has(contract.component)) continue;
      const dependencies = analyzeStyledOutputGroup(projectStyledOutputComponentGroup(contract), {
        target: "svelte",
      }).dependencies.styledComponents;
      if (dependencies.some((name) => groups.has(name))) {
        groups.add(contract.component);
        expanded = true;
      }
    }
  }
  if (all) {
    packageCheck = true;
    primitiveEntries.forEach((_, name) => primitives.add(name));
    styledRoots.forEach((name) => groups.add(name));
    allTests.forEach((name) => tests.add(name));
    const privateBoundary = "scripts/portable-runtime/tests/private/svelte-boundary.test.ts";
    await access(path.join(repo, privateBoundary))
      .then(() => tests.add(privateBoundary))
      .catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
  }
  const portalDependencies = portalStyledRoots.filter((name) => groups.has(name));
  if (portalDependencies.length) {
    portalCompositions = true;
    reasons.add(
      `Portal composition depends on selected Styled input: ${portalDependencies.join(", ")}`,
    );
  }
  function addOwner(owner: string) {
    if (owner.startsWith("packages/svelte/tests/")) packageCheck = true;
    else tests.add(owner);
  }
  for (const name of primitives) addOwner(primitiveEntries.get(name)!.testOwner);
  for (const name of groups) addOwner(styledEntries.get(name)!.testOwner);
  if (primitives.size || groups.size) tests.add(proof + "consumer-types.test.ts");
  if (generator) tests.add(proof + "target.test.ts");
  for (const file of tests)
    await access(path.join(repo, file)).catch(() => {
      throw new Error(`Missing Svelte test owner: ${file}`);
    });
  return {
    primitives: [...primitives].sort(),
    styled: [...groups].sort(),
    tests: [...tests].sort(),
    demo: [...demo].sort(),
    layout,
    portalCompositions,
    package: packageCheck,
    generator,
    all,
    reasons: [...reasons],
    additional: [...additional],
  };
}

export type SvelteCommand = { label: string; args: string[] };
export function svelteCommands(selection: SvelteSelection): SvelteCommand[] {
  const commands: SvelteCommand[] = [];
  const adapters = selection.tests.length > 0 || selection.package;
  const demo = selection.demo.length > 0 || selection.layout || selection.all;
  if (adapters || demo || selection.portalCompositions) {
    commands.push(
      { label: "Build Runtime once", args: ["--filter=@starwind-ui/runtime", "build"] },
      { label: "Build Svelte once", args: ["--filter=@starwind-ui/svelte", "build"] },
    );
  }
  if (selection.primitives.length || selection.all)
    commands.push({ label: "Primitive generation drift", args: ["runtime:generate:svelte:check"] });
  if (selection.styled.length || selection.all)
    commands.push({ label: "Styled generation drift", args: ["svelte:styled:check"] });
  if (selection.generator)
    commands.push({ label: "Generator types", args: ["runtime:generate:typecheck"] });
  if (selection.tests.length)
    commands.push({
      label: "Selected Svelte tests",
      args: [
        "exec",
        "vitest",
        "run",
        "--maxWorkers=2",
        "--project=portable-svelte",
        "--project=portable-svelte-styled",
        ...(selection.tests.some((file) => !file.startsWith(proof) && !file.startsWith(styled))
          ? ["--project=portable-runtime"]
          : []),
        ...selection.tests,
      ],
    });
  if (selection.package)
    commands.push({
      label: "Package exports and distribution",
      args: ["--filter=@starwind-ui/svelte", "test:run"],
    });
  if (demo || selection.portalCompositions)
    commands.push({ label: "Demo build", args: ["--filter=svelte-demo", "build"] });
  if (demo)
    commands.push({
      label: "Selected demo examples",
      args: [
        "--filter=svelte-demo",
        "test",
        ...(selection.demo.length ? [`--components=${selection.demo.join(",")}`] : []),
        ...(selection.layout ? ["--layout"] : []),
      ],
    });
  if (selection.portalCompositions)
    commands.push({
      label: "Portal compositions",
      args: ["--filter=svelte-demo", "exec", "node", "tests/portal-compositions.mjs"],
    });
  return commands;
}

async function changedFiles(repo: string, base: string) {
  const result = await Promise.all([
    execute("git", ["diff", "--name-only", "-z", base, "--"], { cwd: repo }),
    execute("git", ["ls-files", "--others", "--exclude-standard", "-z"], { cwd: repo }),
  ]);
  return [...new Set(result.flatMap((item) => item.stdout.split("\0").filter(Boolean)))];
}
async function run(args: string[], env: NodeJS.ProcessEnv) {
  const script = process.env.npm_execpath;
  const useNode = script && /\.[cm]?js$/.test(script);
  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      useNode ? process.execPath : "pnpm",
      [...(useNode ? [script] : []), ...args],
      { stdio: "inherit", env },
    );
    child.once("error", reject);
    child.once("exit", (code, signal) =>
      code === 0
        ? resolve()
        : reject(new Error(`pnpm ${args.join(" ")} failed (${signal ?? code})`)),
    );
  });
}
export async function verifySvelte(args = process.argv.slice(2)) {
  const option = (name: string) =>
    args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  const known = /^(?:--|--all|--dry-run|--base=.+|--components?=.+|--files=.+)$/;
  for (const arg of args)
    if (!known.test(arg))
      throw new Error(
        `Unknown option: ${arg}. Use --all, --component=<name>, --base=<ref>, --files=<paths>, or --dry-run.`,
      );
  const components = (option("components") ?? option("component"))?.split(",");
  const files =
    option("files")?.split(",") ??
    (components ? [] : await changedFiles(process.cwd(), option("base") ?? "HEAD"));
  const selection = await selectSvelteVerification(files, {
    components,
    all: args.includes("--all"),
  });
  const commands = svelteCommands(selection);
  if (!commands.length) {
    console.log(
      "No Svelte verification inputs changed. Use --component=<name> or --all to select checks.",
    );
    return;
  }
  console.log(JSON.stringify({ selection, commands }, null, 2));
  if (args.includes("--dry-run")) return;
  const env = { ...process.env };
  const roots = [...new Set([...selection.primitives, ...selection.styled])];
  if (!selection.all && roots.length) env.SVELTE_VERIFY_COMPONENTS = roots.join(",");
  else delete env.SVELTE_VERIFY_COMPONENTS;
  const start = performance.now();
  for (const command of commands) {
    console.log(`\n${command.label}`);
    const started = performance.now();
    await run(command.args, env);
    console.log(`${command.label}: ${((performance.now() - started) / 1000).toFixed(1)}s`);
  }
  console.log(
    `Selected Svelte checks passed in ${((performance.now() - start) / 1000).toFixed(1)}s.`,
  );
  if (selection.additional.length)
    console.log(
      `Run these explicit integration checks for the relevant package or toolchain change:\n${selection.additional.join("\n")}`,
    );
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  await verifySvelte();
