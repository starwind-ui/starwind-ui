import * as p from "@clack/prompts";
import semver from "semver";

import { inspectAstroReactConfigFile, setupAstroReactConfig } from "./astro-config.js";
import {
  ASTRO_INTEGRATION_RANGES,
  defaultInstalledVersionReader,
  getMinimumVersion,
  type InstalledVersionReader,
  meetsIntegrationPolicyFloor,
  resolveAstroMajor,
  type SupportedAstroMajor,
} from "./astro-integration-version.js";
import { readJsonFile } from "./fs.js";
import { installDependencies, type PackageManager } from "./package-manager.js";
import { isAstroReactTsConfigReady, setupAstroReactTsConfig } from "./tsconfig.js";

type ProjectPackage = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
};

type AstroReactPackages = {
  development: string[];
  production: string[];
};

export type AstroReactPreflight =
  | { status: "ready"; packages: AstroReactPackages }
  | { status: "configurable"; packages: AstroReactPackages }
  | { status: "manual-action-required"; guidance: string };

export type AstroReactSetupOutcome = {
  status: "cancelled" | "configured" | "declined" | "ready";
};

type EnsureAstroReactIntegrationOptions = {
  packageManager?: PackageManager;
  readInstalledVersion?: InstalledVersionReader;
  skipPrompts?: boolean;
};

type AstroReactPreflightOptions = {
  readInstalledVersion?: InstalledVersionReader;
};

export type { InstalledVersionReader };

const REACT_18_DEFAULTS = {
  react: "^18.3.1",
  "react-dom": "^18.3.1",
  "@types/react": "^18.3.20",
  "@types/react-dom": "^18.3.7",
} as const;

const REACT_19_DEFAULTS = {
  react: "^19.2.0",
  "react-dom": "^19.2.0",
  "@types/react": "^19.2.0",
  "@types/react-dom": "^19.2.0",
} as const;

export async function preflightAstroReactIntegration(
  options: AstroReactPreflightOptions = {},
): Promise<AstroReactPreflight> {
  const pkg = (await readJsonFile("package.json")) as ProjectPackage;
  const dependencies = {
    ...pkg.optionalDependencies,
    ...pkg.devDependencies,
    ...pkg.dependencies,
  };
  const readInstalledVersion = options.readInstalledVersion ?? defaultInstalledVersionReader;
  const astroMajor = await resolveAstroMajor(dependencies.astro, readInstalledVersion, "React");
  if (typeof astroMajor !== "number") {
    return {
      status: "manual-action-required",
      guidance: astroMajor,
    };
  }

  const configReadiness = await inspectAstroReactConfigFile();
  if (configReadiness.status === "manual-action-required") return configReadiness;

  const packages = resolveAstroReactPackages(dependencies, astroMajor, {
    integration: await readInstalledVersion("@astrojs/react"),
    react: await readInstalledVersion("react"),
    reactDom: await readInstalledVersion("react-dom"),
  });
  if ("status" in packages) return packages;

  const hasAllPackages = packages.production.length === 0 && packages.development.length === 0;
  const hasJsxSettings = await isAstroReactTsConfigReady();
  return {
    status:
      configReadiness.status === "ready" && hasAllPackages && hasJsxSettings
        ? "ready"
        : "configurable",
    packages,
  };
}

export async function ensureAstroReactIntegration(
  options: EnsureAstroReactIntegrationOptions = {},
): Promise<AstroReactSetupOutcome> {
  const preflight = await preflightAstroReactIntegration({
    readInstalledVersion: options.readInstalledVersion,
  });
  if (preflight.status === "manual-action-required") throw new Error(preflight.guidance);
  if (preflight.status === "ready") return { status: "ready" };

  const shouldConfigure = options.skipPrompts
    ? true
    : await p.confirm({
        message:
          "React components in Astro require the official Astro React integration. Configure Astro React now?",
        initialValue: true,
      });

  if (p.isCancel(shouldConfigure)) {
    p.cancel("Operation cancelled");
    return { status: "cancelled" };
  }
  if (!shouldConfigure) {
    p.log.warn('React setup was skipped. Run "astro add react" or select React again to continue.');
    return { status: "declined" };
  }

  if (preflight.packages.production.length > 0) {
    await installDependencies(preflight.packages.production, options.packageManager);
  }
  if (preflight.packages.development.length > 0) {
    await installDependencies(preflight.packages.development, options.packageManager, true);
  }

  if (!(await setupAstroReactConfig())) {
    throw new Error(
      "Astro React packages were installed, but the Astro config could not be updated. Add react() to the integrations array manually.",
    );
  }
  if (!(await setupAstroReactTsConfig())) {
    throw new Error(
      'Astro React packages were installed, but tsconfig.json could not be updated. Set jsx to "react-jsx" and jsxImportSource to "react" manually.',
    );
  }
  return { status: "configured" };
}

function resolveAstroReactPackages(
  dependencies: Record<string, string>,
  astroMajor: SupportedAstroMajor,
  installedVersions: {
    integration: string | undefined;
    react: string | undefined;
    reactDom: string | undefined;
  },
): AstroReactPackages | { status: "manual-action-required"; guidance: string } {
  const installedReact = getMinimumVersion(installedVersions.react);
  const installedReactDom = getMinimumVersion(installedVersions.reactDom);
  for (const installed of [installedReact, installedReactDom]) {
    if (installed && installed.major !== 18 && installed.major !== 19) {
      return {
        status: "manual-action-required",
        guidance:
          "The installed React version does not meet the supported React 18 or React 19 policy. Update React and React DOM before adding React components.",
      };
    }
  }
  if (installedReact && installedReactDom && installedReact.major !== installedReactDom.major) {
    return {
      status: "manual-action-required",
      guidance: "Installed React and React DOM must use the same supported major version.",
    };
  }

  const installedMajor = installedReact?.major ?? installedReactDom?.major;
  let selectedReactMajor: 18 | 19;
  if (installedMajor === 18 || installedMajor === 19) {
    selectedReactMajor = installedMajor;
    const missingPackageRange =
      installedReact && !installedReactDom
        ? dependencies["react-dom"]
        : installedReactDom && !installedReact
          ? dependencies.react
          : undefined;
    if (
      missingPackageRange &&
      (!getDeclaredReactMajors(missingPackageRange).includes(selectedReactMajor) ||
        allowsUnsupportedReactMajor(missingPackageRange))
    ) {
      return {
        status: "manual-action-required",
        guidance:
          "The unread React package declaration does not safely select the installed React major. Align React and React DOM before adding React components.",
      };
    }
  } else {
    const declaredRanges = [dependencies.react, dependencies["react-dom"]].filter(
      (range): range is string => Boolean(range),
    );
    if (declaredRanges.some(allowsUnsupportedReactMajor)) {
      return {
        status: "manual-action-required",
        guidance:
          "Starwind could not read the installed React and React DOM versions, and their declarations span majors outside React 18 or React 19. Install dependencies or align both packages manually.",
      };
    }
    const candidateMajors = declaredRanges.reduce<Set<18 | 19>>(
      (candidates, range) =>
        new Set([...candidates].filter((major) => getDeclaredReactMajors(range).includes(major))),
      new Set([18, 19]),
    );
    if (declaredRanges.length === 0) {
      selectedReactMajor = 19;
    } else if (candidateMajors.size === 1) {
      selectedReactMajor = [...candidateMajors][0]!;
    } else {
      return {
        status: "manual-action-required",
        guidance:
          "Starwind could not read the installed React and React DOM versions, and their declarations span multiple majors. Install dependencies or select one matching major manually.",
      };
    }
  }

  const defaults = selectedReactMajor === 18 ? REACT_18_DEFAULTS : REACT_19_DEFAULTS;
  const production: string[] = [];
  const development: string[] = [];
  const integrationRange = ASTRO_INTEGRATION_RANGES["@astrojs/react"][astroMajor];

  if (
    !meetsIntegrationPolicyFloor(
      dependencies["@astrojs/react"],
      installedVersions.integration,
      integrationRange,
    )
  ) {
    production.push(`@astrojs/react@${integrationRange}`);
  }
  for (const packageName of ["react", "react-dom"] as const) {
    const installedVersion = packageName === "react" ? installedReact : installedReactDom;
    if (!meetsReactMajorPolicy(dependencies[packageName], installedVersion, selectedReactMajor)) {
      production.push(`${packageName}@${defaults[packageName]}`);
    }
  }
  for (const packageName of ["@types/react", "@types/react-dom"] as const) {
    if (!satisfiesMajor(dependencies[packageName], selectedReactMajor)) {
      development.push(`${packageName}@${defaults[packageName]}`);
    }
  }

  return { production, development };
}

function getDeclaredReactMajors(range: string): Array<18 | 19> {
  return ([18, 19] as const).filter((major) => {
    try {
      return semver.intersects(range, `>=${major}.0.0 <${major + 1}.0.0`);
    } catch {
      return false;
    }
  });
}

function allowsUnsupportedReactMajor(range: string): boolean {
  try {
    return semver.intersects(range, "<18.0.0") || semver.intersects(range, ">=20.0.0");
  } catch {
    return true;
  }
}

function meetsReactMajorPolicy(
  declaredRange: string | undefined,
  installedVersion: semver.SemVer | undefined,
  selectedMajor: 18 | 19,
): boolean {
  if (installedVersion) {
    if (installedVersion.major !== selectedMajor) return false;
    if (!declaredRange) return true;
    try {
      return semver.satisfies(installedVersion, declaredRange);
    } catch {
      return false;
    }
  }
  if (!declaredRange || allowsUnsupportedReactMajor(declaredRange)) return false;
  const declaredMajors = getDeclaredReactMajors(declaredRange);
  return declaredMajors.length === 1 && declaredMajors[0] === selectedMajor;
}

function satisfiesMajor(range: string | undefined, major: number): boolean {
  const version = getMinimumVersion(range);
  return Boolean(version && version.major === major);
}
