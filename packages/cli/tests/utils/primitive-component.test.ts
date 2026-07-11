import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative } from "node:path";

import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StarwindConfig } from "../../src/utils/config.js";
import * as config from "../../src/utils/config.js";
import * as dependencyResolver from "../../src/utils/dependency-resolver.js";
import * as packageManager from "../../src/utils/package-manager.js";
import {
  installPrimitiveComponents,
  type PrimitiveVendoringArtifact,
  updatePrimitiveComponents,
} from "../../src/utils/primitive-component.js";

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
const mockInstallDependencies = vi.mocked(packageManager.installDependencies);
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
      artifacts: { primitives: [primitiveArtifact("0.2.0")] },
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
});
