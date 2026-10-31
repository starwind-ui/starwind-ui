import { readFileSync } from "node:fs";
import * as clackPrompts from "@clack/prompts";
import { beforeEach, describe, expect, it, vi } from "vitest";
import * as fs from "../../src/utils/fs.js";
import * as packageManager from "../../src/utils/package-manager.js";
import {
  addRuntimePackageUpdatesToPreview,
  offerRuntimePackageUpdates,
  planRuntimePackageUpdates,
  usesCustomStyledRegistry,
} from "../../src/utils/runtime-package.js";

vi.mock("@clack/prompts");
vi.mock("../../src/utils/fs.js");
vi.mock("../../src/utils/package-manager.js", async (importOriginal) => ({
  ...(await importOriginal<typeof packageManager>()),
  detectPackageManager: vi.fn(),
  installDependenciesWithProgress: vi.fn(),
}));

const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockIsCancel = vi.mocked(clackPrompts.isCancel);
const mockLog = {
  error: vi.fn(),
  info: vi.fn(),
  message: vi.fn(),
  step: vi.fn(),
  success: vi.fn(),
  warn: vi.fn(),
  warning: vi.fn(),
};
vi.mocked(clackPrompts).log = mockLog as typeof clackPrompts.log;

const mockReadJsonFile = vi.mocked(fs.readJsonFile);
const mockInstall = vi.mocked(packageManager.installDependenciesWithProgress);
const mockDetect = vi.mocked(packageManager.detectPackageManager);

const RUNTIME = "@starwind-ui/runtime";
const REACT = "@starwind-ui/react";

const artifacts = JSON.parse(
  readFileSync(
    new URL("../../src/registry/primitive-vendoring-artifacts.json", import.meta.url),
    "utf8",
  ),
);
const registry = JSON.parse(
  readFileSync(new URL("../../src/registry/bundled-registry.json", import.meta.url), "utf8"),
);
function getRuntimeRange(framework: string): string {
  return artifacts.primitives
    .filter((primitive: { framework: string }) => primitive.framework === framework)
    .flatMap(
      (primitive: { packageRequirements: { name: string; range: string }[] }) =>
        primitive.packageRequirements,
    )
    .find((requirement: { name: string }) => requirement.name === RUNTIME).range;
}
const runtimeRange = getRuntimeRange("react");
const vueRuntimeRange = getRuntimeRange("vue");
const reactConfig = { components: [], framework: "react" };
const vueConfig = { components: [], framework: "vue" };
const reactRange: string = registry.setup.react.adapterPackage.range;

function mockProject(
  pkg: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> },
  installed: Record<string, string> = {},
) {
  mockReadJsonFile.mockImplementation(async (filePath: string) => {
    if (filePath === "package.json") return pkg;

    const name = filePath.replace(/^node_modules\//, "").replace(/\/package\.json$/, "");
    if (installed[name]) return { version: installed[name] };

    throw new Error("ENOENT");
  });
}

describe("Runtime package updates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockInstall.mockReset();
    mockIsCancel.mockReturnValue(false);
    mockConfirm.mockResolvedValue(true);
    mockInstall.mockResolvedValue(undefined);
    mockDetect.mockReturnValue({
      name: "pnpm",
      installCmd: "pnpm install",
      addCmd: "pnpm add",
      removeCmd: "pnpm remove",
      runCmd: "pnpm",
    });
  });

  describe("planRuntimePackageUpdates", () => {
    it("plans nothing when Runtime is not a direct dependency", async () => {
      mockProject({ dependencies: { [REACT]: "0.0.1" } }, { [REACT]: "0.0.1" });

      await expect(planRuntimePackageUpdates(reactConfig)).resolves.toEqual([]);
    });

    it("plans nothing when the direct Runtime entry meets the required version", async () => {
      mockProject({ dependencies: { [RUNTIME]: runtimeRange } });

      await expect(planRuntimePackageUpdates(reactConfig)).resolves.toEqual([]);
    });

    it("leaves a direct Runtime entry above the required version alone", async () => {
      mockProject({ dependencies: { [RUNTIME]: "^999.0.0" } });

      await expect(planRuntimePackageUpdates(reactConfig)).resolves.toEqual([]);
    });

    it.each(["workspace:*", "link:../runtime", "catalog:", "latest", "*", "npm:other@1.0.0"])(
      "treats the %s spec as managed by the project",
      async (spec) => {
        mockProject({ dependencies: { [RUNTIME]: spec } }, { [RUNTIME]: "0.0.1" });

        await expect(planRuntimePackageUpdates(reactConfig)).resolves.toEqual([]);
      },
    );

    it("plans a direct Runtime entry whose installed version is too old", async () => {
      mockProject({ dependencies: { [RUNTIME]: "^0.0.1" } }, { [RUNTIME]: "0.0.1" });

      await expect(planRuntimePackageUpdates(reactConfig)).resolves.toEqual([
        { name: RUNTIME, currentRange: "^0.0.1", requiredRange: runtimeRange, dev: false },
      ]);
    });

    it.each(["^0.0.1 || >=0.0.2", ">=0.0.1"])(
      "keeps the %s range when its installed version is new enough",
      async (spec) => {
        mockProject({ dependencies: { [RUNTIME]: spec } }, { [RUNTIME]: "999.0.0" });

        await expect(planRuntimePackageUpdates(reactConfig)).resolves.toEqual([]);
      },
    );

    it("plans a non-overlapping range when no installed version can be read", async () => {
      mockProject({ dependencies: { [RUNTIME]: "0.0.1" } });

      await expect(planRuntimePackageUpdates(reactConfig)).resolves.toEqual([
        { name: RUNTIME, currentRange: "0.0.1", requiredRange: runtimeRange, dev: false },
      ]);
    });

    it("keeps an overlapping range when no installed version can be read", async () => {
      mockProject({ dependencies: { [RUNTIME]: ">=0.0.1" } });

      await expect(planRuntimePackageUpdates(reactConfig)).resolves.toEqual([]);
    });

    it("moves a stale direct adapter with Runtime so the two stay aligned", async () => {
      mockProject(
        { dependencies: { [RUNTIME]: "0.0.1", [REACT]: "0.0.1" } },
        { [RUNTIME]: "0.0.1", [REACT]: "0.0.1" },
      );

      await expect(planRuntimePackageUpdates(reactConfig)).resolves.toEqual([
        { name: RUNTIME, currentRange: "0.0.1", requiredRange: runtimeRange, dev: false },
        { name: REACT, currentRange: "0.0.1", requiredRange: reactRange, dev: false },
      ]);
    });

    it("keeps a devDependencies entry in devDependencies", async () => {
      mockProject({ devDependencies: { [RUNTIME]: "0.0.1" } }, { [RUNTIME]: "0.0.1" });

      await expect(planRuntimePackageUpdates(reactConfig)).resolves.toEqual([
        { name: RUNTIME, currentRange: "0.0.1", requiredRange: runtimeRange, dev: true },
      ]);
    });

    it("uses the exact Runtime version for a Vue project", async () => {
      mockProject({ dependencies: { [RUNTIME]: "0.0.1" } }, { [RUNTIME]: "0.0.1" });

      await expect(planRuntimePackageUpdates(vueConfig)).resolves.toEqual([
        { name: RUNTIME, currentRange: "0.0.1", requiredRange: vueRuntimeRange, dev: false },
      ]);
    });

    it("uses the exact Runtime version when a project mixes Vue with another target", async () => {
      mockProject({ dependencies: { [RUNTIME]: "0.0.1" } }, { [RUNTIME]: "0.0.1" });

      const [update] = await planRuntimePackageUpdates({
        components: [{ framework: "vue" }],
        framework: "react",
      });

      expect(update?.requiredRange).toBe(vueRuntimeRange);
    });

    it("replaces a Vue project's range that could drift past the exact version", async () => {
      mockProject(
        { dependencies: { [RUNTIME]: `^${vueRuntimeRange}` } },
        { [RUNTIME]: vueRuntimeRange },
      );

      await expect(planRuntimePackageUpdates(vueConfig)).resolves.toEqual([
        {
          name: RUNTIME,
          currentRange: `^${vueRuntimeRange}`,
          requiredRange: vueRuntimeRange,
          dev: false,
        },
      ]);
    });

    it("keeps a Vue project already on the exact version", async () => {
      mockProject({ dependencies: { [RUNTIME]: vueRuntimeRange } }, { [RUNTIME]: vueRuntimeRange });

      await expect(planRuntimePackageUpdates(vueConfig)).resolves.toEqual([]);
    });

    it("does not downgrade a Vue project above the exact version", async () => {
      mockProject({ dependencies: { [RUNTIME]: "^999.0.0" } }, { [RUNTIME]: "999.0.0" });

      await expect(planRuntimePackageUpdates(vueConfig)).resolves.toEqual([]);
    });

    it("plans nothing when package.json cannot be read", async () => {
      mockReadJsonFile.mockRejectedValue(new Error("ENOENT"));

      await expect(planRuntimePackageUpdates(reactConfig)).resolves.toEqual([]);
    });
  });

  describe("usesCustomStyledRegistry", () => {
    it("treats a missing or default component registry as bundled", () => {
      expect(
        usesCustomStyledRegistry({
          components: [{}, { registry: "default" }],
          framework: "react",
        }),
      ).toBe(false);
    });

    it("detects a component from a custom registry", () => {
      expect(
        usesCustomStyledRegistry({
          components: [{ registry: "default" }, { registry: "acme" }],
          framework: "react",
        }),
      ).toBe(true);
    });
  });

  describe("offerRuntimePackageUpdates", () => {
    it("does not prompt or install when nothing is stale", async () => {
      mockProject({ dependencies: { [RUNTIME]: runtimeRange } });

      await expect(offerRuntimePackageUpdates({ config: reactConfig })).resolves.toBe("current");

      expect(mockConfirm).not.toHaveBeenCalled();
      expect(mockInstall).not.toHaveBeenCalled();
    });

    it("asks first and installs after the user accepts", async () => {
      mockProject({ dependencies: { [RUNTIME]: "0.0.1" } });

      await expect(
        offerRuntimePackageUpdates({ config: reactConfig, packageManager: "pnpm" }),
      ).resolves.toBe("updated");

      expect(mockConfirm).toHaveBeenCalledTimes(1);
      expect(mockInstall).toHaveBeenCalledWith([`${RUNTIME}@${runtimeRange}`], "pnpm", false);
    });

    it("installs without a prompt when prompts are skipped", async () => {
      mockProject({ dependencies: { [RUNTIME]: "0.0.1" } });

      await expect(
        offerRuntimePackageUpdates({ config: reactConfig, skipPrompts: true }),
      ).resolves.toBe("updated");

      expect(mockConfirm).not.toHaveBeenCalled();
      expect(mockInstall).toHaveBeenCalledWith([`${RUNTIME}@${runtimeRange}`], undefined, false);
    });

    it("installs each section once and leaves Runtime for last", async () => {
      mockProject({
        dependencies: { [RUNTIME]: "0.0.1" },
        devDependencies: { [REACT]: "0.0.1" },
      });

      await offerRuntimePackageUpdates({ config: reactConfig, skipPrompts: true });

      expect(mockInstall.mock.calls).toEqual([
        [[`${REACT}@${reactRange}`], undefined, true],
        [[`${RUNTIME}@${runtimeRange}`], undefined, false],
      ]);
    });

    it("keeps Runtime stale for a retry when an earlier section fails", async () => {
      mockProject({
        dependencies: { [REACT]: "0.0.1" },
        devDependencies: { [RUNTIME]: "0.0.1" },
      });
      mockInstall.mockRejectedValueOnce(new Error("network down"));

      await expect(
        offerRuntimePackageUpdates({ config: reactConfig, skipPrompts: true }),
      ).resolves.toBe("failed");

      expect(mockInstall).toHaveBeenCalledTimes(1);
      expect(mockInstall).toHaveBeenCalledWith([`${REACT}@${reactRange}`], undefined, false);
    });

    it("shows the manual command when the user declines", async () => {
      mockProject({ dependencies: { [RUNTIME]: "0.0.1" } });
      mockConfirm.mockResolvedValue(false);

      await expect(offerRuntimePackageUpdates({ config: reactConfig })).resolves.toBe("declined");

      expect(mockInstall).not.toHaveBeenCalled();
      expect(mockLog.info).toHaveBeenCalledWith(
        expect.stringContaining(`run: pnpm add ${RUNTIME}@${runtimeRange}`),
      );
    });

    it("uses the selected package manager and dev flag in the manual command", async () => {
      mockProject({
        dependencies: { [REACT]: "0.0.1" },
        devDependencies: { [RUNTIME]: "0.0.1" },
      });
      mockConfirm.mockResolvedValue(false);

      await offerRuntimePackageUpdates({ config: reactConfig, packageManager: "npm" });

      expect(mockLog.info).toHaveBeenCalledWith(
        expect.stringContaining(
          `run: npm install ${REACT}@${reactRange} && npm install -D ${RUNTIME}@${runtimeRange}`,
        ),
      );
    });

    it("treats a cancelled prompt as a decline", async () => {
      mockProject({ dependencies: { [RUNTIME]: "0.0.1" } });
      mockIsCancel.mockReturnValue(true);

      await expect(offerRuntimePackageUpdates({ config: reactConfig })).resolves.toBe("declined");

      expect(mockInstall).not.toHaveBeenCalled();
    });

    it("reports a failed install with the manual command", async () => {
      mockProject({ dependencies: { [RUNTIME]: "0.0.1" } });
      mockInstall.mockRejectedValue(new Error("network down"));

      await expect(
        offerRuntimePackageUpdates({ config: reactConfig, skipPrompts: true }),
      ).resolves.toBe("failed");

      expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("network down"));
      expect(mockLog.warn).toHaveBeenCalledWith(
        expect.stringContaining(`pnpm add ${RUNTIME}@${runtimeRange}`),
      );
    });
  });

  describe("addRuntimePackageUpdatesToPreview", () => {
    const basePlan = {
      failed: [],
      packageRequirements: [],
      packagesToInstall: [],
      skipped: [],
      updates: [],
    };

    it("returns the plan unchanged when nothing is stale", async () => {
      mockProject({ dependencies: { [RUNTIME]: runtimeRange } });

      await expect(addRuntimePackageUpdatesToPreview(basePlan, reactConfig)).resolves.toEqual(
        basePlan,
      );
    });

    it("adds stale packages to the preview once", async () => {
      mockProject({ dependencies: { [RUNTIME]: "0.0.1" } });
      const spec = `${RUNTIME}@${runtimeRange}`;

      const preview = await addRuntimePackageUpdatesToPreview(
        {
          ...basePlan,
          packageRequirements: [{ name: RUNTIME, range: runtimeRange }],
          packagesToInstall: [spec],
        },
        reactConfig,
      );

      expect(preview.packageRequirements).toEqual([{ name: RUNTIME, range: runtimeRange }]);
      expect(preview.packagesToInstall).toEqual([spec]);

      const added = await addRuntimePackageUpdatesToPreview(basePlan, reactConfig);

      expect(added.packageRequirements).toEqual([{ name: RUNTIME, range: runtimeRange }]);
      expect(added.packagesToInstall).toEqual([spec]);
    });
  });
});
