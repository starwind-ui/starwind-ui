// Separate build entry for the offline kit builder. It must import only `install-defaults`, so it
// stays small and does not copy the bundled registry.
import {
  ASTRO_INTEGRATION_RANGES,
  NEXT_TAILWIND_POSTCSS_REQUIREMENT,
  REACT_18_DEFAULTS,
  REACT_19_DEFAULTS,
  STARWIND_STYLESHEET_REQUIREMENTS,
} from "./utils/install-defaults.js";

interface PackageRequirement {
  name?: unknown;
  range?: unknown;
}

function addRequirement(requirement: PackageRequirement | undefined, into: Set<string>): void {
  if (typeof requirement?.name === "string" && typeof requirement.range === "string") {
    into.add(`${requirement.name}@${requirement.range}`);
  }
}

/**
 * Collects every `adapterPackage` and `packageRequirements` entry in a bundled registry or
 * Primitive vendoring artifact document.
 */
export function collectRegistryPackageRequirements(value: unknown, into = new Set<string>()) {
  if (Array.isArray(value)) {
    for (const entry of value) collectRegistryPackageRequirements(entry, into);
    return into;
  }
  if (!value || typeof value !== "object") return into;
  const record = value as Record<string, unknown>;
  addRequirement(record.adapterPackage as PackageRequirement | undefined, into);
  if (Array.isArray(record.packageRequirements)) {
    for (const requirement of record.packageRequirements) {
      addRequirement(requirement as PackageRequirement, into);
    }
  }
  for (const child of Object.values(record)) {
    if (child && typeof child === "object") collectRegistryPackageRequirements(child, into);
  }
  return into;
}

/**
 * Package specs that the CLI installs from code: Astro integrations, React, the Starwind
 * stylesheet packages, and Next.js PostCSS.
 */
export function getOfflineCodeRequirements(): string[] {
  const requirements = new Set<string>();
  for (const [packageName, ranges] of Object.entries(ASTRO_INTEGRATION_RANGES)) {
    for (const range of Object.values(ranges)) requirements.add(`${packageName}@${range}`);
  }
  for (const defaults of [REACT_18_DEFAULTS, REACT_19_DEFAULTS]) {
    for (const [packageName, range] of Object.entries(defaults)) {
      requirements.add(`${packageName}@${range}`);
    }
  }
  for (const requirement of STARWIND_STYLESHEET_REQUIREMENTS) requirements.add(requirement);
  requirements.add(NEXT_TAILWIND_POSTCSS_REQUIREMENT);
  return [...requirements].sort();
}

declare const __STARWIND_OFFLINE_REGISTRY_REQUIREMENTS__: readonly string[] | undefined;

/**
 * Package specs from the bundled registry, recorded at build time. Returns undefined when this
 * module runs from source, where callers read the registry files instead.
 */
export function getOfflineRegistryRequirements(): string[] | undefined {
  return typeof __STARWIND_OFFLINE_REGISTRY_REQUIREMENTS__ === "undefined"
    ? undefined
    : [...__STARWIND_OFFLINE_REGISTRY_REQUIREMENTS__];
}
