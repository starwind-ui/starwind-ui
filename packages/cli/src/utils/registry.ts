import path from "node:path";

import semver from "semver";
import { z } from "zod";

import runtimeBundledRegistry from "../registry/bundled-registry.json" with { type: "json" };
import { DEFAULT_STYLED_REGISTRY_REFERENCE } from "./config.js";
import type { StarwindConfigFor } from "./config.js";
import {
  type CliFrameworkTarget,
  type FrameworkTargetPolicy,
  isRegistryTarget,
  isSetupTarget,
  type PublicCliFrameworkTarget,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
  type RegistryTargetFor,
} from "./framework-target-policy.js";
import { readJsonFile } from "./fs.js";
import { parsePackageName } from "./package-spec.js";
import { assertSafePathSegment } from "./project-path.js";

export type RegistryImplementationTarget = RegistryTargetFor<PublicCliFrameworkTarget>;
export type RegistryImplementationTargetFor<TFramework extends CliFrameworkTarget> =
  RegistryTargetFor<TFramework>;

export interface RegistryFile {
  path: string;
  content?: string;
  sourcePath?: string;
}

export interface RegistryPackageRequirement {
  name: string;
  range: string;
}

export interface RegistryPublicRename {
  from: string;
  to: string;
}

export interface RegistryArtifactReference {
  path: string;
}

export interface ComponentPublicRenames {
  paths?: RegistryPublicRename[];
  usages?: RegistryPublicRename[];
}

export interface RegistryTarget {
  files: RegistryFile[];
  componentDependencies: string[];
  packageRequirements: RegistryPackageRequirement[];
}

export interface RegistrySetupTarget {
  adapterPackage: RegistryPackageRequirement;
  packageRequirements: RegistryPackageRequirement[];
}

export interface ComponentFor<TFramework extends CliFrameworkTarget> {
  name: string;
  version: string;
  dependencies: string[];
  artifact?: RegistryArtifactReference;
  fileDependencies?: string[];
  publicRenames?: ComponentPublicRenames;
  type: "component";
  targets?: Partial<Record<RegistryImplementationTargetFor<TFramework>, RegistryTarget>>;
}

export type Component = ComponentFor<PublicCliFrameworkTarget>;

export interface RegistryComponentArtifactFor<TFramework extends CliFrameworkTarget> {
  $schema?: string;
  registryVersion: string;
  component: Omit<ComponentFor<TFramework>, "artifact">;
}

export type RegistryComponentArtifact = RegistryComponentArtifactFor<PublicCliFrameworkTarget>;

export interface StarwindRegistryFor<TFramework extends CliFrameworkTarget> {
  $schema?: string;
  version: string;
  setup?: Partial<Record<TFramework, RegistrySetupTarget>>;
  components: ComponentFor<TFramework>[];
}

export type StarwindRegistry = StarwindRegistryFor<PublicCliFrameworkTarget>;

export type RegistrySource =
  | { type: "bundled" }
  | { type: "local"; path: string }
  | { type: "remote"; url: string };

export function parseRegistrySource(value: string | undefined): RegistrySource | undefined {
  if (!value) return undefined;

  if (/^https?:\/\//.test(value)) {
    return { type: "remote", url: value };
  }

  return { type: "local", path: value };
}

export function getConfiguredRegistrySource<TFramework extends CliFrameworkTarget>(
  config: Pick<StarwindConfigFor<TFramework>, "registry">,
): RegistrySource | undefined {
  if (!config.registry) return undefined;

  switch (config.registry.source) {
    case "bundled":
      return { type: "bundled" };
    case "local":
      return config.registry.path ? { type: "local", path: config.registry.path } : undefined;
    case "remote":
      return config.registry.url ? { type: "remote", url: config.registry.url } : undefined;
  }
}

export function getStyledRegistrySource<TFramework extends CliFrameworkTarget>(
  config: Pick<StarwindConfigFor<TFramework>, "registry" | "registries">,
  registryReference: string | undefined,
): RegistrySource | undefined {
  if (!registryReference || registryReference === DEFAULT_STYLED_REGISTRY_REFERENCE) {
    return getConfiguredRegistrySource(config);
  }

  const registry = config.registries?.[registryReference];
  if (!registry) return undefined;

  switch (registry.source) {
    case "bundled":
      return { type: "bundled" };
    case "local":
      return registry.path ? { type: "local", path: registry.path } : undefined;
    case "remote":
      return registry.url ? { type: "remote", url: registry.url } : undefined;
  }
}

const semverVersionSchema = z.string().refine((value) => semver.valid(value) !== null, {
  message: "Expected a semver version",
});

const semverRangeSchema = z.string().refine((value) => semver.validRange(value) !== null, {
  message: "Expected a semver range",
});

const registryPackageNameSchema = z.string().superRefine((value, ctx) => {
  try {
    parsePackageName(value, "registry package requirement name");
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: error instanceof Error ? error.message : "Invalid registry package requirement name",
    });
  }
});

const registryFileSchema = z
  .object({
    path: z.string().min(1),
    content: z.string().optional(),
    sourcePath: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((file, ctx) => {
    const payloadSourceCount = [file.content, file.sourcePath].filter(
      (value) => value !== undefined,
    ).length;

    if (payloadSourceCount !== 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expected exactly one prepared file payload source: content or sourcePath",
      });
    }
  });

const packageRequirementSchema = z
  .object({
    name: registryPackageNameSchema,
    range: semverRangeSchema,
  })
  .strict();

const registrySetupTargetSchema = z
  .object({
    adapterPackage: packageRequirementSchema,
    packageRequirements: z.array(packageRequirementSchema).default([]),
  })
  .strict()
  .superRefine((setupTarget, ctx) => {
    const seenPackageNames = new Set<string>();

    for (const [index, requirement] of setupTarget.packageRequirements.entries()) {
      if (requirement.name === setupTarget.adapterPackage.name) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["packageRequirements", index, "name"],
          message: `Setup package requirements must not repeat adapter package ${requirement.name}`,
        });
      }

      if (seenPackageNames.has(requirement.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["packageRequirements", index, "name"],
          message: `Duplicate setup package requirement ${requirement.name}`,
        });
      }

      seenPackageNames.add(requirement.name);
    }
  });

function createRegistrySetupSchema<TFramework extends CliFrameworkTarget>(
  targetPolicy: FrameworkTargetPolicy<TFramework>,
) {
  return z.record(registrySetupTargetSchema).superRefine((setup, ctx) => {
    for (const target of Object.keys(setup)) {
      if (!isSetupTarget(targetPolicy, target)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [target],
          message: `Unsupported registry setup target "${target}"`,
        });
      }
    }
  });
}

const publicRenameSchema = z
  .object({
    from: z.string().min(1),
    to: z.string().min(1),
  })
  .strict();

const componentPublicRenamesSchema = z
  .object({
    paths: z.array(publicRenameSchema).optional(),
    usages: z.array(publicRenameSchema).optional(),
  })
  .strict()
  .superRefine((renames, ctx) => {
    if (!renames.paths?.length && !renames.usages?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Expected at least one public path or usage rename",
      });
    }
  });

const registryArtifactReferenceSchema = z
  .object({
    path: z.string().min(1),
  })
  .strict();

const registryTargetSchema = z
  .object({
    files: z.array(registryFileSchema).default([]),
    componentDependencies: z.array(z.string().min(1)).default([]),
    packageRequirements: z.array(packageRequirementSchema).default([]),
  })
  .strict();

function createRegistryTargetsSchema<TFramework extends CliFrameworkTarget>(
  targetPolicy: FrameworkTargetPolicy<TFramework>,
) {
  return z.record(registryTargetSchema).superRefine((targets, ctx) => {
    for (const [target, targetMetadata] of Object.entries(targets)) {
      if (!isRegistryTarget(targetPolicy, target)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [target],
          message: `Unsupported registry target "${target}"`,
        });
        continue;
      }

      if (targetMetadata.files.length === 0) continue;

      const packageNames = new Set(
        targetMetadata.packageRequirements.map((requirement) => requirement.name),
      );

      for (const packageName of targetPolicy.requiredAdapterPackages[target]) {
        if (!packageNames.has(packageName)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: [target, "packageRequirements"],
            message: `Target "${target}" with prepared files requires ${packageName}`,
          });
        }
      }
    }
  });
}

const safeComponentNameSchema = z
  .string()
  .min(1)
  .superRefine((componentName, ctx) => {
    try {
      assertSafePathSegment(componentName, "registry component name");
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : "Invalid registry component name",
      });
    }
  });

const componentBaseFields = {
  name: safeComponentNameSchema,
  version: semverVersionSchema,
  dependencies: z.array(z.string()).default([]),
  fileDependencies: z.array(z.string()).optional(),
  publicRenames: componentPublicRenamesSchema.optional(),
  type: z.literal("component"),
};

function createComponentSchema<TFramework extends CliFrameworkTarget>(
  targetPolicy: FrameworkTargetPolicy<TFramework>,
) {
  return z
    .object({
      ...componentBaseFields,
      artifact: registryArtifactReferenceSchema.optional(),
      targets: createRegistryTargetsSchema(targetPolicy).optional(),
    })
    .strict()
    .superRefine((component, ctx) => {
      if (!component.targets && !component.artifact) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expected component targets or artifact",
        });
      }

      if (component.targets && component.artifact) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Expected either inline targets or artifact, not both",
        });
      }
    });
}

function createRegistryComponentArtifactSchema<TFramework extends CliFrameworkTarget>(
  targetPolicy: FrameworkTargetPolicy<TFramework>,
) {
  const registryArtifactComponentSchema = z
    .object({
      ...componentBaseFields,
      targets: createRegistryTargetsSchema(targetPolicy),
    })
    .strict();

  return z
    .object({
      $schema: z.string().optional(),
      registryVersion: semverVersionSchema,
      component: registryArtifactComponentSchema,
    })
    .strict();
}

function createRegistryRootSchema<TFramework extends CliFrameworkTarget>(
  targetPolicy: FrameworkTargetPolicy<TFramework>,
) {
  return z
    .object({
      $schema: z.string().optional(),
      version: semverVersionSchema,
      setup: createRegistrySetupSchema(targetPolicy).optional(),
      components: z.array(createComponentSchema(targetPolicy)),
    })
    .strict();
}

let defaultRegistrySource: RegistrySource = { type: "bundled" };

type RegistryCache = Map<string, Promise<StarwindRegistryFor<CliFrameworkTarget>>>;
type RegistryArtifactCache = Map<string, Promise<RegistryComponentArtifactFor<CliFrameworkTarget>>>;

let registryCachesByPolicy = new WeakMap<object, RegistryCache>();
let registryArtifactCachesByPolicy = new WeakMap<object, RegistryArtifactCache>();

function getPolicyCache<TValue>(
  cachesByPolicy: WeakMap<object, Map<string, TValue>>,
  targetPolicy: object,
): Map<string, TValue> {
  const existingCache = cachesByPolicy.get(targetPolicy);
  if (existingCache) return existingCache;

  const cache = new Map<string, TValue>();
  cachesByPolicy.set(targetPolicy, cache);
  return cache;
}

function registrySourceKey(source: RegistrySource): string {
  switch (source.type) {
    case "bundled":
      return "bundled";
    case "local":
      return `local:${source.path}`;
    case "remote":
      return `remote:${source.url}`;
  }
}

function formatRegistryError(error: z.ZodError): Error {
  const firstIssue = error.issues[0];
  const path = firstIssue?.path.join(".") || "registry";
  const message = firstIssue?.message || "Invalid registry";
  return new Error(`Invalid Starwind registry at ${path}: ${message}`);
}

function parseRegistry<TFramework extends CliFrameworkTarget>(
  rawRegistry: unknown,
  targetPolicy: FrameworkTargetPolicy<TFramework>,
): StarwindRegistryFor<TFramework> {
  try {
    return createRegistryRootSchema(targetPolicy).parse(
      rawRegistry,
    ) as StarwindRegistryFor<TFramework>;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw formatRegistryError(error);
    }

    throw error;
  }
}

function parseRegistryArtifact<TFramework extends CliFrameworkTarget>(
  rawArtifact: unknown,
  artifactPath: string,
  targetPolicy: FrameworkTargetPolicy<TFramework>,
): RegistryComponentArtifactFor<TFramework> {
  try {
    return createRegistryComponentArtifactSchema(targetPolicy).parse(
      rawArtifact,
    ) as RegistryComponentArtifactFor<TFramework>;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      const issuePath = firstIssue?.path.join(".") || "artifact";
      const message = firstIssue?.message || "Invalid registry artifact";
      throw new Error(
        `Invalid Starwind registry artifact at ${artifactPath}.${issuePath}: ${message}`,
      );
    }

    throw error;
  }
}

async function readRegistrySource(source: RegistrySource): Promise<unknown> {
  switch (source.type) {
    case "bundled":
      return runtimeBundledRegistry;
    case "local":
      return readJsonFile(source.path);
    case "remote": {
      const response = await fetch(source.url);

      if (!response.ok) {
        throw new Error(`Failed to fetch registry: ${response.status} ${response.statusText}`);
      }

      return response.json();
    }
  }
}

interface RegistryPolicyOptions<TFramework extends CliFrameworkTarget> {
  forceRefresh?: boolean;
  targetPolicy: FrameworkTargetPolicy<TFramework>;
}

async function hydrateRegistry<TFramework extends CliFrameworkTarget>(
  registry: StarwindRegistryFor<TFramework>,
  source: RegistrySource,
  options: RegistryPolicyOptions<TFramework>,
): Promise<StarwindRegistryFor<TFramework>> {
  const hasArtifacts = registry.components.some((component) => component.artifact);

  if (!hasArtifacts) {
    return registry;
  }

  return {
    ...registry,
    components: await Promise.all(
      registry.components.map((component) =>
        component.artifact
          ? hydrateComponentArtifact(component, registry, source, options)
          : component,
      ),
    ),
  };
}

async function hydrateComponentArtifact<TFramework extends CliFrameworkTarget>(
  indexComponent: ComponentFor<TFramework>,
  registry: StarwindRegistryFor<TFramework>,
  source: RegistrySource,
  options: RegistryPolicyOptions<TFramework>,
): Promise<ComponentFor<TFramework>> {
  if (!indexComponent.artifact) return indexComponent;

  const artifact = await loadRegistryArtifact(indexComponent, source, options);

  if (semver.major(artifact.registryVersion) !== semver.major(registry.version)) {
    throw new Error(
      `Registry artifact for ${indexComponent.name} at ${indexComponent.artifact.path} must be semver-compatible with registry ${registry.version}; received ${artifact.registryVersion}.`,
    );
  }

  if (artifact.component.name !== indexComponent.name) {
    throw new Error(
      `Registry artifact for ${indexComponent.name} at ${indexComponent.artifact.path} declares component "${artifact.component.name}".`,
    );
  }

  if (artifact.component.version !== indexComponent.version) {
    throw new Error(
      `Registry artifact for ${indexComponent.name} at ${indexComponent.artifact.path} declares version ${artifact.component.version}; expected ${indexComponent.version}.`,
    );
  }

  return {
    ...artifact.component,
    artifact: indexComponent.artifact,
    dependencies: indexComponent.dependencies,
    fileDependencies: indexComponent.fileDependencies ?? artifact.component.fileDependencies,
    publicRenames: indexComponent.publicRenames ?? artifact.component.publicRenames,
  };
}

async function loadRegistryArtifact<TFramework extends CliFrameworkTarget>(
  component: ComponentFor<TFramework>,
  source: RegistrySource,
  options: RegistryPolicyOptions<TFramework>,
): Promise<RegistryComponentArtifactFor<TFramework>> {
  const artifactSource = resolveRegistryArtifactSource(component, source);
  const registryArtifactCache = getPolicyCache(
    registryArtifactCachesByPolicy,
    options.targetPolicy,
  );
  const cacheKey = artifactSource.cacheKey;

  if (!options.forceRefresh && registryArtifactCache.has(cacheKey)) {
    return registryArtifactCache.get(cacheKey)! as Promise<
      RegistryComponentArtifactFor<TFramework>
    >;
  }

  const artifactPromise = readRegistryArtifact(component, artifactSource).then((rawArtifact) =>
    parseRegistryArtifact(rawArtifact, component.artifact!.path, options.targetPolicy),
  );
  registryArtifactCache.set(
    cacheKey,
    artifactPromise as Promise<RegistryComponentArtifactFor<CliFrameworkTarget>>,
  );

  return artifactPromise;
}

type ResolvedRegistryArtifactSource =
  | { type: "local"; path: string; cacheKey: string }
  | { type: "remote"; url: string; cacheKey: string };

function resolveRegistryArtifactSource<TFramework extends CliFrameworkTarget>(
  component: ComponentFor<TFramework>,
  source: RegistrySource,
): ResolvedRegistryArtifactSource {
  const artifactPath = component.artifact?.path;

  if (!artifactPath) {
    throw new Error(`Component "${component.name}" does not declare a registry artifact path.`);
  }

  const relativeArtifactPath = normalizeRegistryArtifactPath(artifactPath);

  switch (source.type) {
    case "bundled":
      throw new Error(
        `Bundled registry component "${component.name}" cannot use linked artifact path "${artifactPath}". Bundle inline file content instead.`,
      );
    case "local": {
      const registryRoot = path.dirname(path.resolve(source.path));
      const artifactFilePath = path.resolve(registryRoot, relativeArtifactPath);

      if (!isPathInside(registryRoot, artifactFilePath)) {
        throw new Error(
          `Registry artifact path "${artifactPath}" for ${component.name} must stay inside the registry root.`,
        );
      }

      return {
        type: "local",
        path: artifactFilePath,
        cacheKey: `artifact:local:${artifactFilePath}`,
      };
    }
    case "remote": {
      const registryRootUrl = new URL("./", source.url);
      const artifactUrl = new URL(relativeArtifactPath, registryRootUrl);

      if (!isUrlInside(registryRootUrl, artifactUrl)) {
        throw new Error(
          `Registry artifact path "${artifactPath}" for ${component.name} must stay inside the registry root.`,
        );
      }

      return {
        type: "remote",
        url: artifactUrl.href,
        cacheKey: `artifact:remote:${artifactUrl.href}`,
      };
    }
  }
}

function normalizeRegistryArtifactPath(artifactPath: string): string {
  const portablePath = artifactPath.replace(/\\/g, "/");

  if (
    /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(portablePath) ||
    portablePath.startsWith("/") ||
    path.win32.isAbsolute(artifactPath)
  ) {
    throw new Error(
      `Registry artifact path "${artifactPath}" must be relative to the registry root.`,
    );
  }

  const normalizedPath = path.posix.normalize(portablePath);

  if (normalizedPath === "." || normalizedPath === ".." || normalizedPath.startsWith("../")) {
    throw new Error(`Registry artifact path "${artifactPath}" must stay inside the registry root.`);
  }

  return normalizedPath;
}

function isPathInside(rootPath: string, childPath: string): boolean {
  const relativePath = path.relative(rootPath, childPath);
  return relativePath === "" || (!relativePath.startsWith("..") && !path.isAbsolute(relativePath));
}

function isUrlInside(rootUrl: URL, childUrl: URL): boolean {
  return (
    childUrl.protocol === rootUrl.protocol &&
    childUrl.host === rootUrl.host &&
    childUrl.pathname.startsWith(rootUrl.pathname)
  );
}

async function readRegistryArtifact<TFramework extends CliFrameworkTarget>(
  component: ComponentFor<TFramework>,
  source: ResolvedRegistryArtifactSource,
): Promise<unknown> {
  try {
    switch (source.type) {
      case "local":
        return await readJsonFile(source.path);
      case "remote": {
        const response = await fetch(source.url);

        if (!response.ok) {
          throw new Error(`${response.status} ${response.statusText}`);
        }

        return response.json();
      }
    }
  } catch (error) {
    throw new Error(
      `Failed to load registry artifact for ${component.name} at ${component.artifact?.path}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }
}

async function loadRegistryFromSource<TFramework extends CliFrameworkTarget>(
  source: RegistrySource,
  options: RegistryPolicyOptions<TFramework>,
): Promise<StarwindRegistryFor<TFramework>> {
  const registryCache = getPolicyCache(registryCachesByPolicy, options.targetPolicy);
  const cacheKey = registrySourceKey(source);

  if (!options.forceRefresh && registryCache.has(cacheKey)) {
    return registryCache.get(cacheKey)! as Promise<StarwindRegistryFor<TFramework>>;
  }

  const registryPromise = readRegistrySource(source)
    .then((rawRegistry) => parseRegistry(rawRegistry, options.targetPolicy))
    .then((registry) => hydrateRegistry(registry, source, options));
  registryCache.set(cacheKey, registryPromise as Promise<StarwindRegistryFor<CliFrameworkTarget>>);

  return registryPromise;
}

export interface LoadRegistryOptions<
  TFramework extends CliFrameworkTarget = PublicCliFrameworkTarget,
> {
  forceRefresh?: boolean;
  targetPolicy?: FrameworkTargetPolicy<TFramework>;
}

export function loadRegistry(
  source?: RegistrySource,
  options?: LoadRegistryOptions,
): Promise<StarwindRegistry>;
export function loadRegistry<TFramework extends CliFrameworkTarget>(
  source: RegistrySource | undefined,
  options: LoadRegistryOptions<TFramework> & {
    targetPolicy: FrameworkTargetPolicy<TFramework>;
  },
): Promise<StarwindRegistryFor<TFramework>>;
export async function loadRegistry<
  TFramework extends CliFrameworkTarget = PublicCliFrameworkTarget,
>(
  source?: RegistrySource,
  options: LoadRegistryOptions<TFramework> = {},
): Promise<StarwindRegistryFor<TFramework>> {
  const targetPolicy =
    options.targetPolicy ??
    (PUBLIC_FRAMEWORK_TARGET_POLICY as unknown as FrameworkTargetPolicy<TFramework>);

  return loadRegistryFromSource(source ?? defaultRegistrySource, {
    forceRefresh: options.forceRefresh,
    targetPolicy,
  });
}

/**
 * Fetches the default Runtime component registry and returns its component list.
 * @param forceRefresh Whether to force a refresh of the cache
 * @returns A promise that resolves to an array of Components
 */
export async function getRegistry(forceRefresh = false): Promise<Component[]> {
  const registry = await loadRegistryFromSource(defaultRegistrySource, {
    forceRefresh,
    targetPolicy: PUBLIC_FRAMEWORK_TARGET_POLICY,
  });
  return registry.components;
}

/**
 * Clear the registry cache
 */
export function clearRegistryCache(): void {
  registryCachesByPolicy = new WeakMap<object, RegistryCache>();
  registryArtifactCachesByPolicy = new WeakMap<object, RegistryArtifactCache>();
}

/**
 * Get a component by name from the registry
 * @param name The name of the component to find
 * @param forceRefresh Whether to force a refresh of the registry cache
 * @returns The component or undefined if not found
 */
export async function getComponent(
  name: string,
  forceRefresh = false,
): Promise<Component | undefined> {
  const registry = await getRegistry(forceRefresh);
  return registry.find((component) => component.name === name);
}

/**
 * Get all components from the registry
 * @param forceRefresh Whether to force a refresh of the registry cache
 * @returns All components in the registry
 */
export async function getAllComponents(forceRefresh = false): Promise<Component[]> {
  return getRegistry(forceRefresh);
}
