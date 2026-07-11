import { describe, expect, it } from "vitest";

import { getFormatGeneratedOutputCommands } from "../format-generated-output.js";

describe("formatGeneratedOutput", () => {
  it("runs pnpm.cmd through a shell on Windows", () => {
    const commands = getFormatGeneratedOutputCommands({
      cwd: "C:/repo",
      npmExecPath: null,
      paths: ["generated"],
      platform: "win32",
    });
    const [prettier, biome] = commands;

    expect(prettier.command).toBe("pnpm.cmd");
    expect(prettier.args).toEqual(["exec", "prettier", "-w", "generated"]);
    expect(prettier.options).toMatchObject({ cwd: "C:/repo", shell: true, stdio: "inherit" });
    expect(biome.command).toBe("pnpm.cmd");
    expect(biome.args).toEqual([
      "exec",
      "biome",
      "check",
      "--write",
      "--formatter-enabled=false",
      "--linter-enabled=false",
      "--diagnostic-level=info",
      "generated",
    ]);
    expect(biome.options).toMatchObject({ cwd: "C:/repo", shell: true, stdio: "inherit" });
  });

  it("runs pnpm directly off Windows", () => {
    const [prettier, biome] = getFormatGeneratedOutputCommands({
      cwd: "/repo",
      npmExecPath: null,
      paths: ["generated"],
      platform: "linux",
    });

    expect(prettier.command).toBe("pnpm");
    expect(prettier.options).toMatchObject({ cwd: "/repo", shell: false, stdio: "inherit" });
    expect(biome.command).toBe("pnpm");
    expect(biome.options).toMatchObject({ cwd: "/repo", shell: false, stdio: "inherit" });
  });

  it("runs non-cmd npm exec paths through node", () => {
    const [prettier, biome] = getFormatGeneratedOutputCommands({
      cwd: "C:/repo",
      npmExecPath: "C:/pnpm/bin/pnpm.cjs",
      paths: ["generated"],
      platform: "win32",
    });

    expect(prettier.command).toBe(process.execPath);
    expect(prettier.args).toEqual(["C:/pnpm/bin/pnpm.cjs", "exec", "prettier", "-w", "generated"]);
    expect(prettier.options).toMatchObject({ cwd: "C:/repo", shell: false, stdio: "inherit" });
    expect(biome.command).toBe(process.execPath);
    expect(biome.args).toEqual([
      "C:/pnpm/bin/pnpm.cjs",
      "exec",
      "biome",
      "check",
      "--write",
      "--formatter-enabled=false",
      "--linter-enabled=false",
      "--diagnostic-level=info",
      "generated",
    ]);
    expect(biome.options).toMatchObject({ cwd: "C:/repo", shell: false, stdio: "inherit" });
  });

  it("can pass a standalone Biome config for generated paths outside the repo", () => {
    const [, biome] = getFormatGeneratedOutputCommands({
      biomeConfigPath: "C:/tmp/biome-generated/biome.json",
      cwd: "C:/repo",
      npmExecPath: null,
      paths: ["C:/tmp/generated"],
      platform: "win32",
    });

    expect(biome.args).toEqual([
      "exec",
      "biome",
      "check",
      "--write",
      "--formatter-enabled=false",
      "--linter-enabled=false",
      "--diagnostic-level=info",
      "--config-path",
      "C:/tmp/biome-generated/biome.json",
      "C:/tmp/generated",
    ]);
  });

  it("can pass the repository Prettier config for generated paths outside the repo", () => {
    const [prettier] = getFormatGeneratedOutputCommands({
      cwd: "C:/repo",
      npmExecPath: null,
      paths: ["C:/tmp/generated"],
      platform: "win32",
      prettierConfigPath: "C:/repo/prettier.config.mjs",
    });

    expect(prettier.args).toEqual([
      "exec",
      "prettier",
      "-w",
      "--config",
      "C:/repo/prettier.config.mjs",
      "C:/tmp/generated",
    ]);
  });
});
