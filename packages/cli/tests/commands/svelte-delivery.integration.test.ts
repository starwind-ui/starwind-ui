import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as prompts from "@clack/prompts";
import semver from "semver";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildPrimitiveVendoringArtifacts,
  buildRuntimeRegistry,
  createCliRegistryBuildPolicy,
} from "../../../../scripts/portable-runtime/generate-cli-registry.js";
import { svelteFrameworkAdapterTarget } from "../../../../scripts/portable-runtime/renderers/framework-adapters/svelte/index.js";
import { add } from "../../src/commands/add.js";
import { docs } from "../../src/commands/docs.js";
import { primitivesAdd, primitivesList, primitivesUpdate } from "../../src/commands/primitives.js";
import { remove } from "../../src/commands/remove.js";
import { search } from "../../src/commands/search.js";
import { update } from "../../src/commands/update.js";
import { type StarwindConfigFor } from "../../src/utils/config.js";
import { PATHS } from "../../src/utils/constants.js";
import {
  type CliFrameworkTarget,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "../../src/utils/framework-target-policy.js";
import { installDependenciesWithProgress } from "../../src/utils/package-manager.js";
import { type PrimitiveVendoringArtifactSet } from "../../src/utils/primitive-component.js";
import { type StarwindRegistryFor } from "../../src/utils/registry.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
  isCancel: vi.fn().mockReturnValue(false),
  multiselect: vi.fn(),
  select: vi.fn(),
  spinner: vi.fn(() => ({ start: vi.fn(), stop: vi.fn(), message: vi.fn() })),
  tasks: vi.fn(async (tasks: Array<{ task: () => Promise<unknown> }>) => {
    for (const task of tasks) await task.task();
  }),
  log: {
    error: vi.fn(),
    warn: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
    step: vi.fn(),
  },
}));
vi.mock("../../src/utils/package-manager.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/utils/package-manager.js")>()),
  installDependenciesWithProgress: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../src/utils/pro-manifest.js", () => ({
  searchProBlocks: vi.fn().mockResolvedValue([]),
}));
vi.mock("../../src/utils/sleep.js", () => ({ sleep: vi.fn().mockResolvedValue(undefined) }));

const repoRoot = fileURLToPath(new URL("../../../..", import.meta.url));
let generationRoot: string;
let projectRoot: string;
let originalCwd: string;
let registry: StarwindRegistryFor<CliFrameworkTarget>;
let behaviorRegistry: StarwindRegistryFor<CliFrameworkTarget>;
let artifacts: PrimitiveVendoringArtifactSet<CliFrameworkTarget>;
const policy = PUBLIC_FRAMEWORK_TARGET_POLICY;
let output: ReturnType<typeof vi.spyOn>;
const styledDir = "src/custom/ui";
const primitiveDir = "src/reference/primitives";

async function write(file: string, content: string) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}
async function config(): Promise<StarwindConfigFor<CliFrameworkTarget>> {
  return JSON.parse(await readFile("starwind.config.json", "utf8"));
}
async function saveConfig(value: StarwindConfigFor<CliFrameworkTarget>) {
  await write("starwind.config.json", JSON.stringify(value, null, 2));
}
async function snapshot(directory = "."): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(result, await snapshot(file));
    else result[file] = await readFile(file, "utf8");
  }
  return result;
}
function selectComponent() {
  return registry.components.find(({ name }) => name === "select")!;
}
function selectArtifact() {
  return artifacts.primitives.find(({ component }) => component === "select")!;
}
function lastJson() {
  return JSON.parse(String(output.mock.calls.at(-1)![0]));
}

beforeAll(async () => {
  generationRoot = await mkdtemp(path.join(tmpdir(), "starwind-svelte-delivery-generation-"));
  const targetPolicy = createCliRegistryBuildPolicy([svelteFrameworkAdapterTarget]);
  registry = await buildRuntimeRegistry({ repoRoot, targetPolicy });
  artifacts = await buildPrimitiveVendoringArtifacts({ repoRoot, targetPolicy });
  const manifest = JSON.parse(
    await readFile(
      path.join(repoRoot, "packages/cli/registry/styled-component-versions.json"),
      "utf8",
    ),
  );
  manifest.components.select = semver.inc(manifest.components.select, "patch");
  const manifestPath = path.join(generationRoot, "behavior-versions.json");
  await writeFile(manifestPath, JSON.stringify(manifest));
  behaviorRegistry = await buildRuntimeRegistry({
    repoRoot,
    targetPolicy,
    versionManifestPath: manifestPath,
  });
}, 60_000);
afterAll(async () => {
  await rm(generationRoot, { recursive: true, force: true });
});
beforeEach(async () => {
  vi.clearAllMocks();
  originalCwd = process.cwd();
  projectRoot = await mkdtemp(path.join(tmpdir(), "starwind-svelte-delivery-project-"));
  process.chdir(projectRoot);
  vi.spyOn(process, "exit").mockImplementation((code) => {
    throw new Error(`exit:${code}`);
  });
  output = vi.spyOn(console, "log").mockImplementation(() => {});
  await write("package.json", JSON.stringify({ dependencies: { svelte: "^5.29.0" } }));
  await saveConfig({
    $schema: "https://starwind.dev/config-schema.v2.json",
    version: 2,
    framework: "svelte",
    registry: { source: "bundled", version: registry.version },
    componentDir: styledDir,
    utilsDir: "src/lib/utils",
    components: [],
    tailwind: { css: "src/styles/starwind.css", baseColor: "neutral", cssVariables: true },
  });
});
afterEach(async () => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
  await rm(projectRoot, { recursive: true, force: true });
});

describe.sequential("public Svelte component command delivery", () => {
  it("delivers the Styled lifecycle with dependencies, source ownership and behavior-only updates", async () => {
    const dependencies = { registry, targetPolicy: policy };
    const options = { framework: "svelte" as const, yes: true, packageManager: "pnpm" as const };
    await add(["select"], options, dependencies);
    const component = selectComponent();
    const installed = await config();
    const target = component.targets!.svelte!;
    expect(installed.components).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "select",
          framework: "svelte",
          version: component.version,
          registry: "default",
        }),
      ]),
    );
    for (const name of target.componentDependencies)
      expect(installed.components.some((entry) => entry.name === name)).toBe(true);
    const files = await snapshot(styledDir);
    const sourcePath = Object.keys(files).find((file) => file.endsWith("/select/Select.svelte"))!;
    expect(sourcePath).toBeDefined();
    expect(files[sourcePath]).toContain("@starwind-ui/svelte/select");
    expect(
      vi.mocked(installDependenciesWithProgress).mock.calls.flatMap(([packages]) => packages),
    ).toContain(
      `@starwind-ui/svelte@${JSON.parse(await readFile(path.join(repoRoot, "packages/svelte/package.json"), "utf8")).version}`,
    );
    const first = await snapshot();
    await add(["select"], options, dependencies);
    expect(await snapshot()).toEqual(first);
    await write(sourcePath, files[sourcePath]! + "\n<!-- local edit -->\n");
    await add(["select"], options, dependencies);
    expect(await readFile(sourcePath, "utf8")).toContain("local edit");
    const untracked = await config();
    untracked.components = untracked.components.filter(({ name }) => name !== "select");
    await saveConfig(untracked);
    await add(["select"], options, dependencies);
    expect(await readFile(sourcePath, "utf8")).toContain("local edit");
    expect(prompts.log.warn).toHaveBeenCalledWith(
      expect.stringContaining("Existing file conflicts"),
    );
    await add(["select"], { ...options, overwrite: true }, dependencies);
    expect(await readFile(sourcePath, "utf8")).toBe(files[sourcePath]);

    await write(sourcePath, files[sourcePath]! + "\n<!-- source update edit -->\n");
    const oldConfig = await config();
    oldConfig.components.find(({ name }) => name === "select")!.version = "0.0.0";
    await saveConfig(oldConfig);
    await update(["select"], options, dependencies);
    expect(await readFile(sourcePath, "utf8")).toBe(files[sourcePath]);
    expect((await config()).components.find(({ name }) => name === "select")!.version).toBe(
      component.version,
    );

    await write(sourcePath, files[sourcePath]! + "\n<!-- behavior update edit -->\n");
    const beforeBehavior = await snapshot(styledDir);
    await update(["select"], options, { registry: behaviorRegistry, targetPolicy: policy });
    expect(await snapshot(styledDir)).toEqual(beforeBehavior);
    expect((await config()).components.find(({ name }) => name === "select")!.version).toBe(
      behaviorRegistry.components.find(({ name }) => name === "select")!.version,
    );
    expect(prompts.log.success).toHaveBeenCalledWith(expect.stringContaining("behavior"));
    await remove(["select"], { framework: "svelte", yes: true }, { targetPolicy: policy });
    expect((await config()).components.some(({ name }) => name === "select")).toBe(false);
    await expect(readFile(sourcePath)).rejects.toThrow();
    await add(["select"], options, dependencies);
    expect(await readFile(sourcePath, "utf8")).toBe(files[sourcePath]);
  });

  it("installs each transitive Styled dependency under the configured directory", async () => {
    const parent = registry.components.find(
      (component) => (component.targets?.svelte?.componentDependencies.length ?? 0) > 0,
    )!;
    expect(parent).toBeDefined();
    await add(
      [parent.name],
      { framework: "svelte", yes: true },
      { registry, targetPolicy: policy },
    );
    const installed = await config();
    const visit = async (name: string): Promise<void> => {
      const component = registry.components.find((entry) => entry.name === name)!;
      expect(installed.components).toContainEqual(
        expect.objectContaining({ name, framework: "svelte", version: component.version }),
      );
      expect(Object.keys(await snapshot(path.join(styledDir, name))).length).toBeGreaterThan(0);
      for (const dependency of component.targets!.svelte!.componentDependencies)
        await visit(dependency);
    };
    await visit(parent.name);
  });

  it("keeps Astro primary files and metadata separate from the secondary Svelte directory", async () => {
    const initial = await config();
    initial.framework = "astro";
    initial.componentDir = "src/astro/ui";
    initial.componentDirs = { svelte: styledDir };
    initial.components = [
      { name: "select", framework: "astro", version: "1.0.0", registry: "default" },
    ];
    await saveConfig(initial);
    await write("src/astro/ui/select/index.ts", "export const preserve = true;\n");
    const before = await snapshot("src/astro");
    await add(["select"], { framework: "svelte", yes: true }, { registry, targetPolicy: policy });
    expect((await config()).framework).toBe("astro");
    expect((await config()).components.filter(({ name }) => name === "select")).toHaveLength(2);
    await remove(["select"], { framework: "svelte", yes: true }, { targetPolicy: policy });
    expect(await snapshot("src/astro")).toEqual(before);
    expect((await config()).components).toContainEqual(initial.components[0]);
  });

  it("vendors the complete Select helper closure and preserves edits until explicit source replacement", async () => {
    const dependencies = { artifacts, targetPolicy: policy };
    const options = { framework: "svelte" as const, yes: true, packageManager: "pnpm" as const };
    await primitivesAdd(["select"], { ...options, to: primitiveDir }, dependencies);
    const artifact = selectArtifact();
    expect(artifact.files.some(({ path }) => path.endsWith("/index.ts"))).toBe(true);
    const written = await snapshot(primitiveDir);
    expect(Object.keys(written)).toHaveLength(artifact.files.length);
    for (const file of artifact.files) {
      const destination = path.join(
        primitiveDir,
        path.posix.relative(PATHS.LOCAL_STARWIND_PRIMITIVES_DIR, file.path),
      );
      expect(written[destination]).toBe(file.content);
      expect(file.content).not.toContain("DO NOT EDIT");
    }
    expect(
      vi.mocked(installDependenciesWithProgress).mock.calls.flatMap(([packages]) => packages),
    ).toEqual(
      expect.arrayContaining(
        artifact.packageRequirements
          .filter(({ name }) => name !== "svelte")
          .map(({ name, range }) => `${name}@${range}`),
      ),
    );
    const selectedFile = Object.keys(written).find((file) => file.endsWith("SelectRoot.svelte"))!;
    await write(selectedFile, written[selectedFile]! + "\n<!-- primitive local edit -->\n");
    await primitivesAdd(["select"], options, dependencies);
    await primitivesUpdate(["select"], options, dependencies);
    expect(await readFile(selectedFile, "utf8")).toContain("primitive local edit");
    const outdated = await config();
    outdated.primitives!.find(({ name }) => name === "select")!.version = "0.0.0";
    await saveConfig(outdated);
    await primitivesUpdate(["select"], options, dependencies);
    expect(await readFile(selectedFile, "utf8")).toBe(written[selectedFile]);
    expect((await config()).primitives).toContainEqual(
      expect.objectContaining({
        name: "select",
        framework: "svelte",
        version: artifact.version,
        source: "bundled",
      }),
    );
  });

  it("uses the generated metadata for docs, Styled search and filtered Primitive discovery", async () => {
    const dependencies = { registry, artifacts, targetPolicy: policy };
    await docs(["select"], { json: true }, dependencies);
    expect(lastJson()).toEqual([
      { component: "select", url: "https://starwind.dev/docs/components/select/" },
    ]);
    await search("select", { json: true }, dependencies);
    expect(lastJson().coreComponents.results).toContainEqual(
      expect.objectContaining({
        name: "select",
        frameworkTargets: ["svelte"],
        version: selectComponent().version,
      }),
    );
    await primitivesList({ framework: "svelte", json: true }, dependencies);
    expect(lastJson().primitives.total).toBe(36);
    expect(
      lastJson().primitives.results.every(
        (entry: { framework: string }) => entry.framework === "svelte",
      ),
    ).toBe(true);
    await search("select", { primitives: true, framework: "svelte", json: true }, dependencies);
    expect(lastJson().primitives.results).toContainEqual(
      expect.objectContaining({
        name: "select",
        framework: "svelte",
        fileCount: selectArtifact().files.length,
        installCommand: "starwind primitives add select --framework svelte",
      }),
    );
    await search("select", { primitives: true, framework: "react", json: true }, dependencies);
    expect(lastJson().primitives.total).toBe(0);
  });

  it("rejects unsafe destination paths before mutation", async () => {
    const before = await snapshot();
    await expect(
      primitivesAdd(
        ["select"],
        { framework: "svelte", yes: true, to: "../outside" },
        { artifacts, targetPolicy: policy },
      ),
    ).rejects.toThrow("exit:1");
    expect(await snapshot()).toEqual(before);
    expect(installDependenciesWithProgress).not.toHaveBeenCalled();
  });
});
