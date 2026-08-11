import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  applyAstroVueIntegration: vi.fn(),
  getLaravelInertiaVueProjectPlan: vi.fn(),
  getQuasarProjectPlan: vi.fn(),
  prepareAstroVueIntegration: vi.fn(),
  projectLaravelStarwindStylesheet: vi.fn(),
  setupAstroConfig: vi.fn(),
  setupLaravelInertiaVueProject: vi.fn(),
  setupQuasarProject: vi.fn(),
  setupLayoutCssImport: vi.fn(),
  setupTsConfig: vi.fn(),
  setupVueProject: vi.fn(),
  setupVueTsConfig: vi.fn(),
  validateLaravelInertiaVueProjectSetup: vi.fn(),
  validateQuasarProjectSetup: vi.fn(),
  validateVueProjectSetup: vi.fn(),
}));

vi.mock("../../src/utils/astro-config.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/utils/astro-config.js")>()),
  setupAstroConfig: mocks.setupAstroConfig,
}));
vi.mock("../../src/utils/astro-vue-integration.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/utils/astro-vue-integration.js")>()),
  applyAstroVueIntegration: mocks.applyAstroVueIntegration,
  prepareAstroVueIntegration: mocks.prepareAstroVueIntegration,
}));
vi.mock("../../src/utils/laravel-inertia-vue-project.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/utils/laravel-inertia-vue-project.js")>()),
  getLaravelInertiaVueProjectPlan: mocks.getLaravelInertiaVueProjectPlan,
  projectLaravelStarwindStylesheet: mocks.projectLaravelStarwindStylesheet,
  setupLaravelInertiaVueProject: mocks.setupLaravelInertiaVueProject,
  validateLaravelInertiaVueProjectSetup: mocks.validateLaravelInertiaVueProjectSetup,
}));
vi.mock("../../src/utils/quasar-project.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/utils/quasar-project.js")>()),
  getQuasarProjectPlan: mocks.getQuasarProjectPlan,
  setupQuasarProject: mocks.setupQuasarProject,
  validateQuasarProjectSetup: mocks.validateQuasarProjectSetup,
}));
vi.mock("../../src/utils/layout.js", () => ({
  setupLayoutCssImport: mocks.setupLayoutCssImport,
}));
vi.mock("../../src/utils/tsconfig.js", () => ({
  setupTsConfig: mocks.setupTsConfig,
  setupVueTsConfig: mocks.setupVueTsConfig,
}));
vi.mock("../../src/utils/vue-project.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/utils/vue-project.js")>()),
  setupVueProject: mocks.setupVueProject,
  validateVueProjectSetup: mocks.validateVueProjectSetup,
}));

import {
  detectVueHostProject,
  getPrivateVueHostEvidenceRequests,
  type VueHostProjectDetection,
  type VueHostProjectPlan,
} from "../../src/utils/vue-host-project.js";

function expectedVueHostRequirements(includeVue = false) {
  return [
    ...(includeVue ? ["vue@>=3.5"] : []),
    "tailwindcss@^4.1",
    "@tailwindcss/vite@^4",
    "tw-animate-css@^1",
    "@tailwindcss/forms@^0.5",
  ];
}

function getDetectedPlan(detection: VueHostProjectDetection | undefined): VueHostProjectPlan {
  if (!detection || detection.status !== "detected") {
    throw new Error("Expected a detected private Vue host plan.");
  }
  return detection.plan;
}

describe("private Vue host-project interface", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getLaravelInertiaVueProjectPlan.mockReturnValue(undefined);
    mocks.getQuasarProjectPlan.mockReturnValue(undefined);
    mocks.projectLaravelStarwindStylesheet.mockImplementation((content) => `fragment:${content}`);
    mocks.prepareAstroVueIntegration.mockResolvedValue({ status: "ready" });
    mocks.setupAstroConfig.mockResolvedValue(true);
    mocks.setupLayoutCssImport.mockResolvedValue(true);
    mocks.setupTsConfig.mockResolvedValue(true);
    mocks.setupVueTsConfig.mockResolvedValue(true);
  });

  it("exposes one frozen deduplicated evidence request contract", () => {
    const requests = getPrivateVueHostEvidenceRequests();
    const paths = requests.map((request) => request.path);

    expect(Object.isFrozen(requests)).toBe(true);
    expect(requests.every((request) => Object.isFrozen(request))).toBe(true);
    expect(new Set(paths).size).toBe(paths.length);
    expect(requests).toContainEqual({ path: "nuxt.config.ts", readContent: false });
    expect(requests).toContainEqual({ path: "composer.json", readContent: true });
    expect(requests).toContainEqual({ path: "artisan", readContent: false });
    expect(requests).toContainEqual({ path: "quasar.config.ts", readContent: true });
    expect(requests).toContainEqual({ path: "src-ssr", readContent: false });
    expect(requests).toContainEqual({ path: "vite.config.ts", readContent: true });
    expect(requests).toContainEqual({ path: "src/App.vue", readContent: false });
    expect(requests).toContainEqual({ path: "astro.config.ts", readContent: true });
  });

  it("returns adapter-owned failed identity for a near-match host", () => {
    const detection = detectVueHostProject(
      { dependencies: { nuxt: "^4.2.0", vue: "^3.5.0" } },
      { existingPaths: new Set(["nuxt.config.ts", "app.vue"]) },
      "unknown",
    );

    expect(detection).toEqual({
      diagnostic:
        "This Nuxt project needs manual action. Starwind supports only the official Nuxt 4 app/app.vue layout or the bounded Nuxt 3 root app.vue layout with a static root nuxt.config.ts.",
      host: { kind: "nuxt", label: "Nuxt" },
      status: "failed",
    });
    expect(Object.isFrozen(detection)).toBe(true);
    if (detection?.status === "failed") {
      expect(Object.isFrozen(detection.host)).toBe(true);
    }
  });

  it("hides official Vite paths behind one frozen common plan", async () => {
    const detection = detectVueHostProject(
      {
        dependencies: { vue: "^3.5.0" },
        devDependencies: { "@vitejs/plugin-vue": "^6.0.0", vite: "^8.2.0" },
      },
      { existingPaths: new Set(["vite.config.ts", "src/main.ts", "src/App.vue"]) },
      "unknown",
    );

    expect(detection).toMatchObject({
      readiness: "ready",
      plan: {
        componentDir: "src/components/starwind",
        cssFile: "src/styles/starwind.css",
        hostKind: "vite",
        isSecondaryTarget: false,
        projectFramework: "vue",
        setupLabel: "Setup Vite Vue project",
        utilsDir: "src/lib/utils",
        vueUpgradeRequired: false,
      },
    });
    expect(Object.isFrozen(getDetectedPlan(detection))).toBe(true);

    await getDetectedPlan(detection).validate();
    const preparation = await getDetectedPlan(detection).prepare({
      packageManager: "pnpm",
      projectPackage: {},
      skipPrompts: true,
    });
    expect(preparation).toEqual({ status: "prepared" });
    expect(mocks.setupVueProject).not.toHaveBeenCalled();

    await getDetectedPlan(detection).setup("src/styles/starwind.css");
    await getDetectedPlan(detection).setupTypeScript();
    expect(mocks.validateVueProjectSetup).toHaveBeenCalledOnce();
    expect(mocks.setupVueProject).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "vite", viteConfig: "vite.config.ts" }),
      "src/styles/starwind.css",
    );
    expect(mocks.setupVueTsConfig).toHaveBeenCalledWith(false);
    expect(getDetectedPlan(detection).requirements(["vue@>=3.5", "tailwindcss@^4.1"])).toEqual(
      expectedVueHostRequirements(),
    );
  });

  it("captures package declarations when the host plan is detected", () => {
    const projectPackage = {
      dependencies: { vue: "3.5.39" },
      devDependencies: { "@vitejs/plugin-vue": "^6.0.0", vite: "^8.2.0" },
    };
    const detection = detectVueHostProject(
      projectPackage,
      { existingPaths: new Set(["vite.config.ts", "src/main.ts", "src/App.vue"]) },
      "unknown",
    );
    projectPackage.dependencies.vue = "workspace:*";

    expect(getDetectedPlan(detection).requirements(["vue@>=3.5"])).not.toContain("vue@>=3.5");
  });

  it("requires the private registry to correct an unsupported Vue version", () => {
    const detection = detectVueHostProject(
      {
        dependencies: { vue: "^3.4.0" },
        devDependencies: { "@vitejs/plugin-vue": "^6.0.0", vite: "^8.2.0" },
      },
      { existingPaths: new Set(["vite.config.ts", "src/main.ts", "src/App.vue"]) },
      "unknown",
    );

    expect(detection).toMatchObject({
      readiness: "configurable",
      plan: { vueUpgradeRequired: true },
    });
    expect(() => getDetectedPlan(detection).requirements(["tailwindcss@^4"])).toThrow(
      "The private Vue registry must require Vue 3.5 or later.",
    );
    expect(getDetectedPlan(detection).requirements(["vue@>=3.5", "tailwindcss@^4"])).toContain(
      "@tailwindcss/vite@^4",
    );
  });

  it("prepares Astro integration before exposing its deferred mutation", async () => {
    mocks.prepareAstroVueIntegration.mockResolvedValue({
      packages: ["@astrojs/vue"],
      status: "prepared",
    });
    const projectPackage = { dependencies: { astro: "^7.0.0" } };
    const detection = detectVueHostProject(
      projectPackage,
      {
        astroConfig: {
          content: "export default defineConfig({ integrations: [] });",
          path: "astro.config.ts",
        },
        existingPaths: new Set(["astro.config.ts"]),
      },
      "astro",
    );

    expect(detection).toMatchObject({
      readiness: "configurable",
      plan: {
        componentDir: "src/components/starwind-vue",
        hostKind: "astro",
        isSecondaryTarget: true,
        projectFramework: "astro",
        setupLabel: "Setup Astro config file",
        vueUpgradeRequired: true,
      },
    });
    await getDetectedPlan(detection).validate();
    const preparation = await getDetectedPlan(detection).prepare({
      packageManager: "pnpm",
      projectPackage,
      skipPrompts: true,
    });
    expect(mocks.applyAstroVueIntegration).not.toHaveBeenCalled();
    expect(preparation).toMatchObject({
      integrationLabel: "Setup Astro Vue integration",
      status: "prepared",
    });

    if (preparation.status === "prepared") await preparation.applyIntegration?.();
    await getDetectedPlan(detection).setup(getDetectedPlan(detection).cssFile);
    await getDetectedPlan(detection).setupTypeScript();
    await getDetectedPlan(detection).setupCss?.(getDetectedPlan(detection).cssFile);
    expect(mocks.applyAstroVueIntegration).toHaveBeenCalledWith(
      { packages: ["@astrojs/vue"], status: "prepared" },
      "pnpm",
    );
    expect(mocks.setupAstroConfig).toHaveBeenCalledOnce();
    expect(mocks.setupTsConfig).toHaveBeenCalledWith("astro");
    expect(mocks.setupLayoutCssImport).toHaveBeenCalledWith("src/styles/starwind.css");
    expect(getDetectedPlan(detection).requirements(["vue@>=3.5", "tailwindcss@^4.1"])).toEqual(
      expectedVueHostRequirements(true),
    );
  });

  it("hides Laravel-owned paths and setup behind the common plan", async () => {
    const laravelProject = {
      componentDir: "resources/js/components/starwind" as const,
      cssFile: "resources/css/starwind.css" as const,
      entry: "resources/js/app.ts" as const,
      hostCss: "resources/css/app.css" as const,
      kind: "laravel" as const,
      utilsDir: "resources/js/lib/utils" as const,
      viteConfig: "vite.config.ts" as const,
      vueUpgradeRequired: false,
    };
    mocks.getLaravelInertiaVueProjectPlan.mockReturnValue(laravelProject);

    const detection = detectVueHostProject(
      { dependencies: { vue: "^3.5.13" } },
      { existingPaths: new Set(["artisan"]) },
      "unknown",
    );

    expect(detection).toMatchObject({
      readiness: "ready",
      plan: {
        componentDir: "resources/js/components/starwind",
        cssFile: "resources/css/starwind.css",
        hostKind: "laravel",
        hostLabel: "Laravel with Inertia Vue",
        lockCssFile: true,
        projectFramework: "vue",
        utilsDir: "resources/js/lib/utils",
      },
    });
    expect(getDetectedPlan(detection).prepareStylesheet("standard css")).toBe(
      "fragment:standard css",
    );
    await getDetectedPlan(detection).validate();
    await getDetectedPlan(detection).setup("resources/css/starwind.css");
    expect(await getDetectedPlan(detection).setupTypeScript()).toBe(true);
    expect(mocks.validateLaravelInertiaVueProjectSetup).toHaveBeenCalledWith(laravelProject);
    expect(mocks.setupLaravelInertiaVueProject).toHaveBeenCalledWith(
      laravelProject,
      "resources/css/starwind.css",
    );
    expect(getDetectedPlan(detection).requirements(["vue@>=3.5", "tailwindcss@^4.1"])).toEqual(
      expectedVueHostRequirements(),
    );
  });

  it.each(["spa", "ssr"] as const)(
    "hides Quasar %s paths and setup behind the common plan",
    async (mode) => {
      const quasarProject = {
        componentDir: "src/components/starwind" as const,
        config: "quasar.config.ts" as const,
        cssFile: "src/css/starwind.css" as const,
        kind: "quasar" as const,
        mode,
        utilsDir: "src/lib/utils" as const,
        vueUpgradeRequired: false,
      };
      mocks.getQuasarProjectPlan.mockReturnValue(quasarProject);

      const detection = detectVueHostProject(
        { dependencies: { vue: "^3.5.13" } },
        { existingPaths: new Set(["quasar.config.ts", "src-ssr"]) },
        "unknown",
      );

      expect(detection).toMatchObject({
        readiness: "ready",
        plan: {
          componentDir: "src/components/starwind",
          cssFile: "src/css/starwind.css",
          hostKind: "quasar",
          hostLabel: mode === "ssr" ? "Quasar SSR" : "Quasar SPA",
          lockCssFile: true,
          projectFramework: "vue",
          utilsDir: "src/lib/utils",
        },
      });
      await getDetectedPlan(detection).validate();
      await getDetectedPlan(detection).setup("src/css/starwind.css");
      expect(await getDetectedPlan(detection).setupTypeScript()).toBe(true);
      expect(mocks.validateQuasarProjectSetup).toHaveBeenCalledWith(quasarProject);
      expect(mocks.setupQuasarProject).toHaveBeenCalledWith(quasarProject, "src/css/starwind.css");
      expect(getDetectedPlan(detection).requirements(["vue@>=3.5", "tailwindcss@^4.1"])).toEqual(
        expectedVueHostRequirements(),
      );
    },
  );

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
    "hides Nuxt %s paths and ownership behind the common plan",
    (nuxt, paths, hostLabel, componentDir, cssFile, utilsDir) => {
      const detection = detectVueHostProject(
        { dependencies: { nuxt, vue: "^3.5.0" } },
        { existingPaths: new Set<string>(paths) },
        "unknown",
      );

      expect(detection).toMatchObject({
        readiness: "ready",
        plan: {
          componentDir,
          cssFile,
          hostKind: "nuxt",
          hostLabel,
          isSecondaryTarget: false,
          lockCssFile: true,
          projectFramework: "vue",
          utilsDir,
          vueUpgradeRequired: false,
        },
      });
      expect(Object.isFrozen(getDetectedPlan(detection))).toBe(true);
      expect(getDetectedPlan(detection).setupCss).toBeUndefined();
      expect(getDetectedPlan(detection).requirements(["vue@>=3.5", "tailwindcss@^4.1"])).toEqual(
        expectedVueHostRequirements(),
      );
    },
  );
});
