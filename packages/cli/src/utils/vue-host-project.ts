import { setupAstroConfig } from "./astro-config.js";
import {
  applyAstroVueIntegration,
  inspectAstroVueConfig,
  prepareAstroVueIntegration,
} from "./astro-vue-integration.js";
import { setupLayoutCssImport } from "./layout.js";
import {
  getLaravelInertiaVueProjectPlan,
  hasLaravelInertiaVueProjectEvidence,
  LARAVEL_INERTIA_VUE_CANDIDATE_PATHS,
  projectLaravelStarwindStylesheet,
  setupLaravelInertiaVueProject,
  validateLaravelInertiaVueProjectSetup,
} from "./laravel-inertia-vue-project.js";
import {
  getNuxtProjectPlan,
  NUXT_PROJECT_CANDIDATE_PATHS,
  setupNuxtProject,
  validateNuxtProjectSetup,
} from "./nuxt-project.js";
import type { PackageManager } from "./package-manager.js";
import {
  getQuasarProjectPlan,
  hasQuasarProjectEvidence,
  QUASAR_PROJECT_CANDIDATE_PATHS,
  setupQuasarProject,
  validateQuasarProjectSetup,
} from "./quasar-project.js";
import { setupTsConfig, setupVueTsConfig } from "./tsconfig.js";
import {
  createVuePackageRequirementPlanner,
  getVueProjectPlan,
  meetsVueVersionFloor,
  setupVueProject,
  validateVueProjectSetup,
  VUE_PROJECT_CANDIDATE_PATHS,
} from "./vue-project.js";

export type VueHostProjectPackage = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export type VueHostProjectEvidence = {
  projectFiles?: Readonly<Record<string, string>>;
  astroConfig?: {
    content: string;
    path: string;
  };
  existingPaths: ReadonlySet<string>;
};

export type VueHostEvidenceRequest = Readonly<{
  path: string;
  readContent: boolean;
}>;

export type VueHostProjectPreparation =
  | Readonly<{ status: "cancelled" | "declined" }>
  | (Readonly<{ status: "prepared" }> &
      (
        | Readonly<{
            applyIntegration: () => Promise<void>;
            integrationLabel: string;
            integrationResult: string;
          }>
        | Readonly<{
            applyIntegration?: undefined;
            integrationLabel?: undefined;
            integrationResult?: undefined;
          }>
      ));

type VueHostProjectPlanBase = {
  componentDir: string;
  cssFile: string;
  hostLabel: string;
  prepare: (options: {
    packageManager: PackageManager;
    projectPackage: VueHostProjectPackage;
    skipPrompts?: boolean;
  }) => Promise<VueHostProjectPreparation>;
  prepareStylesheet: (content: string) => string;
  requirements: (requirements: string[]) => string[];
  lockCssFile?: true;
  setup: (cssFile: string) => Promise<void>;
  setupLabel: string;
  setupResult: string;
  setupTypeScript: () => Promise<boolean>;
  utilsDir: string;
  validate: () => Promise<void>;
  vueUpgradeRequired: boolean;
};

type VueHostProjectIdentity =
  | Readonly<{
      hostKind: "laravel";
      isSecondaryTarget: false;
      projectFramework: "vue";
    }>
  | Readonly<{
      hostKind: "astro";
      isSecondaryTarget: true;
      projectFramework: "astro";
    }>
  | Readonly<{
      hostKind: "nuxt";
      isSecondaryTarget: false;
      projectFramework: "vue";
    }>
  | Readonly<{
      hostKind: "quasar";
      isSecondaryTarget: false;
      projectFramework: "vue";
    }>
  | Readonly<{
      hostKind: "vite";
      isSecondaryTarget: false;
      projectFramework: "vue";
    }>;

type VueHostCssSetup =
  | Readonly<{
      setupCss: (cssFile: string) => Promise<boolean>;
      setupCssLabel: string;
      setupCssResult: string;
    }>
  | Readonly<{
      setupCss?: undefined;
      setupCssLabel?: undefined;
      setupCssResult?: undefined;
    }>;

export type VueHostProjectPlan = Readonly<
  VueHostProjectPlanBase & VueHostProjectIdentity & VueHostCssSetup
>;

export type VueHostProjectDetection =
  | Readonly<{
      plan: VueHostProjectPlan;
      readiness: "configurable" | "ready";
      status: "detected";
    }>
  | Readonly<{
      diagnostic: string;
      host: Readonly<{ kind: "laravel" | "nuxt" | "quasar" | "vite"; label: string }>;
      status: "failed";
    }>;

type VueHostAdapter = Readonly<{
  evidence: readonly VueHostEvidenceRequest[];
  detect: (
    pkg: VueHostProjectPackage,
    evidence: VueHostProjectEvidence,
    hostKind: string,
  ) => VueHostProjectDetection | undefined;
}>;

const astroVueHostAdapter: VueHostAdapter = Object.freeze({
  evidence: evidenceRequests(
    ["astro.config.ts", "astro.config.js", "astro.config.mjs", "astro.config.cjs"],
    true,
  ),
  detect(pkg, evidence, hostKind) {
    if (hostKind !== "astro") return undefined;

    const dependencies = getDependencies(pkg);
    const hasSupportedVue = Boolean(dependencies.vue && meetsVueVersionFloor(dependencies.vue));
    const hasConfiguredVue =
      Boolean(dependencies["@astrojs/vue"]) &&
      hasSupportedVue &&
      evidence.astroConfig?.content !== undefined &&
      inspectAstroVueConfig(evidence.astroConfig.content).status === "ready";

    return {
      plan: createAstroVueHostProjectPlan(
        !hasSupportedVue,
        createVuePackageRequirementPlanner(pkg),
      ),
      readiness: hasConfiguredVue ? "ready" : "configurable",
      status: "detected",
    };
  },
});

const viteVueHostAdapter: VueHostAdapter = Object.freeze({
  evidence: evidenceRequests(VUE_PROJECT_CANDIDATE_PATHS),
  detect(pkg, evidence, hostKind) {
    const dependencies = getDependencies(pkg);
    if (hostKind === "astro" || !dependencies.vue) return undefined;

    const packageRequirements = createVuePackageRequirementPlanner(pkg);
    let vitePlan;
    try {
      vitePlan = getVueProjectPlan(pkg, evidence.existingPaths);
    } catch (error) {
      return failedDetection("vite", "Vite", error);
    }
    return {
      plan: Object.freeze({
        componentDir: vitePlan.componentDir,
        cssFile: vitePlan.cssFile,
        hostKind: "vite",
        hostLabel: "Vite",
        isSecondaryTarget: false,
        prepare: async () => Object.freeze({ status: "prepared" as const }),
        prepareStylesheet: (content) => content,
        projectFramework: "vue",
        requirements: (requirements) =>
          getHostPackageRequirements(
            requirements,
            vitePlan.vueUpgradeRequired,
            packageRequirements,
          ),
        setup: async (cssFile) => setupVueProject(vitePlan, cssFile),
        setupLabel: "Setup Vite Vue project",
        setupResult: "Vue project setup completed",
        setupTypeScript: async () => setupVueTsConfig(/\.js$/.test(vitePlan.cssEntry)),
        utilsDir: vitePlan.utilsDir,
        validate: async () => validateVueProjectSetup(vitePlan),
        vueUpgradeRequired: vitePlan.vueUpgradeRequired,
      }),
      readiness: vitePlan.vueUpgradeRequired ? "configurable" : "ready",
      status: "detected",
    };
  },
});

const laravelInertiaVueHostAdapter: VueHostAdapter = Object.freeze({
  evidence: evidenceRequests(LARAVEL_INERTIA_VUE_CANDIDATE_PATHS, (path) => path !== "artisan"),
  detect(pkg, evidence, hostKind) {
    if (hostKind === "astro") return undefined;
    if (!hasLaravelInertiaVueProjectEvidence(pkg, evidence)) return undefined;
    const packageRequirements = createVuePackageRequirementPlanner(pkg);
    let laravelPlan;
    try {
      laravelPlan = getLaravelInertiaVueProjectPlan(pkg, evidence);
    } catch (error) {
      return failedDetection("laravel", "Laravel", error);
    }
    if (!laravelPlan) return undefined;
    return {
      plan: Object.freeze({
        componentDir: laravelPlan.componentDir,
        cssFile: laravelPlan.cssFile,
        hostKind: "laravel",
        hostLabel: "Laravel with Inertia Vue",
        isSecondaryTarget: false,
        lockCssFile: true,
        prepare: async () => Object.freeze({ status: "prepared" as const }),
        prepareStylesheet: projectLaravelStarwindStylesheet,
        projectFramework: "vue",
        requirements: (requirements) =>
          getHostPackageRequirements(
            requirements,
            laravelPlan.vueUpgradeRequired,
            packageRequirements,
          ),
        setup: async (cssFile) => setupLaravelInertiaVueProject(laravelPlan, cssFile),
        setupLabel: "Setup Laravel Inertia Vue project",
        setupResult: "Laravel Inertia Vue project setup completed",
        setupTypeScript: async () => true,
        utilsDir: laravelPlan.utilsDir,
        validate: async () => validateLaravelInertiaVueProjectSetup(laravelPlan),
        vueUpgradeRequired: laravelPlan.vueUpgradeRequired,
      }),
      readiness: laravelPlan.vueUpgradeRequired ? "configurable" : "ready",
      status: "detected",
    };
  },
});

const nuxtVueHostAdapter: VueHostAdapter = Object.freeze({
  evidence: evidenceRequests(NUXT_PROJECT_CANDIDATE_PATHS),
  detect(pkg, evidence, hostKind) {
    if (hostKind === "astro") return undefined;
    if (!getDependencies(pkg).nuxt) return undefined;
    const packageRequirements = createVuePackageRequirementPlanner(pkg);
    let nuxtPlan;
    try {
      nuxtPlan = getNuxtProjectPlan(pkg, evidence.existingPaths);
    } catch (error) {
      return failedDetection("nuxt", "Nuxt", error);
    }
    if (!nuxtPlan) return undefined;
    return {
      plan: Object.freeze({
        componentDir: nuxtPlan.componentDir,
        cssFile: nuxtPlan.cssFile,
        hostKind: "nuxt",
        hostLabel: "Nuxt " + nuxtPlan.nuxtMajor,
        isSecondaryTarget: false,
        lockCssFile: true,
        prepare: async () => Object.freeze({ status: "prepared" as const }),
        prepareStylesheet: (content) => content,
        projectFramework: "vue",
        requirements: (requirements) =>
          getHostPackageRequirements(
            requirements,
            nuxtPlan.vueUpgradeRequired,
            packageRequirements,
          ),
        setup: async (cssFile) => setupNuxtProject(nuxtPlan, cssFile),
        setupLabel: "Setup Nuxt project",
        setupResult: "Nuxt project setup completed",
        setupTypeScript: async () => true,
        utilsDir: nuxtPlan.utilsDir,
        validate: async () => validateNuxtProjectSetup(nuxtPlan),
        vueUpgradeRequired: nuxtPlan.vueUpgradeRequired,
      }),
      readiness: nuxtPlan.vueUpgradeRequired ? "configurable" : "ready",
      status: "detected",
    };
  },
});

const quasarVueHostAdapter: VueHostAdapter = Object.freeze({
  evidence: evidenceRequests(QUASAR_PROJECT_CANDIDATE_PATHS, (path) =>
    path.startsWith("quasar.config."),
  ),
  detect(pkg, evidence, hostKind) {
    if (hostKind === "astro") return undefined;
    if (!hasQuasarProjectEvidence(pkg, evidence)) return undefined;
    const packageRequirements = createVuePackageRequirementPlanner(pkg);
    let quasarPlan;
    try {
      quasarPlan = getQuasarProjectPlan(pkg, evidence);
    } catch (error) {
      return failedDetection("quasar", "Quasar", error);
    }
    if (!quasarPlan) return undefined;
    return {
      plan: Object.freeze({
        componentDir: quasarPlan.componentDir,
        cssFile: quasarPlan.cssFile,
        hostKind: "quasar",
        hostLabel: `Quasar ${quasarPlan.mode.toUpperCase()}`,
        isSecondaryTarget: false,
        lockCssFile: true,
        prepare: async () => Object.freeze({ status: "prepared" as const }),
        prepareStylesheet: (content) => content,
        projectFramework: "vue",
        requirements: (requirements) =>
          getHostPackageRequirements(
            requirements,
            quasarPlan.vueUpgradeRequired,
            packageRequirements,
          ),
        setup: async (cssFile) => setupQuasarProject(quasarPlan, cssFile),
        setupLabel: "Setup Quasar project",
        setupResult: "Quasar project setup completed",
        setupTypeScript: async () => true,
        utilsDir: quasarPlan.utilsDir,
        validate: async () => validateQuasarProjectSetup(quasarPlan),
        vueUpgradeRequired: quasarPlan.vueUpgradeRequired,
      }),
      readiness: quasarPlan.vueUpgradeRequired ? "configurable" : "ready",
      status: "detected",
    };
  },
});
const PRIVATE_VUE_HOST_ADAPTERS = Object.freeze([
  astroVueHostAdapter,
  laravelInertiaVueHostAdapter,
  nuxtVueHostAdapter,
  quasarVueHostAdapter,
  viteVueHostAdapter,
] as const);

const PRIVATE_VUE_HOST_EVIDENCE_REQUESTS = Object.freeze(
  Array.from(
    [...PRIVATE_VUE_HOST_ADAPTERS]
      .flatMap((adapter) => adapter.evidence)
      .reduce<Map<string, VueHostEvidenceRequest>>((requests, request) => {
        const previous = requests.get(request.path);
        if (!previous || (!previous.readContent && request.readContent)) {
          requests.set(request.path, request);
        }
        return requests;
      }, new Map())
      .values(),
  ),
);

export function getPrivateVueHostEvidenceRequests(): readonly VueHostEvidenceRequest[] {
  return PRIVATE_VUE_HOST_EVIDENCE_REQUESTS;
}

export function detectVueHostProject(
  pkg: VueHostProjectPackage,
  evidence: VueHostProjectEvidence,
  hostKind: string,
): VueHostProjectDetection | undefined {
  for (const adapter of PRIVATE_VUE_HOST_ADAPTERS) {
    const detection = adapter.detect(pkg, evidence, hostKind);
    if (detection) return detection;
  }
  return undefined;
}

function createAstroVueHostProjectPlan(
  vueUpgradeRequired: boolean,
  packageRequirements: (requirements: string[]) => string[],
): VueHostProjectPlan {
  return Object.freeze({
    componentDir: "src/components/starwind-vue",
    cssFile: "src/styles/starwind.css",
    hostKind: "astro",
    hostLabel: "Astro",
    isSecondaryTarget: true,
    prepare: async ({ packageManager, projectPackage, skipPrompts }) => {
      const preparation = await prepareAstroVueIntegration({
        packageManager,
        projectPackage,
        skipPrompts,
      });
      if (preparation.status === "cancelled" || preparation.status === "declined") {
        return Object.freeze({ status: preparation.status });
      }
      if (preparation.status === "ready") {
        return Object.freeze({ status: "prepared" as const });
      }
      return Object.freeze({
        applyIntegration: async () => {
          await applyAstroVueIntegration(preparation, packageManager);
        },
        integrationLabel: "Setup Astro Vue integration",
        integrationResult: "Astro Vue integration configured",
        status: "prepared" as const,
      });
    },
    prepareStylesheet: (content) => content,
    projectFramework: "astro",
    requirements: (requirements) =>
      getHostPackageRequirements(requirements, vueUpgradeRequired, packageRequirements),
    setup: async () => {
      const success = await setupAstroConfig();
      if (!success) throw new Error("Failed to setup Astro config");
    },
    setupCss: setupLayoutCssImport,
    setupCssLabel: "Adding CSS import to layout",
    setupCssResult: "CSS import added to layout",
    setupLabel: "Setup Astro config file",
    setupResult: "Astro config setup completed",
    setupTypeScript: async () => setupTsConfig("astro"),
    utilsDir: "src/lib/utils",
    validate: async () => {},
    vueUpgradeRequired,
  });
}

function getHostPackageRequirements(
  requirements: string[],
  vueUpgradeRequired: boolean,
  packageRequirements: (requirements: string[]) => string[],
): string[] {
  const next = packageRequirements(requirements);
  if (
    vueUpgradeRequired &&
    !next.some(
      (requirement) =>
        requirement.startsWith("vue@") && meetsVueVersionFloor(requirement.slice("vue@".length)),
    )
  ) {
    throw new Error("The private Vue registry must require Vue 3.5 or later.");
  }
  return next;
}

function getDependencies(pkg: VueHostProjectPackage): Record<string, string> {
  return {
    ...pkg.peerDependencies,
    ...pkg.optionalDependencies,
    ...pkg.devDependencies,
    ...pkg.dependencies,
  };
}

function evidenceRequests(
  paths: readonly string[],
  readContent: boolean | ((path: string) => boolean) = false,
): readonly VueHostEvidenceRequest[] {
  return Object.freeze(
    paths.map((path) =>
      Object.freeze({
        path,
        readContent: typeof readContent === "function" ? readContent(path) : readContent,
      }),
    ),
  );
}

function failedDetection(
  kind: "laravel" | "nuxt" | "quasar" | "vite",
  label: string,
  error: unknown,
): VueHostProjectDetection {
  return Object.freeze({
    diagnostic: error instanceof Error ? error.message : "Unable to identify a supported Vue host.",
    host: Object.freeze({ kind, label }),
    status: "failed" as const,
  });
}
