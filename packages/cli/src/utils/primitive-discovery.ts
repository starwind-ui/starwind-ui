import {
  getConfigState,
  type StarwindConfigFor,
  type StarwindConfigStateFor,
  type StarwindFramework,
} from "./config.js";
import { sortComponentPresentationByName } from "./component-presentation.js";
import {
  type CliFrameworkTarget,
  type FrameworkTargetPolicy,
  isConfigTarget,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "./framework-target-policy.js";
import {
  getPrimitiveComponents,
  type PrimitiveVendoringArtifact,
  type PrimitiveVendoringArtifactSet,
} from "./primitive-component.js";

export type PrimitiveDiscoveryFramework<TFramework extends CliFrameworkTarget = StarwindFramework> =
  | TFramework
  | "all";

type PrimitiveDiscoveryOptions<TFramework extends CliFrameworkTarget = StarwindFramework> = {
  artifacts?: PrimitiveVendoringArtifactSet<TFramework>;
  framework?: PrimitiveDiscoveryFramework<TFramework>;
  query?: string;
  targetPolicy?: FrameworkTargetPolicy<TFramework>;
};

export type PrimitiveDiscoveryMetadata = {
  fileCount: number;
  files: Array<{
    path: string;
    sourceHash: string;
    sourcePath: string;
  }>;
  framework: CliFrameworkTarget;
  installCommand: string;
  name: string;
  packageRequirements: PrimitiveVendoringArtifact<CliFrameworkTarget>["packageRequirements"];
  version: string;
};

export async function resolvePrimitiveDiscoveryFramework<
  TFramework extends CliFrameworkTarget = StarwindFramework,
>(
  framework?: PrimitiveDiscoveryFramework<TFramework>,
  options: { targetPolicy?: FrameworkTargetPolicy<TFramework> } = {},
): Promise<PrimitiveDiscoveryFramework<TFramework> | undefined> {
  const targetPolicy = getTargetPolicy(options.targetPolicy);
  if (framework !== undefined) {
    if (framework === "all") return framework;
    return isConfigTarget(targetPolicy, framework) ? framework : undefined;
  }

  const configState = (
    options.targetPolicy ? await getConfigState(targetPolicy) : await getConfigState()
  ) as StarwindConfigStateFor<TFramework>;

  if (configState.status !== "current") {
    return targetPolicy.configTargets[0];
  }

  return getConfigFramework(configState.config, targetPolicy);
}

export function getPrimitiveDiscoveryResults<
  TFramework extends CliFrameworkTarget = StarwindFramework,
>(options: PrimitiveDiscoveryOptions<TFramework>): PrimitiveVendoringArtifact<TFramework>[] {
  const targetPolicy = getTargetPolicy(options.targetPolicy);
  const frameworks =
    options.framework === "all"
      ? targetPolicy.configTargets
      : [options.framework ?? targetPolicy.configTargets[0]];
  const primitives = frameworks.flatMap((framework) =>
    options.targetPolicy || options.artifacts
      ? getPrimitiveComponents({
          artifacts: options.artifacts,
          framework,
          targetPolicy,
        })
      : getPrimitiveComponents({ framework }),
  );
  const query = options.query?.trim().toLowerCase();

  const sortedPrimitives = sortComponentPresentationByName(
    primitives,
    (primitive) => primitive.component,
    (primitive) => primitive.framework,
  );

  if (!query) return sortedPrimitives;

  return sortedPrimitives.filter((primitive) => primitive.component.toLowerCase().includes(query));
}

export function toPrimitiveDiscoveryMetadata(
  primitive: PrimitiveVendoringArtifact<CliFrameworkTarget>,
  options: { includeFrameworkFlag?: boolean } = {},
): PrimitiveDiscoveryMetadata {
  return {
    fileCount: primitive.files.length,
    files: primitive.files.map((file) => ({
      path: file.path,
      sourceHash: file.sourceHash,
      sourcePath: file.sourcePath,
    })),
    framework: primitive.framework,
    installCommand: getPrimitiveInstallCommand(
      primitive.component,
      options.includeFrameworkFlag ? primitive.framework : undefined,
    ),
    name: primitive.component,
    packageRequirements: primitive.packageRequirements,
    version: primitive.version,
  };
}

export function getPrimitiveInstallCommand(name: string, framework?: CliFrameworkTarget): string {
  return `starwind primitives add ${name}${framework ? ` --framework ${framework}` : ""}`;
}

function getConfigFramework<TFramework extends CliFrameworkTarget>(
  config: StarwindConfigFor<TFramework>,
  targetPolicy: FrameworkTargetPolicy<TFramework>,
): TFramework | undefined {
  return isConfigTarget(targetPolicy, config.framework) ? config.framework : undefined;
}

function getTargetPolicy<TFramework extends CliFrameworkTarget>(
  targetPolicy?: FrameworkTargetPolicy<TFramework>,
): FrameworkTargetPolicy<TFramework> {
  return (
    targetPolicy ?? (PUBLIC_FRAMEWORK_TARGET_POLICY as unknown as FrameworkTargetPolicy<TFramework>)
  );
}
