import semver from "semver";

import type { StarwindFramework } from "./config.js";
import {
  type CliFrameworkTarget,
  type FrameworkTargetPolicy,
  isSetupTarget,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "./framework-target-policy.js";
import type {
  RegistryPackageRequirement,
  StarwindRegistry,
  StarwindRegistryFor,
} from "./registry.js";

export type RuntimeSetupPlan = {
  adapterPackage: string;
  packageRequirements: string[];
};

export function getRuntimeSetupPlan(
  framework: StarwindFramework,
  registry: StarwindRegistry,
): RuntimeSetupPlan;
export function getRuntimeSetupPlan<TFramework extends CliFrameworkTarget>(
  framework: TFramework,
  registry: StarwindRegistryFor<TFramework>,
  targetPolicy: FrameworkTargetPolicy<TFramework>,
): RuntimeSetupPlan;
export function getRuntimeSetupPlan<TFramework extends CliFrameworkTarget = StarwindFramework>(
  framework: TFramework,
  registry: StarwindRegistryFor<TFramework>,
  targetPolicy: FrameworkTargetPolicy<TFramework> = PUBLIC_FRAMEWORK_TARGET_POLICY as unknown as FrameworkTargetPolicy<TFramework>,
): RuntimeSetupPlan {
  if (!isSetupTarget(targetPolicy, framework)) {
    throw new Error(
      `Framework "${framework}" is not available under the ${targetPolicy.cacheKey} target policy.`,
    );
  }

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
