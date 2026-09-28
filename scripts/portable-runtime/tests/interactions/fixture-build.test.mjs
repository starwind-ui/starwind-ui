import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { copyFixtureApp } from "../../runtime-performance/interactions/build.mjs";

describe("production fixture copy", () => {
  it("includes the local helper imported by the copied React host", async () => {
    const appRoot = mkdtempSync(path.join(os.tmpdir(), "react-perf-fixture-"));
    try {
      copyFixtureApp(appRoot);
      const host = readFileSync(path.join(appRoot, "shared.jsx"), "utf8");
      const localImports = [
        ...host.matchAll(/import\s+(?:[^;]+?\s+from\s+)?["'](\.[^"']+)["']/g),
      ].map((match) => match[1]);
      expect(localImports).toContain("./menu-actions.mjs");
      for (const specifier of localImports)
        expect(existsSync(path.resolve(appRoot, specifier))).toBe(true);
      const { recordMenuCallback } = await import(
        pathToFileURL(path.join(appRoot, "menu-actions.mjs")).href
      );
      const actions = [];
      recordMenuCallback(
        { id: "action-3", disabled: true },
        "onClick",
        () => {},
        (id) => actions.push(id),
      );
      expect(actions).toEqual([]);
    } finally {
      rmSync(appRoot, { recursive: true, force: true });
    }
  });
});
