import { execFile } from "node:child_process";
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

import { afterEach, describe, expect, it } from "vitest";

import {
  getPrimitiveFrameworkAdapterTarget,
  getPrimitiveFrameworkAdapterTargetNames,
  resolvePrimitiveFrameworkAdapterTargetComponents,
} from "../../renderers/framework-adapters/target-registry.js";
import {
  SVELTE_PRIMITIVE_COMPONENTS,
  svelteAdapterPublicContract,
  svelteFrameworkAdapterReadiness,
  svelteFrameworkAdapterTarget,
  sveltePackageExports,
} from "../../renderers/framework-adapters/svelte/index.js";

const temporaryRoots: string[] = [];
const execFileAsync = promisify(execFile);
const testRequire = createRequire(import.meta.url);
const tsxCliPath = testRequire.resolve("tsx/cli");

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

describe("private Svelte proof target", () => {
  it("registers exactly the frozen cohort as explicitly non-shipping", () => {
    expect(getPrimitiveFrameworkAdapterTargetNames()).toContain("svelte");
    expect(getPrimitiveFrameworkAdapterTarget("svelte")).toBe(svelteFrameworkAdapterTarget);
    expect(resolvePrimitiveFrameworkAdapterTargetComponents("svelte")).toEqual([
      "accordion",
      "button",
      "carousel",
      "checkbox",
      "dialog",
      "select",
      "slider",
      "toast",
    ]);
    expect(SVELTE_PRIMITIVE_COMPONENTS).toEqual([
      "button",
      "carousel",
      "checkbox",
      "select",
      "accordion",
      "dialog",
      "slider",
      "toast",
    ]);
    expect(svelteFrameworkAdapterTarget.styled).toBeUndefined();
    expect(svelteFrameworkAdapterTarget.packageName).toBe("@starwind-ui/svelte");
    expect(svelteFrameworkAdapterTarget.publicSupport).toEqual({
      cliRegistry: false,
      demoIntegration: false,
      packageExports: false,
      publicDocsClaim: false,
      status: "non-shipping-tracer",
    });
    expect(svelteFrameworkAdapterReadiness.publicSupport).toBe(
      svelteAdapterPublicContract.publicSupport,
    );
    expect(svelteAdapterPublicContract.framework.minimumVersion).toBe("5.29.0");
  });

  it("dispatches Carousel output only through the engine-viewport family", async () => {
    const sourceRoot = path.join(
      process.cwd(),
      "scripts/portable-runtime/renderers/framework-adapters/svelte",
    );
    const sources = await Promise.all(
      ["adapter.ts", "engine-viewport.ts"].map((file) =>
        readFile(path.join(sourceRoot, file), "utf8"),
      ),
    );
    const implementation = sources.join("\n");

    expect(implementation).toContain('kind === "engine-viewport"');
    expect(implementation).not.toMatch(
      /(?:component|componentName|componentId)\s*={2,3}\s*["']carousel["']/i,
    );
  });

  it("dispatches Dialog output only through the native-overlay family", async () => {
    const sourceRoot = path.join(
      process.cwd(),
      "scripts/portable-runtime/renderers/framework-adapters/svelte",
    );
    const sources = await Promise.all(
      ["adapter.ts", "native-overlay.ts"].map((file) =>
        readFile(path.join(sourceRoot, file), "utf8"),
      ),
    );
    const implementation = sources.join("\n");

    expect(implementation).toContain('kind === "native-overlay"');
    expect(implementation).not.toMatch(
      /(?:component|componentName|componentId)\s*={2,3}\s*["']dialog["']/i,
    );
  });

  it("dispatches Slider output only through the range-control family", async () => {
    const sourceRoot = path.join(
      process.cwd(),
      "scripts/portable-runtime/renderers/framework-adapters/svelte",
    );
    const sources = await Promise.all(
      ["adapter.ts", "range-control.ts"].map((file) =>
        readFile(path.join(sourceRoot, file), "utf8"),
      ),
    );
    const implementation = sources.join("\n");

    expect(implementation).toContain('kind === "range-control"');
    expect(implementation).not.toMatch(
      /(?:component|componentName|componentId)\s*={2,3}\s*["']slider["']/i,
    );
    expect(implementation).not.toMatch(
      /addEventListener|getBoundingClientRect|PointerEvent|KeyboardEvent|FormData|requestAnimationFrame|setPointerCapture|clientX|clientY/,
    );
  });

  it("dispatches Toast output only through the notification-system family", async () => {
    const sourceRoot = path.join(
      process.cwd(),
      "scripts/portable-runtime/renderers/framework-adapters/svelte",
    );
    const sources = await Promise.all(
      ["adapter.ts", "notification-system.ts"].map((file) =>
        readFile(path.join(sourceRoot, file), "utf8"),
      ),
    );
    const implementation = sources.join("\n");

    expect(implementation).toContain('kind === "notification-system"');
    expect(implementation).not.toMatch(
      /(?:component|componentName|componentId)\s*={2,3}\s*["']toast["']/i,
    );
    expect(implementation).not.toMatch(
      /(?:queue|setTimeout|pointermove|cloneNode|ToastManagerController|toast\.promise)/,
    );
  });

  it("dispatches holdout output by family kind without Accordion identity branches", async () => {
    const sourceRoot = path.join(
      process.cwd(),
      "scripts/portable-runtime/renderers/framework-adapters/svelte",
    );
    const sources = await Promise.all(
      ["adapter.ts", "repeated-disclosure.ts"].map((file) =>
        readFile(path.join(sourceRoot, file), "utf8"),
      ),
    );
    const implementation = sources.join("\n");

    expect(implementation).toContain('kind === "repeated-disclosure"');
    expect(implementation).not.toMatch(
      /(?:component|componentName|componentId)\s*={2,3}\s*["']accordion["']/i,
    );
  });

  it("removes and exactly restores the private target home and registration in isolation", async () => {
    const sourcePortableRuntime = path.join(process.cwd(), "scripts/portable-runtime");
    const sourceHome = path.join(sourcePortableRuntime, "renderers/framework-adapters/svelte");
    const sourceRegistry = path.join(
      sourcePortableRuntime,
      "renderers/framework-adapters/target-registry.ts",
    );
    const fixtureRoot = await createTemporaryRoot({ insideRepository: true });
    const fixturePortableRuntime = path.join(fixtureRoot, "scripts/portable-runtime");
    const fixtureHome = path.join(fixturePortableRuntime, "renderers/framework-adapters/svelte");
    const fixtureRegistry = path.join(
      fixturePortableRuntime,
      "renderers/framework-adapters/target-registry.ts",
    );
    const runner = path.join(fixtureRoot, "run-primitive-generation.ts");
    const registrySource = await readFile(sourceRegistry, "utf8");

    await mkdir(fixturePortableRuntime, { recursive: true });
    await Promise.all(
      ["contracts", "renderers"].map((directory) =>
        cp(
          path.join(sourcePortableRuntime, directory),
          path.join(fixturePortableRuntime, directory),
          { recursive: true },
        ),
      ),
    );
    await writeFile(
      runner,
      [
        'import { generatePrimitiveWrappersForTarget } from "./scripts/portable-runtime/renderers/primitive-package-generator.ts";',
        "",
        "const [target, outputRoot] = process.argv.slice(2);",
        'if (!target || !outputRoot) throw new Error("target and output root are required");',
        "await generatePrimitiveWrappersForTarget(target as never, {",
        '  generatedBy: "isolated target-removal proof",',
        "  outputRoot,",
        "});",
        "",
      ].join("\n"),
      "utf8",
    );
    const committedFixture = await readTree(fixturePortableRuntime);
    const baselineRoot = path.join(fixtureRoot, "output/baseline");

    for (const target of ["astro", "react", "vue", "svelte"] as const) {
      await runIsolatedPrimitiveGeneration(runner, fixtureRoot, target, baselineRoot);
    }
    const baselineTargets = new Map(
      await Promise.all(
        ["astro", "react", "vue", "svelte"].map(
          async (target) => [target, await readTree(path.join(baselineRoot, target))] as const,
        ),
      ),
    );

    await rm(fixtureHome, { force: true, recursive: true });
    const registryWithoutSvelte = registrySource
      .replace('import { svelteFrameworkAdapterTarget } from "./svelte/index.js";\n', "")
      .replace("  svelteFrameworkAdapterTarget,\n", "")
      .replace(" | typeof svelteFrameworkAdapterTarget.target", "");
    await writeFile(fixtureRegistry, registryWithoutSvelte, "utf8");

    expect(registryWithoutSvelte).not.toContain("svelteFrameworkAdapterTarget");
    await expect(readdir(fixtureHome)).rejects.toMatchObject({ code: "ENOENT" });

    const withoutSvelteRoot = path.join(fixtureRoot, "output/without-svelte");
    for (const target of ["astro", "react", "vue"] as const) {
      await runIsolatedPrimitiveGeneration(runner, fixtureRoot, target, withoutSvelteRoot);
      expect(await readTree(path.join(withoutSvelteRoot, target)), target).toEqual(
        baselineTargets.get(target),
      );
    }
    await expect(
      runIsolatedPrimitiveGeneration(runner, fixtureRoot, "svelte", withoutSvelteRoot),
    ).rejects.toMatchObject({
      stderr: expect.stringContaining("Unsupported primitive Framework Adapter target: svelte"),
    });
    await expect(readdir(path.join(withoutSvelteRoot, "svelte"))).rejects.toMatchObject({
      code: "ENOENT",
    });

    await cp(sourceHome, fixtureHome, { recursive: true });
    await writeFile(fixtureRegistry, registrySource, "utf8");
    expect(await readTree(fixturePortableRuntime)).toEqual(committedFixture);

    const restoredRoot = path.join(fixtureRoot, "output/restored");
    await runIsolatedPrimitiveGeneration(runner, fixtureRoot, "svelte", restoredRoot);
    expect(await readTree(path.join(restoredRoot, "svelte"))).toEqual(
      baselineTargets.get("svelte"),
    );
  });

  it("keeps Svelte tooling and registration out of shipping manifests", async () => {
    const nonSvelteManifests = [
      "apps/demo/package.json",
      "apps/react-demo/package.json",
      "apps/vue-demo/package.json",
      "packages/astro/package.json",
      "packages/cli/package.json",
      "packages/core/package.json",
      "packages/react/package.json",
      "packages/runtime/package.json",
      "packages/vue/package.json",
    ];

    for (const manifest of nonSvelteManifests) {
      const source = await readFile(path.join(process.cwd(), manifest), "utf8");
      expect(source.toLowerCase(), manifest).not.toContain("svelte");
    }

    const packageManifest = JSON.parse(
      await readFile(path.join(process.cwd(), "packages/svelte/package.json"), "utf8"),
    );
    expect(packageManifest).toMatchObject({
      name: "@starwind-ui/svelte",
      private: true,
      sideEffects: false,
      version: "0.0.0",
    });
    expect(packageManifest.exports).toEqual(sveltePackageExports);
    const packageReadme = (
      await readFile(path.join(process.cwd(), "packages/svelte/README.md"), "utf8")
    ).replace(/\s+/g, " ");
    expect(packageReadme).toContain(
      "Its exact Primitive inventory is Button, Carousel, Checkbox, Select, Accordion, Dialog, Slider, and Toast.",
    );
    expect(packageReadme).toContain("This package is not public Svelte support.");

    for (const absentPath of [
      "apps/svelte-demo",
      "docs/svelte",
      "packages/cli/registry/svelte",
      "packages/cli/src/registry/svelte",
    ]) {
      await expect(readdir(path.join(process.cwd(), absentPath)), absentPath).rejects.toMatchObject(
        {
          code: "ENOENT",
        },
      );
    }

    for (const registryRoot of ["packages/cli/registry", "packages/cli/src/registry"]) {
      const registry = await readTree(path.join(process.cwd(), registryRoot));
      for (const [file, source] of registry) {
        expect(source, `${registryRoot}/${file}`).not.toContain("@starwind-ui/svelte");
      }
    }

    for (const publicReadme of [
      "README.md",
      "packages/astro/README.md",
      "packages/cli/README.md",
      "packages/react/README.md",
      "packages/runtime/README.md",
    ]) {
      expect(
        await readFile(path.join(process.cwd(), publicReadme), "utf8"),
        publicReadme,
      ).not.toContain("@starwind-ui/svelte");
    }
  });
});

async function createTemporaryRoot({
  insideRepository = false,
}: { insideRepository?: boolean } = {}): Promise<string> {
  const root = await mkdtemp(
    path.join(insideRepository ? process.cwd() : os.tmpdir(), ".starwind-svelte-target-removal-"),
  );
  temporaryRoots.push(root);
  return root;
}

async function runIsolatedPrimitiveGeneration(
  runner: string,
  fixtureRoot: string,
  target: string,
  outputRoot: string,
): Promise<void> {
  await execFileAsync(
    process.execPath,
    [tsxCliPath, runner, target, path.join(outputRoot, target)],
    { cwd: fixtureRoot },
  );
}

async function readTree(root: string): Promise<Map<string, string>> {
  const files = await listFiles(root);
  return new Map(
    await Promise.all(
      files.map(
        async (file) =>
          [path.relative(root, file).replaceAll("\\", "/"), await readFile(file, "utf8")] as const,
      ),
    ),
  );
}

async function listFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const candidate = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(candidate) : [candidate];
    }),
  );
  return files.flat().sort();
}
