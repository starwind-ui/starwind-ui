import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock @clack/prompts with a factory so tasks is typed as a simple mock
vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  tasks: vi.fn(),
  log: {
    error: vi.fn(),
    info: vi.fn(),
    message: vi.fn(),
    warn: vi.fn(),
  },
}));

import * as clackPrompts from "@clack/prompts";

import * as config from "../../src/utils/config.js";
import * as primitiveComponent from "../../src/utils/primitive-component.js";
import * as proManifest from "../../src/utils/pro-manifest.js";
import * as registry from "../../src/utils/registry.js";
import { search } from "../../src/commands/search.js";

vi.mock("../../src/utils/config.js");
vi.mock("../../src/utils/primitive-component.js");
vi.mock("../../src/utils/pro-manifest.js");
vi.mock("../../src/utils/registry.js");
vi.mock("../../src/utils/shadcn-config.js", () => ({
  hasStarwindProRegistry: vi.fn().mockResolvedValue(false),
}));

import * as shadcnConfig from "../../src/utils/shadcn-config.js";

const mockIntro = vi.mocked(clackPrompts.intro);
const mockOutro = vi.mocked(clackPrompts.outro);
const mockCancel = vi.mocked(clackPrompts.cancel);
const mockNote = vi.mocked(clackPrompts.note);
const mockTasks = vi.mocked(clackPrompts.tasks);
const mockLog = vi.mocked(clackPrompts.log);

const mockGetConfigState = vi.mocked(config.getConfigState);
const mockGetPrimitiveComponents = vi.mocked(primitiveComponent.getPrimitiveComponents);
const mockSearchProBlocks = vi.mocked(proManifest.searchProBlocks);
const mockLoadRegistry = vi.mocked(registry.loadRegistry);
const mockParseRegistrySource = vi.mocked(registry.parseRegistrySource);
const mockHasStarwindProRegistry = vi.mocked(shadcnConfig.hasStarwindProRegistry);

function runtimeConfig(overrides: Partial<config.StarwindConfig> = {}): config.StarwindConfig {
  return {
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
    utilsDir: "src/lib/utils",
    components: [],
    ...overrides,
  };
}

function primitiveArtifact(
  component: string,
  framework: config.StarwindFramework,
): primitiveComponent.PrimitiveVendoringArtifact {
  return {
    component,
    framework,
    version: "0.1.0",
    files: [
      {
        content: "",
        path: `src/components/starwind-primitives/${component}/index.ts`,
        sourceHash: `${framework}-${component}-hash`,
        sourcePath: `packages/${framework}/src/${component}/index.ts`,
      },
    ],
    packageRequirements: [{ name: "@starwind-ui/runtime", range: "^1.0.0" }],
  };
}

describe("search command", () => {
  let mockExit: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Make p.tasks actually execute task functions so closures run
    mockTasks.mockImplementation(async (tasks) => {
      for (const t of tasks) {
        await t.task(() => {});
      }
    });

    mockSearchProBlocks.mockResolvedValue([]);
    mockParseRegistrySource.mockImplementation((value) =>
      value ? { type: "remote", url: value } : undefined,
    );
    mockGetConfigState.mockResolvedValue({ status: "missing", config: runtimeConfig() });
    mockGetPrimitiveComponents.mockImplementation((options = {}) => {
      if (options.framework === "react") {
        return [primitiveArtifact("button", "react"), primitiveArtifact("toast", "react")];
      }

      return [primitiveArtifact("button", "astro"), primitiveArtifact("checkbox", "astro")];
    });
    mockLoadRegistry.mockResolvedValue({
      $schema: "https://starwind.dev/registry-schema.v2.json",
      version: "0.1.0",
      components: [
        {
          name: "card",
          version: "1.0.0",
          dependencies: [],
          type: "component",
          targets: { react: { files: [], componentDependencies: [], packageRequirements: [] } },
        },
        { name: "button", version: "1.0.0", dependencies: [], type: "component" },
      ],
    });
  });

  afterEach(() => {
    mockExit.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it("shows intro and outro for normal output", async () => {
    await search("hero");
    expect(mockIntro).toHaveBeenCalledTimes(1);
    expect(mockOutro).toHaveBeenCalledTimes(1);
  });

  it("skips intro/outro for json output", async () => {
    await search("hero", { json: true });
    expect(mockIntro).not.toHaveBeenCalled();
  });

  it("searches Pro blocks with query and options", async () => {
    await search("pricing", { plan: "pro", category: "pricing", limit: 10 });
    expect(mockSearchProBlocks).toHaveBeenCalledWith({
      query: "pricing",
      plan: "pro",
      category: "pricing",
      limit: 10,
      offset: 0,
    });
  });

  it("passes offset through to searchProBlocks", async () => {
    await search("pricing", { limit: 5, offset: 10 });
    expect(mockSearchProBlocks).toHaveBeenCalledWith({
      query: "pricing",
      limit: 5,
      offset: 10,
    });
  });

  it("filters core components by query", async () => {
    await search("card");
    expect(mockLoadRegistry).toHaveBeenCalled();
    expect(mockLog.info).toHaveBeenCalledWith(expect.stringContaining("card"));
  });

  it("shows no results warning when nothing matches", async () => {
    await search("xyz-nothing");
    expect(mockLog.warn).toHaveBeenCalledWith(expect.stringContaining("No results"));
  });

  it("outputs JSON with combined results", async () => {
    mockSearchProBlocks.mockResolvedValue([
      {
        id: "hero-1",
        name: "Hero One",
        description: "A hero block",
        categories: ["hero"],
        keywords: ["hero", "landing"],
        plan: "free",
        installCommand: "starwind add @starwind-pro/hero-1",
        previewUrl: "/hero-1",
      },
    ]);

    await search("hero", { json: true });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(output.query).toBe("hero");
    expect(output.proBlocks.total).toBe(1);
    expect(output.coreComponents.total).toBeGreaterThanOrEqual(0);
  });

  it("loads components from an explicit remote registry", async () => {
    await search("card", {
      registry: "https://starwind.dev/registry/0.1.0/registry.json",
    });

    expect(mockLoadRegistry).toHaveBeenCalledWith({
      type: "remote",
      url: "https://starwind.dev/registry/0.1.0/registry.json",
    });
  });

  it("shows setup note when Pro blocks found but Pro is NOT configured", async () => {
    mockHasStarwindProRegistry.mockResolvedValue(false);
    mockSearchProBlocks.mockResolvedValue([
      {
        id: "hero-1",
        name: "Hero One",
        description: "A free hero",
        categories: ["hero"],
        keywords: ["hero"],
        plan: "free",
        installCommand: "starwind add @starwind-pro/hero-1",
        previewUrl: "/hero-1",
      },
    ]);

    await search("hero");
    expect(mockNote).toHaveBeenCalledWith(
      expect.stringContaining("Pro blocks require Starwind Pro setup"),
      "Pro Tip",
    );
  });

  it("shows upgrade nudge when Pro IS configured and paid blocks are found", async () => {
    mockHasStarwindProRegistry.mockResolvedValue(true);
    mockSearchProBlocks.mockResolvedValue([
      {
        id: "hero-pro",
        name: "Hero Pro",
        description: "A premium hero",
        categories: ["hero"],
        keywords: ["hero"],
        plan: "pro",
        installCommand: "starwind add @starwind-pro/hero-pro",
        previewUrl: "/hero-pro",
      },
    ]);

    await search("hero");
    expect(mockNote).toHaveBeenCalledWith(
      expect.stringContaining("https://pro.starwind.dev/"),
      "Pro Tip",
    );
  });

  it("shows no Pro note when Pro IS configured and only free blocks are found", async () => {
    mockHasStarwindProRegistry.mockResolvedValue(true);
    mockSearchProBlocks.mockResolvedValue([
      {
        id: "hero-1",
        name: "Hero One",
        description: "A free hero",
        categories: ["hero"],
        keywords: ["hero"],
        plan: "free",
        installCommand: "starwind add @starwind-pro/hero-1",
        previewUrl: "/hero-1",
      },
    ]);

    await search("hero");
    expect(mockNote).not.toHaveBeenCalled();
  });

  it("skips core components when category or plan filter is used", async () => {
    await search("hero", { category: "hero" });
    expect(mockSearchProBlocks).toHaveBeenCalled();
    expect(mockLoadRegistry).not.toHaveBeenCalled();
  });

  it("skips core components when plan filter is used", async () => {
    await search("hero", { plan: "free" });
    expect(mockSearchProBlocks).toHaveBeenCalled();
    expect(mockLoadRegistry).not.toHaveBeenCalled();
  });

  it("handles unexpected errors gracefully", async () => {
    mockSearchProBlocks.mockRejectedValue(new Error("Network error"));
    await expect(search("hero")).rejects.toThrow("process.exit called");
    expect(mockLog.error).toHaveBeenCalledWith("Network error");
    expect(mockCancel).toHaveBeenCalledWith("Operation cancelled");
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("lists Astro primitives by default when no config exists", async () => {
    await search(undefined, { primitives: true });

    expect(mockGetPrimitiveComponents).toHaveBeenCalledWith({ framework: "astro" });
    expect(mockParseRegistrySource).not.toHaveBeenCalled();
    expect(mockSearchProBlocks).not.toHaveBeenCalled();
    expect(mockLoadRegistry).not.toHaveBeenCalled();

    const output = getLogOutput(mockLog.info);
    expect(output).toContain("button");
    expect(output).toContain("starwind primitives add button");
  });

  it("uses the configured framework for primitive search", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({ framework: "react" }),
    });

    await search(undefined, { primitives: true });

    expect(mockGetPrimitiveComponents).toHaveBeenCalledWith({ framework: "react" });
    expect(getLogOutput(mockLog.info)).toContain("starwind primitives add toast");
  });

  it("allows primitive search framework override", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({ framework: "astro" }),
    });

    await search(undefined, { primitives: true, framework: "react" });

    expect(mockGetConfigState).not.toHaveBeenCalled();
    expect(mockGetPrimitiveComponents).toHaveBeenCalledWith({ framework: "react" });
    expect(getLogOutput(mockLog.info)).toContain("starwind primitives add toast --framework react");
  });

  it("filters primitive search results by query", async () => {
    await search("check", { primitives: true });

    const output = getLogOutput(mockLog.info);
    expect(output).toContain("checkbox");
    expect(output).toContain("starwind primitives add checkbox");
    expect(output).not.toContain("starwind primitives add button");
  });

  it("does not advertise primitive install commands for unsupported current Runtime configs", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({ framework: undefined }),
    });

    await search(undefined, { primitives: true });

    expect(mockGetPrimitiveComponents).not.toHaveBeenCalled();
    expect(mockLog.warn).toHaveBeenCalledWith(
      "Primitive source discovery supports Astro and React Runtime projects only.",
    );
    expect(getLogOutput(mockLog.info)).not.toContain("starwind primitives add");
  });

  it("outputs primitive search JSON without styled or Pro result sections", async () => {
    await search("button", { primitives: true, json: true });

    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(output.query).toBe("button");
    expect(output.filters.framework).toBe("astro");
    expect(output.primitives.total).toBe(1);
    expect(output.primitives.results[0]).toMatchObject({
      name: "button",
      framework: "astro",
      version: "0.1.0",
      installCommand: "starwind primitives add button",
    });
    expect(output.primitives.results[0].files[0]).toMatchObject({
      path: "src/components/starwind-primitives/button/index.ts",
      sourceHash: "astro-button-hash",
      sourcePath: "packages/astro/src/button/index.ts",
    });
    expect(output.primitives.results[0].files[0].content).toBeUndefined();
    expect(output.proBlocks).toBeUndefined();
    expect(output.coreComponents).toBeUndefined();
    expect(mockParseRegistrySource).not.toHaveBeenCalled();
    expect(mockSearchProBlocks).not.toHaveBeenCalled();
    expect(mockLoadRegistry).not.toHaveBeenCalled();
    expect(mockHasStarwindProRegistry).not.toHaveBeenCalled();
  });

  it("outputs primitive search JSON with an explicit framework install command", async () => {
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: runtimeConfig({ framework: "astro" }),
    });

    await search("toast", { primitives: true, framework: "react", json: true });

    expect(mockGetConfigState).not.toHaveBeenCalled();
    expect(mockGetPrimitiveComponents).toHaveBeenCalledWith({ framework: "react" });

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(output.filters.framework).toBe("react");
    expect(output.primitives.total).toBe(1);
    expect(output.primitives.results[0]).toMatchObject({
      name: "toast",
      framework: "react",
      installCommand: "starwind primitives add toast --framework react",
    });
  });

  it("outputs all-framework primitive search JSON with framework-specific install commands", async () => {
    await search("button", { primitives: true, framework: "all", json: true });

    expect(mockGetConfigState).not.toHaveBeenCalled();
    expect(mockGetPrimitiveComponents).toHaveBeenCalledWith({ framework: "astro" });
    expect(mockGetPrimitiveComponents).toHaveBeenCalledWith({ framework: "react" });

    const output = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(output.query).toBe("button");
    expect(output.filters.framework).toBe("all");
    expect(output.primitives.total).toBe(2);
    expect(output.primitives.results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "button",
          framework: "astro",
          installCommand: "starwind primitives add button --framework astro",
        }),
        expect.objectContaining({
          name: "button",
          framework: "react",
          installCommand: "starwind primitives add button --framework react",
        }),
      ]),
    );
  });
});

function getLogOutput(mock: typeof mockLog.info): string {
  return mock.mock.calls.map((call: unknown[]) => String(call[0])).join("\n");
}
