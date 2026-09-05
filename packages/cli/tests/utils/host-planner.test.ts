import { describe, expect, it } from "vitest";

import { PRIVATE_VUE_FRAMEWORK_TARGET_POLICY } from "../../src/utils/framework-target-policy.js";
import {
  ASTRO_CONFIG_PATHS,
  detectHostPlan,
  detectPrivateVueHostPlan,
  formatDetectedHost,
  getHostPlan,
  getPrivateVueHostPlan,
  type ProjectPackage,
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

  it("preserves a supported React host when Vue lacks host-specific evidence", async () => {
    const paths = new Set(["vite.config.ts", "src/main.tsx"]);
    const plan = await detectHostPlan(
      {
        dependencies: { react: "^19.2.0", vue: "^3.5.0" },
        devDependencies: { "@vitejs/plugin-react": "latest", vite: "^8.2.0" },
      },
      {
        pathExists: async (filePath) => paths.has(filePath),
        readFile: async () => "",
      },
    );

    expect(plan).toMatchObject({
      host: { kind: "vite", label: "Vite" },
      reactProject: { kind: "vite" },
      targets: [{ framework: "react", readiness: "ready" }],
    });
    expect(plan.vueHostProject).toBeUndefined();
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

  it("keeps public host planning free of Vue targets", () => {
    const plan = getHostPlan(
      {
        dependencies: { vue: "^3.5.0" },
        devDependencies: { "@vitejs/plugin-vue": "^6.0.0", vite: "^8.2.0" },
      },
      {
        existingPaths: new Set(["vite.config.ts", "src/main.ts", "src/App.vue"]),
      },
    );

    expect(plan.targets.map((target) => target.framework)).not.toContain("vue");
  });

  it("plans an official Vite Vue project only through the private policy", () => {
    const plan = getPrivateVueHostPlan(
      {
        dependencies: { vue: "^3.5.0" },
        devDependencies: { "@vitejs/plugin-vue": "^6.0.0", vite: "^8.2.0" },
      },
      {
        existingPaths: new Set(["vite.config.ts", "src/main.ts", "src/App.vue"]),
      },
      PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
    );

    expect(plan).toMatchObject({
      host: { kind: "vite", label: "Vite" },
      targets: [{ framework: "vue", readiness: "ready" }],
      vueHostProject: {
        componentDir: "src/components/starwind",
        cssFile: "src/styles/starwind.css",
        hostKind: "vite",
        projectFramework: "vue",
        utilsDir: "src/lib/utils",
        vueUpgradeRequired: false,
      },
    });
  });

  it.each([
    {
      expectedHost: { kind: "vite", label: "Vite" },
      name: "Vite Vue",
      paths: ["vite.config.ts", "src/main.ts", "src/App.vue"],
      pkg: {
        dependencies: { vue: "^3.5.13" },
        devDependencies: { "@vitejs/plugin-vue": "^6.0.0", vite: "^8.2.0" },
      },
      projectFiles: {},
    },
    {
      expectedHost: { kind: "astro", label: "Astro" },
      name: "Astro with Vue",
      paths: ["astro.config.ts"],
      pkg: {
        dependencies: { "@astrojs/vue": "^5.1.5", astro: "^7.0.0", vue: "^3.5.13" },
      },
      projectFiles: {
        "astro.config.ts":
          'import vue from "@astrojs/vue"; export default defineConfig({ integrations: [vue()] });',
      },
    },
    {
      expectedHost: { kind: "nuxt", label: "Nuxt 3" },
      name: "Nuxt 3",
      paths: ["nuxt.config.ts", "app.vue"],
      pkg: { dependencies: { nuxt: "^3.21.0", vue: "^3.5.13" } },
      projectFiles: {},
    },
    {
      expectedHost: { kind: "nuxt", label: "Nuxt 4" },
      name: "Nuxt 4",
      paths: ["nuxt.config.ts", "app/app.vue"],
      pkg: { dependencies: { nuxt: "^4.2.0", vue: "^3.5.13" } },
      projectFiles: {},
    },
    {
      expectedHost: { kind: "laravel", label: "Laravel with Inertia Vue" },
      name: "Laravel Inertia Vue",
      paths: [
        "artisan",
        "composer.json",
        "vite.config.ts",
        "resources/js/app.ts",
        "resources/css/app.css",
        "tsconfig.json",
      ],
      pkg: {
        dependencies: {
          "@inertiajs/vite": "^3.0.0",
          "@inertiajs/vue3": "^3.0.0",
          "@tailwindcss/vite": "^4.1.0",
          "@vitejs/plugin-vue": "^6.0.0",
          "laravel-vite-plugin": "^3.0.0",
          tailwindcss: "^4.1.0",
          vue: "^3.5.13",
        },
      },
      projectFiles: {
        "composer.json": JSON.stringify({ require: { "laravel/framework": "^13.0" } }),
        "resources/css/app.css":
          "@import 'tailwindcss';\n@import 'tw-animate-css';\n@custom-variant dark (&:is(.dark *));\n@theme inline { --color-background: var(--background); }\n",
        "resources/js/app.ts":
          "import { createInertiaApp } from '@inertiajs/vue3'; createInertiaApp({});",
        "tsconfig.json": '{ "compilerOptions": { "paths": { "@/*": ["./resources/js/*"] } } }',
        "vite.config.ts":
          "import inertia from '@inertiajs/vite'; import tailwindcss from '@tailwindcss/vite'; import vue from '@vitejs/plugin-vue'; import laravel from 'laravel-vite-plugin'; import { defineConfig } from 'vite'; export default defineConfig({ plugins: [laravel({ input: ['resources/css/app.css', 'resources/js/app.ts'] }), inertia(), tailwindcss(), vue()] });",
      },
    },
    ...(["SPA", "SSR"] as const).map((mode) => ({
      expectedHost: { kind: "quasar", label: `Quasar ${mode}` },
      name: `Quasar Vite ${mode}`,
      paths: [
        "quasar.config.ts",
        "src/App.vue",
        "src/router",
        "src/layouts",
        "src/pages",
        "src/css",
        ...(mode === "SSR" ? ["src-ssr"] : []),
      ],
      pkg: {
        dependencies: { quasar: "^2.18.0", vue: "^3.5.13" },
        devDependencies: { "@quasar/app-vite": "^3.0.0" },
      },
      projectFiles: {
        "quasar.config.ts":
          "import { defineConfig } from '#q-app'; export default defineConfig(() => ({ css: ['app.css'], build: { vitePlugins: [] } }));",
      },
    })),
  ])("exposes $name through the production Vue policy", async (fixture) => {
    const paths = new Set(fixture.paths);
    const projectFiles = fixture.projectFiles as Record<string, string>;
    const plan = await detectHostPlan(fixture.pkg as ProjectPackage, {
      pathExists: async (filePath) => paths.has(filePath),
      readFile: async (filePath) => projectFiles[filePath] ?? "",
    });

    expect(plan.host).toEqual(fixture.expectedHost);
    expect(plan.targets).toContainEqual({ framework: "vue", readiness: "ready" });
    expect(plan.vueHostProject).toMatchObject({ projectFramework: expect.any(String) });
  });

  it.each(["^3.4.0", "^2.7.16"])(
    "requires explicit corrective setup for a Vite project declaring Vue %s",
    (range) => {
      const plan = getPrivateVueHostPlan(
        {
          dependencies: { vue: range },
          devDependencies: { "@vitejs/plugin-vue": "^6.0.0", vite: "^8.2.0" },
        },
        {
          existingPaths: new Set(["vite.config.ts", "src/main.ts", "src/App.vue"]),
        },
        PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      );

      expect(plan.targets).toEqual([{ framework: "vue", readiness: "configurable" }]);
      expect(plan.vueHostProject?.vueUpgradeRequired).toBe(true);
    },
  );

  it.each([
    {
      expected: "ready",
      expectedUpgrade: false,
      dependencies: {
        "@astrojs/vue": "^5.1.5",
        astro: "^7.0.0",
        vue: "^3.5.0",
      },
      source:
        'import vueRenderer from "@astrojs/vue";\nexport default defineConfig({ integrations: [vueRenderer()] });',
    },
    {
      expected: "configurable",
      expectedUpgrade: true,
      dependencies: { astro: "^7.0.0" },
      source: "export default defineConfig({ integrations: [] });",
    },
    {
      expected: "configurable",
      expectedUpgrade: true,
      dependencies: {
        "@astrojs/vue": "^5.1.5",
        astro: "^7.0.0",
        vue: "^3.4.0",
      },
      source:
        'import vueRenderer from "@astrojs/vue";\nexport default defineConfig({ integrations: [vueRenderer()] });',
    },
  ])("plans Astro Vue as $expected from package and config evidence", (fixture) => {
    const plan = getPrivateVueHostPlan(
      { dependencies: fixture.dependencies as Record<string, string> },
      {
        astroConfig: { content: fixture.source, path: "astro.config.ts" },
        existingPaths: new Set(["astro.config.ts"]),
      },
      PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
    );

    expect(plan.targets).toContainEqual({ framework: "vue", readiness: fixture.expected });
    expect(plan.vueHostProject?.vueUpgradeRequired).toBe(fixture.expectedUpgrade);
  });

  it.each([
    [
      "^4.2.0",
      ["nuxt.config.ts", "app/app.vue"],
      "Nuxt 4",
      "app/components/starwind",
      "app/assets/css/starwind.css",
      "app/lib/utils",
    ],
    [
      "^3.21.0",
      ["nuxt.config.ts", "app.vue"],
      "Nuxt 3",
      "components/starwind",
      "assets/css/starwind.css",
      "lib/utils",
    ],
  ] as const)(
    "plans exact private Nuxt evidence for %s",
    (nuxt, paths, label, componentDir, cssFile, utilsDir) => {
      const plan = getPrivateVueHostPlan(
        { dependencies: { nuxt, vue: "^3.5.0" } },
        { existingPaths: new Set<string>(paths) },
        PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      );

      expect(plan).toMatchObject({
        host: { kind: "nuxt", label },
        targets: [{ framework: "vue", readiness: "ready" }],
        vueHostProject: {
          componentDir,
          cssFile,
          hostKind: "nuxt",
          projectFramework: "vue",
          utilsDir,
          vueUpgradeRequired: false,
        },
      });
    },
  );

  it("gathers Nuxt evidence for production Vue planning", async () => {
    const paths = new Set(["nuxt.config.ts", "app/app.vue"]);
    const reader = {
      pathExists: async (filePath: string) => paths.has(filePath),
      readFile: async () => "export default defineNuxtConfig({});",
    };
    const privatePlan = await detectPrivateVueHostPlan(
      { dependencies: { nuxt: "^4.2.0" } },
      PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      reader,
    );
    const publicPlan = await detectHostPlan({ dependencies: { nuxt: "^4.2.0" } }, reader);

    expect(privatePlan.host).toEqual({ kind: "nuxt", label: "Nuxt 4" });
    expect(privatePlan.vueHostProject?.vueUpgradeRequired).toBe(true);
    expect(publicPlan).toMatchObject({
      host: privatePlan.host,
      targets: privatePlan.targets,
      vueHostProject: {
        hostKind: privatePlan.vueHostProject?.hostKind,
        projectFramework: "vue",
        vueUpgradeRequired: true,
      },
    });
  });

  it.each([
    ["^4.2.0", ["nuxt.config.ts", "app.vue"]],
    ["^3.21.0", ["nuxt.config.ts", "app/app.vue"]],
    ["^4.2.0", ["nuxt.config.ts", "app.vue", "app/app.vue"]],
    ["^4.2.0", ["nuxt.config.mjs", "app/app.vue"]],
  ] as const)("returns a manual-action diagnostic for near-match Nuxt %s", (nuxt, paths) => {
    const plan = getPrivateVueHostPlan(
      { dependencies: { nuxt } },
      { existingPaths: new Set<string>(paths) },
      PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
    );

    expect(plan.host.kind).toBe("nuxt");
    expect(plan.targets.map((target) => target.framework)).not.toContain("vue");
    expect(plan.diagnostic).toMatch(/manual action/i);
  });

  it.each([
    ["SPA", []],
    ["SSR", ["src-ssr"]],
  ] as const)("plans exact private Quasar %s evidence", (_label, modePaths) => {
    const source = `import { defineConfig } from '#q-app';
export default defineConfig(() => ({ css: ['app.css'], build: { vitePlugins: [] } }));
`;
    const paths = new Set([
      "quasar.config.ts",
      "src/App.vue",
      "src/router",
      "src/layouts",
      "src/pages",
      "src/css",
      ...modePaths,
    ]);
    const plan = getPrivateVueHostPlan(
      {
        dependencies: { quasar: "^2.18.0", vue: "^3.5.13" },
        devDependencies: { "@quasar/app-vite": "^3.0.0" },
      },
      { existingPaths: paths, projectFiles: { "quasar.config.ts": source } },
      PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
    );

    expect(plan).toMatchObject({
      host: { kind: "quasar", label: `Quasar ${_label}` },
      targets: [{ framework: "vue", readiness: "ready" }],
      vueHostProject: {
        componentDir: "src/components/starwind",
        cssFile: "src/css/starwind.css",
        hostKind: "quasar",
        lockCssFile: true,
        utilsDir: "src/lib/utils",
      },
    });
  });

  it("gathers Quasar config and mode evidence for production Vue planning", async () => {
    const source = `import { defineConfig } from '#q-app';
export default defineConfig(() => ({ css: [], build: { vitePlugins: [] } }));
`;
    const paths = new Set([
      "quasar.config.js",
      "src/App.vue",
      "src/router",
      "src/layouts",
      "src/pages",
      "src/css",
      "src-ssr",
    ]);
    const projectPackage = {
      dependencies: { quasar: "^2.18.0", vue: "^3.4.0" },
      devDependencies: { "@quasar/app-vite": "^3.0.0" },
    };
    const reader = {
      pathExists: async (filePath: string) => paths.has(filePath),
      readFile: async () => source,
    };

    const privatePlan = await detectPrivateVueHostPlan(
      projectPackage,
      PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      reader,
    );
    const publicPlan = await detectHostPlan(projectPackage, reader);

    expect(privatePlan.host).toEqual({ kind: "quasar", label: "Quasar SSR" });
    expect(privatePlan.vueHostProject?.vueUpgradeRequired).toBe(true);
    expect(publicPlan).toMatchObject({
      host: privatePlan.host,
      targets: privatePlan.targets,
      vueHostProject: {
        hostKind: privatePlan.vueHostProject?.hostKind,
        projectFramework: "vue",
        vueUpgradeRequired: true,
      },
    });
  });

  it("returns a manual-action Quasar diagnostic for partial CLI evidence before generic Vite", () => {
    const plan = getPrivateVueHostPlan(
      {
        dependencies: { quasar: "^2.18.0", vue: "^3.5.13" },
        devDependencies: {
          "@quasar/app-vite": "^3.0.0",
          "@vitejs/plugin-vue": "^6.0.0",
          vite: "^8.0.0",
        },
      },
      {
        existingPaths: new Set([
          "quasar.config.ts",
          "vite.config.ts",
          "src/main.ts",
          "src/App.vue",
        ]),
        projectFiles: { "quasar.config.ts": "export default {};" },
      },
      PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
    );

    expect(plan.host.kind).toBe("quasar");
    expect(plan.targets.map((target) => target.framework)).not.toContain("vue");
    expect(plan.diagnostic).toMatch(/manual action/i);
  });

  it("keeps a Quasar Vite-plugin-only project on generic Vite Vue", () => {
    const plan = getPrivateVueHostPlan(
      {
        dependencies: { quasar: "^2.18.0", vue: "^3.5.13" },
        devDependencies: { "@vitejs/plugin-vue": "^6.0.0", vite: "^8.0.0" },
      },
      { existingPaths: new Set(["vite.config.ts", "src/main.ts", "src/App.vue"]) },
      PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
    );

    expect(plan.host.kind).toBe("vite");
    expect(plan.targets).toContainEqual({ framework: "vue", readiness: "ready" });
  });

  it("plans complete Laravel Inertia Vue evidence through production detection", async () => {
    const projectFiles: Record<string, string> = {
      "composer.json": JSON.stringify({ require: { "laravel/framework": "^13.0" } }),
      "resources/css/app.css":
        "@import 'tailwindcss';\n@import 'tw-animate-css';\n@custom-variant dark (&:is(.dark *));\n@theme inline { --color-background: var(--background); }\n",
      "resources/js/app.ts":
        "import { createInertiaApp } from '@inertiajs/vue3';\ncreateInertiaApp({});\n",
      "tsconfig.json": '{ "compilerOptions": { "paths": { "@/*": ["./resources/js/*"] } } }',
      "vite.config.ts":
        "import inertia from '@inertiajs/vite'; import tailwindcss from '@tailwindcss/vite'; import vue from '@vitejs/plugin-vue'; import laravel from 'laravel-vite-plugin'; import { defineConfig } from 'vite'; export default defineConfig({ plugins: [laravel({ input: ['resources/css/app.css', 'resources/js/app.ts'] }), inertia(), tailwindcss(), vue()] });",
    };
    const paths = new Set(["artisan", ...Object.keys(projectFiles)]);
    const projectPackage = {
      dependencies: {
        "@inertiajs/vite": "^3.0.0",
        "@inertiajs/vue3": "^3.0.0",
        "@tailwindcss/vite": "^4.1.0",
        "@vitejs/plugin-vue": "^6.0.0",
        "laravel-vite-plugin": "^3.0.0",
        tailwindcss: "^4.1.0",
        vue: "^3.5.13",
      },
    };
    const reader = {
      pathExists: async (filePath: string) => paths.has(filePath),
      readFile: async (filePath: string) => projectFiles[filePath]!,
    };

    const privatePlan = await detectPrivateVueHostPlan(
      projectPackage,
      PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      reader,
    );
    const publicPlan = await detectHostPlan(projectPackage, reader);

    expect(privatePlan).toMatchObject({
      host: { kind: "laravel", label: "Laravel with Inertia Vue" },
      targets: [{ framework: "vue", readiness: "ready" }],
      vueHostProject: {
        componentDir: "resources/js/components/starwind",
        cssFile: "resources/css/starwind.css",
        hostKind: "laravel",
        lockCssFile: true,
        utilsDir: "resources/js/lib/utils",
      },
    });
    expect(publicPlan).toMatchObject({
      host: privatePlan.host,
      targets: privatePlan.targets,
      vueHostProject: {
        hostKind: privatePlan.vueHostProject?.hostKind,
        projectFramework: "vue",
      },
    });
  });

  it("keeps generic Vite Vue when common PHP and resources paths exist", () => {
    const plan = getPrivateVueHostPlan(
      {
        dependencies: { vue: "^3.5.13" },
        devDependencies: { "@vitejs/plugin-vue": "^6.0.0", vite: "^8.0.0" },
      },
      {
        existingPaths: new Set([
          "composer.json",
          "resources/css/app.css",
          "vite.config.ts",
          "src/main.ts",
          "src/App.vue",
        ]),
        projectFiles: { "composer.json": "{}", "resources/css/app.css": "body {}" },
      },
      PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
    );

    expect(plan.host.kind).toBe("vite");
    expect(plan.targets).toContainEqual({ framework: "vue", readiness: "ready" });
  });

  it("returns a manual-action Laravel diagnostic for partial evidence before generic Vite", () => {
    const plan = getPrivateVueHostPlan(
      {
        dependencies: { "@inertiajs/vue3": "^3.0.0", vue: "^3.5.13" },
        devDependencies: { "@vitejs/plugin-vue": "^6.0.0", vite: "^8.0.0" },
      },
      {
        existingPaths: new Set(["vite.config.ts", "resources/js/app.ts"]),
        projectFiles: {
          "resources/js/app.ts":
            "import { createInertiaApp } from '@inertiajs/vue3'; createInertiaApp({});",
          "vite.config.ts": "export default defineConfig({ plugins: [] });",
        },
      },
      PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
    );

    expect(plan.host.kind).toBe("laravel");
    expect(plan.targets.map((target) => target.framework)).not.toContain("vue");
    expect(plan.diagnostic).toMatch(/manual action/i);
  });
});
