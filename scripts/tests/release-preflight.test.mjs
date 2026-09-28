import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createSpawnCommand, getPackageManagerCommand } from "../command-process.mjs";
import { collectPreflightFailures, rehearseRelease } from "../release-preflight.mjs";
import {
  createChangesetStatusCommand,
  runChangesetStatus,
} from "../portable-runtime/changeset-status.ts";

const roots = [];

async function createFixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-release-preflight-test-"));
  roots.push(root);
  execFileSync("git", ["init", "-b", "main"], { cwd: root, stdio: "pipe" });
  execFileSync("git", ["config", "user.name", "Release preflight test"], { cwd: root });
  execFileSync("git", ["config", "user.email", "release-preflight-test@localhost"], { cwd: root });
  await writeFile(path.join(root, "package.json"), '{"name":"fixture"}\n');
  await writeFile(path.join(root, "release-input.txt"), "committed\n");
  execFileSync("git", ["add", "."], { cwd: root });
  execFileSync("git", ["commit", "--quiet", "-m", "fixture"], { cwd: root });
  await writeFile(path.join(root, "release-input.txt"), "working edit\n");
  await writeFile(path.join(root, "untracked-release-input.txt"), "untracked edit\n");
  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

describe("release preflight", () => {
  it("executes Changesets through the package manager instead of parsing pnpm as JavaScript", () => {
    const command = createChangesetStatusCommand();
    expect(command).toEqual(
      createSpawnCommand(getPackageManagerCommand("pnpm"), [
        "exec",
        "changeset",
        "status",
        "--verbose",
      ]),
    );
    expect(command.command).not.toBe(process.execPath);
  });

  it.each(["success", "failure"])(
    "restores pending component intents after Changesets %s",
    async (outcome) => {
      const root = await mkdtemp(path.join(os.tmpdir(), "changeset-status-test-"));
      roots.push(root);
      for (const directory of ["styled-components", "primitive-components"]) {
        const pending = path.join(root, ".changeset", directory);
        await mkdir(pending, { recursive: true });
        await writeFile(path.join(pending, "changes.md"), `${directory}\n`);
      }
      const execution = runChangesetStatus({
        repoRoot: root,
        run: async () => {
          if (outcome === "failure") throw new Error("changeset status failed");
          return { stdout: "status output\n", stderr: "" };
        },
      });
      if (outcome === "failure") await expect(execution).rejects.toThrow("changeset status failed");
      else await expect(execution).resolves.toBe("status output\n");

      expect(existsSync(path.join(root, ".changeset/styled-components/changes.md"))).toBe(true);
      expect(existsSync(path.join(root, ".changeset/primitive-components/changes.md"))).toBe(true);
      expect(existsSync(path.join(root, ".styled-component-intents"))).toBe(false);
      expect(existsSync(path.join(root, ".primitive-component-intents"))).toBe(false);
    },
  );
  it("reports every independent preflight failure", async () => {
    const calls = [];

    await expect(
      collectPreflightFailures([
        ["first", async () => calls.push("first")],
        [
          "second",
          async () => {
            calls.push("second");
            throw new Error("second failure");
          },
        ],
        [
          "third",
          async () => {
            calls.push("third");
            throw new Error("third failure");
          },
        ],
      ]),
    ).rejects.toThrow(
      "Release preflight found 2 failed check(s):\nsecond: second failure\nthird: third failure",
    );

    expect(calls).toEqual(["first", "second", "third"]);
  });

  it("copies working release inputs into a disposable successful rehearsal", async () => {
    const root = await createFixture();
    const calls = [];
    let candidate;
    let copiedInputs;

    await rehearseRelease({
      root,
      run: async (args, cwd) => {
        candidate ??= cwd;
        calls.push(args);
        copiedInputs ??= await Promise.all([
          readFile(path.join(cwd, "release-input.txt"), "utf8"),
          readFile(path.join(cwd, "untracked-release-input.txt"), "utf8"),
        ]);
      },
    });

    expect(copiedInputs).toEqual(["working edit\n", "untracked edit\n"]);
    expect(calls.at(-1)).toEqual(["audit:prod"]);
    expect(calls).toContainEqual(["release:version"]);
    expect(calls).toContainEqual(["install", "--frozen-lockfile", "--ignore-scripts", "--offline"]);
    expect(existsSync(candidate)).toBe(false);
  });

  it("runs the audit and removes the rehearsal when versioning fails", async () => {
    const root = await createFixture();
    const calls = [];
    let candidate;

    await expect(
      rehearseRelease({
        root,
        run: async (args, cwd) => {
          candidate ??= cwd;
          calls.push(args);
          if (args[0] === "release:version") throw new Error("version rehearsal failed");
        },
      }),
    ).rejects.toThrow(/version rehearsal: version rehearsal failed/);

    expect(calls).toContainEqual(["audit:prod"]);
    expect(existsSync(candidate)).toBe(false);
  });
});
