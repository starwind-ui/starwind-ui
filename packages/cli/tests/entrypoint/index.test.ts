import type { Command, OutputConfiguration } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../src/commands/add.js", () => ({ add: vi.fn() }));
vi.mock("../../src/commands/docs.js", () => ({ docs: vi.fn() }));
vi.mock("../../src/commands/init.js", () => ({ init: vi.fn() }));
vi.mock("../../src/commands/migrate.js", () => ({ migrate: vi.fn() }));
vi.mock("../../src/commands/primitives.js", () => ({
  primitivesAdd: vi.fn(),
  primitivesList: vi.fn(),
  primitivesUpdate: vi.fn(),
}));
vi.mock("../../src/commands/remove.js", () => ({ remove: vi.fn() }));
vi.mock("../../src/commands/search.js", () => ({ search: vi.fn() }));
vi.mock("../../src/commands/setup.js", () => ({ setup: vi.fn() }));
vi.mock("../../src/commands/update.js", () => ({ update: vi.fn() }));

import { add } from "../../src/commands/add.js";
import { init } from "../../src/commands/init.js";
import { primitivesAdd, primitivesList, primitivesUpdate } from "../../src/commands/primitives.js";
import { remove } from "../../src/commands/remove.js";
import { search } from "../../src/commands/search.js";
import { update } from "../../src/commands/update.js";
import { createProgram } from "../../src/program.js";

const mockAdd = vi.mocked(add);
const mockInit = vi.mocked(init);
const mockPrimitivesAdd = vi.mocked(primitivesAdd);
const mockPrimitivesList = vi.mocked(primitivesList);
const mockPrimitivesUpdate = vi.mocked(primitivesUpdate);
const mockRemove = vi.mocked(remove);
const mockSearch = vi.mocked(search);
const mockUpdate = vi.mocked(update);

describe("starwind CLI parser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes valid search plan choices through to the search command", async () => {
    const program = createTestProgram();

    await program.parseAsync(["search", "hero", "--plan", "free", "--json"], {
      from: "user",
    });

    expect(mockSearch).toHaveBeenCalledWith(
      "hero",
      expect.objectContaining({
        json: true,
        limit: 20,
        offset: 0,
        plan: "free",
      }),
    );
  });

  it("passes the pro search plan choice through to the search command", async () => {
    const program = createTestProgram();

    await program.parseAsync(["search", "hero", "--plan", "pro", "--json"], {
      from: "user",
    });

    expect(mockSearch).toHaveBeenCalledWith(
      "hero",
      expect.objectContaining({
        plan: "pro",
      }),
    );
  });

  it("passes primitive search options through to the search command", async () => {
    const program = createTestProgram();

    await program.parseAsync(
      ["search", "button", "--primitives", "--framework", "react", "--json"],
      {
        from: "user",
      },
    );

    expect(mockSearch).toHaveBeenCalledWith(
      "button",
      expect.objectContaining({
        framework: "react",
        json: true,
        primitives: true,
      }),
    );
  });

  it("passes all-framework primitive search through to the search command", async () => {
    const program = createTestProgram();

    await program.parseAsync(["search", "button", "--primitives", "--framework", "all"], {
      from: "user",
    });

    expect(mockSearch).toHaveBeenCalledWith(
      "button",
      expect.objectContaining({
        framework: "all",
        primitives: true,
      }),
    );
  });

  it("rejects invalid search plan choices through Commander", async () => {
    const program = createTestProgram();
    let stderr = "";

    program.configureOutput({
      writeErr: (message: string) => {
        stderr += message;
      },
    });
    configureCommandTree(program, {
      writeErr: (message: string) => {
        stderr += message;
      },
    });

    await expect(
      program.parseAsync(["search", "hero", "--plan", "team"], {
        from: "user",
      }),
    ).rejects.toMatchObject({
      code: "commander.invalidArgument",
    });

    expect(stderr).toContain("error: option '-p, --plan <plan>' argument 'team' is invalid");
    expect(stderr).toContain("Allowed choices are free, pro");
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("parses overwrite after a Pro registry component into add options", async () => {
    const program = createTestProgram();

    await program.parseAsync(["add", "@starwind-pro/shader-glass-aurora", "--overwrite"], {
      from: "user",
    });

    expect(mockAdd).toHaveBeenCalledWith(
      ["@starwind-pro/shader-glass-aurora"],
      expect.objectContaining({
        overwrite: true,
      }),
      expect.anything(),
    );
  });

  it("passes styled update framework choices through to the update command", async () => {
    const program = createTestProgram();

    await program.parseAsync(["update", "--all", "--framework", "all"], {
      from: "user",
    });

    expect(mockUpdate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        all: true,
        framework: "all",
      }),
      expect.anything(),
    );
  });

  it.each(["astro", "react", "all"] as const)(
    "passes the %s framework choice through to the remove command",
    async (framework) => {
      const program = createTestProgram();

      await program.parseAsync(["remove", "button", "--framework", framework], {
        from: "user",
      });

      expect(mockRemove).toHaveBeenCalledWith(
        ["button"],
        expect.objectContaining({ framework }),
        expect.anything(),
      );
    },
  );

  it("rejects the removed init --component-layer option through Commander", async () => {
    const program = createTestProgram();
    let stderr = "";

    program.configureOutput({
      writeErr: (message: string) => {
        stderr += message;
      },
    });
    configureCommandTree(program, {
      writeErr: (message: string) => {
        stderr += message;
      },
    });

    await expect(
      program.parseAsync(["init", "--component-layer", "primitives"], {
        from: "user",
      }),
    ).rejects.toMatchObject({
      code: "commander.unknownOption",
    });

    expect(stderr).toContain("error: unknown option '--component-layer'");
    expect(mockInit).not.toHaveBeenCalled();
  });

  it("documents primitive commands in help without the removed component layer option", () => {
    const program = createProgram();
    const rootHelp = program.helpInformation();
    const initHelp = getCommand(program, "init").helpInformation();
    const addHelp = getCommand(program, "add").helpInformation();
    const updateHelp = getCommand(program, "update").helpInformation();
    const searchHelp = getCommand(program, "search").helpInformation();
    const primitivesCommand = getCommand(program, "primitives");
    const primitivesHelp = primitivesCommand.helpInformation();
    const primitiveAddHelp = getCommand(primitivesCommand, "add").helpInformation();

    expect(rootHelp).toContain("primitives");
    expect(initHelp).not.toContain("component-layer");
    expect(addHelp).toContain("--framework <framework>");
    expect(updateHelp).toContain("--framework <framework>");
    expect(searchHelp).toContain("--primitives");
    expect(searchHelp).toContain("--framework <framework>");
    expect(primitivesHelp).toContain("add");
    expect(primitivesHelp).toContain("update");
    expect(primitivesHelp).toContain("list");
    expect(primitiveAddHelp).toContain("--framework <framework>");
    expect(primitiveAddHelp).toContain("--to <dir>");
    expect(primitiveAddHelp).toContain("-p, --path <dir>");
  });

  it("parses primitive add names and options into the primitives add command", async () => {
    const program = createTestProgram();

    await program.parseAsync(
      ["primitives", "add", "--to", "src/primitives", "--yes", "--all", "-m", "pnpm"],
      {
        from: "user",
      },
    );

    expect(mockPrimitivesAdd).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        packageManager: "pnpm",
        to: "src/primitives",
        yes: true,
        all: true,
      }),
      expect.anything(),
    );
  });

  it("parses primitive add framework and path aliases into the primitives add command", async () => {
    const program = createTestProgram();

    await program.parseAsync(
      ["primitives", "add", "button", "--framework", "react", "--path", "src/react-primitives"],
      {
        from: "user",
      },
    );

    expect(mockPrimitivesAdd).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        framework: "react",
        path: "src/react-primitives",
      }),
      expect.anything(),
    );
  });

  it("parses primitive add short path alias into the primitives add command", async () => {
    const program = createTestProgram();

    await program.parseAsync(["primitives", "add", "button", "-p", "src/react-primitives"], {
      from: "user",
    });

    expect(mockPrimitivesAdd).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        path: "src/react-primitives",
      }),
      expect.anything(),
    );
  });

  it("parses primitive add overwrite into the primitives add command", async () => {
    const program = createTestProgram();

    await program.parseAsync(["primitives", "add", "button", "--overwrite"], {
      from: "user",
    });

    expect(mockPrimitivesAdd).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        overwrite: true,
      }),
      expect.anything(),
    );
  });

  it("parses primitive update names and options into the primitives update command", async () => {
    const program = createTestProgram();

    await program.parseAsync(
      [
        "primitives",
        "update",
        "button",
        "--yes",
        "--dry-run",
        "--framework",
        "react",
        "--diff",
        "src/file.ts",
        "-m",
        "pnpm",
      ],
      {
        from: "user",
      },
    );

    expect(mockPrimitivesUpdate).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        packageManager: "pnpm",
        yes: true,
        dryRun: true,
        framework: "react",
        diff: "src/file.ts",
      }),
      expect.anything(),
    );
  });

  it("parses primitive update view options into the primitives update command", async () => {
    const program = createTestProgram();

    await program.parseAsync(["primitives", "update", "button", "--view", "src/file.ts"], {
      from: "user",
    });

    expect(mockPrimitivesUpdate).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        view: "src/file.ts",
      }),
      expect.anything(),
    );
  });

  it("parses primitive update bare view into the primitives update command", async () => {
    const program = createTestProgram();

    await program.parseAsync(["primitives", "update", "button", "--view"], {
      from: "user",
    });

    expect(mockPrimitivesUpdate).toHaveBeenCalledWith(
      ["button"],
      expect.objectContaining({
        view: true,
      }),
      expect.anything(),
    );
  });

  it("parses primitive list options into the primitives list command", async () => {
    const program = createTestProgram();

    await program.parseAsync(["primitives", "list", "--framework", "react", "--json"], {
      from: "user",
    });

    expect(mockPrimitivesList).toHaveBeenCalledWith(
      expect.objectContaining({
        framework: "react",
        json: true,
      }),
      expect.anything(),
    );
  });

  it("keeps command construction importable without running the bin entrypoint", () => {
    expect(createProgram().name()).toBe("starwind");
  });
});

function createTestProgram() {
  const program = createProgram();
  configureCommandTree(program, {
    writeOut: () => {},
    writeErr: () => {},
  });

  return program;
}

function configureCommandTree(command: Command, output: OutputConfiguration) {
  command.exitOverride();
  command.configureOutput(output);

  for (const childCommand of command.commands) {
    configureCommandTree(childCommand, output);
  }
}

function getCommand(command: Command, name: string): Command {
  const child = command.commands.find((entry) => entry.name() === name);

  if (!child) {
    throw new Error(`Expected ${command.name()} to include ${name}`);
  }

  return child;
}
