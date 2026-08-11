import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, vi } from "vitest";

import { PATHS } from "../../src/utils/constants.js";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  confirm: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  group: vi.fn(),
  select: vi.fn(),
  text: vi.fn(),
  tasks: vi.fn(),
  note: vi.fn(),
  log: {
    error: vi.fn(),
    warn: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    success: vi.fn(),
    message: vi.fn(),
    step: vi.fn(),
  },
}));

vi.mock("../../src/utils/astro-config.js");
vi.mock("../../src/utils/astro-react-integration.js");
vi.mock("../../src/utils/astro-vue-integration.js");
vi.mock("../../src/utils/config.js");
vi.mock("../../src/utils/env.js");
vi.mock("../../src/utils/fs.js");
vi.mock("../../src/utils/host-planner.js");
vi.mock("../../src/utils/layout.js");
vi.mock("../../src/utils/package-manager.js");
vi.mock("../../src/utils/react-project.js");
vi.mock("../../src/utils/sleep.js", () => ({
  sleep: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../src/utils/snippets.js");
vi.mock("../../src/utils/tsconfig.js");
vi.mock("../../src/utils/vite-config.js");
vi.mock("../../src/utils/vue-project.js");
vi.mock("../../src/commands/migrate.js", () => ({
  migrate: vi.fn(),
}));

import type { Task } from "@clack/prompts";
import * as clackPrompts from "@clack/prompts";

import * as astroConfig from "../../src/utils/astro-config.js";
import * as astroReactIntegration from "../../src/utils/astro-react-integration.js";
import * as astroVueIntegration from "../../src/utils/astro-vue-integration.js";
import * as config from "../../src/utils/config.js";
import { CONFIG_SCHEMA_V2_URL } from "../../src/utils/config.js";
import * as env from "../../src/utils/env.js";
import * as fsUtils from "../../src/utils/fs.js";
import { PRIVATE_VUE_FRAMEWORK_TARGET_POLICY } from "../../src/utils/framework-target-policy.js";
import * as hostPlanner from "../../src/utils/host-planner.js";
import * as layout from "../../src/utils/layout.js";
import * as packageManager from "../../src/utils/package-manager.js";
import * as reactProject from "../../src/utils/react-project.js";
import * as snippets from "../../src/utils/snippets.js";
import * as sleepUtils from "../../src/utils/sleep.js";
import * as tsconfig from "../../src/utils/tsconfig.js";
import * as viteConfig from "../../src/utils/vite-config.js";
import * as vueProject from "../../src/utils/vue-project.js";
import { init } from "../../src/commands/init.js";
import { migrate } from "../../src/commands/migrate.js";

const actualVueProject = await vi.importActual<typeof import("../../src/utils/vue-project.js")>(
  "../../src/utils/vue-project.js",
);

const runtimePackage = JSON.parse(
  readFileSync(new URL("../../../runtime/package.json", import.meta.url), "utf8"),
) as { version: string };
const registryVersionManifest = JSON.parse(
  readFileSync(new URL("../../registry/styled-component-versions.json", import.meta.url), "utf8"),
) as { registryVersion: string };
const CURRENT_ASTRO_SPEC = `@starwind-ui/astro@${runtimePackage.version}`;
const CURRENT_REACT_SPEC = `@starwind-ui/react@${runtimePackage.version}`;
const CURRENT_VUE_SPEC = "@starwind-ui/vue@0.0.0";
const ASTRO_SETUP_REQUIREMENTS = [
  "@tabler/icons@^3",
  "@tailwindcss/forms@^0.5",
  "@tailwindcss/vite@^4",
  "tailwind-merge@^3",
  "tailwind-variants@^3",
  "tailwindcss@^4",
  "tw-animate-css@^1",
];
const REACT_SETUP_REQUIREMENTS = [
  "@tabler/icons-react@^3",
  "@tailwindcss/forms@^0.5",
  "@tailwindcss/vite@^4",
  "tailwind-merge@^3",
  "tailwind-variants@^3",
  "tailwindcss@^4",
  "tw-animate-css@^1",
];

const mockTasks = vi.mocked(clackPrompts.tasks);
const mockGroup = vi.mocked(clackPrompts.group);
const mockSelect = vi.mocked(clackPrompts.select);
const mockText = vi.mocked(clackPrompts.text);
const mockConfirm = vi.mocked(clackPrompts.confirm);
const mockFileExists = vi.mocked(fsUtils.fileExists);
const mockReadJsonFile = vi.mocked(fsUtils.readJsonFile);
const mockEnsureDirectory = vi.mocked(fsUtils.ensureDirectory);
const mockWriteCssFile = vi.mocked(fsUtils.writeCssFile);
const mockDetectHostPlan = vi.mocked(hostPlanner.detectHostPlan);
const mockFormatDetectedHost = vi.mocked(hostPlanner.formatDetectedHost);
const mockFormatPrivateDetectedHost = vi.mocked(hostPlanner.formatPrivateDetectedHost);
const mockValidateHostTarget = vi.mocked(hostPlanner.validateHostTarget);
const mockValidatePrivateHostTarget = vi.mocked(hostPlanner.validatePrivateHostTarget);
const mockSetupSnippets = vi.mocked(snippets.setupSnippets);
const mockSetupAstroConfig = vi.mocked(astroConfig.setupAstroConfig);
const mockEnsureAstroReactIntegration = vi.mocked(
  astroReactIntegration.ensureAstroReactIntegration,
);
const mockApplyAstroVueIntegration = vi.mocked(astroVueIntegration.applyAstroVueIntegration);
const mockPrepareAstroVueIntegration = vi.mocked(astroVueIntegration.prepareAstroVueIntegration);
const mockSetupTsConfig = vi.mocked(tsconfig.setupTsConfig);
const mockSetupVueTsConfig = vi.mocked(tsconfig.setupVueTsConfig);
const mockSetupLayoutCssImport = vi.mocked(layout.setupLayoutCssImport);
const mockSetupReactViteConfig = vi.mocked(viteConfig.setupReactViteConfig);
const mockSetupReactCssImport = vi.mocked(viteConfig.setupReactCssImport);
const mockGetConfigState = vi.mocked(config.getConfigState);
const mockUpdateConfig = vi.mocked(config.updateConfig);
const mockInstallDependencies = vi.mocked(packageManager.installDependencies);
const mockDetectReactProjectPlan = vi.mocked(reactProject.detectReactProjectPlan);
const mockGetReactPackageRequirements = vi.mocked(reactProject.getReactPackageRequirements);
const mockSetupReactProject = vi.mocked(reactProject.setupReactProject);
const mockValidateReactProjectSetup = vi.mocked(reactProject.validateReactProjectSetup);
const mockGetVuePackageRequirements = vi.mocked(vueProject.getVuePackageRequirements);
const mockMeetsVueVersionFloor = vi.mocked(vueProject.meetsVueVersionFloor);
const mockSetupVueProject = vi.mocked(vueProject.setupVueProject);
const mockValidateVueProjectSetup = vi.mocked(vueProject.validateVueProjectSetup);
const mockHasStarwindProAuthConfig = vi.mocked(config.hasStarwindProAuthConfig);
const mockSetupStarwindProConfig = vi.mocked(config.setupStarwindProConfig);
const mockSetupStarwindProEnv = vi.mocked(env.setupStarwindProEnv);
const mockCheckStarwindProEnv = vi.mocked(env.checkStarwindProEnv);
const mockMigrate = vi.mocked(migrate);

async function runTasksSequentially(tasks: Task[]) {
  for (const task of tasks) {
    await task.task(() => {});
  }
}

function createCurrentConfig(framework: "astro" | "react" = "astro") {
  return {
    $schema: CONFIG_SCHEMA_V2_URL,
    version: 2 as const,
    framework,
    registry: {
      source: "bundled" as const,
      version: "0.1.0",
    },
    tailwind: {
      css: PATHS.LOCAL_CSS_FILE,
      baseColor: "neutral" as const,
      cssVariables: true,
    },
    componentDir: PATHS.LOCAL_STARWIND_COMPONENTS_DIR,
    utilsDir: PATHS.LOCAL_UTILS_DIR,
    components: [],
  };
}

function mockDefaultProject() {
  vi.mocked(clackPrompts.isCancel).mockReturnValue(false);
  mockTasks.mockImplementation(runTasksSequentially);
  mockFileExists.mockImplementation(async (filePath) => filePath === "package.json");
  mockReadJsonFile.mockResolvedValue({
    dependencies: {
      astro: "^5.11.0",
    },
  });

  mockEnsureDirectory.mockResolvedValue(undefined);
  mockWriteCssFile.mockResolvedValue(undefined);
  mockSetupSnippets.mockResolvedValue(true);
  mockSetupAstroConfig.mockResolvedValue(true);
  mockEnsureAstroReactIntegration.mockResolvedValue({ status: "ready" });
  mockApplyAstroVueIntegration.mockResolvedValue({ status: "configured" });
  mockPrepareAstroVueIntegration.mockResolvedValue({ status: "ready" });
  mockSetupTsConfig.mockResolvedValue(true);
  mockSetupVueTsConfig.mockResolvedValue(true);
  mockSetupLayoutCssImport.mockResolvedValue(true);
  mockSetupReactViteConfig.mockResolvedValue(true);
  mockSetupReactCssImport.mockResolvedValue(true);
  mockSetupStarwindProEnv.mockResolvedValue(true);
  mockCheckStarwindProEnv.mockResolvedValue(false);
  mockHasStarwindProAuthConfig.mockReturnValue(false);
  mockSetupStarwindProConfig.mockResolvedValue(undefined);
  mockGetConfigState.mockResolvedValue({
    status: "missing",
    config: createCurrentConfig(),
  });
  mockUpdateConfig.mockResolvedValue(undefined);
  mockInstallDependencies.mockResolvedValue(undefined);
  mockDetectReactProjectPlan.mockResolvedValue({
    componentDir: "src/components/starwind",
    cssEntry: "src/main.tsx",
    cssFile: "src/styles/starwind.css",
    kind: "vite",
    sourceRoot: "src",
    utilsDir: "src/lib/utils",
    viteConfig: "vite.config.ts",
  });
  mockDetectHostPlan.mockImplementation(async (pkg) => {
    const dependencies = {
      ...pkg.devDependencies,
      ...pkg.dependencies,
    };
    if (dependencies.astro) {
      return {
        host: { kind: "astro", label: "Astro" },
        targets: [
          { framework: "astro", readiness: "ready" },
          { framework: "react", readiness: "configurable" },
        ],
      };
    }
    if (dependencies.react || dependencies["react-dom"]) {
      const reactProject = await mockDetectReactProjectPlan(pkg);
      return {
        host: {
          kind: reactProject.kind,
          label: reactProject.kind === "vite" ? "Vite" : reactProject.kind,
        },
        reactProject,
        targets: [{ framework: "react", readiness: "ready" }],
      };
    }
    return {
      diagnostic:
        "No supported Starwind target was detected. Use --astro for an Astro project, or run Starwind in a supported React host.",
      host: { kind: "unknown", label: "Unknown" },
      targets: [{ framework: "astro", readiness: "configurable" }],
    };
  });
  mockFormatDetectedHost.mockImplementation(
    (plan, framework) =>
      `Detected ${framework === "astro" ? "Astro" : "React"}${plan.host.kind === framework ? "" : ` (${plan.host.label})`}`,
  );
  mockFormatPrivateDetectedHost.mockImplementation(
    (plan, framework) =>
      `Detected ${framework === "vue" ? "Vue" : framework === "astro" ? "Astro" : "React"}${plan.host.kind === framework ? "" : ` (${plan.host.label})`}`,
  );
  mockValidateHostTarget.mockImplementation((plan, framework) => {
    if (plan.targets.some((target) => target.framework === framework)) return framework;
    throw new Error(`${framework} is not available for ${plan.host.label}`);
  });
  mockValidatePrivateHostTarget.mockImplementation((plan, framework) => {
    if (plan.targets.some((target) => target.framework === framework)) return framework;
    throw new Error(`${framework} is not available for ${plan.host.label}`);
  });
  mockGetReactPackageRequirements.mockImplementation((requirements) => requirements);
  mockSetupReactProject.mockResolvedValue(undefined);
  mockValidateReactProjectSetup.mockResolvedValue(undefined);
  mockGetVuePackageRequirements.mockImplementation((requirements) => [
    ...requirements,
    "@tailwindcss/vite@^4",
    "tailwindcss@^4",
    "tw-animate-css@^1",
    "@tailwindcss/forms@^0.5",
  ]);
  mockMeetsVueVersionFloor.mockImplementation((range) => range === ">=3.5");
  mockSetupVueProject.mockResolvedValue(undefined);
  mockValidateVueProjectSetup.mockResolvedValue(undefined);
  mockMigrate.mockResolvedValue(undefined);
}

describe("init command", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDefaultProject();
  });

  const vueRegistry = {
    version: "2.0.0",
    setup: {
      vue: {
        adapterPackage: { name: "@starwind-ui/vue", range: "*" },
        packageRequirements: [{ name: "vue", range: ">=3.5" }],
      },
    },
    components: [],
  };
  const viteVueProject = {
    componentDir: "src/components/starwind",
    cssEntry: "src/main.ts",
    cssFile: "src/styles/starwind.css",
    kind: "vite" as const,
    sourceRoot: "src" as const,
    utilsDir: "src/lib/utils",
    viteConfig: "vite.config.ts",
    vueUpgradeRequired: false,
  };
  const vuePlan = {
    host: { kind: "vite" as const, label: "Vite" },
    targets: [{ framework: "vue" as const, readiness: "ready" as const }],
    vueHostProject: {
      componentDir: "src/components/starwind",
      cssFile: "src/styles/starwind.css",
      hostKind: "vite" as const,
      hostLabel: "Vite",
      isSecondaryTarget: false as const,
      prepare: async () => ({ status: "prepared" as const }),
      prepareStylesheet: (content: string) => content,
      projectFramework: "vue" as const,
      requirements: (requirements: string[]) => mockGetVuePackageRequirements(requirements),
      setup: async (cssFile: string) => mockSetupVueProject(viteVueProject, cssFile),
      setupLabel: "Setup Vite Vue project",
      setupResult: "Vue project setup completed",
      setupTypeScript: async () => mockSetupVueTsConfig(false),
      utilsDir: "src/lib/utils",
      validate: async () => mockValidateVueProjectSetup(viteVueProject),
      vueUpgradeRequired: false,
    },
  };

  function createVuePlanWithManifest(projectPackage: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    optionalDependencies?: Record<string, string>;
    peerDependencies?: Record<string, string>;
  }) {
    return {
      ...vuePlan,
      vueHostProject: {
        ...vuePlan.vueHostProject,
        requirements: actualVueProject.createVuePackageRequirementPlanner(projectPackage),
      },
    };
  }

  function createLaravelHostPlan(options: { cancelled?: boolean; validationError?: Error } = {}) {
    const setup = vi.fn().mockResolvedValue(undefined);
    const setupTypeScript = vi.fn().mockResolvedValue(true);
    const validate = options.validationError
      ? vi.fn().mockRejectedValue(options.validationError)
      : vi.fn().mockResolvedValue(undefined);
    return {
      hostPlan: {
        host: { kind: "laravel" as const, label: "Laravel with Inertia Vue" },
        targets: [{ framework: "vue" as const, readiness: "ready" as const }],
        vueHostProject: {
          componentDir: "resources/js/components/starwind",
          cssFile: "resources/css/starwind.css",
          hostKind: "laravel" as const,
          hostLabel: "Laravel with Inertia Vue",
          isSecondaryTarget: false as const,
          lockCssFile: true as const,
          prepare: async () => {
            if (options.cancelled) return { status: "cancelled" as const };
            return { status: "prepared" as const };
          },
          prepareStylesheet: (content: string) =>
            content
              .replace(/^@import "tailwindcss";\n/m, "")
              .replace(/^@import "tw-animate-css";\n/m, "")
              .replace(/^@custom-variant dark [^;]+;\n/m, ""),
          projectFramework: "vue" as const,
          requirements: (requirements: string[]) => mockGetVuePackageRequirements(requirements),
          setup,
          setupLabel: "Setup Laravel Inertia Vue project",
          setupResult: "Laravel Inertia Vue project setup completed",
          setupTypeScript,
          utilsDir: "resources/js/lib/utils",
          validate,
          vueUpgradeRequired: false,
        },
      },
      setup,
      setupTypeScript,
      validate,
    };
  }

  function createQuasarHostPlan(options: { cancelled?: boolean; validationError?: Error } = {}) {
    const setup = vi.fn().mockResolvedValue(undefined);
    const setupTypeScript = vi.fn().mockResolvedValue(true);
    const validate = options.validationError
      ? vi.fn().mockRejectedValue(options.validationError)
      : vi.fn().mockResolvedValue(undefined);
    return {
      hostPlan: {
        host: { kind: "quasar" as const, label: "Quasar SSR" },
        targets: [{ framework: "vue" as const, readiness: "ready" as const }],
        vueHostProject: {
          componentDir: "src/components/starwind",
          cssFile: "src/css/starwind.css",
          hostKind: "quasar" as const,
          hostLabel: "Quasar SSR",
          isSecondaryTarget: false as const,
          lockCssFile: true as const,
          prepare: async () =>
            options.cancelled ? { status: "cancelled" as const } : { status: "prepared" as const },
          prepareStylesheet: (content: string) => content,
          projectFramework: "vue" as const,
          requirements: (requirements: string[]) => mockGetVuePackageRequirements(requirements),
          setup,
          setupLabel: "Setup Quasar project",
          setupResult: "Quasar project setup completed",
          setupTypeScript,
          utilsDir: "src/lib/utils",
          validate,
          vueUpgradeRequired: false,
        },
      },
      setup,
      setupTypeScript,
      validate,
    };
  }

  function createAstroVueHostPlan(vueUpgradeRequired = false) {
    return {
      host: { kind: "astro" as const, label: "Astro" },
      targets: [
        { framework: "astro" as const, readiness: "ready" as const },
        { framework: "vue" as const, readiness: "configurable" as const },
      ],
      vueHostProject: {
        componentDir: "src/components/starwind-vue",
        cssFile: "src/styles/starwind.css",
        hostKind: "astro" as const,
        hostLabel: "Astro",
        isSecondaryTarget: true as const,
        prepare: async (options: {
          packageManager: packageManager.PackageManager;
          projectPackage: hostPlanner.ProjectPackage;
          skipPrompts?: boolean;
        }) => {
          const preparation = await mockPrepareAstroVueIntegration(options);
          if (preparation.status === "cancelled" || preparation.status === "declined") {
            return { status: preparation.status } as const;
          }
          if (preparation.status === "ready") return { status: "prepared" as const };
          return {
            applyIntegration: async () => {
              await mockApplyAstroVueIntegration(preparation, options.packageManager);
            },
            integrationLabel: "Setup Astro Vue integration",
            integrationResult: "Astro Vue integration configured",
            status: "prepared" as const,
          };
        },
        prepareStylesheet: (content: string) => content,
        projectFramework: "astro" as const,
        requirements: (requirements: string[]) => mockGetVuePackageRequirements(requirements),
        setup: async () => {
          if (!(await mockSetupAstroConfig())) throw new Error("Failed to setup Astro config");
        },
        setupCss: async (cssFile: string) => mockSetupLayoutCssImport(cssFile),
        setupCssLabel: "Adding CSS import to layout",
        setupCssResult: "CSS import added to layout",
        setupLabel: "Setup Astro config file",
        setupResult: "Astro config setup completed",
        setupTypeScript: async () => mockSetupTsConfig("astro"),
        utilsDir: "src/lib/utils",
        validate: async () => {},
        vueUpgradeRequired,
      },
    };
  }

  it("initializes Vite Vue only with explicit private dependencies", async () => {
    const projectPackage = {
      dependencies: { vue: "3.5.39" },
      devDependencies: { "@vitejs/plugin-vue": "^6.0.0", vite: "^8.2.0" },
    };
    mockReadJsonFile.mockResolvedValue(projectPackage);
    mockGetVuePackageRequirements.mockReturnValue([
      "@tailwindcss/vite@^4",
      "tailwindcss@^4",
      "tw-animate-css@^1",
      "@tailwindcss/forms@^0.5",
    ]);

    await init(
      true,
      { defaults: true, framework: "vue", packageManager: "pnpm" },
      {
        hostPlan: vuePlan,
        registry: vueRegistry,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );

    expect(mockValidateVueProjectSetup).toHaveBeenCalledWith(viteVueProject);
    expect(mockSetupVueProject).toHaveBeenCalledWith(viteVueProject, "src/styles/starwind.css");
    expect(mockSetupVueTsConfig).toHaveBeenCalledWith(false);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        framework: "vue",
        componentDir: "src/components/starwind",
      }),
      {
        appendComponents: false,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );
    expect(mockInstallDependencies.mock.calls).toEqual([
      [[CURRENT_VUE_SPEC], "pnpm"],
      [
        ["@tailwindcss/vite@^4", "tailwindcss@^4", "tw-animate-css@^1", "@tailwindcss/forms@^0.5"],
        "pnpm",
        false,
        false,
      ],
    ]);
    expect(mockGetVuePackageRequirements).toHaveBeenCalledWith(["vue@>=3.5"]);
  });

  it.each([
    ["missing", {}],
    ["incompatible", { dependencies: { vue: "^3.4.0" } }],
    ["local", { dependencies: { vue: "file:../vue" } }],
    ["workspace", { dependencies: { vue: "workspace:*" } }],
  ] as const)(
    "installs the canonical Vue requirement for a %s declaration",
    async (_, projectPackage) => {
      mockReadJsonFile.mockResolvedValue(projectPackage);

      await init(
        true,
        { defaults: true, framework: "vue", packageManager: "pnpm" },
        {
          hostPlan: createVuePlanWithManifest(projectPackage),
          registry: vueRegistry,
          targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
        },
      );

      expect(mockInstallDependencies.mock.calls[1]).toEqual([
        [
          "vue@>=3.5",
          "tailwindcss@^4",
          "@tailwindcss/vite@^4",
          "tw-animate-css@^1",
          "@tailwindcss/forms@^0.5",
        ],
        "pnpm",
        false,
        false,
      ]);
    },
  );

  it("keeps satisfied installer requirements stable across repeat init", async () => {
    const projectPackage = {
      dependencies: { tailwindcss: "^4.1", vue: " 3.5.39 " },
    };
    const hostPlan = createVuePlanWithManifest(projectPackage);
    mockReadJsonFile.mockResolvedValue(projectPackage);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await init(
        true,
        { defaults: true, framework: "vue", packageManager: "pnpm" },
        {
          hostPlan,
          registry: vueRegistry,
          targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
        },
      );
    }

    expect(
      mockInstallDependencies.mock.calls.filter((call) => call.length === 4).map((call) => call[0]),
    ).toEqual([
      ["@tailwindcss/vite@^4", "tw-animate-css@^1", "@tailwindcss/forms@^0.5"],
      ["@tailwindcss/vite@^4", "tw-animate-css@^1", "@tailwindcss/forms@^0.5"],
    ]);
  });

  it("skips the secondary installer prompt and task when every requirement is satisfied", async () => {
    const projectPackage = {
      dependencies: {
        "@starwind-ui/runtime": "^0.1.0",
        "@starwind-ui/vue": "0.0.0",
        "@tailwindcss/forms": "^0.5.1",
        tailwindcss: "^4.1",
        "tw-animate-css": "^1.2.0",
        vue: "3.5.39",
      },
      devDependencies: {
        "@tailwindcss/vite": "^4.1",
        "@vitejs/plugin-vue": "^6.0.0",
        vite: "^8.2.0",
      },
    };
    const hostPlan = createVuePlanWithManifest(projectPackage);
    mockReadJsonFile.mockResolvedValue(projectPackage);
    mockGroup.mockImplementation(async (prompts) => {
      const answers: Record<string, unknown> = {};
      for (const [key, prompt] of Object.entries(prompts)) {
        answers[key] = await (prompt as () => unknown | Promise<unknown>)();
      }
      return answers;
    });
    mockText.mockImplementation(async (options) => options.initialValue ?? "");
    mockSelect.mockImplementation(async (options) => options.initialValue ?? "neutral");
    mockConfirm.mockResolvedValue(true);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      await init(
        true,
        { framework: "vue", packageManager: "pnpm" },
        {
          hostPlan,
          registry: vueRegistry,
          targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
        },
      );
    }

    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(
      mockTasks.mock.calls.flatMap(([tasks]) => tasks.map((task) => task.title)),
    ).not.toContain("Installing packages");
    expect(mockUpdateConfig).toHaveBeenCalledTimes(2);
  });

  it("keeps Astro primary and records Vue in a separate component directory", async () => {
    const hostPlan = createAstroVueHostPlan();
    mockReadJsonFile.mockResolvedValue({ dependencies: { astro: "^7.0.0" } });
    mockPrepareAstroVueIntegration.mockResolvedValue({
      status: "prepared",
      packages: ["@astrojs/vue"],
    });

    await init(
      true,
      { defaults: true, framework: "vue", packageManager: "pnpm" },
      {
        hostPlan,
        registry: vueRegistry,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );

    expect(mockPrepareAstroVueIntegration).toHaveBeenCalledWith({
      packageManager: "pnpm",
      projectPackage: { dependencies: { astro: "^7.0.0" } },
      skipPrompts: true,
    });
    expect(mockApplyAstroVueIntegration).toHaveBeenCalledWith(
      { status: "prepared", packages: ["@astrojs/vue"] },
      "pnpm",
    );
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        framework: "astro",
        componentDir: PATHS.LOCAL_STARWIND_COMPONENTS_DIR,
        componentDirs: { vue: "src/components/starwind-vue" },
      }),
      {
        appendComponents: false,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );
    expect(mockSetupAstroConfig).toHaveBeenCalled();
    expect(mockSetupLayoutCssImport).toHaveBeenCalled();
  });

  it("validates Vue registry setup before Astro integration decisions or mutation", async () => {
    const hostPlan = createAstroVueHostPlan();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    try {
      await expect(
        init(
          true,
          { defaults: true, framework: "vue", packageManager: "pnpm" },
          {
            hostPlan,
            registry: { version: "2.0.0", components: [] },
            targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
          },
        ),
      ).rejects.toThrow("process.exit called");
      expect(mockPrepareAstroVueIntegration).not.toHaveBeenCalled();
      expect(mockApplyAstroVueIntegration).not.toHaveBeenCalled();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("keeps Astro package and config state untouched when Vue integration is cancelled", async () => {
    const hostPlan = createAstroVueHostPlan();
    mockPrepareAstroVueIntegration.mockResolvedValue({ status: "cancelled" });

    await init(
      true,
      { defaults: true, framework: "vue", packageManager: "pnpm" },
      {
        hostPlan,
        registry: vueRegistry,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );

    expect(mockApplyAstroVueIntegration).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockSetupAstroConfig).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("defers Astro Vue mutation until later project preflight is complete", async () => {
    const hostPlan = createAstroVueHostPlan();
    mockReadJsonFile.mockResolvedValue({ dependencies: { astro: "workspace:*" } });
    mockPrepareAstroVueIntegration.mockResolvedValue({
      status: "prepared",
      packages: ["@astrojs/vue"],
    });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    try {
      await expect(
        init(
          true,
          { defaults: true, framework: "vue", packageManager: "pnpm" },
          {
            hostPlan,
            registry: vueRegistry,
            targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
          },
        ),
      ).rejects.toThrow("process.exit called");
      expect(mockPrepareAstroVueIntegration).toHaveBeenCalled();
      expect(mockApplyAstroVueIntegration).not.toHaveBeenCalled();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockSetupAstroConfig).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("keeps prepared Astro Vue changes deferred when a later package prompt is cancelled", async () => {
    const hostPlan = createAstroVueHostPlan();
    mockReadJsonFile.mockResolvedValue({ dependencies: { astro: "^7.0.0" } });
    mockPrepareAstroVueIntegration.mockResolvedValue({
      status: "prepared",
      packages: ["@astrojs/vue"],
    });
    mockGroup.mockResolvedValue({
      framework: "vue",
      componentDir: "src/components/starwind-vue",
      cssFile: "src/styles/starwind.css",
      twBaseColor: "neutral",
    });
    const cancellation = Symbol("cancel");
    mockConfirm.mockResolvedValue(cancellation);
    vi.mocked(clackPrompts.isCancel).mockImplementation((value) => value === cancellation);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    try {
      await expect(
        init(
          true,
          { framework: "vue", packageManager: "pnpm" },
          {
            hostPlan,
            registry: vueRegistry,
            targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
          },
        ),
      ).rejects.toThrow("process.exit called");
      expect(mockPrepareAstroVueIntegration).toHaveBeenCalled();
      expect(mockApplyAstroVueIntegration).not.toHaveBeenCalled();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockSetupAstroConfig).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("requires corrective Vue installation before mutating a Vue 3.4 project", async () => {
    const upgradePlan = {
      ...vuePlan,
      targets: [{ framework: "vue" as const, readiness: "configurable" as const }],
      vueHostProject: { ...vuePlan.vueHostProject, vueUpgradeRequired: true },
    };
    mockGroup.mockResolvedValue({
      framework: "vue",
      componentDir: "src/components/starwind",
      cssFile: "src/styles/starwind.css",
      twBaseColor: "neutral",
    });
    mockConfirm.mockResolvedValue(false);
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    try {
      await expect(
        init(
          true,
          { framework: "vue", packageManager: "pnpm" },
          {
            hostPlan: upgradePlan,
            registry: vueRegistry,
            targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
          },
        ),
      ).rejects.toThrow("process.exit called");
      expect(clackPrompts.cancel).toHaveBeenCalledWith(expect.stringContaining("Vue 3.5 or later"));
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockSetupVueProject).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("rejects Vue through the public init call before host detection or mutation", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    try {
      await expect(
        init(true, {
          defaults: true,
          framework: "vue",
          packageManager: "pnpm",
        } as never),
      ).rejects.toThrow("process.exit called");
      expect(clackPrompts.log.error).toHaveBeenCalledWith(
        expect.stringContaining("public target policy"),
      );
      expect(mockDetectHostPlan).not.toHaveBeenCalled();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("preserves a Vite Vue project when preflight fails", async () => {
    mockValidateVueProjectSetup.mockRejectedValue(new Error("Unsupported Vite Vue config"));
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    try {
      await expect(
        init(
          true,
          { defaults: true, framework: "vue", packageManager: "pnpm" },
          {
            hostPlan: vuePlan,
            registry: vueRegistry,
            targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
          },
        ),
      ).rejects.toThrow("process.exit called");
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockSetupVueProject).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("writes v2 runtime config and package plan for a React framework flag", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" },
      devDependencies: { vite: "^8.2.0" },
    });

    await init(true, { defaults: true, framework: "react", packageManager: "pnpm" });

    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        $schema: CONFIG_SCHEMA_V2_URL,
        version: 2,
        framework: "react",
        registry: {
          source: "bundled",
          version: registryVersionManifest.registryVersion,
        },
        componentDir: `${PATHS.LOCAL_COMPONENTS_DIR}/starwind`,
        utilsDir: PATHS.LOCAL_UTILS_DIR,
      }),
      { appendComponents: false },
    );
    expect(mockSetupAstroConfig).not.toHaveBeenCalled();
    expect(mockSetupLayoutCssImport).not.toHaveBeenCalled();
    expect(mockSetupReactViteConfig).not.toHaveBeenCalled();
    expect(mockSetupReactCssImport).not.toHaveBeenCalled();
    expect(mockSetupReactProject).toHaveBeenCalledWith(
      expect.objectContaining({ kind: "vite" }),
      PATHS.LOCAL_CSS_FILE,
    );
    expect(mockSetupTsConfig).toHaveBeenCalledWith("react", "src", false);
    expect(mockInstallDependencies.mock.calls).toEqual([
      [[CURRENT_REACT_SPEC], "pnpm"],
      [REACT_SETUP_REQUIREMENTS, "pnpm", false, false],
    ]);
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).not.toContain('"@tabler/icons@^3"');
  });

  it("requests JavaScript and generated TSX support for a Vite React JavaScript host", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" },
      devDependencies: { vite: "^8.2.0" },
    });
    mockDetectReactProjectPlan.mockResolvedValue({
      componentDir: "src/components/starwind",
      cssEntry: "src/main.jsx",
      cssFile: "src/styles/starwind.css",
      kind: "vite",
      sourceRoot: "src",
      utilsDir: "src/lib/utils",
      viteConfig: "vite.config.js",
    });

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockSetupTsConfig).toHaveBeenCalledWith("react", "src", true);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.not.objectContaining({ language: expect.anything(), tsx: expect.anything() }),
      { appendComponents: false },
    );
  });

  it("detects a React project when defaults are used without a framework flag", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        react: "^19.2.0",
        "react-dom": "^19.2.0",
      },
    });

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockUpdateConfig).toHaveBeenCalledWith(expect.objectContaining({ framework: "react" }), {
      appendComponents: false,
    });
    expect(mockInstallDependencies.mock.calls).toEqual([
      [[CURRENT_REACT_SPEC], "pnpm"],
      [REACT_SETUP_REQUIREMENTS, "pnpm", false, false],
    ]);
    expect(mockSelect).not.toHaveBeenCalled();
    expect(clackPrompts.log.info).toHaveBeenCalledWith("Detected React (Vite)");
  });

  it("uses detected Next App paths and validates setup before installing packages", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        next: "^16.3.0",
        react: "^19.2.0",
        "react-dom": "^19.2.0",
      },
    });
    const nextPlan = {
      componentDir: "src/components/starwind",
      cssEntry: "src/app/globals.css",
      cssFile: "src/styles/starwind.css",
      kind: "next-app" as const,
      rootEntry: "src/app/layout.tsx",
      sourceRoot: "src" as const,
      utilsDir: "src/lib/utils",
    };
    mockDetectReactProjectPlan.mockResolvedValue(nextPlan);
    mockGetReactPackageRequirements.mockReturnValue([
      "@tabler/icons-react@^3",
      "@tailwindcss/forms@^0.5",
      "tailwind-merge@^3",
      "tailwind-variants@^3",
      "tailwindcss@^4",
      "tw-animate-css@^1",
      "@tailwindcss/postcss@^4",
    ]);

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockValidateReactProjectSetup).toHaveBeenCalledWith(nextPlan);
    expect(mockValidateReactProjectSetup.mock.invocationCallOrder[0]).toBeLessThan(
      mockInstallDependencies.mock.invocationCallOrder[0]!,
    );
    expect(mockSetupReactProject).toHaveBeenCalledWith(nextPlan, nextPlan.cssFile);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        componentDir: nextPlan.componentDir,
        utilsDir: nextPlan.utilsDir,
        tailwind: expect.objectContaining({ css: nextPlan.cssFile }),
      }),
      { appendComponents: false },
    );
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).not.toContain("@tailwindcss/vite");
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).toContain("@tailwindcss/postcss");
  });

  it("uses detected Next Pages paths and the PostCSS package plan", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        next: "^16.3.0",
        react: "^19.2.0",
        "react-dom": "^19.2.0",
      },
    });
    const nextPagesPlan = {
      componentDir: "components/starwind",
      cssEntry: "styles/globals.css",
      cssFile: "styles/starwind.css",
      kind: "next-pages" as const,
      rootEntry: "pages/_document.tsx",
      sourceRoot: "." as const,
      utilsDir: "lib/utils",
    };
    mockDetectReactProjectPlan.mockResolvedValue(nextPagesPlan);
    mockGetReactPackageRequirements.mockReturnValue([
      "@tabler/icons-react@^3",
      "@tailwindcss/forms@^0.5",
      "tailwind-merge@^3",
      "tailwind-variants@^3",
      "tailwindcss@^4",
      "tw-animate-css@^1",
      "@tailwindcss/postcss@^4",
    ]);

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockValidateReactProjectSetup).toHaveBeenCalledWith(nextPagesPlan);
    expect(mockSetupReactProject).toHaveBeenCalledWith(nextPagesPlan, nextPagesPlan.cssFile);
    expect(mockSetupTsConfig).toHaveBeenCalledWith("react", ".", false);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        componentDir: "components/starwind",
        utilsDir: "lib/utils",
        tailwind: expect.objectContaining({ css: "styles/starwind.css" }),
      }),
      { appendComponents: false },
    );
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).not.toContain("@tailwindcss/vite");
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).toContain("@tailwindcss/postcss");
  });

  it("uses detected React Router paths and keeps the Vite package plan", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        react: "^19.2.0",
        "react-dom": "^19.2.0",
        "react-router": "^7.15.0",
      },
      devDependencies: {
        "@react-router/dev": "^7.15.0",
        vite: "^8.0.0",
      },
    });
    const reactRouterPlan = {
      componentDir: "app/components/starwind",
      cssEntry: "app/app.css",
      cssFile: "app/styles/starwind.css",
      kind: "react-router" as const,
      rootEntry: "app/root.tsx",
      sourceRoot: "app" as const,
      utilsDir: "app/lib/utils",
      viteConfig: "vite.config.ts",
    };
    mockDetectReactProjectPlan.mockResolvedValue(reactRouterPlan);

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockValidateReactProjectSetup).toHaveBeenCalledWith(reactRouterPlan);
    expect(mockSetupReactProject).toHaveBeenCalledWith(reactRouterPlan, reactRouterPlan.cssFile);
    expect(mockSetupTsConfig).toHaveBeenCalledWith("react", "app", false);
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        componentDir: "app/components/starwind",
        utilsDir: "app/lib/utils",
        tailwind: expect.objectContaining({ css: "app/styles/starwind.css" }),
      }),
      { appendComponents: false },
    );
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).toContain("@tailwindcss/vite");
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).not.toContain(
      "@tailwindcss/postcss",
    );
  });

  it("stops before package installation when React host preflight fails", async () => {
    mockReadJsonFile.mockResolvedValue({ dependencies: { next: "^16.3.0", react: "^19.2.0" } });
    mockValidateReactProjectSetup.mockRejectedValue(new Error("Unsupported Next layout"));
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(init(true, { defaults: true, packageManager: "pnpm" })).rejects.toThrow(
        "process.exit called",
      );
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
      expect(mockEnsureDirectory).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("keeps Astro as the project framework when React is used for Astro islands", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        astro: "^7.0.0",
        react: "^19.2.0",
        "react-dom": "^19.2.0",
      },
    });

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockUpdateConfig).toHaveBeenCalledWith(expect.objectContaining({ framework: "astro" }), {
      appendComponents: false,
    });
    expect(mockInstallDependencies.mock.calls[0]).toEqual([[CURRENT_ASTRO_SPEC], "pnpm"]);
  });

  it("preserves a packed local adapter during prepublish initialization", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: {
        "@starwind-ui/astro": "file:/tmp/starwind-astro.tgz",
        "@starwind-ui/runtime": "file:/tmp/starwind-runtime.tgz",
        astro: "^7.0.0",
      },
    });

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockInstallDependencies.mock.calls).toEqual([
      [ASTRO_SETUP_REQUIREMENTS, "pnpm", false, false],
    ]);
    expect(JSON.stringify(mockInstallDependencies.mock.calls)).not.toContain(
      JSON.stringify(CURRENT_ASTRO_SPEC),
    );
  });

  it("requires an explicit framework when defaults cannot identify the project", async () => {
    mockReadJsonFile.mockResolvedValue({ devDependencies: { vite: "^9.1.1" } });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(init(true, { defaults: true, packageManager: "pnpm" })).rejects.toThrow(
        "process.exit called",
      );
      expect(clackPrompts.log.error).toHaveBeenCalledWith(
        expect.stringMatching(/--astro.*supported React host/s),
      );
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("configures Pro authorization during fresh init without shadcn components config", async () => {
    await init(true, {
      defaults: true,
      framework: "astro",
      packageManager: "pnpm",
      pro: true,
    });

    expect(mockSetupStarwindProConfig).toHaveBeenCalled();
    expect(mockSetupStarwindProEnv).toHaveBeenCalled();
    expect(clackPrompts.note).toHaveBeenCalledWith(
      expect.stringContaining("Starwind Pro is now configured"),
      "Next steps",
    );
    const nextStepsMessage = String(vi.mocked(clackPrompts.note).mock.calls[0]?.[0]);
    expect(nextStepsMessage).toContain("starwind add @starwind-pro/component-name");
    expect(nextStepsMessage).toContain(".env.local");
    expect(nextStepsMessage).toContain("STARWIND_LICENSE_KEY");
  });

  it("auto-selects a plain Astro target without asking for a framework", async () => {
    const selectMessages: string[] = [];

    mockGroup.mockImplementation(async (prompts) => {
      const answers: Record<string, unknown> = {};

      for (const [key, prompt] of Object.entries(prompts)) {
        answers[key] = await (prompt as () => unknown | Promise<unknown>)();
      }

      return answers;
    });
    mockSelect.mockImplementation(async (options) => {
      selectMessages.push(options.message);

      if (options.message.includes("framework")) {
        return "astro";
      }

      return options.initialValue ?? "styled";
    });
    mockText.mockImplementation(async (options) => options.initialValue ?? "");
    mockConfirm.mockResolvedValue(true);

    await init(true, { packageManager: "pnpm" });

    expect(selectMessages).not.toContain("Which framework is this project using?");
    expect(selectMessages).not.toContain("Which Starwind component layer do you want to use?");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        framework: "astro",
      }),
      { appendComponents: false },
    );
  });

  it("prompts once with only ready targets for a mixed Astro host", async () => {
    const selectMessages: string[] = [];
    mockDetectHostPlan.mockResolvedValue({
      host: { kind: "astro", label: "Astro" },
      targets: [
        { framework: "astro", readiness: "ready" },
        { framework: "react", readiness: "ready" },
      ],
    });
    mockGroup.mockImplementation(async (prompts) => {
      const answers: Record<string, unknown> = {};
      for (const [key, prompt] of Object.entries(prompts)) {
        answers[key] = await (prompt as () => unknown | Promise<unknown>)();
      }
      return answers;
    });
    mockSelect.mockImplementation(async (options) => {
      selectMessages.push(options.message);
      if (options.message.includes("detected framework")) return "astro";
      return options.initialValue ?? "neutral";
    });
    mockText.mockImplementation(async (options) => options.initialValue ?? "");
    mockConfirm.mockResolvedValue(true);

    await init(true, { packageManager: "pnpm" });

    expect(selectMessages.filter((message) => message.includes("detected framework"))).toEqual([
      "Which detected framework target would you like to use?",
    ]);
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { label: "Astro", value: "astro" },
          { label: "React", value: "react" },
        ],
      }),
    );
  });

  it("uses the same constrained target prompt in defaults mode for an ambiguous host", async () => {
    mockDetectHostPlan.mockResolvedValue({
      host: { kind: "astro", label: "Astro" },
      targets: [
        { framework: "astro", readiness: "ready" },
        { framework: "react", readiness: "ready" },
      ],
    });
    mockSelect.mockResolvedValue("astro");

    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockSelect).toHaveBeenCalledTimes(1);
    expect(mockSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        options: [
          { label: "Astro", value: "astro" },
          { label: "React", value: "react" },
        ],
      }),
    );
    expect(mockUpdateConfig).toHaveBeenCalledWith(expect.objectContaining({ framework: "astro" }), {
      appendComponents: false,
    });
  });

  it("executes a mixed Astro prompt React selection as a configured secondary target", async () => {
    mockDetectHostPlan.mockResolvedValue({
      host: { kind: "astro", label: "Astro" },
      targets: [
        { framework: "astro", readiness: "ready" },
        { framework: "react", readiness: "ready" },
      ],
    });
    mockSelect.mockResolvedValue("react");
    await init(true, { defaults: true, packageManager: "pnpm" });

    expect(mockEnsureAstroReactIntegration).toHaveBeenCalledWith({
      packageManager: "pnpm",
      skipPrompts: true,
    });
    expect(clackPrompts.log.info).toHaveBeenCalledWith("Detected React (Astro)");
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        framework: "astro",
        componentDirs: { react: "src/components/starwind-react" },
      }),
      { appendComponents: false },
    );
  });

  it.each(["cancelled", "declined"] as const)(
    "stops Astro React initialization cleanly when setup is %s",
    async (status) => {
      mockDetectHostPlan.mockResolvedValue({
        host: { kind: "astro", label: "Astro" },
        targets: [
          { framework: "astro", readiness: "ready" },
          { framework: "react", readiness: "configurable" },
        ],
      });
      mockValidateHostTarget.mockReturnValue("react");
      mockEnsureAstroReactIntegration.mockResolvedValue({ status });

      await init(true, { defaults: true, framework: "react", packageManager: "pnpm" });

      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
      expect(mockEnsureDirectory).not.toHaveBeenCalled();
    },
  );

  it("rejects an explicit target that the host plan cannot support before mutation", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: { react: "^19.2.0" },
      devDependencies: { vite: "^8.2.0" },
    });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(
        init(true, { astro: true, defaults: true, packageManager: "pnpm" }),
      ).rejects.toThrow("process.exit called");
      expect(clackPrompts.log.error).toHaveBeenCalledWith(expect.stringMatching(/not available/i));
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
      expect(mockEnsureDirectory).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("preserves the conflicting framework option error before mutation", async () => {
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(
        init(true, { astro: true, defaults: true, packageManager: "pnpm", react: true }),
      ).rejects.toThrow("process.exit called");
      expect(clackPrompts.log.error).toHaveBeenCalledWith(
        "Choose only one Starwind framework target.",
      );
      expect(mockDetectHostPlan).not.toHaveBeenCalled();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("rejects conflicting framework options before legacy migration", async () => {
    mockFileExists.mockResolvedValue(true);
    mockConfirm.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({
      status: "legacy",
      config: {
        $schema: "https://starwind.dev/config-schema.json",
        tailwind: {
          css: PATHS.LOCAL_CSS_FILE,
          baseColor: "neutral",
          cssVariables: true,
        },
        componentDir: PATHS.LOCAL_COMPONENTS_DIR,
        utilsDir: PATHS.LOCAL_UTILS_DIR,
        components: [],
      },
    });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(
        init(false, { astro: true, packageManager: "pnpm", react: true }),
      ).rejects.toThrow("process.exit called");
      expect(clackPrompts.log.error).toHaveBeenCalledWith(
        "Choose only one Starwind framework target.",
      );
      expect(mockConfirm).not.toHaveBeenCalled();
      expect(mockMigrate).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("uses framework alias flags for runtime setup", async () => {
    mockReadJsonFile.mockResolvedValue({
      dependencies: { react: "^19.2.0", "react-dom": "^19.2.0" },
      devDependencies: { vite: "^8.2.0" },
    });
    await init(true, { defaults: true, packageManager: "pnpm", react: true });

    expect(mockUpdateConfig).toHaveBeenLastCalledWith(
      expect.objectContaining({
        framework: "react",
      }),
      { appendComponents: false },
    );
    expect(mockInstallDependencies.mock.calls).toEqual([
      [[CURRENT_REACT_SPEC], "pnpm"],
      [REACT_SETUP_REQUIREMENTS, "pnpm", false, false],
    ]);

    vi.clearAllMocks();
    mockDefaultProject();

    await init(true, { astro: true, defaults: true, packageManager: "pnpm" });

    expect(mockUpdateConfig).toHaveBeenLastCalledWith(
      expect.objectContaining({
        framework: "astro",
      }),
      { appendComponents: false },
    );
    expect(mockInstallDependencies.mock.calls).toEqual([
      [[CURRENT_ASTRO_SPEC], "pnpm"],
      [ASTRO_SETUP_REQUIREMENTS, "pnpm", false, false],
    ]);
  });

  it("recommends migrate for legacy configs before writing runtime setup", async () => {
    mockFileExists.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({
      status: "legacy",
      config: {
        $schema: "https://starwind.dev/config-schema.json",
        tailwind: {
          css: PATHS.LOCAL_CSS_FILE,
          baseColor: "neutral",
          cssVariables: true,
        },
        componentDir: PATHS.LOCAL_COMPONENTS_DIR,
        utilsDir: PATHS.LOCAL_UTILS_DIR,
        components: [{ name: "button", version: "2.3.1" }],
      },
    });

    await init(true, { defaults: true, framework: "astro", packageManager: "pnpm" });

    expect(clackPrompts.log.warn).toHaveBeenCalledWith(expect.stringContaining("starwind migrate"));
    expect(mockMigrate).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
  });

  it("prompts to migrate legacy configs and continues into Pro setup", async () => {
    mockFileExists.mockResolvedValue(true);
    mockConfirm.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({
      status: "legacy",
      config: {
        $schema: "https://starwind.dev/config-schema.json",
        tailwind: {
          css: PATHS.LOCAL_CSS_FILE,
          baseColor: "neutral",
          cssVariables: true,
        },
        componentDir: PATHS.LOCAL_COMPONENTS_DIR,
        utilsDir: PATHS.LOCAL_UTILS_DIR,
        components: [{ name: "button", version: "2.3.1" }],
      },
    });

    await init(false, { packageManager: "pnpm", pro: true });

    expect(mockConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("run `starwind migrate` now"),
        initialValue: true,
      }),
    );
    expect(mockMigrate).toHaveBeenCalledWith({
      packageManager: "pnpm",
      withinInit: true,
    });
    expect(mockSetupStarwindProConfig).toHaveBeenCalled();
    expect(mockSetupStarwindProEnv).toHaveBeenCalled();
    expect(clackPrompts.note).toHaveBeenCalledWith(
      expect.stringContaining("Starwind Pro is now configured"),
      "Next steps",
    );
    const nextStepsMessage = String(vi.mocked(clackPrompts.note).mock.calls[0]?.[0]);
    expect(nextStepsMessage).toContain("starwind add @starwind-pro/component-name");
    expect(nextStepsMessage).toContain(".env.local");
    expect(nextStepsMessage).toContain("STARWIND_LICENSE_KEY");
  });

  it("keeps legacy configs unchanged when migration is declined", async () => {
    mockFileExists.mockResolvedValue(true);
    mockConfirm.mockResolvedValue(false);
    mockGetConfigState.mockResolvedValue({
      status: "legacy",
      config: {
        $schema: "https://starwind.dev/config-schema.json",
        tailwind: {
          css: PATHS.LOCAL_CSS_FILE,
          baseColor: "neutral",
          cssVariables: true,
        },
        componentDir: PATHS.LOCAL_COMPONENTS_DIR,
        utilsDir: PATHS.LOCAL_UTILS_DIR,
        components: [{ name: "button", version: "2.3.1" }],
      },
    });

    await init(false, { packageManager: "pnpm", pro: true });

    expect(mockMigrate).not.toHaveBeenCalled();
    expect(mockSetupStarwindProConfig).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("returns without changes when a v2 config is already present", async () => {
    mockFileExists.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: createCurrentConfig("react"),
    });

    await init(true, { defaults: true, framework: "react", packageManager: "pnpm" });

    expect(clackPrompts.log.info).toHaveBeenCalledWith(
      expect.stringContaining("already configured"),
    );
    expect(mockUpdateConfig).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
  });

  it("configures Pro when a v2 config is already present and --pro is used", async () => {
    mockFileExists.mockResolvedValue(true);
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: createCurrentConfig("react"),
    });

    await init(false, { packageManager: "pnpm", pro: true });

    expect(clackPrompts.log.info).toHaveBeenCalledWith(
      expect.stringContaining("already configured"),
    );
    expect(mockSetupStarwindProConfig).toHaveBeenCalled();
    expect(mockSetupStarwindProEnv).toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
  });

  it("configures Pro auth when an existing v2 config has only a partial Pro registry", async () => {
    mockFileExists.mockResolvedValue(true);
    mockCheckStarwindProEnv.mockResolvedValue(true);
    mockHasStarwindProAuthConfig.mockReturnValue(false);
    mockGetConfigState.mockResolvedValue({
      status: "current",
      config: {
        ...createCurrentConfig("react"),
        pro: {
          registry: {
            url: "http://localhost:4321/r/{name}",
            headers: {},
          },
        },
      },
    });

    await init(false, { packageManager: "pnpm", pro: true });

    expect(mockSetupStarwindProConfig).toHaveBeenCalled();
    expect(mockSetupStarwindProEnv).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
  });

  it("owns standalone completion through the final delay and outro", async () => {
    let resolveFinalDelay!: () => void;
    const finalDelay = new Promise<void>((resolve) => {
      resolveFinalDelay = resolve;
    });
    vi.mocked(sleepUtils.sleep).mockImplementation((milliseconds) =>
      milliseconds === 1000 ? finalDelay : Promise.resolve(),
    );
    let completed = false;

    const initPromise = init(false, {
      defaults: true,
      framework: "astro",
      packageManager: "pnpm",
    }).then(() => {
      completed = true;
    });

    await vi.waitFor(() => expect(sleepUtils.sleep).toHaveBeenCalledWith(1000));
    expect(completed).toBe(false);
    expect(clackPrompts.outro).not.toHaveBeenCalled();

    resolveFinalDelay();
    await initPromise;

    expect(clackPrompts.intro).toHaveBeenCalledTimes(1);
    expect(clackPrompts.outro).toHaveBeenCalledTimes(1);
  });

  it("initializes Quasar SSR through the common private host seam", async () => {
    const { hostPlan, setup, setupTypeScript, validate } = createQuasarHostPlan();
    mockReadJsonFile.mockResolvedValue({
      dependencies: { quasar: "^2.18.0", vue: "^3.5.13" },
      devDependencies: { "@quasar/app-vite": "^3.0.0" },
    });

    await init(
      true,
      { defaults: true, framework: "vue", packageManager: "pnpm" },
      {
        hostPlan,
        registry: vueRegistry,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );

    expect(validate).toHaveBeenCalledOnce();
    expect(setup).toHaveBeenCalledWith("src/css/starwind.css");
    expect(setupTypeScript).toHaveBeenCalledOnce();
    expect(mockSetupTsConfig).not.toHaveBeenCalled();
    expect(mockSetupVueTsConfig).not.toHaveBeenCalled();
    expect(mockEnsureDirectory).toHaveBeenCalledWith("src/components/starwind");
    expect(mockWriteCssFile).toHaveBeenCalledWith("src/css/starwind.css", expect.any(String));
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        componentDir: "src/components/starwind",
        framework: "vue",
        tailwind: expect.objectContaining({ css: "src/css/starwind.css" }),
        utilsDir: "src/lib/utils",
      }),
      {
        appendComponents: false,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );
  });

  it.each([
    ["failed preflight", { validationError: new Error("Unsupported Quasar config shape") }],
    ["cancelled preparation", { cancelled: true }],
  ] as const)(
    "stops Quasar initialization after %s before installs or writes",
    async (_case, options) => {
      const { hostPlan, setup } = createQuasarHostPlan(options);
      const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
        throw new Error("process.exit called");
      });

      try {
        const initialization = init(
          true,
          { defaults: true, framework: "vue", packageManager: "pnpm" },
          {
            hostPlan,
            registry: vueRegistry,
            targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
          },
        );
        if ("validationError" in options) {
          await expect(initialization).rejects.toThrow("process.exit called");
        } else {
          await initialization;
        }
        expect(setup).not.toHaveBeenCalled();
        expect(mockInstallDependencies).not.toHaveBeenCalled();
        expect(mockEnsureDirectory).not.toHaveBeenCalled();
        expect(mockWriteCssFile).not.toHaveBeenCalled();
        expect(mockUpdateConfig).not.toHaveBeenCalled();
      } finally {
        exitSpy.mockRestore();
      }
    },
  );

  it("initializes Laravel Inertia Vue through the common private host seam", async () => {
    const { hostPlan, setup, setupTypeScript, validate } = createLaravelHostPlan();
    const projectPackage = {
      dependencies: {
        "@inertiajs/vue3": "^3.0.0",
        tailwindcss: "^4.1",
        vue: "3.5.39",
      },
    };
    mockReadJsonFile.mockResolvedValue(projectPackage);
    mockGetVuePackageRequirements.mockReturnValue([
      "@tailwindcss/vite@^4",
      "tw-animate-css@^1",
      "@tailwindcss/forms@^0.5",
    ]);

    await init(
      true,
      { defaults: true, framework: "vue", packageManager: "pnpm" },
      {
        hostPlan,
        registry: vueRegistry,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );

    expect(validate).toHaveBeenCalledOnce();
    expect(setup).toHaveBeenCalledWith("resources/css/starwind.css");
    expect(setupTypeScript).toHaveBeenCalledOnce();
    expect(mockSetupTsConfig).not.toHaveBeenCalled();
    expect(mockSetupVueTsConfig).not.toHaveBeenCalled();
    expect(mockGetVuePackageRequirements).toHaveBeenCalledWith(["vue@>=3.5"]);
    expect(mockInstallDependencies).toHaveBeenCalledWith(
      ["@tailwindcss/vite@^4", "tw-animate-css@^1", "@tailwindcss/forms@^0.5"],
      "pnpm",
      false,
      false,
    );
    expect(mockEnsureDirectory).toHaveBeenCalledWith("resources/js/components/starwind");
    expect(mockWriteCssFile).toHaveBeenCalledWith(
      "resources/css/starwind.css",
      expect.not.stringContaining('@import "tailwindcss"'),
    );
    expect(mockWriteCssFile).toHaveBeenCalledWith(
      "resources/css/starwind.css",
      expect.stringContaining('@plugin "@tailwindcss/forms"'),
    );
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        componentDir: "resources/js/components/starwind",
        framework: "vue",
        tailwind: expect.objectContaining({ css: "resources/css/starwind.css" }),
        utilsDir: "resources/js/lib/utils",
      }),
      {
        appendComponents: false,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );
  });

  it("stops Laravel initialization when host preflight fails", async () => {
    const { hostPlan, setup } = createLaravelHostPlan({
      validationError: new Error("Unsupported Laravel starter shape"),
    });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(
        init(
          true,
          { defaults: true, framework: "vue", packageManager: "pnpm" },
          {
            hostPlan,
            registry: vueRegistry,
            targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
          },
        ),
      ).rejects.toThrow("process.exit called");
      expect(setup).not.toHaveBeenCalled();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockEnsureDirectory).not.toHaveBeenCalled();
      expect(mockWriteCssFile).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });

  it("stops Laravel initialization when common host preparation is cancelled", async () => {
    const { hostPlan, setup } = createLaravelHostPlan({ cancelled: true });

    await init(
      true,
      { defaults: true, framework: "vue", packageManager: "pnpm" },
      {
        hostPlan,
        registry: vueRegistry,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );

    expect(setup).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockEnsureDirectory).not.toHaveBeenCalled();
    expect(mockWriteCssFile).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });

  it("initializes Nuxt through the common private Vue host seam", async () => {
    const validate = vi.fn().mockResolvedValue(undefined);
    const setup = vi.fn().mockResolvedValue(undefined);
    const setupTypeScript = vi.fn().mockResolvedValue(true);
    const nuxtPlan = {
      host: { kind: "nuxt" as const, label: "Nuxt 4" },
      targets: [{ framework: "vue" as const, readiness: "ready" as const }],
      vueHostProject: {
        componentDir: "app/components/starwind",
        cssFile: "app/assets/css/starwind.css",
        hostKind: "nuxt" as const,
        hostLabel: "Nuxt 4",
        isSecondaryTarget: false as const,
        lockCssFile: true as const,
        prepare: async () => ({ status: "prepared" as const }),
        prepareStylesheet: (content: string) => content,
        projectFramework: "vue" as const,
        requirements: (requirements: string[]) => mockGetVuePackageRequirements(requirements),
        setup,
        setupLabel: "Setup Nuxt project",
        setupResult: "Nuxt project setup completed",
        setupTypeScript,
        utilsDir: "app/lib/utils",
        validate,
        vueUpgradeRequired: false,
      },
    };
    mockReadJsonFile.mockResolvedValue({
      dependencies: { nuxt: "^4.2.0", vue: "^3.5.0" },
    });

    await init(
      true,
      { defaults: true, framework: "vue", packageManager: "pnpm" },
      {
        hostPlan: nuxtPlan,
        registry: vueRegistry,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );

    expect(validate).toHaveBeenCalledOnce();
    expect(setup).toHaveBeenCalledWith("app/assets/css/starwind.css");
    expect(setupTypeScript).toHaveBeenCalledOnce();
    expect(mockSetupTsConfig).not.toHaveBeenCalled();
    expect(mockSetupVueTsConfig).not.toHaveBeenCalled();
    expect(mockWriteCssFile).toHaveBeenCalledWith(
      "app/assets/css/starwind.css",
      expect.any(String),
    );
    expect(mockUpdateConfig).toHaveBeenCalledWith(
      expect.objectContaining({
        componentDir: "app/components/starwind",
        framework: "vue",
        utilsDir: "app/lib/utils",
      }),
      {
        appendComponents: false,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );
  });

  it("uses Nuxt plan destinations as accepted interactive prompt defaults", async () => {
    const setup = vi.fn().mockResolvedValue(undefined);
    const nuxtPlan = {
      host: { kind: "nuxt" as const, label: "Nuxt 4" },
      targets: [{ framework: "vue" as const, readiness: "ready" as const }],
      vueHostProject: {
        componentDir: "app/components/starwind",
        cssFile: "app/assets/css/starwind.css",
        hostKind: "nuxt" as const,
        hostLabel: "Nuxt 4",
        isSecondaryTarget: false as const,
        lockCssFile: true as const,
        prepare: async () => ({ status: "prepared" as const }),
        prepareStylesheet: (content: string) => content,
        projectFramework: "vue" as const,
        requirements: (requirements: string[]) => mockGetVuePackageRequirements(requirements),
        setup,
        setupLabel: "Setup Nuxt project",
        setupResult: "Nuxt project setup completed",
        setupTypeScript: async () => true,
        utilsDir: "app/lib/utils",
        validate: async () => {},
        vueUpgradeRequired: false,
      },
    };
    mockReadJsonFile.mockResolvedValue({
      dependencies: { nuxt: "^4.2.0", vue: "^3.5.0" },
    });
    mockGroup.mockImplementation(async (prompts) => {
      const answers: Record<string, unknown> = {};
      for (const [key, prompt] of Object.entries(prompts)) {
        answers[key] = await (prompt as () => unknown | Promise<unknown>)();
      }
      return answers;
    });
    mockText.mockImplementation(async (options) => options.initialValue ?? "");
    mockSelect.mockImplementation(async (options) => options.initialValue ?? "neutral");
    mockConfirm.mockResolvedValue(true);

    await init(
      true,
      { framework: "vue", packageManager: "pnpm" },
      {
        hostPlan: nuxtPlan,
        registry: vueRegistry,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );

    expect(mockText).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        initialValue: "app/components/starwind",
        placeholder: "app/components/starwind",
      }),
    );
    expect(mockText).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        initialValue: "app/assets/css/starwind.css",
        placeholder: "app/assets/css/starwind.css",
      }),
    );
    expect(setup).toHaveBeenCalledWith("app/assets/css/starwind.css");
    expect(mockEnsureDirectory).toHaveBeenCalledWith("app/components/starwind");
    expect(mockWriteCssFile).toHaveBeenCalledWith(
      "app/assets/css/starwind.css",
      expect.any(String),
    );
  });

  it("stops Nuxt initialization when common host preparation is cancelled", async () => {
    const setup = vi.fn();
    const nuxtPlan = {
      host: { kind: "nuxt" as const, label: "Nuxt 4" },
      targets: [{ framework: "vue" as const, readiness: "ready" as const }],
      vueHostProject: {
        componentDir: "app/components/starwind",
        cssFile: "app/assets/css/starwind.css",
        hostKind: "nuxt" as const,
        hostLabel: "Nuxt 4",
        isSecondaryTarget: false as const,
        lockCssFile: true as const,
        prepare: async () => ({ status: "cancelled" as const }),
        prepareStylesheet: (content: string) => content,
        projectFramework: "vue" as const,
        requirements: (requirements: string[]) => requirements,
        setup,
        setupLabel: "Setup Nuxt project",
        setupResult: "Nuxt project setup completed",
        setupTypeScript: async () => true,
        utilsDir: "app/lib/utils",
        validate: async () => {},
        vueUpgradeRequired: false,
      },
    };

    await init(
      true,
      { defaults: true, framework: "vue", packageManager: "pnpm" },
      {
        hostPlan: nuxtPlan,
        registry: vueRegistry,
        targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
      },
    );

    expect(setup).not.toHaveBeenCalled();
    expect(mockInstallDependencies).not.toHaveBeenCalled();
    expect(mockEnsureDirectory).not.toHaveBeenCalled();
    expect(mockWriteCssFile).not.toHaveBeenCalled();
    expect(mockUpdateConfig).not.toHaveBeenCalled();
  });
  it("rejects a custom Nuxt CSS destination before installs or writes", async () => {
    const setup = vi.fn();
    const nuxtPlan = {
      host: { kind: "nuxt" as const, label: "Nuxt 4" },
      targets: [{ framework: "vue" as const, readiness: "ready" as const }],
      vueHostProject: {
        componentDir: "app/components/starwind",
        cssFile: "app/assets/css/starwind.css",
        hostKind: "nuxt" as const,
        hostLabel: "Nuxt 4",
        isSecondaryTarget: false as const,
        lockCssFile: true as const,
        prepare: async () => ({ status: "prepared" as const }),
        prepareStylesheet: (content: string) => content,
        projectFramework: "vue" as const,
        requirements: (requirements: string[]) => requirements,
        setup,
        setupLabel: "Setup Nuxt project",
        setupResult: "Nuxt project setup completed",
        setupTypeScript: async () => true,
        utilsDir: "app/lib/utils",
        validate: async () => {},
        vueUpgradeRequired: false,
      },
    };
    mockReadJsonFile.mockResolvedValue({
      dependencies: { nuxt: "^4.2.0", vue: "^3.5.0" },
    });
    mockGroup.mockResolvedValue({
      framework: "vue",
      componentDir: "app/components/starwind",
      cssFile: "styles/custom.css",
      twBaseColor: "neutral",
    });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    try {
      await expect(
        init(
          true,
          { framework: "vue", packageManager: "pnpm" },
          {
            hostPlan: nuxtPlan,
            registry: vueRegistry,
            targetPolicy: PRIVATE_VUE_FRAMEWORK_TARGET_POLICY,
          },
        ),
      ).rejects.toThrow("process.exit called");

      expect(clackPrompts.log.error).toHaveBeenCalledWith(
        expect.stringContaining("plan-owned stylesheet path app/assets/css/starwind.css"),
      );
      expect(setup).not.toHaveBeenCalled();
      expect(mockInstallDependencies).not.toHaveBeenCalled();
      expect(mockEnsureDirectory).not.toHaveBeenCalled();
      expect(mockSetupSnippets).not.toHaveBeenCalled();
      expect(mockWriteCssFile).not.toHaveBeenCalled();
      expect(mockUpdateConfig).not.toHaveBeenCalled();
    } finally {
      exitSpy.mockRestore();
    }
  });
});
