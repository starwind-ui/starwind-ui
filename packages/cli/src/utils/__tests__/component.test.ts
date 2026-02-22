import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as config from "../config.js";
import { copyComponent } from "../component.js";
import * as registry from "../registry.js";

vi.mock("../config.js");
vi.mock("../registry.js");

const mockGetConfig = vi.mocked(config.getConfig);
const mockGetRegistry = vi.mocked(registry.getRegistry);

async function createCoreFixture(options?: {
  componentName?: string;
  includePositioning?: boolean;
}): Promise<{ coreDir: string; packageUrl: string }> {
  const componentName = options?.componentName ?? "tooltip";
  const includePositioning = options?.includePositioning ?? true;

  const coreDir = await mkdtemp(join(tmpdir(), "starwind-core-fixture-"));

  const componentFilePath = join(coreDir, "src", "components", componentName, `${componentName}.astro`);
  await mkdir(dirname(componentFilePath), { recursive: true });
  await writeFile(componentFilePath, `---\n---\n<div>${componentName}</div>\n`, "utf-8");

  if (includePositioning) {
    const utilityFilePath = join(coreDir, "src", "lib", "utils", "starwind", "positioning.ts");
    await mkdir(dirname(utilityFilePath), { recursive: true });
    await writeFile(utilityFilePath, "export const marker = 'positioning';\n", "utf-8");
  }

  const packageUrl = pathToFileURL(join(coreDir, "index.js")).href;
  return { coreDir, packageUrl };
}

describe.sequential("copyComponent fileDependencies", () => {
  let projectDir = "";
  let previousCwd = "";

  beforeEach(async () => {
    vi.clearAllMocks();

    projectDir = await mkdtemp(join(tmpdir(), "starwind-component-test-"));
    previousCwd = process.cwd();
    process.chdir(projectDir);

    mockGetRegistry.mockResolvedValue([
      {
        name: "tooltip",
        version: "1.5.0",
        dependencies: [],
        fileDependencies: ["positioning.ts"],
        type: "component",
      },
    ]);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(projectDir, { recursive: true, force: true });
  });

  it("copies utility file dependencies into <utilsDir>/starwind for new installs", async () => {
    const { packageUrl } = await createCoreFixture();

    mockGetConfig.mockResolvedValue({
      $schema: "https://starwind.dev/config-schema.json",
      tailwind: { css: "src/styles/starwind.css", baseColor: "neutral", cssVariables: true },
      componentDir: "src/components",
      utilsDir: "src/lib/utils",
      components: [],
    });

    const result = await copyComponent("tooltip", false, {
      resolvePackageUrl: () => packageUrl,
    });

    expect(result).toEqual({
      status: "installed",
      name: "tooltip",
      version: "1.5.0",
    });

    const copiedComponent = await readFile(
      join(projectDir, "src", "components", "starwind", "tooltip", "tooltip.astro"),
      "utf-8",
    );
    const copiedUtility = await readFile(
      join(projectDir, "src", "lib", "utils", "starwind", "positioning.ts"),
      "utf-8",
    );

    expect(copiedComponent).toContain("<div>tooltip</div>");
    expect(copiedUtility).toContain("marker = 'positioning'");
  });

  it("normalizes alias-based utilsDir while copying dependencies for skipped installs", async () => {
    const { packageUrl } = await createCoreFixture();

    mockGetConfig.mockResolvedValue({
      $schema: "https://starwind.dev/config-schema.json",
      tailwind: { css: "src/styles/starwind.css", baseColor: "neutral", cssVariables: true },
      componentDir: "src/components",
      utilsDir: "@/lib/utils",
      components: [{ name: "tooltip", version: "1.5.0" }],
    });

    const result = await copyComponent("tooltip", false, {
      resolvePackageUrl: () => packageUrl,
    });

    expect(result).toEqual({
      status: "skipped",
      name: "tooltip",
      version: "1.5.0",
    });

    const copiedUtility = await readFile(
      join(projectDir, "src", "lib", "utils", "starwind", "positioning.ts"),
      "utf-8",
    );

    expect(copiedUtility).toContain("marker = 'positioning'");
  });

  it("returns a failed result when required utility file is missing", async () => {
    const { packageUrl } = await createCoreFixture({ includePositioning: false });

    mockGetConfig.mockResolvedValue({
      $schema: "https://starwind.dev/config-schema.json",
      tailwind: { css: "src/styles/starwind.css", baseColor: "neutral", cssVariables: true },
      componentDir: "src/components",
      utilsDir: "src/lib/utils",
      components: [],
    });

    const result = await copyComponent("tooltip", false, {
      resolvePackageUrl: () => packageUrl,
    });

    expect(result.status).toBe("failed");
    expect(result.name).toBe("tooltip");

    if (result.status === "failed") {
      expect(result.error).toContain('File dependency "positioning.ts"');
      expect(result.error).toContain("src/lib/utils/starwind");
    }
  });
});
