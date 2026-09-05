import fs from "fs-extra";

import { inspectAstroReactConfig } from "./astro-config.js";
import type { StarwindFramework } from "./config.js";
import {
  type FrameworkTargetPolicy,
  isConfigTarget,
  type PrivateVueCliFrameworkTarget,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "./framework-target-policy.js";
import {
  detectReactProjectPaths,
  getReactProjectPlan,
  type ReactHostKind,
  type ReactProjectPlan,
} from "./react-project.js";
import {
  detectVueHostProject,
  getPrivateVueHostEvidenceRequests,
  type VueHostProjectPlan,
} from "./vue-host-project.js";

export type ProjectPackage = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export type HostKind = "astro" | "laravel" | "nuxt" | "quasar" | ReactHostKind | "unknown";
export type HostTargetReadiness = "configurable" | "ready";

export type HostTarget<TFramework extends string = string> = {
  framework: TFramework;
  readiness: HostTargetReadiness;
};

export type HostPlan<TFramework extends string = string> = {
  diagnostic?: string;
  host: {
    kind: HostKind;
    label: string;
  };
  reactProject?: ReactProjectPlan;
  targets: HostTarget<TFramework>[];
  vueHostProject?: VueHostProjectPlan;
};

export type HostEvidence = {
  projectFiles?: Readonly<Record<string, string>>;
  astroConfig?: {
    content: string;
    path: string;
  };
  existingPaths: ReadonlySet<string>;
};

export const ASTRO_CONFIG_PATHS = [
  "astro.config.ts",
  "astro.config.js",
  "astro.config.mjs",
  "astro.config.cjs",
] as const;

type HostEvidenceReader = {
  pathExists: (filePath: string) => Promise<boolean>;
  readFile: (filePath: string) => Promise<string>;
};

const defaultEvidenceReader: HostEvidenceReader = {
  pathExists: async (filePath) => fs.pathExists(filePath),
  readFile: async (filePath) => fs.readFile(filePath, "utf8"),
};

export async function detectHostPlan(
  pkg: ProjectPackage,
  reader: HostEvidenceReader = defaultEvidenceReader,
): Promise<HostPlan<StarwindFramework>> {
  return detectPrivateVueHostPlan(pkg, PUBLIC_FRAMEWORK_TARGET_POLICY, reader);
}

export async function detectPrivateVueHostPlan(
  pkg: ProjectPackage,
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>,
  reader: HostEvidenceReader = defaultEvidenceReader,
): Promise<HostPlan<PrivateVueCliFrameworkTarget>> {
  if (!isConfigTarget(targetPolicy, "vue")) {
    throw new Error("Vue host planning requires a policy that admits Vue.");
  }
  const existingPaths = new Set(await detectReactProjectPaths(reader.pathExists));
  const projectFiles: Record<string, string> = {};
  await Promise.all(
    getPrivateVueHostEvidenceRequests().map(async ({ path, readContent }) => {
      if (!(await reader.pathExists(path))) return;
      existingPaths.add(path);
      if (readContent) projectFiles[path] = await reader.readFile(path);
    }),
  );
  const astroConfigPath = ASTRO_CONFIG_PATHS.find((path) => existingPaths.has(path));
  const astroConfig = astroConfigPath
    ? { content: projectFiles[astroConfigPath]!, path: astroConfigPath }
    : undefined;
  return getPrivateVueHostPlan(pkg, { astroConfig, existingPaths, projectFiles }, targetPolicy);
}

export function getHostPlan(
  pkg: ProjectPackage,
  evidence: HostEvidence,
): HostPlan<StarwindFramework> {
  const dependencies = getDependencies(pkg);
  const hasAstro = Boolean(dependencies.astro) || hasAstroConfig(evidence.existingPaths);

  if (hasAstro) {
    const hasConfiguredReact =
      Boolean(dependencies["@astrojs/react"]) &&
      Boolean(dependencies.react || dependencies["react-dom"]) &&
      evidence.astroConfig?.content !== undefined &&
      inspectAstroReactConfig(evidence.astroConfig.content).status === "ready";

    return {
      host: { kind: "astro", label: "Astro" },
      targets: [
        { framework: "astro", readiness: "ready" },
        { framework: "react", readiness: hasConfiguredReact ? "ready" : "configurable" },
      ],
    };
  }

  const hasReact = Boolean(dependencies.react || dependencies["react-dom"]);
  if (hasReact) {
    try {
      const reactProject = getReactProjectPlan(pkg, evidence.existingPaths);

      return {
        host: { kind: reactProject.kind, label: getReactHostLabel(reactProject.kind) },
        reactProject,
        targets: [{ framework: "react", readiness: "ready" }],
      };
    } catch (error) {
      return unsupportedPlan(getEvidenceHostKind(dependencies, evidence.existingPaths), error);
    }
  }

  return unsupportedPlan(getEvidenceHostKind(dependencies, evidence.existingPaths));
}

export function getPrivateVueHostPlan(
  pkg: ProjectPackage,
  evidence: HostEvidence,
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>,
): HostPlan<PrivateVueCliFrameworkTarget> {
  if (!isConfigTarget(targetPolicy, "vue")) {
    throw new Error("Vue host planning requires a policy that admits Vue.");
  }
  const publicPlan = getHostPlan(pkg, evidence);
  const vueDetection = detectVueHostProject(pkg, evidence, publicPlan.host.kind);
  if (vueDetection?.status === "failed") {
    if (
      vueDetection.host.kind === "vite" &&
      publicPlan.targets.some(
        (target) => target.framework === "react" && target.readiness === "ready",
      )
    ) {
      return publicPlan;
    }
    return {
      diagnostic: vueDetection.diagnostic,
      host: vueDetection.host,
      targets: [{ framework: "astro", readiness: "configurable" }],
    };
  }

  if (!vueDetection) return publicPlan;

  if (publicPlan.host.kind === "astro") {
    return {
      ...publicPlan,
      targets: [...publicPlan.targets, { framework: "vue", readiness: vueDetection.readiness }],
      vueHostProject: vueDetection.plan,
    };
  }

  return {
    host: { kind: vueDetection.plan.hostKind, label: vueDetection.plan.hostLabel },
    targets: [{ framework: "vue", readiness: vueDetection.readiness }],
    vueHostProject: vueDetection.plan,
  };
}

export function validatePrivateHostTarget(
  plan: HostPlan<PrivateVueCliFrameworkTarget>,
  framework: PrivateVueCliFrameworkTarget,
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>,
): PrivateVueCliFrameworkTarget {
  if (
    isConfigTarget(targetPolicy, framework) &&
    plan.targets.some((target) => target.framework === framework)
  ) {
    return framework;
  }
  throw new Error(
    `${targetPolicy.labels[framework]} is not available for the detected ${plan.host.label} host. ${plan.diagnostic ?? "Choose one of the detected Starwind targets."}`,
  );
}

export function formatPrivateDetectedHost(
  plan: HostPlan<PrivateVueCliFrameworkTarget>,
  framework: PrivateVueCliFrameworkTarget,
  targetPolicy: FrameworkTargetPolicy<PrivateVueCliFrameworkTarget>,
): string {
  const target = targetPolicy.labels[framework];
  return plan.host.kind === framework
    ? `Detected ${target}`
    : `Detected ${target} (${plan.host.label})`;
}

export function validateHostTarget(
  plan: HostPlan<StarwindFramework>,
  framework: StarwindFramework,
): StarwindFramework {
  if (plan.targets.some((target) => target.framework === framework)) return framework;

  throw new Error(
    `${framework === "react" ? "React" : "Astro"} is not available for the detected ${plan.host.label} host. ${plan.diagnostic ?? "Choose one of the detected Starwind targets."}`,
  );
}

export function formatDetectedHost(
  plan: HostPlan<StarwindFramework>,
  framework: StarwindFramework,
): string {
  const target = framework === "react" ? "React" : "Astro";
  return plan.host.kind === framework
    ? `Detected ${target}`
    : `Detected ${target} (${plan.host.label})`;
}

function unsupportedPlan(
  kind: ReactHostKind | "unknown",
  cause?: unknown,
): HostPlan<StarwindFramework> {
  const label = kind === "unknown" ? "Unknown" : getReactHostLabel(kind);
  const causeMessage = cause instanceof Error ? ` ${cause.message}` : "";
  return {
    diagnostic: `No supported Starwind target was detected. Use --astro for an Astro project, or run Starwind in a supported React host: Vite React, Next.js, React Router, or TanStack Start with Vite.${causeMessage}`,
    host: { kind, label },
    targets: [{ framework: "astro", readiness: "configurable" }],
  };
}

function getDependencies(pkg: ProjectPackage): Record<string, string> {
  return {
    ...pkg.peerDependencies,
    ...pkg.optionalDependencies,
    ...pkg.devDependencies,
    ...pkg.dependencies,
  };
}

function hasAstroConfig(existingPaths: ReadonlySet<string>): boolean {
  return ASTRO_CONFIG_PATHS.some((configPath) => existingPaths.has(configPath));
}

function getEvidenceHostKind(
  dependencies: Record<string, string>,
  existingPaths: ReadonlySet<string>,
): ReactHostKind | "unknown" {
  if (dependencies.next) {
    return [...existingPaths].some((filePath) => /(?:^|\/)app\/layout\./.test(filePath))
      ? "next-app"
      : "next-pages";
  }
  if ([...existingPaths].some((filePath) => filePath.startsWith("react-router.config."))) {
    return "react-router";
  }
  if (dependencies["@tanstack/react-start"]) return "tanstack-start";
  if (
    dependencies.vite ||
    [...existingPaths].some((filePath) => filePath.startsWith("vite.config."))
  ) {
    return "vite";
  }
  return "unknown";
}

function getReactHostLabel(kind: ReactHostKind): string {
  switch (kind) {
    case "next-app":
      return "Next.js App Router";
    case "next-pages":
      return "Next.js Pages Router";
    case "react-router":
      return "React Router";
    case "tanstack-start":
      return "TanStack Start";
    case "vite":
      return "Vite";
  }
}
