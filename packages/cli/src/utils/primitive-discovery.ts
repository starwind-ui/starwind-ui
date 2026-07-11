import { getConfigState, type StarwindConfig, type StarwindFramework } from "./config.js";
import { getPrimitiveComponents, type PrimitiveVendoringArtifact } from "./primitive-component.js";

export type PrimitiveDiscoveryFramework = StarwindFramework | "all";

type PrimitiveDiscoveryOptions = {
  framework?: PrimitiveDiscoveryFramework;
  query?: string;
};

export type PrimitiveDiscoveryMetadata = {
  fileCount: number;
  files: Array<{
    path: string;
    sourceHash: string;
    sourcePath: string;
  }>;
  framework: StarwindFramework;
  installCommand: string;
  name: string;
  packageRequirements: PrimitiveVendoringArtifact["packageRequirements"];
  version: string;
};

export async function resolvePrimitiveDiscoveryFramework(
  framework?: PrimitiveDiscoveryFramework,
): Promise<PrimitiveDiscoveryFramework | undefined> {
  if (framework) return framework;

  const configState = await getConfigState();

  if (configState.status !== "current") {
    return "astro";
  }

  return getConfigFramework(configState.config);
}

export function getPrimitiveDiscoveryResults(
  options: PrimitiveDiscoveryOptions,
): PrimitiveVendoringArtifact[] {
  const primitives =
    options.framework === "all"
      ? (["astro", "react"] as const).flatMap((framework) => getPrimitiveComponents({ framework }))
      : getPrimitiveComponents({ framework: options.framework ?? "astro" });
  const query = options.query?.trim().toLowerCase();

  const sortedPrimitives = primitives.sort(
    (a, b) => a.component.localeCompare(b.component) || a.framework.localeCompare(b.framework),
  );

  if (!query) return sortedPrimitives;

  return sortedPrimitives.filter((primitive) => primitive.component.toLowerCase().includes(query));
}

export function toPrimitiveDiscoveryMetadata(
  primitive: PrimitiveVendoringArtifact,
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

export function getPrimitiveInstallCommand(name: string, framework?: StarwindFramework): string {
  return `starwind primitives add ${name}${framework ? ` --framework ${framework}` : ""}`;
}

function getConfigFramework(config: StarwindConfig): StarwindFramework | undefined {
  if (config.framework === "astro") return "astro";
  if (config.framework === "react") return "react";

  return undefined;
}
