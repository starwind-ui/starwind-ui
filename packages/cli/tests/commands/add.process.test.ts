import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { execa } from "execa";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const entrypoint = fileURLToPath(new URL("../../src/index.ts", import.meta.url));
const responses = new URL("../fixtures/registry-response.mjs", import.meta.url).href;
const tsconfig = fileURLToPath(new URL("../../tsconfig.json", import.meta.url));

describe("add process status", () => {
  let project: string;
  beforeEach(async () => {
    project = await mkdtemp(join(tmpdir(), "starwind-add-process-"));
    await writeFile(
      join(project, "package.json"),
      JSON.stringify({
        name: "cli-test",
        type: "module",
        dependencies: { astro: "^7.0.0", "@starwind-ui/astro": "1.2.1" },
      }),
    );
    await writeFile(
      join(project, "starwind.config.json"),
      JSON.stringify({
        $schema: "https://starwind.dev/config-schema.v2.json",
        version: 2,
        framework: "astro",
        registry: { source: "bundled", version: "0.1.0" },
        tailwind: { css: "src/styles/starwind.css", baseColor: "neutral", cssVariables: true },
        componentDir: "src/components/starwind",
        components: [],
        pro: {
          registry: {
            url: "https://pro.starwind.dev/r/{name}",
            headers: { Authorization: "Bearer ${STARWIND_LICENSE_KEY}" },
          },
        },
      }),
    );
    await writeFile(
      join(project, "registry.json"),
      JSON.stringify({
        version: "0.1.0",
        components: [
          {
            name: "test-free",
            type: "component",
            version: "1.0.0",
            dependencies: [],
            targets: {
              astro: {
                files: [
                  {
                    path: "src/components/starwind/test-free/TestFree.astro",
                    content: "<div>Free component</div>",
                  },
                ],
                componentDependencies: [],
                packageRequirements: [{ name: "@starwind-ui/astro", range: "^1.0.0" }],
              },
            },
          },
        ],
      }),
    );
  });
  afterEach(async () => {
    await rm(project, { recursive: true, force: true });
  });

  async function run(scenario: string, components = ["@starwind-pro/test-card"]) {
    const env = Object.fromEntries(
      Object.entries(process.env).filter(
        ([name]) => !name.startsWith("STARWIND_") && name !== "NODE_OPTIONS",
      ),
    );
    return execa(
      process.execPath,
      [
        "--import",
        pathToFileURL(require.resolve("tsx")).href,
        "--import",
        responses,
        entrypoint,
        "add",
        ...components,
        "--yes",
        "--package-manager",
        "pnpm",
        "--registry",
        join(project, "registry.json"),
      ],
      {
        cwd: project,
        reject: false,
        extendEnv: false,
        env: {
          ...env,
          TSX_TSCONFIG_PATH: tsconfig,
          STARWIND_TEST_RESPONSE: scenario,
          ...(scenario === "paid" ? { STARWIND_LICENSE_KEY: "test-license-only" } : {}),
          NO_COLOR: "1",
        },
      },
    );
  }

  it.each(["missing", "invalid", "placeholder", "server", "network"])(
    "returns status 1 for a %s failure and keeps the diagnostic",
    async (scenario) => {
      if (scenario === "placeholder")
        await writeFile(join(project, ".env.local"), "STARWIND_LICENSE_KEY=your-license-key\n");
      const result = await run(scenario);
      expect(result.stdout).toContain("Failed to install Pro registry components:");
      expect(result.stdout).toContain("@starwind-pro/test-card");
      expect(result.stdout).toContain(
        "Some components could not be installed. See the errors above.",
      );
      expect(result.stdout).not.toContain("Enjoy using Starwind UI");
      expect(result.exitCode).toBe(1);
    },
  );

  it.each(["free", "paid"])("returns zero for a successful %s block", async (scenario) => {
    const result = await run(scenario);
    expect(result.exitCode, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain("Successfully installed Pro registry components:");
    expect(result.stdout).not.toContain("test-license-only");
    expect(
      await readFile(join(project, "src/components/starwind-pro/test-card/TestCard.astro"), "utf8"),
    ).toContain("Test card");
  });

  it("keeps a successful free component when a Pro block fails and returns 1", async () => {
    const result = await run("invalid", ["test-free", "@starwind-pro/test-card"]);
    expect(result.stdout).toContain("Successfully installed components:");
    expect(result.stdout).toContain("Failed to install Pro registry components:");
    expect(result.exitCode).toBe(1);
    expect(
      await readFile(join(project, "src/components/starwind/test-free/TestFree.astro"), "utf8"),
    ).toContain("Free component");
  });

  it("returns zero for a successful free component", async () => {
    const result = await run("free", ["test-free"]);
    expect(result.exitCode, result.stdout + result.stderr).toBe(0);
    expect(result.stdout).toContain("Successfully installed components:");
  });
  it("returns 1 when a free component has a missing dependency", async () => {
    const registryPath = join(project, "registry.json");
    const registry = JSON.parse(await readFile(registryPath, "utf8"));
    registry.components[0].targets.astro.componentDependencies = ["missing-dependency"];
    await writeFile(registryPath, JSON.stringify(registry));
    const result = await run("free", ["test-free"]);
    expect(result.stdout).toContain("Failed to install components:");
    expect(result.exitCode).toBe(1);
  });

  it("returns zero when an installed block is skipped", async () => {
    expect((await run("free")).exitCode).toBe(0);
    const result = await run("free");
    expect(result.stdout).toContain("Skipped Pro registry components:");
    expect(result.exitCode).toBe(0);
  });
});
