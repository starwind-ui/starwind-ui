import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile, realpath, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import {
  createDistConsumer,
  type DistConsumer,
} from "../../packages/svelte/tests/dist-consumer.js";
import { verifyStyledCompatibility } from "../../packages/svelte/tests/styled-compatibility.js";

const execFileAsync = promisify(execFile);
export const SVELTE_COMPATIBILITY_VERSIONS = ["5.29.0", "5.57.0"] as const;
export const SVELTE_COMPATIBILITY_TOOLS = {
  "svelte-check": "4.4.8",
  typescript: "5.9.3",
  esbuild: "0.28.1",
  "@floating-ui/dom": "1.7.6",
  "embla-carousel": "8.6.0",
  "tailwind-variants": "3.2.2",
  "tailwind-merge": "3.6.0",
} as const;

type ExecuteInstall = (args: string[], root: string) => Promise<void>;

export async function installCompatibilityTools(
  root: string,
  version: string,
  execute: ExecuteInstall = async (args, cwd) => {
    await execFileAsync("pnpm", args, {
      cwd,
      timeout: 120_000,
      maxBuffer: 4 * 1024 * 1024,
    });
  },
): Promise<void> {
  const versions = { svelte: version, ...SVELTE_COMPATIBILITY_TOOLS };
  const args = [
    "--dir",
    root,
    "--allow-build=esbuild",
    "add",
    "--save-exact",
    "--store-dir",
    path.join(root, ".pnpm-store"),
    "--config.enable-global-virtual-store=false",
    "--config.link-workspace-packages=false",
    "--config.prefer-workspace-packages=false",
    "--reporter=append-only",
    ...Object.entries(versions).map(([name, selected]) => `${name}@${selected}`),
  ];
  try {
    await execute(args, root);
  } catch (error) {
    throw new Error(
      `Could not install the exact Svelte ${version} consumer tools. Check registry/network access and rerun pnpm svelte:compatibility. No workspace fallback was used.\n${String(error)}`,
      { cause: error },
    );
  }
}

async function readToolManifest(root: string, entry: string, name: string) {
  for (
    let directory = path.dirname(entry);
    directory.startsWith(root + path.sep);
    directory = path.dirname(directory)
  ) {
    let manifest: string;
    try {
      manifest = await realpath(path.join(directory, "package.json"));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") continue;
      throw error;
    }
    assert.ok(
      manifest.startsWith(root + path.sep),
      `${name} manifest resolved outside its consumer: ${manifest}`,
    );
    const metadata = JSON.parse(await readFile(manifest, "utf8"));
    // Nested entry folders can declare their module type without naming a package.
    if (metadata.name === undefined) continue;
    assert.equal(metadata.name, name, `${name} must resolve its own package manifest`);
    return { manifest, metadata };
  }
  assert.fail(`${name} has no package manifest inside its consumer`);
}

export async function readCompatibilityProvenance(root: string, version: string) {
  root = await realpath(root);
  const require = createRequire(path.join(root, "package.json"));
  const tools: Record<string, { version: string; manifest: string; entry: string }> = {};
  for (const [name, expected] of Object.entries({
    svelte: version,
    ...SVELTE_COMPATIBILITY_TOOLS,
  })) {
    const entry = await realpath(
      require.resolve(
        name === "svelte"
          ? "svelte/compiler"
          : name === "svelte-check"
            ? "svelte-check/bin/svelte-check"
            : name,
      ),
    );
    assert.ok(entry.startsWith(root + path.sep), `${name} resolved outside its consumer: ${entry}`);
    const { manifest, metadata } = await readToolManifest(root, entry, name);
    assert.equal(metadata.version, expected, `${name} must resolve the exact selected version`);
    tools[name] = { version: metadata.version, manifest, entry };
  }
  const checkerRequire = createRequire(tools["svelte-check"]!.entry);
  assert.equal(
    await realpath(checkerRequire.resolve("svelte/compiler")),
    tools.svelte!.entry,
    "Checker resolved another Svelte compiler",
  );
  assert.equal(
    await realpath(checkerRequire.resolve("typescript")),
    tools.typescript!.entry,
    "Checker resolved another TypeScript installation",
  );
  return tools;
}

async function verifyConsumer(consumer: DistConsumer, version: string, repoRoot = process.cwd()) {
  const tools = await readCompatibilityProvenance(consumer.root, version);
  const styled = await verifyStyledCompatibility(consumer, repoRoot);
  assert.equal(styled.build.bundler, tools.esbuild!.entry);
  assert.equal(styled.build.compiler, tools.svelte!.entry);
  return { version, root: consumer.root, tools, styled };
}

export type SvelteCompatibilityResult = Awaited<ReturnType<typeof verifyConsumer>>;

export async function runSvelteCompatibility(
  options: {
    repoRoot?: string;
    createConsumer?: (version: string) => Promise<DistConsumer>;
    verifyConsumer?: (
      consumer: DistConsumer,
      version: string,
    ) => Promise<SvelteCompatibilityResult>;
    log?: (message: string) => void;
  } = {},
): Promise<SvelteCompatibilityResult[]> {
  const log = options.log ?? console.log;
  const createConsumer =
    options.createConsumer ??
    ((version: string) =>
      createDistConsumer({
        packageRoot: path.join(options.repoRoot ?? process.cwd(), "packages/svelte"),
        installTools: (root) => installCompatibilityTools(root, version),
      }));
  const results: SvelteCompatibilityResult[] = [];
  for (const version of SVELTE_COMPATIBILITY_VERSIONS) {
    log(`Installing isolated Svelte ${version} tools`);
    const consumer = await createConsumer(version);
    try {
      log(`Checking Svelte ${version} types, SSR, exports, and hydration`);
      const result = await (options.verifyConsumer
        ? options.verifyConsumer(consumer, version)
        : verifyConsumer(consumer, version, options.repoRoot));
      results.push(result);
      log(
        `Svelte ${version} passed: representative hydration, native compiler regressions, forwarded attachments; ${result.styled.types.positiveFiles.length} positive and ${result.styled.types.negativeFiles.length} negative fixtures`,
      );
    } finally {
      await consumer.dispose();
    }
  }
  return results;
}

if (process.argv[1]?.endsWith("check-svelte-compatibility.ts")) {
  const results = await runSvelteCompatibility();
  const reportRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-svelte-compatibility-report-"));
  const report = path.join(reportRoot, "report.json");
  await writeFile(report, JSON.stringify(results, null, 2));
  console.log(`Compatibility provenance: ${report}`);
}
