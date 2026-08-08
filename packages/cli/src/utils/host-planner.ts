import fs from "fs-extra";

import { inspectAstroReactConfig } from "./astro-config.js";
import type { StarwindFramework } from "./config.js";
import {
  detectReactProjectPaths,
  getReactProjectPlan,
  type ReactHostKind,
  type ReactProjectPlan,
} from "./react-project.js";

export type ProjectPackage = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

export type HostKind = "astro" | ReactHostKind | "unknown";
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
};

export type HostEvidence = {
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
  const existingPaths = new Set(await detectReactProjectPaths(reader.pathExists));
  const astroConfigPath = (
    await Promise.all(
      ASTRO_CONFIG_PATHS.map(async (configPath) =>
        (await reader.pathExists(configPath)) ? configPath : undefined,
      ),
    )
  ).find((configPath) => configPath !== undefined);

  let astroConfig: HostEvidence["astroConfig"];
  if (astroConfigPath) {
    existingPaths.add(astroConfigPath);
    astroConfig = {
      content: await reader.readFile(astroConfigPath),
      path: astroConfigPath,
    };
  }

  return getHostPlan(pkg, { astroConfig, existingPaths });
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

function unsupportedPlan(kind: HostKind, cause?: unknown): HostPlan<StarwindFramework> {
  const label = kind === "unknown" ? "Unknown" : getHostLabel(kind);
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
): HostKind {
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

function getHostLabel(kind: HostKind): string {
  return kind === "astro" ? "Astro" : kind === "unknown" ? "Unknown" : getReactHostLabel(kind);
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
