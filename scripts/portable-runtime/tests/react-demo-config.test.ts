import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

describe("React demo Vite config", () => {
  it("loads without depending on prebuilt React adapter output", async () => {
    const demoRoot = path.join(repoRoot, "apps/react-demo");
    const configPath = path.join(demoRoot, "vite.config.ts");
    const configSource = await readFile(configPath, "utf8");
    const themeToggleSource = await readFile(
      path.join(demoRoot, "src/components/starwind-runtime/theme-toggle/ThemeToggle.tsx"),
      "utf8",
    );
    const demoRequire = createRequire(path.join(demoRoot, "package.json"));
    const { loadConfigFromFile } = await import(pathToFileURL(demoRequire.resolve("vite")).href);

    const loaded = await loadConfigFromFile(
      {
        command: "serve",
        isPreview: false,
        isSsrBuild: false,
        mode: "development",
      },
      configPath,
      demoRoot,
      "silent",
    );

    expect(path.normalize(loaded?.path ?? "")).toBe(path.normalize(configPath));
    expect(configSource).not.toMatch(/from\s+["']@starwind-ui\/react(?:\/[^"']*)?["']/);
    expect(themeToggleSource).toContain(
      'import { initThemeController } from "@starwind-ui/react/theme";',
    );
  });
});
