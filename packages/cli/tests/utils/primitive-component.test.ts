import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, stat, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";

import type { StarwindConfig, StarwindConfigFor } from "../../src/utils/config.js";
import * as config from "../../src/utils/config.js";
import * as dependencyResolver from "../../src/utils/dependency-resolver.js";
import { PRIVATE_VUE_FRAMEWORK_TARGET_POLICY } from "../../src/utils/framework-target-policy.js";
import * as packageManager from "../../src/utils/package-manager.js";
import {
  getPrimitiveComponents,
  installPrimitiveComponents,
  planPrimitiveComponentUpdates,
  type PrimitiveVendoringArtifact,
  type PrimitiveVendoringArtifactSet,
  updatePrimitiveComponents,
} from "../../src/utils/primitive-component.js";
import {
  buildPrimitiveVendoringArtifacts,
  createCliRegistryBuildPolicy,
} from "../../../../scripts/portable-runtime/generate-cli-registry.js";
import { vueFrameworkAdapterTarget } from "../../../../scripts/portable-runtime/renderers/framework-adapters/vue/index.js";

vi.mock("@clack/prompts", () => ({
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  log: {
    warn: vi.fn(),
  },
}));
vi.mock("../../src/utils/config.js");
vi.mock("../../src/utils/dependency-resolver.js");
vi.mock("../../src/utils/package-manager.js");

const mockUpdateConfig = vi.mocked(config.updateConfig);
const mockFilterUninstalledDependencies = vi.mocked(
  dependencyResolver.filterUninstalledDependencies,
);
const mockInstallDependencies = vi.mocked(packageManager.installDependenciesWithProgress);
const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockPromptLog = vi.mocked(clackPrompts.log);

const primitiveConfig: StarwindConfig = {
  $schema: "https://starwind.dev/config-schema.v2.json",
  version: 2,
  framework: "astro",
  registry: {
    source: "bundled",
    version: "0.1.0",
  },
  tailwind: {
    css: "src/styles/starwind.css",
    baseColor: "neutral",
    cssVariables: true,
  },
  componentDir: "src/components/starwind",
  primitiveDir: "src/components/starwind-primitives",
  utilsDir: "src/lib/utils",
  components: [],
  primitives: [],
};

const reactPrimitiveConfig: StarwindConfig = {
  ...primitiveConfig,
  framework: "react",
};

const reactHelperContent =
  'import * as React from "react";\nexport const useIsomorphicLayoutEffect = typeof window === "undefined" ? React.useEffect : React.useLayoutEffect;\n';

function primitiveArtifact(version = "0.1.0"): PrimitiveVendoringArtifact {
  return {
    component: "button",
    framework: "astro",
    version,
    packageRequirements: [{ name: "@starwind-ui/runtime", range: "^1.0.0" }],
    files: [
      {
        path: "src/components/starwind-primitives/button/ButtonRoot.astro",
        sourcePath: "packages/astro/src/button/ButtonRoot.astro",
        sourceHash: "sha256:abc",
        content: "---\n---\n<button data-sw-button><slot /></button>\n",
      },
      {
        path: "src/components/starwind-primitives/button/index.ts",
        sourcePath: "packages/astro/src/button/index.ts",
        sourceHash: "sha256:def",
        content: 'import ButtonRoot from "./ButtonRoot.astro";\nexport { ButtonRoot };\n',
      },
    ],
  };
}

function reactPrimitiveArtifact(version = "0.1.0"): PrimitiveVendoringArtifact {
  return {
    component: "button",
    framework: "react",
    version,
    packageRequirements: [
      { name: "@starwind-ui/runtime", range: "^1.0.0" },
      { name: "react", range: ">=18" },
      { name: "react-dom", range: ">=18" },
    ],
    files: [
      {
        path: "src/components/starwind-primitives/button/ButtonRoot.tsx",
        sourcePath: "packages/react/src/button/ButtonRoot.tsx",
        sourceHash: "sha256:abc",
        content:
          'import * as React from "react";\nimport { createButton } from "@starwind-ui/runtime/button";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\nexport function ButtonRoot() { useIsomorphicLayoutEffect(() => createButton(document.createElement("button")).destroy(), []); return <button />; }\n',
      },
      {
        path: "src/components/starwind-primitives/button/index.ts",
        sourcePath: "packages/react/src/button/index.ts",
        sourceHash: "sha256:def",
        content: 'export { ButtonRoot } from "./ButtonRoot";\n',
      },
      {
        path: "src/components/starwind-primitives/internal/use-isomorphic-layout-effect.ts",
        sourcePath: "packages/react/src/internal/use-isomorphic-layout-effect.ts",
        sourceHash: "sha256:ghi",
        content: reactHelperContent,
      },
    ],
  };
}

function reactToastPrimitiveArtifact(version = "0.1.0"): PrimitiveVendoringArtifact {
  return {
    component: "toast",
    framework: "react",
    version,
    packageRequirements: [
      { name: "@starwind-ui/runtime", range: "^1.0.0" },
      { name: "react", range: ">=18" },
      { name: "react-dom", range: ">=18" },
    ],
    files: [
      {
        path: "src/components/starwind-primitives/toast/ToastViewport.tsx",
        sourcePath: "packages/react/src/toast/ToastViewport.tsx",
        sourceHash: "sha256:toast",
        content:
          'import { createToastManager } from "@starwind-ui/runtime/toast";\nimport { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\nexport function ToastViewport() { useIsomorphicLayoutEffect(() => createToastManager(document.createElement("div")).destroy(), []); return <div />; }\n',
      },
      {
        path: "src/components/starwind-primitives/internal/use-isomorphic-layout-effect.ts",
        sourcePath: "packages/react/src/internal/use-isomorphic-layout-effect.ts",
        sourceHash: "sha256:ghi",
        content: reactHelperContent,
      },
    ],
  };
}

async function createDirectoryLink(target: string, linkPath: string): Promise<Error | undefined> {
  try {
    await symlink(target, linkPath, process.platform === "win32" ? "junction" : "dir");
  } catch (error) {
    if (
      process.platform === "win32" &&
      error instanceof Error &&
      "code" in error &&
      error.code === "EPERM"
    ) {
      return error;
    }

    throw error;
  }
}

const vendoredVueHeader =
  "<!-- Vendored by the Starwind CLI. You own this file in your project. -->";
const primitiveVersionManifest = JSON.parse(
  readFileSync(new URL("../../registry/primitive-versions.json", import.meta.url), "utf8"),
) as { primitives: Record<string, string> };
const runtimePackage = JSON.parse(
  readFileSync(new URL("../../../runtime/package.json", import.meta.url), "utf8"),
) as { version: string };

function createValidVueArtifact(): PrimitiveVendoringArtifact<"astro" | "react" | "vue"> {
  const file = withVueFileContent(
    {
      path: "src/components/starwind-primitives/button/ButtonRoot.vue",
      sourcePath: "packages/vue/src/button/ButtonRoot.vue",
      sourceHash: "",
      content: "",
    },
    vendoredVueHeader + "\n<button data-sw-button />\n",
  );

  return {
    component: "button",
    framework: "vue",
    version: primitiveVersionManifest.primitives.button!,
    packageRequirements: [
      { name: "@starwind-ui/runtime", range: `^${runtimePackage.version}` },
      { name: "vue", range: ">=3.5" },
    ],
    files: [file],
  };
}

function createValidVueArtifactSet(
  artifact: PrimitiveVendoringArtifact<"astro" | "react" | "vue">,
): PrimitiveVendoringArtifactSet<"astro" | "react" | "vue"> {
  const generatedRequirements = createValidVueArtifact().packageRequirements;
  return {
    primitives: [artifact],
    validation: {
      vue: {
        editableContentMarkers: [
          {
            extensions: [".vue"],
            markers: [vendoredVueHeader],
            position: "prefix",
          },
          {
            extensions: [".ts", ".js"],
            markers: ["// Vendored by the Starwind CLI.\n// You own this file in your project."],
            position: "prefix",
          },
        ],
        forbiddenContent: ["Internal non-shipping Vue adapter output"],
        generatedImportCandidateExtensions: [".vue", ".ts", ".js"],
        packageRequirements: generatedRequirements,
        sourceRoot: "packages/vue/src",
      },
    },
  };
}

function withVueFileContent(
  file: PrimitiveVendoringArtifact<"astro" | "react" | "vue">["files"][number],
  content: string,
) {
  return {
    ...file,
    content,
    sourceHash: `sha256:${createHash("sha256").update(content).digest("hex")}`,
  };
}

describe.sequential("primitive component vendoring", () => {
  let tempDir = "";
  let previousCwd = "";

  beforeEach(async () => {
    vi.clearAllMocks();

    tempDir = await mkdtemp(join(tmpdir(), "starwind-primitive-component-test-"));
    previousCwd = process.cwd();
    process.chdir(tempDir);
    mockFilterUninstalledDependencies.mockImplementation(async (packages) => packages);
    mockInstallDependencies.mockResolvedValue(undefined);
    mockUpdateConfig.mockResolvedValue(undefined);
    mockConfirm.mockResolvedValue(true);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("rejects primitive writes through an external directory link before package or config mutations", async ({
    skip,
  }) => {
    const externalDir = await mkdtemp(join(tmpdir(), "starwind-primitive-external-test-"));
    const primitiveRoot = join(tempDir, "src", "components", "starwind-primitives");
    await mkdir(dirname(primitiveRoot), { recursive: true });

    try {
      const linkError = await createDirectoryLink(externalDir, primitiveRoot);
      if (linkError) skip(`Windows junction creation failed with EPERM: ${linkError.message}`);

      const result = await installPrimitiveComponents(["button"], {
        artifacts: { primitives: [primitiveArtifact()] },
        config: primitiveConfig,
        packageManager: "pnpm",
        skipPrompts: true,
      });

      expect(result.failed).toEqual([
        expect.objectContaining({ name: "button", error: expect.stringMatching(/outside/i) }),
      ]);
      await expect(
        readFile(join(externalDir, "button", "ButtonRoot.astro"), "utf-8"),
      ).rejects.toThrow();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    } finally {
      await rm(externalDir, { recursive: true, force: true });
    }
  });

  it("rejects a traversing primitive directory before writing inside or outside the project", async () => {
    const externalDir = await mkdtemp(join(tmpdir(), "starwind-primitive-traversal-test-"));

    try {
      const result = await installPrimitiveComponents(["button"], {
        artifacts: { primitives: [primitiveArtifact()] },
        config: primitiveConfig,
        packageManager: "pnpm",
        primitiveDir: relative(tempDir, externalDir),
        skipPrompts: true,
      });

      expect(result.failed).toEqual([
        expect.objectContaining({ name: "button", error: expect.stringMatching(/inside/i) }),
      ]);
      await expect(
        readFile(join(externalDir, "button", "ButtonRoot.astro"), "utf-8"),
      ).rejects.toThrow();
      await expect(
        readFile(
          join(tempDir, "src", "components", "starwind-primitives", "button", "ButtonRoot.astro"),
          "utf-8",
        ),
      ).rejects.toThrow();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    } finally {
      await rm(externalDir, { recursive: true, force: true });
    }
  });

  it("copies primitive source, preserves unrelated files, installs Runtime, and records primitive metadata", async () => {
    const unrelatedPath = join(
      tempDir,
      "src",
      "components",
      "starwind-primitives",
      "button",
      "local-note.md",
    );
    await mkdir(dirname(unrelatedPath), { recursive: true });
    await writeFile(unrelatedPath, "keep me\n", "utf-8");

    const result = await installPrimitiveComponents(["button"], {
      artifacts: { primitives: [primitiveArtifact()] },
      config: primitiveConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.failed).toEqual([]);
    expect(result.installed).toEqual([{ name: "button", status: "installed", version: "0.1.0" }]);
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-primitives", "button", "ButtonRoot.astro"),
        "utf-8",
      ),
    ).resolves.toContain("data-sw-button");
    await expect(readFile(unrelatedPath, "utf-8")).resolves.toBe("keep me\n");
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/runtime@^1.0.0"], "pnpm");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        primitiveDir: "src/components/starwind-primitives",
        primitives: [
          {
            name: "button",
            version: "0.1.0",
            framework: "astro",
            source: "bundled",
          },
        ],
      },
      { appendComponents: true },
    );
  });

  it("copies React primitive source with shared helpers and records React primitive metadata", async () => {
    const result = await installPrimitiveComponents(["button"], {
      artifacts: { primitives: [reactPrimitiveArtifact()] },
      config: reactPrimitiveConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.failed).toEqual([]);
    expect(result.installed).toEqual([{ name: "button", status: "installed", version: "0.1.0" }]);
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-primitives", "button", "ButtonRoot.tsx"),
        "utf-8",
      ),
    ).resolves.toContain("@starwind-ui/runtime/button");
    await expect(
      readFile(
        join(
          tempDir,
          "src",
          "components",
          "starwind-primitives",
          "internal",
          "use-isomorphic-layout-effect.ts",
        ),
        "utf-8",
      ),
    ).resolves.toContain("useIsomorphicLayoutEffect");
    expect(mockInstallDependencies).toHaveBeenCalledWith(
      ["@starwind-ui/runtime@^1.0.0", "react@>=18", "react-dom@>=18"],
      "pnpm",
    );
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        primitiveDir: "src/components/starwind-primitives",
        primitives: [
          {
            name: "button",
            version: "0.1.0",
            framework: "react",
            source: "bundled",
          },
        ],
      },
      { appendComponents: true },
    );
  });

  it("installs the same primitive name for an alternate framework using that framework's default primitive directory", async () => {
    const result = await installPrimitiveComponents(["button"], {
      artifacts: { primitives: [reactPrimitiveArtifact()] },
      config: {
        ...primitiveConfig,
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      },
      framework: "react",
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.failed).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(result.installed).toEqual([{ name: "button", status: "installed", version: "0.1.0" }]);
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-react-primitives", "button", "ButtonRoot.tsx"),
        "utf-8",
      ),
    ).resolves.toContain("@starwind-ui/runtime/button");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        primitiveDirs: {
          react: "src/components/starwind-react-primitives",
        },
        primitives: [
          {
            name: "button",
            version: "0.1.0",
            framework: "react",
            source: "bundled",
          },
        ],
      },
      { appendComponents: true },
    );
  });

  it("records a destination override on the alternate framework primitive directory", async () => {
    const result = await installPrimitiveComponents(["button"], {
      artifacts: { primitives: [reactPrimitiveArtifact()] },
      config: primitiveConfig,
      framework: "react",
      packageManager: "pnpm",
      primitiveDir: "src/reference/react-primitives",
      skipPrompts: true,
    });

    expect(result.installed).toEqual([{ name: "button", status: "installed", version: "0.1.0" }]);
    await expect(
      readFile(
        join(tempDir, "src", "reference", "react-primitives", "button", "ButtonRoot.tsx"),
        "utf-8",
      ),
    ).resolves.toContain("@starwind-ui/runtime/button");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        primitiveDirs: {
          react: "src/reference/react-primitives",
        },
        primitives: [
          {
            name: "button",
            version: "0.1.0",
            framework: "react",
            source: "bundled",
          },
        ],
      },
      { appendComponents: true },
    );
  });

  it("installs a new React primitive when its existing shared helper is unchanged", async () => {
    await installPrimitiveComponents(["button"], {
      artifacts: { primitives: [reactPrimitiveArtifact()] },
      config: reactPrimitiveConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });
    vi.clearAllMocks();
    mockFilterUninstalledDependencies.mockImplementation(async (packages) => packages);
    mockInstallDependencies.mockResolvedValue(undefined);
    mockUpdateConfig.mockResolvedValue(undefined);

    const result = await installPrimitiveComponents(["toast"], {
      artifacts: { primitives: [reactToastPrimitiveArtifact()] },
      config: {
        ...reactPrimitiveConfig,
        primitives: [{ name: "button", version: "0.1.0", framework: "react", source: "bundled" }],
      },
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.failed).toEqual([]);
    expect(result.skipped).toEqual([]);
    expect(result.installed).toEqual([{ name: "toast", status: "installed", version: "0.1.0" }]);
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-primitives", "toast", "ToastViewport.tsx"),
        "utf-8",
      ),
    ).resolves.toContain("@starwind-ui/runtime/toast");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        primitives: [
          {
            name: "toast",
            version: "0.1.0",
            framework: "react",
            source: "bundled",
          },
        ],
      }),
      { appendComponents: true },
    );
  });

  it("supports primitive directories with trailing slashes for add and update", async () => {
    const configWithTrailingSlash: StarwindConfig = {
      ...primitiveConfig,
      primitiveDir: "src/components/starwind-primitives/",
    };

    const installResult = await installPrimitiveComponents(["button"], {
      artifacts: { primitives: [primitiveArtifact()] },
      config: configWithTrailingSlash,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(installResult.installed).toEqual([
      { name: "button", status: "installed", version: "0.1.0" },
    ]);
    await expect(
      readFile(
        join(tempDir, "src", "components", "starwind-primitives", "button", "ButtonRoot.astro"),
        "utf-8",
      ),
    ).resolves.toContain("data-sw-button");

    vi.clearAllMocks();
    mockFilterUninstalledDependencies.mockResolvedValue([]);
    mockUpdateConfig.mockResolvedValue(undefined);

    const updateResult = await updatePrimitiveComponents(["button"], {
      artifacts: { primitives: [primitiveArtifact("0.2.0")] },
      config: {
        ...configWithTrailingSlash,
        primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
      },
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(updateResult.updated).toEqual([
      {
        delivery: "source",
        name: "button",
        status: "updated",
        oldVersion: "0.1.0",
        newVersion: "0.2.0",
      },
    ]);
  });

  it("prompts before overwriting matching primitive files and leaves them unchanged when refused", async () => {
    const targetPath = join(
      tempDir,
      "src",
      "components",
      "starwind-primitives",
      "button",
      "ButtonRoot.astro",
    );
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "old local edit\n", "utf-8");
    mockConfirm.mockResolvedValue(false);

    const result = await installPrimitiveComponents(["button"], {
      artifacts: { primitives: [primitiveArtifact()] },
      config: primitiveConfig,
      packageManager: "pnpm",
      skipPrompts: false,
    });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Existing primitive files were found"),
      }),
    );
    expect(result.installed).toEqual([]);
    expect(result.skipped).toEqual([{ name: "button", status: "skipped", version: "0.1.0" }]);
    await expect(readFile(targetPath, "utf-8")).resolves.toBe("old local edit\n");
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("warns and skips primitive updates when required Runtime package updates are declined", async () => {
    const currentConfig: StarwindConfig = {
      ...primitiveConfig,
      primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
    };
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
    mockFilterUninstalledDependencies.mockResolvedValue(["@starwind-ui/runtime@^1.0.0"]);
    mockConfirm.mockResolvedValue(false);

    const result = await updatePrimitiveComponents(["button"], {
      artifacts: {
        primitives: [{ ...primitiveArtifact("0.2.0"), sourceVersion: "0.1.0" }],
      },
      config: currentConfig,
      packageManager: "pnpm",
      skipPrompts: false,
    });

    expect(mockPromptLog.warn).toHaveBeenCalledWith(
      expect.stringContaining("@starwind-ui/runtime@^1.0.0"),
    );
    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("Install required package updates"),
      }),
    );
    expect(result.updated).toEqual([]);
    expect(result.skipped).toEqual([
      {
        delivery: "behavior",
        name: "button",
        status: "skipped",
        oldVersion: "0.1.0",
        newVersion: "0.2.0",
      },
    ]);
    await expect(readFile(targetPath, "utf-8")).resolves.toBe("old primitive\n");
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("delivers a primitive behavior update without creating or rewriting source files", async () => {
    const currentConfig: StarwindConfig = {
      ...primitiveConfig,
      primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
    };
    const artifact = {
      ...primitiveArtifact("0.2.0"),
      sourceVersion: "0.1.0",
    };
    const targetPath = join(
      tempDir,
      "src",
      "components",
      "starwind-primitives",
      "button",
      "ButtonRoot.astro",
    );
    const absentIndexPath = join(dirname(targetPath), "index.ts");
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "custom primitive\n", "utf-8");
    mockFilterUninstalledDependencies.mockResolvedValue([]);

    const plan = await planPrimitiveComponentUpdates(["button"], {
      artifacts: { primitives: [artifact] },
      config: currentConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });
    expect(plan.updates).toEqual([expect.objectContaining({ delivery: "behavior", files: [] })]);
    expectTypeOf(plan.updates[0]!.delivery).toEqualTypeOf<"source" | "behavior">();

    const result = await updatePrimitiveComponents(["button"], {
      artifacts: { primitives: [artifact] },
      config: currentConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.updated).toEqual([
      {
        delivery: "behavior",
        name: "button",
        status: "updated",
        oldVersion: "0.1.0",
        newVersion: "0.2.0",
      },
    ]);
    expectTypeOf(result.updated[0]!.delivery).toEqualTypeOf<"source" | "behavior">();
    await expect(readFile(targetPath, "utf-8")).resolves.toBe("custom primitive\n");
    await expect(readFile(absentIndexPath, "utf-8")).rejects.toThrow();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        primitives: [{ name: "button", version: "0.2.0", framework: "astro", source: "bundled" }],
      }),
      { appendComponents: false },
    );
  });

  it("does not create a Primitive destination directory for behavior delivery", async () => {
    const currentConfig: StarwindConfig = {
      ...primitiveConfig,
      primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
    };
    const destinationDir = join(tempDir, "src", "components", "starwind-primitives", "button");
    mockFilterUninstalledDependencies.mockResolvedValue([]);

    await expect(stat(destinationDir)).rejects.toThrow();

    const result = await updatePrimitiveComponents(["button"], {
      artifacts: {
        primitives: [{ ...primitiveArtifact("0.2.0"), sourceVersion: "0.1.0" }],
      },
      config: currentConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.updated).toEqual([
      {
        delivery: "behavior",
        name: "button",
        status: "updated",
        oldVersion: "0.1.0",
        newVersion: "0.2.0",
      },
    ]);
    await expect(stat(destinationDir)).rejects.toThrow();
  });

  it("delivers primitive source files when the installed version predates a later source release", async () => {
    const currentConfig: StarwindConfig = {
      ...primitiveConfig,
      primitives: [{ name: "button", version: "0.1.0", framework: "astro", source: "bundled" }],
    };
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
    mockFilterUninstalledDependencies.mockResolvedValue([]);

    const result = await updatePrimitiveComponents(["button"], {
      artifacts: {
        primitives: [{ ...primitiveArtifact("0.3.0"), sourceVersion: "0.2.0" }],
      },
      config: currentConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.updated).toEqual([
      {
        delivery: "source",
        name: "button",
        status: "updated",
        oldVersion: "0.1.0",
        newVersion: "0.3.0",
      },
    ]);
    await expect(readFile(targetPath, "utf-8")).resolves.toContain("data-sw-button");
  });

  it("plans primitive behavior delivery after a skipped source release", async () => {
    const plan = await planPrimitiveComponentUpdates(["button"], {
      artifacts: {
        primitives: [{ ...primitiveArtifact("0.4.0"), sourceVersion: "0.2.0" }],
      },
      config: {
        ...primitiveConfig,
        primitives: [{ name: "button", version: "0.3.0", framework: "astro", source: "bundled" }],
      },
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(plan.updates).toEqual([expect.objectContaining({ delivery: "behavior", files: [] })]);
  });

  it("updates an explicit framework primitive without replacing the same primitive for another framework", async () => {
    const currentConfig: StarwindConfig = {
      ...primitiveConfig,
      primitiveDirs: {
        react: "src/components/starwind-react-primitives",
      },
      primitives: [
        { name: "button", version: "0.1.0", framework: "astro", source: "bundled" },
        { name: "button", version: "0.1.0", framework: "react", source: "bundled" },
      ],
    };
    const targetPath = join(
      tempDir,
      "src",
      "components",
      "starwind-react-primitives",
      "button",
      "ButtonRoot.tsx",
    );
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, "old react primitive\n", "utf-8");
    mockFilterUninstalledDependencies.mockResolvedValue([]);

    const result = await updatePrimitiveComponents(["button"], {
      artifacts: { primitives: [primitiveArtifact("0.2.0"), reactPrimitiveArtifact("0.2.0")] },
      config: currentConfig,
      framework: "react",
      packageManager: "pnpm",
      skipPrompts: true,
    });

    expect(result.updated).toEqual([
      {
        delivery: "source",
        name: "button",
        status: "updated",
        oldVersion: "0.1.0",
        newVersion: "0.2.0",
      },
    ]);
    await expect(readFile(targetPath, "utf-8")).resolves.toContain("@starwind-ui/runtime/button");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      {
        primitiveDirs: {
          react: "src/components/starwind-react-primitives",
        },
        primitives: [
          { name: "button", version: "0.1.0", framework: "astro", source: "bundled" },
          { name: "button", version: "0.2.0", framework: "react", source: "bundled" },
        ],
      },
      { appendComponents: false },
    );
  });
  it("vendors and updates a valid Vue artifact only through the private policy", async () => {
    const vueConfig: StarwindConfigFor<"astro" | "react" | "vue"> = {
      ...primitiveConfig,
      framework: "vue",
      primitives: [],
    };
    const vueArtifact = createValidVueArtifact();

    const publicResult = await installPrimitiveComponents(["button"], {
      artifacts: createValidVueArtifactSet(vueArtifact),
      config: vueConfig,
      packageManager: "pnpm",
      skipPrompts: true,
    });
    expect(publicResult.failed[0]?.error).toContain("Astro and React");

    await expect(
      installPrimitiveComponents(["button"], {
        artifacts: createValidVueArtifactSet(vueArtifact),
        config: vueConfig,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      }),
    ).rejects.toThrow(/trusted integrity fingerprint/);
    expect(mockInstallDependencies).not.toHaveBeenCalled();
  });

  it("rejects a handcrafted private document before descriptor validation", () => {
    const artifactSet = createValidVueArtifactSet(createValidVueArtifact());

    expect(() =>
      getPrimitiveComponents({
        artifacts: artifactSet,
        framework: "vue",
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      }),
    ).toThrow(/trusted integrity fingerprint/);

    artifactSet.integrity = {
      algorithm: "sha256",
      fingerprint: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY.primitiveArtifactIntegrity!.vue!,
    };
    expect(() =>
      getPrimitiveComponents({
        artifacts: artifactSet,
        framework: "vue",
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      }),
    ).toThrow(/trusted integrity fingerprint/);
  });

  it("rejects source-version drift after private artifact integrity validation", async () => {
    const repositoryRoot = fileURLToPath(new URL("../../../..", import.meta.url));
    const generatedArtifactRoot = await mkdtemp(
      join(tmpdir(), "starwind-vue-primitive-integrity-test-"),
    );
    const projectRoot = process.cwd();

    try {
      process.chdir(repositoryRoot);
      const generated = (await buildPrimitiveVendoringArtifacts({
        repoRoot: repositoryRoot,
        targetPolicy: createCliRegistryBuildPolicy([vueFrameworkAdapterTarget]),
        tempRoot: generatedArtifactRoot,
      })) as PrimitiveVendoringArtifactSet<"astro" | "react" | "vue">;
      process.chdir(projectRoot);
      const changedSourceVersions = structuredClone(generated);
      for (const artifact of changedSourceVersions.primitives) {
        artifact.sourceVersion = "0.0.0";
      }

      expect(
        getPrimitiveComponents({
          artifacts: generated,
          framework: "vue",
          targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
        }),
      ).not.toHaveLength(0);
      expect(() =>
        getPrimitiveComponents({
          artifacts: changedSourceVersions,
          framework: "vue",
          targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
        }),
      ).toThrow(/must use manifest source version/);
    } finally {
      process.chdir(projectRoot);
      await rm(generatedArtifactRoot, { force: true, recursive: true });
    }
  }, 30_000);
});
