import semver from "semver";

import type { StarwindFramework } from "./config.js";
import type { RegistryPackageRequirement, StarwindRegistry } from "./registry.js";

export type RuntimeSetupPlan = {
  adapterPackage: string;
  packageRequirements: string[];
};

export function getRuntimeSetupPlan(
  framework: StarwindFramework,
  registry: StarwindRegistry,
): RuntimeSetupPlan {
  const setup = registry.setup?.[framework];

  if (!setup) {
    throw new Error(
      `Bundled registry ${registry.version} is missing setup metadata for framework "${framework}".`,
    );
  }

  const adapterVersion = semver.minVersion(setup.adapterPackage.range)?.version;
  if (!adapterVersion) {
    throw new Error(
      `Bundled registry declares an invalid ${setup.adapterPackage.name} adapter range: ${setup.adapterPackage.range}`,
    );
  }

  return {
    adapterPackage: `${setup.adapterPackage.name}@${adapterVersion}`,
    packageRequirements: setup.packageRequirements.map(formatPackageRequirement),
  };
}

function formatPackageRequirement(requirement: RegistryPackageRequirement): string {
  return `${requirement.name}@${requirement.range}`;
}
