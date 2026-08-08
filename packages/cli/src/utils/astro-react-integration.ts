import * as p from "@clack/prompts";
import semver from "semver";

import { inspectAstroReactConfigFile, setupAstroReactConfig } from "./astro-config.js";
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

export type InstalledVersionReader = (packageName: string) => Promise<string | undefined>;

const INTEGRATION_BY_ASTRO_MAJOR = {
  5: "^4.4.2",
  6: "^5.0.7",
  7: "^6.0.2",
} as const;

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
  const astroMajor = await resolveAstroMajor(dependencies.astro, readInstalledVersion);
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
  astroMajor: keyof typeof INTEGRATION_BY_ASTRO_MAJOR,
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
  const integrationRange = INTEGRATION_BY_ASTRO_MAJOR[astroMajor];

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

function getMinimumVersion(range: string | undefined): semver.SemVer | undefined {
  if (!range || /^(?:file|link|portal|workspace):/i.test(range)) return undefined;
  return semver.minVersion(range) ?? undefined;
}

function satisfiesMajor(range: string | undefined, major: number): boolean {
  const version = getMinimumVersion(range);
  return Boolean(version && version.major === major);
}

async function resolveAstroMajor(
  declaredRange: string | undefined,
  readInstalledVersion: InstalledVersionReader,
): Promise<keyof typeof INTEGRATION_BY_ASTRO_MAJOR | string> {
  const installedVersion = getMinimumVersion(await readInstalledVersion("astro"));
  if (installedVersion) {
    if (installedVersion.major in INTEGRATION_BY_ASTRO_MAJOR) {
      return installedVersion.major as keyof typeof INTEGRATION_BY_ASTRO_MAJOR;
    }
    return "Starwind supports automatic Astro React setup for installed Astro 5, 6, and 7. Install a supported Astro version or configure the official React integration manually.";
  }

  if (!declaredRange) {
    return "Starwind could not read an installed Astro version. Install Astro 5, 6, or 7 before configuring the React integration.";
  }

  const matchingMajors = ([5, 6, 7] as const).filter((major) => {
    try {
      return semver.intersects(declaredRange, `>=${major}.0.0 <${major + 1}.0.0`);
    } catch {
      return false;
    }
  });
  if (matchingMajors.length === 1) return matchingMajors[0]!;
  if (matchingMajors.length > 1) {
    return "Starwind could not read the installed Astro version, and the declared Astro range spans multiple supported majors. Install dependencies or configure the matching React integration manually.";
  }
  return "Starwind supports automatic Astro React setup for Astro 5, 6, and 7. Install a supported Astro version or configure the official React integration manually.";
}

function meetsIntegrationPolicyFloor(
  declaredRange: string | undefined,
  installedVersion: string | undefined,
  requiredRange: string,
): boolean {
  const requiredFloor = semver.minVersion(requiredRange);
  if (!requiredFloor) return false;
  const installed = getMinimumVersion(installedVersion);
  if (installed) {
    return installed.major === requiredFloor.major && semver.gte(installed, requiredFloor);
  }
  const declaredFloor = getMinimumVersion(declaredRange);
  return Boolean(
    declaredFloor &&
    declaredFloor.major === requiredFloor.major &&
    semver.gte(declaredFloor, requiredFloor),
  );
}

const defaultInstalledVersionReader: InstalledVersionReader = async (packageName) => {
  try {
    const packagePath = `node_modules/${packageName}/package.json`;
    const pkg = (await readJsonFile(packagePath)) as { version?: string };
    return pkg.version;
  } catch {
    return undefined;
  }
};
