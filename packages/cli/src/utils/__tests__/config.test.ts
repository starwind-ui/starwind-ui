import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { getConfig, updateConfig } from "../config.js";
import { PATHS } from "../constants.js";

const DEFAULT_SCHEMA = "https://starwind.dev/config-schema.json";

describe.sequential("config utilsDir handling", () => {
  let tempDir = "";
  let previousCwd = "";

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "starwind-config-test-"));
    previousCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(previousCwd);
    await rm(tempDir, { recursive: true, force: true });
  });

  it("returns default utilsDir when config file is missing", async () => {
    const config = await getConfig();

    expect(config.utilsDir).toBe(PATHS.LOCAL_UTILS_DIR);
  });

  it("preserves existing utilsDir when updates omit it", async () => {
    await writeFile(
      "starwind.config.json",
      JSON.stringify(
        {
          $schema: DEFAULT_SCHEMA,
          tailwind: {
            css: "src/styles/starwind.css",
            baseColor: "neutral",
            cssVariables: true,
          },
          componentDir: "src/components/starwind",
          utilsDir: "src/custom/utils",
          components: [],
        },
        null,
        2,
      ),
      "utf-8",
    );

    await updateConfig({ components: [{ name: "button", version: "2.3.1" }] });

    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(updatedConfig.utilsDir).toBe("src/custom/utils");
  });

  it("writes updated utilsDir when explicitly provided", async () => {
    await updateConfig({ utilsDir: "src/shared/utils", components: [] });

    const updatedConfig = JSON.parse(await readFile("starwind.config.json", "utf-8"));
    expect(updatedConfig.utilsDir).toBe("src/shared/utils");
  });
});
