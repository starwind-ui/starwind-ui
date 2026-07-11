import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { execa } from "execa";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  buildInstallDependencyArgs,
  detectPackageManager,
  installDependencies,
} from "../../src/utils/package-manager.js";
import { parsePackageSpec } from "../../src/utils/package-spec.js";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

const mockExeca = vi.mocked(execa);

describe("registry package specs", () => {
  it.each([
    "react",
    "@starwind-ui/react",
    "react@18.3.1",
    "react@^18.0.0",
    "react@>=18",
    "react@>=18 <20",
    "react@~18.2.0",
    "react@18.x",
    "react@next",
    "@starwind-ui/react@^0.1.0-beta.1",
  ])("accepts registry package spec %s", (value) => {
    expect(parsePackageSpec(value, "test package")).toBe(value);
  });

  it.each([
    "",
    "--global",
    "-D",
    "React",
    "@Scope/name",
    "@scope/Name",
    " react",
    "react ",
    "react\t@^18.0.0",
    "react\n--global",
    "@scope",
    "@scope/",
    "@/name",
    "@scope/name/child",
    "../react",
    "https://registry.example/react.tgz",
    "git+https://example.com/react.git",
    "git@github.com:example/react.git",
    "file:../react",
    "workspace:^",
    "npm:react",
    "preact-compat@npm:preact",
  ])("rejects unsafe or unsupported package spec %s", (value) => {
    expect(() => parsePackageSpec(value, "test package")).toThrow(/test package/i);
  });
});

describe("package manager dependency arguments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockExeca.mockResolvedValue({} as Awaited<ReturnType<typeof execa>>);
  });

  it.each([
    ["npm", ["install", "-D", "--force", "--", "react@^18.0.0", "zod@next"]],
    ["pnpm", ["add", "-D", "--force", "--", "react@^18.0.0", "zod@next"]],
    ["yarn", ["add", "--dev", "--force", "--", "react@^18.0.0", "zod@next"]],
    ["bun", ["add", "--dev", "--force", "--", "react@^18.0.0", "zod@next"]],
  ] as const)("builds separated %s arguments", (packageManager, expected) => {
    expect(
      buildInstallDependencyArgs(["react@^18.0.0", "zod@next"], packageManager, true, true),
    ).toEqual(expected);
  });

  it("places the terminator before packages without optional manager flags", () => {
    expect(buildInstallDependencyArgs(["react"], "npm")).toEqual(["install", "--", "react"]);
  });

  it("passes the separated arguments to execa", async () => {
    await installDependencies(["react@^18.0.0"], "pnpm", true, true);

    expect(mockExeca).toHaveBeenCalledWith("pnpm", ["add", "-D", "--force", "--", "react@^18.0.0"]);
  });

  it.each(["--global", "-D", "file:../react", "react@npm:preact"])(
    "rejects unsafe direct package argument %s before execution",
    async (value) => {
      await expect(installDependencies([value], "npm")).rejects.toThrow(/package/i);
      expect(mockExeca).not.toHaveBeenCalled();
    },
  );
});

describe("package manager detection", () => {
  it("prefers the project lockfile over the invoking package manager", () => {
    const cwd = mkdtempSync(join(tmpdir(), "starwind-package-manager-pnpm-"));
    writeFileSync(join(cwd, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
    vi.stubEnv("npm_config_user_agent", "npm/11.0.0 node/v24.0.0");

    expect(detectPackageManager({ cwd }).name).toBe("pnpm");

    vi.unstubAllEnvs();
    rmSync(cwd, { recursive: true, force: true });
  });

  it("uses the invoking package manager when the project has no lockfile", () => {
    const cwd = mkdtempSync(join(tmpdir(), "starwind-package-manager-unlocked-"));
    vi.stubEnv("npm_config_user_agent", "yarn/4.9.0 npm/? node/v24.0.0");

    expect(detectPackageManager({ cwd }).name).toBe("yarn");

    vi.unstubAllEnvs();
    rmSync(cwd, { recursive: true, force: true });
  });
});
