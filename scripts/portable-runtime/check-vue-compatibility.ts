import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import semver from "semver";

const execFileAsync = promisify(execFile);
const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const PACKED_NAMES = ["@starwind-ui/runtime", "@starwind-ui/vue"] as const;
/** The Vue runtime packages that one exact Vue release installs at the same version. */
const VUE_RUNTIME_PACKAGES = [
  "@vue/runtime-core",
  "@vue/runtime-dom",
  "@vue/server-renderer",
  "@vue/reactivity",
  "@vue/shared",
  "@vue/compiler-sfc",
] as const;
export const VUE_COMPATIBILITY_TOOLS = { typescript: "5.9.3" } as const;

export interface VuePacks {
  runtime: { tarball: string; version: string };
  vue: { tarball: string; version: string; peerRange: string };
}

type Execute = (
  file: string,
  args: string[],
  cwd: string,
  env?: NodeJS.ProcessEnv,
) => Promise<{ stdout: string; stderr: string }>;

const defaultExecute: Execute = (file, args, cwd, env) =>
  execFileAsync(file, args, {
    cwd,
    env: env ?? cleanEnvironment(),
    timeout: 300_000,
    maxBuffer: 16 * 1024 * 1024,
  });

function cleanEnvironment(extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  const env = { ...process.env, ...extra };
  delete env.NODE_OPTIONS;
  delete env.NODE_PATH;
  return env;
}

const hash = async (file: string) =>
  createHash("sha256")
    .update(await readFile(file))
    .digest("hex");

/** Read the accepted Runtime and Vue archives from a release pack directory. */
export async function readVuePacks(directory: string): Promise<VuePacks> {
  const manifest = JSON.parse(await readFile(path.join(directory, "manifest.json"), "utf8"));
  const entries = Object.values(manifest.packages ?? {}) as Array<{
    file: string;
    name: string;
    sha256: string;
    version: string;
    manifest: { peerDependencies?: Record<string, string> };
  }>;
  const select = async (name: (typeof PACKED_NAMES)[number]) => {
    const matches = entries.filter((entry) => entry.name === name);
    assert.equal(matches.length, 1, `Expected one ${name} archive in ${directory}`);
    const entry = matches[0]!;
    const tarball = path.resolve(directory, entry.file);
    assert.equal(await hash(tarball), entry.sha256, `Accepted archive changed: ${name}`);
    return { entry, tarball };
  };
  const runtime = await select("@starwind-ui/runtime");
  const vue = await select("@starwind-ui/vue");
  const peerRange = vue.entry.manifest.peerDependencies?.vue;
  assert.equal(typeof peerRange, "string", "The Vue pack has no vue peer range");
  return {
    runtime: { tarball: runtime.tarball, version: runtime.entry.version },
    vue: { tarball: vue.tarball, version: vue.entry.version, peerRange: peerRange! },
  };
}

/** The floor comes from the packed peer range, so a range change moves the tested floor. */
export function vueCompatibilityVersions(peerRange: string, currentVersion: string): string[] {
  const floor = semver.minVersion(peerRange)?.version;
  assert.ok(floor, `Cannot read a floor from the Vue peer range ${peerRange}`);
  assert.ok(
    semver.satisfies(currentVersion, peerRange),
    `Vue ${currentVersion} is outside ${peerRange}`,
  );
  return [...new Set([floor, currentVersion])];
}

export async function installVueCompatibilityConsumer(
  root: string,
  version: string,
  packs: VuePacks,
  execute: Execute = defaultExecute,
): Promise<void> {
  const tarballs = {
    "@starwind-ui/runtime": `file:${packs.runtime.tarball}`,
    "@starwind-ui/vue": `file:${packs.vue.tarball}`,
  };
  await writeFile(
    path.join(root, "package.json"),
    JSON.stringify({
      name: "starwind-vue-compatibility-consumer",
      private: true,
      type: "module",
      dependencies: tarballs,
    }),
  );
  // The overrides bind each packed package through the whole dependency tree.
  await writeFile(
    path.join(root, "pnpm-workspace.yaml"),
    "overrides:\n" +
      Object.entries(tarballs)
        .map(([name, value]) => `  ${JSON.stringify(name)}: ${JSON.stringify(value)}\n`)
        .join(""),
  );
  const versions = { vue: version, ...VUE_COMPATIBILITY_TOOLS };
  try {
    await execute(
      "pnpm",
      [
        "add",
        "--save-exact",
        "--workspace-root",
        "--store-dir",
        path.join(root, ".pnpm-store"),
        "--config.enable-global-virtual-store=false",
        "--config.link-workspace-packages=false",
        "--config.prefer-workspace-packages=false",
        "--reporter=append-only",
        ...Object.entries(versions).map(([name, selected]) => `${name}@${selected}`),
      ],
      root,
    );
  } catch (error) {
    throw new Error(
      `Could not install the exact Vue ${version} consumer. Check registry access. No workspace fallback was used.\n${String(error)}`,
      { cause: error },
    );
  }
}

async function packageVersion(directory: string, name: string) {
  const metadata = JSON.parse(await readFile(path.join(directory, "package.json"), "utf8"));
  assert.equal(metadata.name, name, `${directory} must hold ${name}`);
  return metadata.version as string;
}

/** Locate a package directory as Node resolves it from a parent, without its export map. */
async function locate(name: string, parent: string) {
  for (const lookup of createRequire(path.join(parent, "package.json")).resolve.paths(name) ?? []) {
    try {
      const directory = await realpath(path.join(lookup, name));
      await readFile(path.join(directory, "package.json"));
      return directory;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    }
  }
  assert.fail(`${name} is not installed for ${parent}`);
}

export async function readVueCompatibilityProvenance(
  root: string,
  version: string,
  packs: VuePacks,
) {
  root = await realpath(root);
  const inside = (directory: string, label: string) =>
    assert.ok(directory.startsWith(root + path.sep), `${label} resolved outside: ${directory}`);
  const vue = await locate("vue", root);
  inside(vue, "vue");
  assert.equal(await packageVersion(vue, "vue"), version, "vue must be the selected version");
  const packages: Record<string, { directory: string; version: string }> = {
    vue: { directory: vue, version },
  };
  for (const name of VUE_RUNTIME_PACKAGES) {
    const directory = await locate(name, vue);
    inside(directory, name);
    const installed = await packageVersion(directory, name);
    assert.equal(installed, version, `${name} must match Vue ${version}`);
    packages[name] = { directory, version: installed };
  }
  for (const [name, expected] of [
    ["@starwind-ui/vue", packs.vue.version],
    ["@starwind-ui/runtime", packs.runtime.version],
  ] as const) {
    const directory = await locate(name, root);
    inside(directory, name);
    assert.equal(await packageVersion(directory, name), expected, `${name} pack version`);
    packages[name] = { directory, version: expected };
  }
  // The adapter and the consumer must share one Vue instance.
  assert.equal(
    await locate("vue", packages["@starwind-ui/vue"]!.directory),
    vue,
    "@starwind-ui/vue resolved another Vue installation",
  );
  assert.equal(
    await locate("@starwind-ui/runtime", packages["@starwind-ui/vue"]!.directory),
    packages["@starwind-ui/runtime"]!.directory,
    "@starwind-ui/vue resolved another Runtime installation",
  );
  const typescript = await locate("typescript", root);
  inside(typescript, "typescript");
  assert.equal(
    await packageVersion(typescript, "typescript"),
    VUE_COMPATIBILITY_TOOLS.typescript,
    "typescript version",
  );
  return { packages, typescript };
}

export interface DeclarationDiagnostic {
  file: string;
  code: string;
  message: string;
  count: number;
}

/**
 * Group compiler output by pack-relative file, code and message. A file path drops everything up
 * to its last node_modules folder, so the location does not depend on the temporary consumer.
 */
export function typeDiagnostics(output: string): DeclarationDiagnostic[] {
  const groups = new Map<string, DeclarationDiagnostic>();
  for (const line of output.split("\n")) {
    // A diagnostic without a location, such as TS2688, counts under the <global> file.
    const match =
      /^(.*?)\(\d+,\d+\): error (TS\d+): (.*)$/.exec(line.trim()) ??
      /^()error (TS\d+): (.*)$/.exec(line.trim());
    if (!match) continue;
    const file = match[1] ? match[1].replace(/^.*node_modules\//, "") : "<global>";
    const key = `${file}\0${match[2]}\0${match[3]}`;
    const entry = groups.get(key) ?? { file, code: match[2]!, message: match[3]!, count: 0 };
    entry.count++;
    groups.set(key, entry);
  }
  return [...groups.values()].sort(
    (left, right) =>
      left.file.localeCompare(right.file) ||
      left.code.localeCompare(right.code) ||
      left.message.localeCompare(right.message),
  );
}

export const ACCEPTED_DIAGNOSTICS_PATH = path.join(
  REPO_ROOT,
  "scripts/portable-runtime/vue-compatibility-accepted-diagnostics.json",
);

/** The one known declaration defect. Its pinned occurrences are the only accepted diagnostics. */
export interface AcceptedDiagnostics {
  code: string;
  messagePrefix: string;
  occurrences: Record<string, number>;
}

const isAcceptedKind = (accepted: AcceptedDiagnostics, diagnostic: DeclarationDiagnostic) =>
  diagnostic.code === accepted.code && diagnostic.message.startsWith(accepted.messagePrefix);

/** Fail on any other diagnostic, or on more occurrences in a file than the pinned count. */
export function checkDeclarationDiagnostics(
  results: Array<{ version: string; types?: { declarationDiagnostics: DeclarationDiagnostic[] } }>,
  accepted: AcceptedDiagnostics,
): void {
  const failures = results.flatMap(({ version, types }) => {
    const counts = new Map<string, number>();
    const unexpected: string[] = [];
    for (const diagnostic of types?.declarationDiagnostics ?? []) {
      if (!isAcceptedKind(accepted, diagnostic)) {
        unexpected.push(
          `${diagnostic.file}: ${diagnostic.code} x${diagnostic.count}: ${diagnostic.message}`,
        );
        continue;
      }
      counts.set(diagnostic.file, (counts.get(diagnostic.file) ?? 0) + diagnostic.count);
    }
    for (const [file, count] of counts) {
      const pinned = accepted.occurrences[file] ?? 0;
      if (count > pinned) unexpected.push(`${file}: ${accepted.code} x${count}, pinned x${pinned}`);
    }
    return unexpected.length ? [`Vue ${version}:\n  ${unexpected.join("\n  ")}`] : [];
  });
  assert.equal(
    failures.length,
    0,
    `Packed Vue declarations have new diagnostics with skipLibCheck false. Only the pinned ${accepted.code} occurrences in ${path.relative(REPO_ROOT, ACCEPTED_DIAGNOSTICS_PATH)} are accepted:\n${failures.join("\n")}\nIf a new Vue part only moved the pinned ${accepted.code} counts, refresh them with: pnpm vue:compatibility --packs=<dir> --write-accepted-diagnostics`,
  );
}

/** Pin the current accepted-kind occurrences. Any other diagnostic blocks the update. */
export function acceptedDiagnosticsFrom(
  results: Array<{ version: string; types?: { declarationDiagnostics: DeclarationDiagnostic[] } }>,
  accepted: AcceptedDiagnostics,
): AcceptedDiagnostics {
  const occurrences: Record<string, number> = {};
  for (const { version, types } of results) {
    assert.ok(types, `Vue ${version} has no type check result`);
    const counts = new Map<string, number>();
    for (const diagnostic of types.declarationDiagnostics) {
      assert.ok(
        isAcceptedKind(accepted, diagnostic),
        `Vue ${version} has a diagnostic that cannot be pinned: ${diagnostic.file}: ${diagnostic.code}: ${diagnostic.message}`,
      );
      counts.set(diagnostic.file, (counts.get(diagnostic.file) ?? 0) + diagnostic.count);
    }
    for (const [file, count] of counts) occurrences[file] = Math.max(occurrences[file] ?? 0, count);
  }
  return {
    ...accepted,
    occurrences: Object.fromEntries(
      Object.entries(occurrences).sort(([left], [right]) => left.localeCompare(right)),
    ),
  };
}

/**
 * Type check every public export against the selected Vue declarations. The consumer must pass
 * with skipLibCheck, as starters set it. The declaration diagnostics without skipLibCheck are
 * recorded, because a missing or changed Vue type inside a declaration otherwise becomes any.
 */
async function verifyTypes(root: string, repoRoot: string, execute: Execute) {
  await cp(
    path.join(repoRoot, "packages/vue/tests/release/consumer.ts"),
    path.join(root, "consumer.ts"),
  );
  const tsc = path.join(root, "node_modules/typescript/bin/tsc");
  const check = async (skipLibCheck: boolean) => {
    await writeFile(
      path.join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          lib: ["DOM", "DOM.Iterable", "ES2022"],
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          skipLibCheck,
          strict: true,
          target: "ES2022",
          types: [],
        },
        include: ["consumer.ts"],
      }),
    );
    try {
      await execute(process.execPath, [tsc, "-p", "tsconfig.json"], root);
      return [];
    } catch (error) {
      const failure = error as Error & { stdout?: string };
      const diagnostics = typeDiagnostics(failure.stdout ?? "");
      if (!diagnostics.length) throw error;
      return diagnostics;
    }
  };
  const consumer = await check(true);
  if (consumer.length)
    throw new Error(
      `The public Vue consumer failed type checking:\n${consumer
        .map(({ file, code, count, message }) => `${file}: ${code} x${count}: ${message}`)
        .join("\n")}`,
    );
  return { files: ["consumer.ts"], declarationDiagnostics: await check(false) };
}

/**
 * Build a Node module that imports each export-map subpath. Node needs the JSON import attribute
 * for JSON entries such as `./package.json`.
 */
export function exportImportScript(subpaths: readonly string[]): string {
  return `const subpaths = ${JSON.stringify(subpaths)};
for (const subpath of subpaths)
  await import(subpath, subpath.endsWith(".json") ? { with: { type: "json" } } : undefined);
console.log(subpaths.length);
`;
}

/** Import every export-map entry in Node, which links each named Vue import. */
async function verifyExports(root: string, vueDirectory: string, execute: Execute) {
  const metadata = JSON.parse(await readFile(path.join(vueDirectory, "package.json"), "utf8"));
  const subpaths = Object.keys(metadata.exports).map((key) =>
    key === "." ? "@starwind-ui/vue" : `@starwind-ui/vue/${key.slice(2)}`,
  );
  await writeFile(path.join(root, "import-exports.mjs"), exportImportScript(subpaths));
  const { stdout } = await execute(process.execPath, ["import-exports.mjs"], root);
  assert.equal(Number(stdout.trim()), subpaths.length, "Not every export-map entry loaded");
  return subpaths;
}

/** Compile each Styled SFC that the CLI installs with the selected Vue compiler. */
async function verifyStyledSources(root: string, repoRoot: string, execute: Execute) {
  const source = path.join(repoRoot, "apps/vue-demo/src/components/starwind-runtime");
  const destination = path.join(root, "src/components/starwind");
  await cp(source, destination, { recursive: true });
  await writeFile(
    path.join(root, "compile-styled.cjs"),
    `const { readFileSync, readdirSync } = require("node:fs");
const path = require("node:path");
const { parse, compileScript, registerTS } = require("vue/compiler-sfc");
registerTS(() => require("typescript"));
const files = [];
const visit = (directory) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(file);
    else if (entry.name.endsWith(".vue")) files.push(file);
  }
};
visit(process.argv[2]);
const failures = [];
for (const [index, filename] of files.entries()) {
  try {
    const { descriptor, errors } = parse(readFileSync(filename, "utf8"), { filename });
    if (errors.length) throw errors[0];
    for (const ssr of [false, true])
      compileScript(descriptor, { id: "sw" + index, inlineTemplate: true, templateOptions: { ssr } });
  } catch (error) {
    failures.push(path.relative(process.argv[2], filename) + ": " + (error && error.message));
  }
}
if (failures.length) {
  console.error(failures.join("\\n"));
  process.exit(1);
}
console.log(files.length);
`,
  );
  try {
    const { stdout } = await execute(process.execPath, ["compile-styled.cjs", destination], root);
    const count = Number(stdout.trim());
    assert.ok(count > 0, "No Styled Vue sources were compiled");
    return { files: count };
  } catch (error) {
    const failure = error as Error & { stderr?: string };
    throw new Error(`Styled Vue sources failed to compile:\n${failure.stderr ?? ""}`, {
      cause: error,
    });
  }
}

/** Server-render the Primitive hydration fixture, then hydrate and drive it in Chrome. */
async function verifyHydration(root: string, repoRoot: string, version: string, execute: Execute) {
  const integration = path.join(repoRoot, "packages/vue/tests/integration");
  for (const file of ["run-hydration-playwright.mjs", "hydration.playwright.fixture.js"])
    await cp(path.join(integration, file), path.join(root, file));
  const { stdout } = await execute(
    process.execPath,
    ["run-hydration-playwright.mjs"],
    root,
    cleanEnvironment({
      STARWIND_VUE_COMPATIBILITY_CONSUMER: root,
      STARWIND_VUE_COMPATIBILITY_PLAYWRIGHT: path.join(repoRoot, "apps/vue-demo/package.json"),
    }),
  );
  assert.ok(
    stdout.includes(`with Vue ${version} (server ${version})`),
    `Hydration did not run on Vue ${version}: ${stdout}`,
  );
  return stdout.trim();
}

async function verifyConsumer(
  root: string,
  version: string,
  packs: VuePacks,
  repoRoot: string,
  execute: Execute,
) {
  const provenance = await readVueCompatibilityProvenance(root, version, packs);
  // Each check runs, so one report names every check that fails on this Vue version.
  const failures: string[] = [];
  const check = async <T>(name: string, run: () => Promise<T>): Promise<T | undefined> => {
    try {
      return await run();
    } catch (error) {
      failures.push(`${name}: ${error instanceof Error ? error.message : String(error)}`);
      return undefined;
    }
  };
  const types = await check("types", () => verifyTypes(root, repoRoot, execute));
  const exports = await check("exports", () =>
    verifyExports(root, provenance.packages["@starwind-ui/vue"]!.directory, execute),
  );
  const styled = await check("styled", () => verifyStyledSources(root, repoRoot, execute));
  const hydration = await check("hydration", () =>
    verifyHydration(root, repoRoot, version, execute),
  );
  return { version, root, provenance, types, exports, styled, hydration, failures };
}

export type VueCompatibilityResult = Awaited<ReturnType<typeof verifyConsumer>>;

export async function runVueCompatibility(options: {
  packsDirectory: string;
  repoRoot?: string;
  versions?: string[];
  createConsumer?: (version: string, packs: VuePacks) => Promise<string>;
  verifyConsumer?: (
    root: string,
    version: string,
    packs: VuePacks,
  ) => Promise<VueCompatibilityResult>;
  readPacks?: (directory: string) => Promise<VuePacks>;
  acceptedDiagnostics?: AcceptedDiagnostics;
  /** Write the pinned occurrences instead of checking them. */
  writeAcceptedDiagnostics?: (accepted: AcceptedDiagnostics) => Promise<void>;
  log?: (message: string) => void;
}): Promise<VueCompatibilityResult[]> {
  const repoRoot = options.repoRoot ?? REPO_ROOT;
  const log = options.log ?? console.log;
  const packs = await (options.readPacks ?? readVuePacks)(options.packsDirectory);
  const current = JSON.parse(
    await readFile(path.join(repoRoot, "packages/vue/package.json"), "utf8"),
  ).devDependencies.vue as string;
  const versions = options.versions ?? vueCompatibilityVersions(packs.vue.peerRange, current);
  const createConsumer =
    options.createConsumer ??
    (async (version: string, selected: VuePacks) => {
      const root = await realpath(
        await mkdtemp(path.join(os.tmpdir(), "starwind-vue-compatibility-")),
      );
      try {
        await installVueCompatibilityConsumer(root, version, selected);
      } catch (error) {
        await rm(root, { recursive: true, force: true });
        throw error;
      }
      return root;
    });
  const results: VueCompatibilityResult[] = [];
  const failures: string[] = [];
  // Every version runs every check, so one report names each failing version and check.
  for (const version of versions) {
    log(`Installing an isolated Vue ${version} consumer with the packed Runtime and Vue adapters`);
    const root = await createConsumer(version, packs);
    try {
      log(`Checking Vue ${version} types, exports, Styled compilation, SSR, and hydration`);
      const result = await (options.verifyConsumer
        ? options.verifyConsumer(root, version, packs)
        : verifyConsumer(root, version, packs, repoRoot, defaultExecute));
      results.push(result);
      if (result.failures.length)
        failures.push(
          `Vue ${version} failed ${result.failures.length} checks:\n${result.failures.join("\n")}`,
        );
      else
        log(
          `Vue ${version} passed: ${result.exports!.length} export-map entries, ${result.styled!.files} Styled sources, public consumer types, Primitive SSR and hydration`,
        );
    } catch (error) {
      failures.push(`Vue ${version}: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
  const accepted =
    options.acceptedDiagnostics ??
    (JSON.parse(await readFile(ACCEPTED_DIAGNOSTICS_PATH, "utf8")) as AcceptedDiagnostics);
  try {
    if (options.writeAcceptedDiagnostics) {
      assert.equal(results.length, versions.length, "Every version needs a type check result");
      await options.writeAcceptedDiagnostics(acceptedDiagnosticsFrom(results, accepted));
    } else checkDeclarationDiagnostics(results, accepted);
  } catch (error) {
    failures.push((error as Error).message);
  }
  if (failures.length) throw new Error(failures.join("\n\n"));
  return results;
}

if (process.argv[1]?.endsWith("check-vue-compatibility.ts")) {
  const args = process.argv.slice(2);
  const value = (name: string) =>
    args.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
  const packsDirectory = value("packs");
  assert.ok(
    packsDirectory,
    "Pass --packs=<directory> with the release packs from scripts/pack-public-release-artifacts.mjs.",
  );
  const results = await runVueCompatibility({
    packsDirectory: path.resolve(packsDirectory),
    versions: value("versions")?.split(","),
    // Refresh the pinned occurrences only after a packed declaration change moves them.
    writeAcceptedDiagnostics: args.includes("--write-accepted-diagnostics")
      ? async (accepted) =>
          writeFile(ACCEPTED_DIAGNOSTICS_PATH, `${JSON.stringify(accepted, null, 2)}\n`)
      : undefined,
  });
  const reportRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-compatibility-report-"));
  await mkdir(reportRoot, { recursive: true });
  const report = path.join(reportRoot, "report.json");
  await writeFile(report, JSON.stringify(results, null, 2));
  console.log(`Compatibility provenance: ${report}`);
}
