import { join } from "node:path";
import { fileURLToPath } from "node:url";

import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildRuntimeRegistry,
  createCliRegistryBuildPolicy,
} from "../../../../scripts/portable-runtime/generate-cli-registry.js";
import { vueFrameworkAdapterTarget } from "../../../../scripts/portable-runtime/renderers/framework-adapters/vue/index.js";

import * as registry from "../../src/utils/registry.js";
import { docs } from "../../src/commands/docs.js";
import { PRIVATE_VUE_FRAMEWORK_TARGET_POLICY } from "../../src/utils/framework-target-policy.js";

vi.mock("@clack/prompts");
vi.mock("../../src/utils/registry.js");

const mockIntro = vi.mocked(clackPrompts.intro);
const mockOutro = vi.mocked(clackPrompts.outro);

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

const mockLoadRegistry = vi.mocked(registry.loadRegistry);
const mockParseRegistrySource = vi.mocked(registry.parseRegistrySource);

describe("docs command", () => {
  let mockExit: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let vueRegistry: Awaited<ReturnType<typeof buildRuntimeRegistry>>;

  beforeAll(async () => {
    vueRegistry = await buildRuntimeRegistry({
      repoRoot: fileURLToPath(new URL("../../../..", import.meta.url)),
      targetPolicy: createCliRegistryBuildPolicy([vueFrameworkAdapterTarget]),
    });
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    mockParseRegistrySource.mockImplementation((value) =>
      value ? { type: "remote", url: value } : undefined,
    );
    mockLoadRegistry.mockResolvedValue({
      $schema: "https://starwind.dev/registry-schema.v2.json",
      version: "0.1.0",
      components: [
        {
          name: "card",
          version: "1.0.0",
          sourceVersion: "1.0.0",
          dependencies: [],
          type: "component",
        },
        {
          name: "button",
          version: "1.0.0",
          sourceVersion: "1.0.0",
          dependencies: [],
          type: "component",
        },
      ],
    });
  });

  afterEach(() => {
    mockExit.mockRestore();
    consoleLogSpy.mockRestore();
  });

  it("shows intro and outro for valid components", async () => {
    await docs(["card", "button"]);
    expect(mockIntro).toHaveBeenCalledTimes(1);
    expect(mockOutro).toHaveBeenCalledTimes(1);
  });

  it("prints doc URLs for valid components", async () => {
    await docs(["card", "button"]);
    expect(mockLog.info).toHaveBeenCalledTimes(2);
    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("https://starwind.dev/docs/components/card/"),
    );
    expect(mockLog.info).toHaveBeenCalledWith(
      expect.stringContaining("https://starwind.dev/docs/components/button/"),
    );
  });

  it("exits with error for invalid component", async () => {
    await expect(docs(["not-real"])).rejects.toThrow("process.exit called");
    expect(mockLog.error).toHaveBeenCalledWith(expect.stringContaining("not-real"));
    expect(mockExit).toHaveBeenCalledWith(1);
  });

  it("outputs JSON when --json is passed", async () => {
    await docs(["card"], { json: true });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const output = JSON.parse(consoleLogSpy.mock.calls[0][0] as string);
    expect(output).toEqual([
      { component: "card", url: "https://starwind.dev/docs/components/card/" },
    ]);
  });

  it("loads docs from an explicit remote registry", async () => {
    await docs(["card"], {
      registry: "https://starwind.dev/registry/0.1.0/registry.json",
    });

    expect(mockLoadRegistry).toHaveBeenCalledWith({
      type: "remote",
      url: "https://starwind.dev/registry/0.1.0/registry.json",
    });
  });

  it("uses an injected private Vue registry without changing docs output", async () => {
    await docs(
      ["theme-toggle"],
      { json: true },
      {
        registry: vueRegistry,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );

    expect(mockLoadRegistry).not.toHaveBeenCalled();
    expect(JSON.parse(consoleLogSpy.mock.calls[0]![0] as string)).toEqual([
      {
        component: "theme-toggle",
        url: "https://starwind.dev/docs/components/theme-toggle/",
      },
    ]);
  });
});
