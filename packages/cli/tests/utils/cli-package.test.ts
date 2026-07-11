import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

describe("CLI package metadata", () => {
  it("does not ship the legacy core package as a production dependency", async () => {
    const packageJson = JSON.parse(
      await readFile(new URL("../../package.json", import.meta.url), "utf-8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      scripts?: Record<string, string>;
    };

    expect(packageJson.dependencies).not.toHaveProperty("@starwind-ui/core");
    expect(JSON.stringify(packageJson.scripts ?? {})).not.toContain("@starwind-ui/core");
  });
});
