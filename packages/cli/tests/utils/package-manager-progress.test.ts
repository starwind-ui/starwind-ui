import { stripVTControlCharacters } from "node:util";

import * as p from "@clack/prompts";
import { execa } from "execa";
import { afterEach, describe, expect, it, vi } from "vitest";

import { installDependencies } from "../../src/utils/package-manager.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

const mockExeca = vi.mocked(execa);

describe("package installation progress", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps Clack task output under one progress renderer", async () => {
    mockExeca.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({} as Awaited<ReturnType<typeof execa>>), 350);
        }) as ReturnType<typeof execa>,
    );
    const writeSpy = vi
      .spyOn(process.stdout, "write")
      .mockImplementation((() => true) as typeof process.stdout.write);

    await p.tasks([
      {
        title: "Installing packages",
        task: async () => {
          await installDependencies(["react"], "pnpm");
          return "Packages installed successfully";
        },
      },
    ]);

    const output = stripVTControlCharacters(
      writeSpy.mock.calls.map(([chunk]) => String(chunk)).join(""),
    );

    expect(output).toContain("Installing packages");
    expect(output).not.toContain("Installing dependencies with pnpm");
  });
});
