import { describe, expect, it } from "vitest";

import {
  ASTRO_CONFIG_PATHS,
  detectHostPlan,
  formatDetectedHost,
  getHostPlan,
  validateHostTarget,
} from "../../src/utils/host-planner.js";

describe("host planning", () => {
  it("gathers configured Astro React evidence with the editable config extension set", async () => {
    const content =
      'import react from "@astrojs/react";\nexport default defineConfig({ integrations: [react()] });';
    const plan = await detectHostPlan(
      {
        dependencies: {
          "@astrojs/react": "^4.4.0",
          astro: "^7.0.0",
          react: "^19.2.0",
        },
      },
      {
        pathExists: async (filePath) => filePath === "astro.config.cjs",
        readFile: async () => content,
      },
    );

    expect(ASTRO_CONFIG_PATHS).toEqual([
      "astro.config.ts",
      "astro.config.js",
      "astro.config.mjs",
      "astro.config.cjs",
    ]);
    expect(plan.targets).toContainEqual({ framework: "react", readiness: "ready" });
  });

  it("plans React as the ready target for a Vite React host", () => {
    expect(
      getHostPlan(
        { dependencies: { react: "^19.2.0" }, devDependencies: { vite: "^8.2.0" } },
        { existingPaths: new Set(["vite.config.ts", "src/main.tsx"]) },
      ),
    ).toMatchObject({
      host: { kind: "vite", label: "Vite" },
      reactProject: { kind: "vite" },
      targets: [{ framework: "react", readiness: "ready" }],
    });
  });

  it("plans Astro as ready and React as configurable for a plain Astro host", () => {
    expect(
      getHostPlan(
        { dependencies: { astro: "^7.0.0" } },
        {
          astroConfig: {
            content:
              'import { defineConfig } from "astro/config";\nexport default defineConfig({});',
            path: "astro.config.mjs",
          },
          existingPaths: new Set(["astro.config.mjs"]),
        },
      ),
    ).toEqual({
      host: { kind: "astro", label: "Astro" },
      targets: [
        { framework: "astro", readiness: "ready" },
        { framework: "react", readiness: "configurable" },
      ],
    });
  });

  it("plans Astro and React as ready when the Astro React integration is configured", () => {
    const plan = getHostPlan(
      {
        dependencies: {
          "@astrojs/react": "^4.4.0",
          astro: "^7.0.0",
          react: "^19.2.0",
          "react-dom": "^19.2.0",
        },
      },
      {
        astroConfig: {
          content:
            'import react from "@astrojs/react";\nimport { defineConfig } from "astro/config";\nexport default defineConfig({ integrations: [react()] });',
          path: "astro.config.ts",
        },
        existingPaths: new Set(["astro.config.ts"]),
      },
    );

    expect(plan.targets).toEqual([
      { framework: "astro", readiness: "ready" },
      { framework: "react", readiness: "ready" },
    ]);
  });

  it("recognizes an aliased default Astro React integration import", () => {
    const plan = getHostPlan(
      {
        dependencies: {
          "@astrojs/react": "^4.4.0",
          astro: "^7.0.0",
          react: "^19.2.0",
        },
      },
      {
        astroConfig: {
          content:
            'import reactRenderer from "@astrojs/react";\nexport default defineConfig({ integrations: [reactRenderer()] });',
          path: "astro.config.ts",
        },
        existingPaths: new Set(["astro.config.ts"]),
      },
    );

    expect(plan.targets).toContainEqual({ framework: "react", readiness: "ready" });
  });

  it("recognizes an Astro React integration call with options", () => {
    const plan = getHostPlan(
      {
        dependencies: {
          "@astrojs/react": "^4.4.0",
          astro: "^7.0.0",
          react: "^19.2.0",
        },
      },
      {
        astroConfig: {
          content:
            'import react from "@astrojs/react";\nexport default defineConfig({ integrations: [react({ include: ["**/react/**"] })] });',
          path: "astro.config.ts",
        },
        existingPaths: new Set(["astro.config.ts"]),
      },
    );

    expect(plan.targets).toContainEqual({ framework: "react", readiness: "ready" });
  });

  it("does not label a nested Astro React call as ready", () => {
    const plan = getHostPlan(
      {
        dependencies: {
          "@astrojs/react": "^6.0.2",
          astro: "^7.0.0",
          react: "^19.2.0",
        },
      },
      {
        astroConfig: {
          content:
            'import react from "@astrojs/react";\nexport default defineConfig({ integrations: [[react()]] });',
          path: "astro.config.ts",
        },
        existingPaths: new Set(["astro.config.ts"]),
      },
    );

    expect(plan.targets).toContainEqual({ framework: "react", readiness: "configurable" });
  });

  it.each([
    `/*
import react from "@astrojs/react";
const integration = react();
*/
export default defineConfig({ integrations: [] });`,
    `import react from "@astrojs/react";
export default defineConfig({
  integrations: [
    // react({ include: ["**/react/**"] }),
  ],
});`,
  ])("ignores commented-out Astro React integration evidence", (content) => {
    const plan = getHostPlan(
      {
        dependencies: {
          "@astrojs/react": "^4.4.0",
          astro: "^7.0.0",
          react: "^19.2.0",
        },
      },
      {
        astroConfig: { content, path: "astro.config.ts" },
        existingPaths: new Set(["astro.config.ts"]),
      },
    );

    expect(plan.targets).toContainEqual({ framework: "react", readiness: "configurable" });
  });

  it.each([
    [
      "next-app",
      { dependencies: { next: "^16.3.0", react: "^19.2.0" } },
      ["src/app/layout.tsx", "src/app/globals.css"],
    ],
    [
      "next-pages",
      { dependencies: { next: "^16.3.0", react: "^19.2.0" } },
      ["pages/_app.tsx", "styles/globals.css"],
    ],
    [
      "react-router",
      {
        dependencies: { react: "^19.2.0", "react-router": "^7.15.0" },
        devDependencies: { "@react-router/dev": "^7.15.0", vite: "^8.0.0" },
      },
      ["react-router.config.ts", "vite.config.ts", "app/root.tsx", "app/app.css"],
    ],
    [
      "tanstack-start",
      {
        dependencies: { "@tanstack/react-start": "latest", react: "^19.2.0" },
        devDependencies: { vite: "^8.0.0" },
      },
      ["vite.config.ts", "src/routes/__root.tsx", "src/styles.css"],
    ],
  ] as const)("keeps the %s React host identity", (kind, pkg, paths) => {
    expect(getHostPlan(pkg, { existingPaths: new Set(paths) })).toMatchObject({
      host: { kind },
      reactProject: { kind },
      targets: [{ framework: "react", readiness: "ready" }],
    });
  });

  it("keeps Vite as a host when no supported framework target is present", () => {
    expect(
      getHostPlan(
        { devDependencies: { vite: "^8.2.0" } },
        { existingPaths: new Set(["vite.config.ts", "src/main.ts"]) },
      ),
    ).toEqual({
      diagnostic:
        "No supported Starwind target was detected. Use --astro for an Astro project, or run Starwind in a supported React host: Vite React, Next.js, React Router, or TanStack Start with Vite.",
      host: { kind: "vite", label: "Vite" },
      targets: [{ framework: "astro", readiness: "configurable" }],
    });
  });

  it("validates explicit targets against ready and configurable targets", () => {
    const astroPlan = getHostPlan(
      { dependencies: { astro: "^7.0.0" } },
      { existingPaths: new Set(["astro.config.ts"]) },
    );

    expect(validateHostTarget(astroPlan, "react")).toBe("react");
    expect(() =>
      validateHostTarget(
        getHostPlan(
          { devDependencies: { vite: "^8.2.0" } },
          { existingPaths: new Set(["vite.config.ts", "src/main.ts"]) },
        ),
        "react",
      ),
    ).toThrow(/React.*not available.*Vite/i);
  });

  it("formats concise target and host status text", () => {
    const plan = getHostPlan(
      { dependencies: { react: "^19.2.0" }, devDependencies: { vite: "^8.2.0" } },
      { existingPaths: new Set(["vite.config.ts", "src/main.tsx"]) },
    );

    expect(formatDetectedHost(plan, "react")).toBe("Detected React (Vite)");
  });
});
