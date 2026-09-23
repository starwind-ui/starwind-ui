import { describe, expect, it } from "vitest";
import { hasReleaseVersionChange } from "../detect-release-version-changes.mjs";

describe("release version detection", () => {
  it("reads a real Git history when a package is added and rejects invalid refs", () => {
    const cwd = mkdtempSync(path.join(tmpdir(), "starwind-release-package-addition-"));
    const script = fileURLToPath(new URL("../detect-release-version-changes.mjs", import.meta.url));
    const git = (...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
    try {
      git("init", "--quiet");
      git("config", "user.name", "Fixture");
      git("config", "user.email", "fixture@example.test");
      git("commit", "--allow-empty", "--quiet", "-m", "Before package addition");
      const before = git("rev-parse", "HEAD");
      mkdirSync(path.join(cwd, "packages/svelte"), { recursive: true });
      writeFileSync(
        path.join(cwd, "packages/svelte/package.json"),
        JSON.stringify({ version: "0.1.0" }),
      );
      git("add", ".");
      git("commit", "--quiet", "-m", "Add package");
      expect(
        execFileSync(process.execPath, [script, before, "HEAD"], { cwd, encoding: "utf8" }).trim(),
      ).toBe("versioned=true");
      expect(
        execFileSync(process.execPath, [script, "HEAD", "HEAD"], { cwd, encoding: "utf8" }).trim(),
      ).toBe("versioned=false");
      expect(spawnSync(process.execPath, [script, "missing-ref", "HEAD"], { cwd }).status).not.toBe(
        0,
      );
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
  it("detects Vue-only beta versioning without a deleted Changeset", () => {
    expect(
      hasReleaseVersionChange({ vue: { version: "0.1.0" } }, { vue: { version: "0.1.1" } }),
    ).toBe(true);
  });
  it("detects the initial private-to-public Vue beta", () => {
    expect(
      hasReleaseVersionChange(
        { vue: { version: "0.0.0", private: true } },
        { vue: { version: "0.1.0" } },
      ),
    ).toBe(true);
  });
  it("detects the initial public Svelte beta version", () => {
    expect(
      hasReleaseVersionChange(
        { svelte: { version: "0.0.0", private: true } },
        { svelte: { version: "0.1.0" } },
      ),
    ).toBe(true);
  });
  it.each(["runtime", "astro", "react", "cli"])("detects %s version changes", (name) => {
    expect(
      hasReleaseVersionChange({ [name]: { version: "1.0.0" } }, { [name]: { version: "1.0.1" } }),
    ).toBe(true);
  });
  it("ignores dependency-only changes and private packages", () => {
    expect(
      hasReleaseVersionChange(
        { vue: { version: "0.1.0" } },
        { vue: { version: "0.1.0", dependencies: { vue: "3.5.0" } } },
      ),
    ).toBe(false);
    expect(
      hasReleaseVersionChange(
        {},
        { vue: { version: "0.0.1", private: true }, svelte: { version: "1.0.0", private: true } },
      ),
    ).toBe(false);
  });
});

import { execFileSync, spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
