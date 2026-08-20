import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  primitivesUpdate,
  type PrivatePrimitiveCommandDependencies,
} from "../../src/commands/primitives.js";
import { update } from "../../src/commands/update.js";
import {
  type CliFrameworkTarget,
  type FrameworkTargetPolicy,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "../../src/utils/framework-target-policy.js";
import type { PrimitiveVendoringArtifactSet } from "../../src/utils/primitive-component.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  multiselect: vi.fn(),
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

const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockInstallDependencies = vi.mocked(packageManager.installDependenciesWithProgress);
const mockLog = vi.mocked(clackPrompts.log);

const REGISTRY_PATH = "synthetic-registry.json";
const STYLED_PATH = "src/components/starwind/button/Button.astro";
const STYLED_SIBLING_PATH = "src/components/starwind/button/index.ts";
const PRIMITIVE_PATH = "src/components/starwind-primitives/button/ButtonRoot.astro";
const PRIMITIVE_SIBLING_PATH = "src/components/starwind-primitives/button/index.ts";
const CUSTOM_STYLED = "---\n---\n<button>custom styled</button>\n";
const CUSTOM_PRIMITIVE = "---\n---\n<button>custom primitive</button>\n";
const CANONICAL_STYLED = "---\n---\n<button>canonical styled</button>\n";
const CANONICAL_STYLED_SIBLING = 'export { default as Button } from "./Button.astro";\n';
const CANONICAL_PRIMITIVE = "---\n---\n<button>canonical primitive</button>\n";
const CANONICAL_PRIMITIVE_SIBLING = 'export { default as ButtonRoot } from "./ButtonRoot.astro";\n';

const primitiveContentHash = createHash("sha256").update(CANONICAL_PRIMITIVE).digest("hex");
const primitiveSiblingHash = createHash("sha256").update(CANONICAL_PRIMITIVE_SIBLING).digest("hex");
const primitiveArtifacts: PrimitiveVendoringArtifactSet<CliFrameworkTarget> = {
  primitives: [
    {
      component: "button",
      framework: "astro",
      version: "2.0.0",
      sourceVersion: "1.0.0",
      files: [
        {
          path: PRIMITIVE_PATH,
          content: CANONICAL_PRIMITIVE,
          sourceHash: `sha256:${primitiveContentHash}`,
          sourcePath: "synthetic/astro/button/ButtonRoot.astro",
        },
        {
          path: PRIMITIVE_SIBLING_PATH,
          content: CANONICAL_PRIMITIVE_SIBLING,
          sourceHash: `sha256:${primitiveSiblingHash}`,
          sourcePath: "synthetic/astro/button/index.ts",
        },
      ],
      packageRequirements: [{ name: "@starwind-ui/runtime", range: "^2.0.0" }],
    },
  ],
};

const primitiveDependencies: PrivatePrimitiveCommandDependencies = {
  artifacts: primitiveArtifacts,
  targetPolicy:
    PUBLIC_FRAMEWORK_TARGET_POLICY as unknown as FrameworkTargetPolicy<CliFrameworkTarget>,
};

type TargetConfigSnapshot = {
  components: Array<{ version: string }>;
  primitives: Array<{ version: string }>;
};

describe.sequential("source-version delivery command integration", () => {
  let tempDir = "";
  let previousCwd = "";
  let mockExit: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockConfirm.mockResolvedValue(true);
    mockInstallDependencies.mockResolvedValue(undefined);

    tempDir = await mkdtemp(join(tmpdir(), "starwind-source-version-delivery-"));
    previousCwd = process.cwd();
    process.chdir(tempDir);
    mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    mockExit.mockRestore();
    await rm(tempDir, { recursive: true, force: true });
  });

  it("preserves customized files while behavior delivery advances both surfaces", async () => {
    await writeTargetProject("1.0.0", {
      "@starwind-ui/runtime": "2.1.0",
    });
    await expect(readFile(STYLED_SIBLING_PATH, "utf-8")).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(PRIMITIVE_SIBLING_PATH, "utf-8")).rejects.toMatchObject({
      code: "ENOENT",
    });

    await update(["button"], {
      packageManager: "pnpm",
      registry: REGISTRY_PATH,
      yes: true,
    });

    await expect(readFile(STYLED_PATH, "utf-8")).resolves.toBe(CUSTOM_STYLED);
    await expect(readFile(STYLED_SIBLING_PATH, "utf-8")).rejects.toMatchObject({ code: "ENOENT" });
    expect(mockInstallDependencies).toHaveBeenCalledWith(["@starwind-ui/astro@^2.0.0"], "pnpm");
    let config = await readTargetConfig();
    expect(config.components[0].version).toBe("2.0.0");
    expect(getPromptOutput(mockLog.success)).toContain("button (1.0.0 → 2.0.0) [behavior]");

    mockInstallDependencies.mockClear();
    await primitivesUpdate(
      ["button"],
      { packageManager: "pnpm", yes: true },
      primitiveDependencies,
    );

    await expect(readFile(PRIMITIVE_PATH, "utf-8")).resolves.toBe(CUSTOM_PRIMITIVE);
    await expect(readFile(PRIMITIVE_SIBLING_PATH, "utf-8")).rejects.toMatchObject({
      code: "ENOENT",
    });
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    config = await readTargetConfig();
    expect(config.primitives[0].version).toBe("2.0.0");
    expect(getPromptOutput(mockLog.success)).toContain("button (1.0.0 -> 2.0.0) [behavior]");
  });

  it("delivers skipped source releases and records the latest behavior version", async () => {
    await writeTargetProject("0.5.0", {
      "@starwind-ui/astro": "2.1.0",
      "@starwind-ui/runtime": "2.1.0",
    });

    await update(["button"], {
      packageManager: "pnpm",
      registry: REGISTRY_PATH,
      yes: true,
    });
    await primitivesUpdate(
      ["button"],
      { packageManager: "pnpm", yes: true },
      primitiveDependencies,
    );

    await expect(readFile(STYLED_PATH, "utf-8")).resolves.toBe(CANONICAL_STYLED);
    await expect(readFile(STYLED_SIBLING_PATH, "utf-8")).resolves.toBe(CANONICAL_STYLED_SIBLING);
    await expect(readFile(PRIMITIVE_PATH, "utf-8")).resolves.toBe(CANONICAL_PRIMITIVE);
    await expect(readFile(PRIMITIVE_SIBLING_PATH, "utf-8")).resolves.toBe(
      CANONICAL_PRIMITIVE_SIBLING,
    );
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    const config = await readTargetConfig();
    expect(config.components[0].version).toBe("2.0.0");
    expect(config.primitives[0].version).toBe("2.0.0");
    expect(getPromptOutput(mockLog.success)).toContain("button (0.5.0 → 2.0.0) [source]");
    expect(getPromptOutput(mockLog.success)).toContain("button (0.5.0 -> 2.0.0) [source]");
  });

  it("keeps both versions unchanged when required package installation is declined", async () => {
    await writeTargetProject("1.0.0");
    mockConfirm.mockResolvedValue(false);

    await update(["button"], {
      packageManager: "pnpm",
      registry: REGISTRY_PATH,
    });
    await primitivesUpdate(["button"], { packageManager: "pnpm" }, primitiveDependencies);

    expect(mockConfirm).toHaveBeenCalledTimes(2);
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    await expect(readFile(STYLED_PATH, "utf-8")).resolves.toBe(CUSTOM_STYLED);
    await expect(readFile(PRIMITIVE_PATH, "utf-8")).resolves.toBe(CUSTOM_PRIMITIVE);
    const config = await readTargetConfig();
    expect(config.components[0].version).toBe("1.0.0");
    expect(config.primitives[0].version).toBe("1.0.0");
    expect(getPromptOutput(mockLog.info)).toContain("button (1.0.0) [behavior]");
    expect(getPromptOutput(mockLog.info)).toContain("button (1.0.0 -> 2.0.0) [behavior]");
  });

  it("previews behavior delivery with package effects and zero file changes", async () => {
    await writeTargetProject("1.0.0");
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    try {
      await update(["button"], {
        dryRun: true,
        packageManager: "pnpm",
        registry: REGISTRY_PATH,
      });
      const styledPreview = getConsoleOutput(consoleLogSpy);
      expect(styledPreview).toContain("button [astro]: behavior");
      expect(styledPreview).toContain("@starwind-ui/astro@^2.0.0");
      expect(styledPreview).toContain("File changes:\n  - none");
      expect(styledPreview).not.toContain(STYLED_PATH);
      expect(styledPreview).not.toContain("diff --");

      consoleLogSpy.mockClear();
      await primitivesUpdate(
        ["button"],
        { dryRun: true, packageManager: "pnpm" },
        primitiveDependencies,
      );
      const primitivePreview = getConsoleOutput(consoleLogSpy);
      expect(primitivePreview).toContain("button [astro]: behavior");
      expect(primitivePreview).toContain("@starwind-ui/runtime@^2.0.0");
      expect(primitivePreview).toContain("File changes:\n  - none");
      expect(primitivePreview).not.toContain(PRIMITIVE_PATH);
      expect(primitivePreview).not.toContain("diff --");
    } finally {
      consoleLogSpy.mockRestore();
    }

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    await expect(readFile(STYLED_PATH, "utf-8")).resolves.toBe(CUSTOM_STYLED);
    await expect(readFile(PRIMITIVE_PATH, "utf-8")).resolves.toBe(CUSTOM_PRIMITIVE);
    const config = await readTargetConfig();
    expect(config.components[0].version).toBe("1.0.0");
    expect(config.primitives[0].version).toBe("1.0.0");
  });
});

async function writeTargetProject(
  installedVersion: string,
  dependencies: Record<string, string> = {},
): Promise<void> {
  await writeFile(
    "package.json",
    JSON.stringify({ dependencies: { astro: "^5.0.0", ...dependencies } }, null, 2),
    "utf-8",
  );
  await writeFile(
    "starwind.config.json",
    JSON.stringify(
      {
        $schema: "https://starwind.dev/config-schema.v2.json",
        version: 2,
        framework: "astro",
        registry: { source: "bundled", version: "0.1.0" },
        tailwind: {
          css: "src/styles/starwind.css",
          baseColor: "neutral",
          cssVariables: true,
        },
        componentDir: "src/components/starwind",
        primitiveDir: "src/components/starwind-primitives",
        utilsDir: "src/lib/utils",
        components: [
          {
            name: "button",
            version: installedVersion,
            framework: "astro",
            registry: "default",
          },
        ],
        primitives: [
          {
            name: "button",
            version: installedVersion,
            framework: "astro",
            source: "bundled",
          },
        ],
      },
      null,
      2,
    ),
    "utf-8",
  );
  await writeFile(
    REGISTRY_PATH,
    JSON.stringify(
      {
        $schema: "https://starwind.dev/registry-schema.v2.json",
        version: "0.1.0",
        components: [
          {
            name: "button",
            version: "2.0.0",
            sourceVersion: "1.0.0",
            dependencies: [],
            type: "component",
            targets: {
              astro: {
                files: [
                  { path: STYLED_PATH, content: CANONICAL_STYLED },
                  { path: STYLED_SIBLING_PATH, content: CANONICAL_STYLED_SIBLING },
                ],
                componentDependencies: [],
                packageRequirements: [{ name: "@starwind-ui/astro", range: "^2.0.0" }],
              },
            },
          },
        ],
      },
      null,
      2,
    ),
    "utf-8",
  );

  await mkdir(dirname(STYLED_PATH), { recursive: true });
  await mkdir(dirname(PRIMITIVE_PATH), { recursive: true });
  await writeFile(STYLED_PATH, CUSTOM_STYLED, "utf-8");
  await writeFile(PRIMITIVE_PATH, CUSTOM_PRIMITIVE, "utf-8");
}

async function readTargetConfig(): Promise<TargetConfigSnapshot> {
  return JSON.parse(await readFile("starwind.config.json", "utf-8")) as TargetConfigSnapshot;
}

function getPromptOutput(mock: typeof mockLog.success): string {
  return mock.mock.calls.flat().map(String).join("\n");
}

function getConsoleOutput(consoleLogSpy: ReturnType<typeof vi.spyOn>): string {
  return consoleLogSpy.mock.calls.flat().map(String).join("\n");
}
