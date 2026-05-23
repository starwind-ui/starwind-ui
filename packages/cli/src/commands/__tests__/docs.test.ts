import * as clackPrompts from "@clack/prompts";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as registry from "../../utils/registry.js";
import { docs } from "../docs.js";

vi.mock("@clack/prompts");
vi.mock("../../utils/registry.js");

const mockIntro = vi.mocked(clackPrompts.intro);
const mockOutro = vi.mocked(clackPrompts.outro);
const mockCancel = vi.mocked(clackPrompts.cancel);

const mockLog = {
  error: vi.fn(),
  info: vi.fn(),
  message: vi.fn(),
};
vi.mocked(clackPrompts).log = mockLog as typeof clackPrompts.log;

const mockGetAllComponents = vi.mocked(registry.getAllComponents);

describe("docs command", () => {
  let mockExit: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockExit = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    mockGetAllComponents.mockResolvedValue([
      { name: "card", version: "1.0.0", dependencies: [], type: "component" },
      { name: "button", version: "1.0.0", dependencies: [], type: "component" },
    ]);
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
});
