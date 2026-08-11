import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import * as clackPrompts from "@clack/prompts";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { primitivesAdd, primitivesUpdate } from "../../src/commands/primitives.js";
import { PRIVATE_VUE_FRAMEWORK_TARGET_POLICY } from "../../src/utils/framework-target-policy.js";
import {
  getPrimitiveComponents,
  type PrimitiveVendoringArtifactSet,
} from "../../src/utils/primitive-component.js";
import {
  buildPrimitiveVendoringArtifacts,
  createCliRegistryBuildPolicy,
} from "../../../../scripts/portable-runtime/generate-cli-registry.js";
import { vueFrameworkAdapterTarget } from "../../../../scripts/portable-runtime/renderers/framework-adapters/vue/index.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
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

vi.mock("../../src/utils/package-manager.js", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../src/utils/package-manager.js")>();

  return {
    ...actual,
    installDependenciesWithProgress: vi.fn(),
  };
});

vi.mock("../../src/utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));

import * as packageManager from "../../src/utils/package-manager.js";

const mockInstallDependencies = vi.mocked(packageManager.installDependenciesWithProgress);
const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockLog = vi.mocked(clackPrompts.log);
const runtimePackage = JSON.parse(
  readFileSync(new URL("../../../runtime/package.json", import.meta.url), "utf8"),
) as { version: string };
const primitiveVersions = JSON.parse(
  readFileSync(new URL("../../registry/primitive-versions.json", import.meta.url), "utf8"),
) as { primitives: Record<string, string> };
const CURRENT_BETA_RUNTIME_SPEC = `@starwind-ui/runtime@^${runtimePackage.version}`;

describe.sequential("primitives add integration", () => {
  let tempDir = "";
  let previousCwd = "";
  let generatedArtifactRoot = "";
  let authoritativeVueArtifacts: PrimitiveVendoringArtifactSet<"astro" | "react" | "vue">;

  beforeAll(async () => {
    const repositoryRoot = fileURLToPath(new URL("../../../..", import.meta.url));
    generatedArtifactRoot = await mkdtemp(join(tmpdir(), "starwind-vue-primitive-artifacts-"));
    const generated = await buildPrimitiveVendoringArtifacts({
      repoRoot: repositoryRoot,
      targetPolicy: createCliRegistryBuildPolicy([vueFrameworkAdapterTarget]),
      tempRoot: generatedArtifactRoot,
    });
    authoritativeVueArtifacts = {
      ...generated,
      primitives: generated.primitives.map((artifact) => {
        if (artifact.framework !== "vue") {
          throw new Error(`Expected a Vue artifact for ${artifact.component}.`);
        }
        return { ...artifact, framework: "vue" as const };
      }),
    };
  });

  afterAll(async () => {
    await rm(generatedArtifactRoot, { recursive: true, force: true });
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    tempDir = await mkdtemp(join(tmpdir(), "starwind-primitives-add-test-"));
    previousCwd = process.cwd();
    process.chdir(tempDir);

    await writeFile(
      "package.json",
      JSON.stringify({ dependencies: { astro: "^5.0.0" } }, null, 2),
      "utf-8",
    );
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: "https://starwind.dev/config-schema.v2.json",
          version: 2,
          framework: "astro",
          registry: {
            source: "bundled",
            version: "0.1.0",
          },
          packageRequirements: {
            "@starwind-ui/runtime": "*",
          },
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          utilsDir: "src/lib/utils",
          components: [
            {
              name: "card",
              version: "2.0.0",
              framework: "astro",
              registry: "default",
            },
          ],
        },
        null,
        2,
      ),
      "utf-8",
    );
    mockInstallDependencies.mockResolvedValue(undefined);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("rejects every internally consistent mutation before reading private target facts", () => {
    type VueArtifactSet = PrimitiveVendoringArtifactSet<"astro" | "react" | "vue">;
    const probes: Array<{ name: string; mutate(artifacts: VueArtifactSet): void }> = [
      {
        name: "source root",
        mutate(artifacts) {
          const descriptor = artifacts.validation!.vue!;
          const previousRoot = descriptor.sourceRoot;
          descriptor.sourceRoot = "packages/vue-private/src";
          for (const primitive of artifacts.primitives) {
            for (const file of primitive.files) {
              file.sourcePath = file.sourcePath.replace(previousRoot, descriptor.sourceRoot);
            }
          }
        },
      },
      {
        name: "extension",
        mutate(artifacts) {
          const descriptor = artifacts.validation!.vue!;
          descriptor.generatedImportCandidateExtensions =
            descriptor.generatedImportCandidateExtensions.map((extension) =>
              extension === ".vue" ? ".sfc" : extension,
            );
          for (const rule of descriptor.editableContentMarkers) {
            rule.extensions = rule.extensions.map((extension) =>
              extension === ".vue" ? ".sfc" : extension,
            );
          }
          for (const primitive of artifacts.primitives) {
            for (const file of primitive.files) {
              file.path = file.path.replace(/\.vue$/, ".sfc");
              file.sourcePath = file.sourcePath.replace(/\.vue$/, ".sfc");
            }
          }
        },
      },
      {
        name: "editable marker",
        mutate(artifacts) {
          artifacts.validation!.vue!.editableContentMarkers[0]!.markers[0] =
            "<!-- Editable private artifact -->";
        },
      },
      {
        name: "forbidden marker",
        mutate(artifacts) {
          artifacts.validation!.vue!.forbiddenContent = ["Unrelated marker"];
        },
      },
      {
        name: "requirement",
        mutate(artifacts) {
          const changeRange = (requirement: { name: string; range: string }) => {
            if (requirement.name === "vue") requirement.range = ">=3.6";
          };
          artifacts.validation!.vue!.packageRequirements.forEach(changeRange);
          artifacts.primitives.forEach((primitive) =>
            primitive.packageRequirements.forEach(changeRange),
          );
        },
      },
      {
        name: "file content and source hash",
        mutate(artifacts) {
          const file = artifacts.primitives[0]!.files[0]!;
          file.content += "\n<!-- attacker mutation -->\n";
          file.sourceHash = `sha256:${createHash("sha256").update(file.content).digest("hex")}`;
        },
      },
      {
        name: "component",
        mutate(artifacts) {
          artifacts.primitives[0]!.component = "renamed-component";
        },
      },
    ];

    for (const probe of probes) {
      const artifacts = structuredClone(authoritativeVueArtifacts);
      probe.mutate(artifacts);
      expect(
        () =>
          getPrimitiveComponents({
            artifacts,
            framework: "vue",
            targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
          }),
        probe.name,
      ).toThrow(/trusted integrity fingerprint/);
    }
  });

  it("writes primitive source, installs missing packages from package.json, and records primitive metadata", async () => {
    await primitivesAdd(["button"], {
      packageManager: "pnpm",
      to: "src/reference/primitives",
      yes: true,
    });

    await expect(
      readFile(
        join(tempDir, "src", "reference", "primitives", "button", "ButtonRoot.astro"),
        "utf-8",
      ),
    ).resolves.toContain("data-sw-button");
    expect(mockInstallDependencies).toHaveBeenCalledWith([CURRENT_BETA_RUNTIME_SPEC], "pnpm");

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    expect(updatedConfig.components).toEqual([
      {
        name: "card",
        version: "2.0.0",
        framework: "astro",
        registry: "default",
      },
    ]);
    expect(updatedConfig.primitiveDir).toBe("src/reference/primitives");
    expect(updatedConfig.primitives).toEqual([
      {
        name: "button",
        version: primitiveVersions.primitives.button,
        framework: "astro",
        source: "bundled",
      },
    ]);
    expect(updatedConfig.packageRequirements).toBeUndefined();
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Successfully installed primitives:"),
    );
  });

  it("appends primitive metadata while preserving existing primitives and styled components", async () => {
    const config = JSON.parse(await readFile(join(tempDir, "starwind.config.json"), "utf-8"));
    config.primitives = [
      {
        name: "checkbox",
        version: "0.0.1",
        framework: "astro",
        source: "bundled",
      },
    ];
    await writeFile("starwind.config.json", JSON.stringify(config, null, 2), "utf-8");

    await primitivesAdd(["button"], { packageManager: "pnpm", yes: true });

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );

    expect(updatedConfig.components).toEqual([
      {
        name: "card",
        version: "2.0.0",
        framework: "astro",
        registry: "default",
      },
    ]);
    expect(updatedConfig.primitives).toEqual([
      {
        name: "checkbox",
        version: "0.0.1",
        framework: "astro",
        source: "bundled",
      },
      {
        name: "button",
        version: primitiveVersions.primitives.button,
        framework: "astro",
        source: "bundled",
      },
    ]);
  });

  it("protects existing primitive files by default in --yes mode", async () => {
    const targetPath = join(
      tempDir,
      "src",
      "components",
      "starwind-primitives",
      "button",
      "ButtonRoot.astro",
    );
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "local edit\n", "utf-8");

    await primitivesAdd(["button"], { packageManager: "pnpm", yes: true });

    await expect(readFile(targetPath, "utf-8")).resolves.toBe("local edit\n");
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("Skipped primitives:"));
  });

  it("overwrites existing primitive files when --overwrite is requested", async () => {
    const targetPath = join(
      tempDir,
      "src",
      "components",
      "starwind-primitives",
      "button",
      "ButtonRoot.astro",
    );
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "local edit\n", "utf-8");

    await primitivesAdd(["button"], { overwrite: true, packageManager: "pnpm", yes: true });

    await expect(readFile(targetPath, "utf-8")).resolves.toContain("data-sw-button");
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Successfully installed primitives:"),
    );
  });

  it("continues installing valid primitives when another requested primitive is skipped for local edits", async () => {
    const buttonPath = join(
      tempDir,
      "src",
      "components",
      "starwind-primitives",
      "button",
      "ButtonRoot.astro",
    );
    await mkdir(dirname(buttonPath), { recursive: true });
    await writeFile(buttonPath, "local edit\n", "utf-8");

    await primitivesAdd(["button", "checkbox"], { packageManager: "pnpm", yes: true });

    await expect(readFile(buttonPath, "utf-8")).resolves.toBe("local edit\n");
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-primitives", "checkbox", "CheckboxRoot.astro"),
        "utf-8",
      ),
    ).resolves.toContain("data-sw-checkbox");

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    expect(updatedConfig.primitives).toEqual([
      {
        name: "checkbox",
        version: primitiveVersions.primitives.checkbox,
        framework: "astro",
        source: "bundled",
      },
    ]);
    expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("Skipped primitives:"));
    expect(mockLog.success).toHaveBeenCalledWith(
      expect.stringContaining("Successfully installed primitives:"),
    );
  });

  it("prompts before primitive updates that require package changes", async () => {
    const config = JSON.parse(await readFile(join(tempDir, "starwind.config.json"), "utf-8"));
    config.primitives = [
      {
        name: "button",
        version: "0.0.0",
        framework: "astro",
        source: "bundled",
      },
    ];
    await writeFile("starwind.config.json", JSON.stringify(config, null, 2), "utf-8");
    mockConfirm.mockResolvedValue(false);

    await primitivesUpdate(["button"], { packageManager: "pnpm" });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Install required package updates"),
      }),
    );
    expect(mockInstallDependencies).not.toHaveBeenCalled();

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    expect(updatedConfig.primitives).toEqual([
      {
        name: "button",
        version: "0.0.0",
        framework: "astro",
        source: "bundled",
      },
    ]);
  });

  it("dry-runs primitive updates without writing files, installing packages, or mutating config", async () => {
    const config = JSON.parse(await readFile(join(tempDir, "starwind.config.json"), "utf-8"));
    config.primitives = [
      {
        name: "button",
        version: "0.0.0",
        framework: "astro",
        source: "bundled",
      },
    ];
    await writeFile("starwind.config.json", JSON.stringify(config, null, 2), "utf-8");

    const targetPath = join(
      tempDir,
      "src",
      "components",
      "starwind-primitives",
      "button",
      "ButtonRoot.astro",
    );
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "old primitive\n", "utf-8");

    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    try {
      await primitivesUpdate(["button"], { dryRun: true, packageManager: "pnpm" });
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Update Preview"));
    } finally {
      consoleLogSpy.mockRestore();
    }

    await expect(readFile(targetPath, "utf-8")).resolves.toBe("old primitive\n");
    expect(mockInstallDependencies).not.toHaveBeenCalled();

    const updatedConfig = JSON.parse(
      await readFile(join(tempDir, "starwind.config.json"), "utf-8"),
    );
    expect(updatedConfig.primitives).toEqual([
      {
        name: "button",
        version: "0.0.0",
        framework: "astro",
        source: "bundled",
      },
    ]);
  });

  it("vendors and updates authoritative generated Vue primitive families with exact provenance", async () => {
    await writeFile(
      "package.json",
      JSON.stringify({ dependencies: { vue: "^3.5.0" } }, null, 2),
      "utf-8",
    );
    const config = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    config.framework = "vue";
    await writeFile("starwind.config.json", JSON.stringify(config, null, 2), "utf-8");

    const representativeNames = [
      "button",
      "form",
      "popover",
      "select",
      "toast",
      "sidebar",
    ] as const;
    const representativeArtifacts = authoritativeVueArtifacts.primitives.filter(({ component }) =>
      representativeNames.includes(component as (typeof representativeNames)[number]),
    );
    expect(representativeArtifacts.map(({ component }) => component).sort()).toEqual(
      [...representativeNames].sort(),
    );
    expect(
      authoritativeVueArtifacts.primitives.some(({ component }) => component === "theme"),
    ).toBe(false);
    const dependencies = {
      artifacts: authoritativeVueArtifacts,
      targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
    };

    await primitivesAdd(
      [...representativeNames],
      { framework: "vue", packageManager: "pnpm", to: "src/private/vue", yes: true },
      dependencies,
    );

    for (const artifact of representativeArtifacts) {
      expect(artifact.version).toBe(primitiveVersions.primitives[artifact.component]);
      expect(artifact.packageRequirements).toEqual(
        expect.arrayContaining([
          { name: "@starwind-ui/runtime", range: `^${runtimePackage.version}` },
          { name: "vue", range: ">=3.5" },
        ]),
      );
      for (const file of artifact.files) {
        const relativePath = file.path.replace(
          "src/components/starwind-primitives",
          "src/private/vue",
        );
        await expect(readFile(join(tempDir, relativePath), "utf-8")).resolves.toBe(file.content);
        const editableHeader = file.path.endsWith(".vue")
          ? "<!-- Vendored by the Starwind CLI. You own this file in your project. -->"
          : "/**\n * Vendored by the Starwind CLI.\n * You own this file in your project.\n */";
        expect(file.content.startsWith(editableHeader), file.path).toBe(true);
        expect(file.content, file.path).not.toContain("Do not edit by hand");
        expect(file.content, file.path).not.toContain("Internal non-shipping Vue adapter output");
        expect(file.sourcePath).toMatch(/^packages\/vue\/src\//);
        expect(file.sourceHash).toBe(
          `sha256:${createHash("sha256").update(file.content).digest("hex")}`,
        );
      }
    }

    const sidebar = representativeArtifacts.find(({ component }) => component === "sidebar")!;
    expect(sidebar.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourcePath: "packages/vue/src/_internal/as-child.ts" }),
      ]),
    );
    expect(sidebar.files.some(({ content }) => content.includes("../_internal/as-child.js"))).toBe(
      true,
    );

    const installedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(installedConfig.primitiveDir).toBe("src/private/vue");
    installedConfig.primitives = installedConfig.primitives.map(
      (primitive: { name: string; version: string }) => ({ ...primitive, version: "0.0.0" }),
    );
    await writeFile("starwind.config.json", JSON.stringify(installedConfig, null, 2), "utf-8");
    for (const artifact of representativeArtifacts) {
      for (const file of artifact.files) {
        const relativePath = file.path.replace(
          "src/components/starwind-primitives",
          "src/private/vue",
        );
        await writeFile(relativePath, "stale local source\n", "utf-8");
      }
    }

    await primitivesUpdate(
      undefined,
      { all: true, framework: "vue", packageManager: "pnpm", yes: true },
      dependencies,
    );

    for (const artifact of representativeArtifacts) {
      for (const file of artifact.files) {
        const relativePath = file.path.replace(
          "src/components/starwind-primitives",
          "src/private/vue",
        );
        await expect(readFile(join(tempDir, relativePath), "utf-8")).resolves.toBe(file.content);
      }
    }
    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(
      Object.fromEntries(
        updatedConfig.primitives.map(({ name, version }: { name: string; version: string }) => [
          name,
          version,
        ]),
      ),
    ).toEqual(
      Object.fromEntries(
        representativeArtifacts.map(({ component, version }) => [component, version]),
      ),
    );
  });
});
