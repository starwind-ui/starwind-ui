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

import * as proManifest from "../../utils/pro-manifest.js";
import * as registry from "../../utils/registry.js";
import { search } from "../search.js";

vi.mock("../../utils/pro-manifest.js");
vi.mock("../../utils/registry.js");
vi.mock("../../utils/shadcn-config.js", () => ({
  hasStarwindProRegistry: vi.fn().mockResolvedValue(false),
}));

import * as shadcnConfig from "../../utils/shadcn-config.js";

const mockIntro = vi.mocked(clackPrompts.intro);
const mockOutro = vi.mocked(clackPrompts.outro);
const mockCancel = vi.mocked(clackPrompts.cancel);
const mockNote = vi.mocked(clackPrompts.note);
const mockTasks = vi.mocked(clackPrompts.tasks);
const mockLog = vi.mocked(clackPrompts.log);

const mockSearchProBlocks = vi.mocked(proManifest.searchProBlocks);
const mockGetAllComponents = vi.mocked(registry.getAllComponents);
const mockHasStarwindProRegistry = vi.mocked(shadcnConfig.hasStarwindProRegistry);

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
        await t.task();
      }
    });

    mockSearchProBlocks.mockResolvedValue([]);
    mockGetAllComponents.mockResolvedValue([
      { name: "card", version: "1.0.0", dependencies: [], type: "component" },
      { name: "button", version: "1.0.0", dependencies: [], type: "component" },
    ]);
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
    });
  });

  it("filters core components by query", async () => {
    await search("card");
    expect(mockGetAllComponents).toHaveBeenCalled();
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
    expect(mockGetAllComponents).not.toHaveBeenCalled();
  });

  it("skips core components when plan filter is used", async () => {
    await search("hero", { plan: "free" });
    expect(mockSearchProBlocks).toHaveBeenCalled();
    expect(mockGetAllComponents).not.toHaveBeenCalled();
  });

  it("handles unexpected errors gracefully", async () => {
    mockSearchProBlocks.mockRejectedValue(new Error("Network error"));
    await expect(search("hero")).rejects.toThrow("process.exit called");
    expect(mockLog.error).toHaveBeenCalledWith("Network error");
    expect(mockCancel).toHaveBeenCalledWith("Operation cancelled");
    expect(mockExit).toHaveBeenCalledWith(1);
  });
});
