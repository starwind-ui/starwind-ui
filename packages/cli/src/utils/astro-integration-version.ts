import semver from "semver";

import { readJsonFile } from "./fs.js";

export type InstalledVersionReader = (packageName: string) => Promise<string | undefined>;

export type SupportedAstroMajor = 5 | 6 | 7;

const SUPPORTED_ASTRO_MAJORS = [5, 6, 7] as const;

/** Each official integration major supports one Astro major, so npm rejects any other pairing. */
export const ASTRO_INTEGRATION_RANGES = {
  "@astrojs/react": { 5: "^4.4.2", 6: "^5.0.7", 7: "^6.0.2" },
  "@astrojs/svelte": { 5: "^7.2.5", 6: "^8.1.2", 7: "^9.1.2" },
  "@astrojs/vue": { 5: "^5.1.4", 6: "^6.0.1", 7: "^7.1.2" },
} as const satisfies Record<string, Record<SupportedAstroMajor, string>>;

export function getMinimumVersion(range: string | undefined): semver.SemVer | undefined {
  if (!range || /^(?:file|link|portal|workspace):/i.test(range)) return undefined;
  return semver.minVersion(range) ?? undefined;
}

/** Returns the Astro major for the project, or guidance when it cannot select one safely. */
export async function resolveAstroMajor(
  declaredRange: string | undefined,
  readInstalledVersion: InstalledVersionReader,
  frameworkLabel: "React" | "Svelte" | "Vue",
): Promise<SupportedAstroMajor | string> {
  const installedVersion = getMinimumVersion(await readInstalledVersion("astro"));
  if (installedVersion) {
    if ((SUPPORTED_ASTRO_MAJORS as readonly number[]).includes(installedVersion.major)) {
      return installedVersion.major as SupportedAstroMajor;
    }
    return `Starwind supports automatic Astro ${frameworkLabel} setup for installed Astro 5, 6, and 7. Install a supported Astro version or configure the official ${frameworkLabel} integration manually.`;
  }

  if (!declaredRange) {
    return `Starwind could not read an installed Astro version. Install Astro 5, 6, or 7 before configuring the ${frameworkLabel} integration.`;
  }

  const matchingMajors = SUPPORTED_ASTRO_MAJORS.filter((major) => {
    try {
      return semver.intersects(declaredRange, `>=${major}.0.0 <${major + 1}.0.0`);
    } catch {
      return false;
    }
  });
  if (matchingMajors.length === 1) return matchingMajors[0]!;
  if (matchingMajors.length > 1) {
    return `Starwind could not read the installed Astro version, and the declared Astro range spans multiple supported majors. Install dependencies or configure the matching ${frameworkLabel} integration manually.`;
  }
  return `Starwind supports automatic Astro ${frameworkLabel} setup for Astro 5, 6, and 7. Install a supported Astro version or configure the official ${frameworkLabel} integration manually.`;
}

export function meetsIntegrationPolicyFloor(
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

/**
 * Astro 5.7 made SVG components stable, and later versions reject the experimental flag. The
 * installed version decides. Without one, only a range that cannot reach 5.7 needs the flag.
 */
export function needsExperimentalAstroSvg(
  declaredRange: string | undefined,
  installedVersion: string | undefined,
): boolean {
  const installed = getMinimumVersion(installedVersion);
  if (installed) return semver.lt(installed, "5.7.0");
  if (!declaredRange || !semver.validRange(declaredRange)) return false;
  return semver.gtr("5.7.0", declaredRange);
}

export const defaultInstalledVersionReader: InstalledVersionReader = async (packageName) => {
  try {
    const packagePath = `node_modules/${packageName}/package.json`;
    const pkg = (await readJsonFile(packagePath)) as { version?: string };
    return pkg.version;
  } catch {
    return undefined;
  }
};
