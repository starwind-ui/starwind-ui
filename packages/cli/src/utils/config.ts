import semver from "semver";

import { PATHS } from "./constants.js";
import { fileExists, readJsonFile, writeJsonFile } from "./fs.js";
import { assertProjectRelativePath, assertSafePathSegment } from "./project-path.js";

export const CONFIG_SCHEMA_V1_URL = "https://starwind.dev/config-schema.json";
export const CONFIG_SCHEMA_V2_URL = "https://starwind.dev/config-schema.v2.json";
export const DEFAULT_STYLED_REGISTRY_REFERENCE = "default";

export type StarwindFramework = "astro" | "react";
export type StarwindRegistrySource = "bundled" | "local" | "remote";
export type StarwindComponentSource = "legacy";
export type StyledRegistryCatalog = Record<string, StyledRegistryConfig>;

export interface StyledRegistryConfig {
  source: StarwindRegistrySource;
  version: string;
  path?: string;
  url?: string;
}

export interface StarwindProRegistryConfig {
  url?: string;
  headers?: Record<string, string>;
  params?: Record<string, string>;
}

export interface StarwindProConfig {
  registry?: StarwindProRegistryConfig;
}

export interface ResolvedStarwindProRegistryConfig {
  url: string;
  headers: Record<string, string>;
  params: Record<string, string>;
}

export interface ComponentConfig {
  framework?: StarwindFramework;
  name: string;
  registry?: string;
  source?: StarwindComponentSource;
  version: string;
}

export interface PrimitiveConfig {
  framework?: StarwindFramework;
  name: string;
  source?: StarwindRegistrySource;
  version: string;
}

interface TailwindConfig {
  css: string;
  baseColor: "slate" | "gray" | "zinc" | "neutral" | "stone";
  cssVariables: boolean;
}

// interface AliasConfig {
// 	components: string;
// }

export interface StarwindConfig {
  $schema: string;
  version?: 2;
  framework?: StarwindFramework;
  /** @deprecated Private beta field. Read for compatibility, omitted from config writes. */
  componentLayer?: string;
  registry?: StyledRegistryConfig;
  registries?: StyledRegistryCatalog;
  pro?: StarwindProConfig;
  tailwind: TailwindConfig;
  // aliases: AliasConfig;
  componentDir: string;
  componentDirs?: Partial<Record<StarwindFramework, string>>;
  primitiveDir?: string;
  primitiveDirs?: Partial<Record<StarwindFramework, string>>;
  utilsDir?: string;
  components: ComponentConfig[];
  primitives?: PrimitiveConfig[];
  /** @deprecated Private beta field. Read for compatibility, omitted from config writes. */
  packageRequirements?: Record<string, string>;
}

const STARWIND_CONFIG_KEY_ORDER = [
  "$schema",
  "version",
  "framework",
  "registry",
  "registries",
  "pro",
  "components",
  "primitives",
  "tailwind",
  "componentDir",
  "componentDirs",
  "primitiveDir",
  "primitiveDirs",
  "utilsDir",
] as const;

const defaultConfig: StarwindConfig = {
  $schema: CONFIG_SCHEMA_V1_URL,
  tailwind: {
    css: "src/styles/starwind.css",
    baseColor: "neutral",
    cssVariables: true,
  },
  // aliases: {
  // 	components: "@/components",
  // },
  componentDir: PATHS.LOCAL_STARWIND_COMPONENTS_DIR,
  utilsDir: PATHS.LOCAL_UTILS_DIR,
  components: [],
};

const defaultV2Config: StarwindConfig = {
  ...defaultConfig,
  $schema: CONFIG_SCHEMA_V2_URL,
  version: 2,
  framework: "astro",
  registry: {
    source: "bundled",
    version: "0.1.0",
  },
};

const defaultStarwindProHeaders = {
  Authorization: "Bearer ${STARWIND_LICENSE_KEY}",
};

const officialStarwindProRegistryOrigin = new URL(PATHS.STARWIND_PRO_REGISTRY).origin;
const STARWIND_PRO_TRUSTED_ORIGINS_ENV = "STARWIND_PRO_TRUSTED_ORIGINS";

function getStarwindProRegistryOrigin(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

function isOfficialStarwindProRegistryUrl(url: string): boolean {
  return getStarwindProRegistryOrigin(url) === officialStarwindProRegistryOrigin;
}

export const DEFAULT_STARWIND_PRO_REGISTRY_CONFIG: ResolvedStarwindProRegistryConfig = {
  url: PATHS.STARWIND_PRO_REGISTRY,
  headers: defaultStarwindProHeaders,
  params: {},
};

export function getDefaultStarwindProAuthConfig(): StarwindProConfig {
  return {
    registry: {
      headers: { ...DEFAULT_STARWIND_PRO_REGISTRY_CONFIG.headers },
    },
  };
}

function getAuthorizationHeader(headers: Record<string, string> | undefined): string | undefined {
  if (!headers) return undefined;

  const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === "authorization");
  return entry?.[1];
}

export function hasStarwindProAuthConfig(config: Partial<StarwindConfig>): boolean {
  const authorization = getAuthorizationHeader(config.pro?.registry?.headers);
  return typeof authorization === "string" && authorization.trim().length > 0;
}

export type StarwindConfigState =
  | { status: "missing"; config: StarwindConfig }
  | { status: "legacy"; config: StarwindConfig }
  | { status: "current"; config: StarwindConfig };

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeStringRecord(label: string, value: unknown): Record<string, string> | undefined {
  if (value === undefined) return undefined;

  if (!isObject(value)) {
    throw new Error(`Invalid Starwind config ${label}`);
  }

  const normalized: Record<string, string> = {};
  for (const [key, entryValue] of Object.entries(value)) {
    if (typeof entryValue !== "string") {
      throw new Error(`Invalid Starwind config ${label}.${key}`);
    }

    normalized[key] = entryValue;
  }

  return normalized;
}

function validateFramework(value: unknown): asserts value is StarwindFramework {
  if (value !== "astro" && value !== "react") {
    throw new Error(`Invalid Starwind config framework "${String(value)}"`);
  }
}

function validateRegistrySource(value: unknown): asserts value is StarwindRegistrySource {
  if (value !== "bundled" && value !== "local" && value !== "remote") {
    throw new Error(`Invalid Starwind config registry source "${String(value)}"`);
  }
}

function validateSemverVersion(label: string, value: string): void {
  if (semver.valid(value) === null) {
    throw new Error(`Invalid Starwind config ${label} "${value}". Expected a semver version.`);
  }
}

function validateStyledRegistryConfig(
  label: string,
  registry: StyledRegistryConfig,
  options: { allowBundled: boolean },
): void {
  validateRegistrySource(registry.source);

  if (!options.allowBundled && registry.source === "bundled") {
    throw new Error(`Invalid Starwind config ${label}. Custom registries must be local or remote.`);
  }

  validateSemverVersion(`${label} version`, registry.version);

  if (registry.source === "local" && (!registry.path || registry.path.length === 0)) {
    throw new Error(`Invalid Starwind config ${label}.path`);
  }

  if (registry.source === "remote" && (!registry.url || registry.url.length === 0)) {
    throw new Error(`Invalid Starwind config ${label}.url`);
  }
}

function normalizeComponent(component: unknown): ComponentConfig {
  if (!isObject(component)) {
    throw new Error("Invalid Starwind config component entry");
  }

  if (typeof component.name !== "string" || component.name.length === 0) {
    throw new Error("Invalid Starwind config component name");
  }

  assertSafePathSegment(component.name, "Starwind config component name");

  if (typeof component.version !== "string" || component.version.length === 0) {
    throw new Error(`Invalid Starwind config component version for "${component.name}"`);
  }

  const normalized: ComponentConfig = {
    name: component.name,
    version: component.version,
  };

  if (component.framework !== undefined) {
    validateFramework(component.framework);
    normalized.framework = component.framework;
  }

  if (component.registry !== undefined) {
    if (typeof component.registry !== "string" || component.registry.length === 0) {
      throw new Error(`Invalid Starwind config component registry for "${component.name}"`);
    }

    normalized.registry = component.registry;
  }

  if (component.source !== undefined) {
    if (component.source !== "legacy") {
      throw new Error(`Invalid Starwind config component source "${String(component.source)}"`);
    }

    normalized.source = component.source;
  }

  return normalized;
}

function normalizeStyledRegistryConfig(
  label: string,
  registry: unknown,
  options: { allowBundled: boolean },
): StyledRegistryConfig | undefined {
  if (registry === undefined) return undefined;

  if (!isObject(registry)) {
    throw new Error(`Invalid Starwind config ${label}`);
  }

  validateRegistrySource(registry.source);

  if (!options.allowBundled && registry.source === "bundled") {
    throw new Error(`Invalid Starwind config ${label}. Custom registries must be local or remote.`);
  }

  if (typeof registry.version !== "string" || registry.version.length === 0) {
    throw new Error(`Invalid Starwind config ${label}.version`);
  }

  const normalized: StyledRegistryConfig = {
    source: registry.source,
    version: registry.version,
  };

  if (registry.path !== undefined) {
    if (typeof registry.path !== "string" || registry.path.length === 0) {
      throw new Error(`Invalid Starwind config ${label}.path`);
    }

    normalized.path = registry.path;
  }

  if (registry.url !== undefined) {
    if (typeof registry.url !== "string" || registry.url.length === 0) {
      throw new Error(`Invalid Starwind config ${label}.url`);
    }

    normalized.url = registry.url;
  }

  return normalized;
}

function normalizeStyledRegistryCatalog(value: unknown): StyledRegistryCatalog | undefined {
  if (value === undefined) return undefined;

  if (!isObject(value)) {
    throw new Error("Invalid Starwind config registries");
  }

  const normalized: StyledRegistryCatalog = {};

  for (const [id, registry] of Object.entries(value)) {
    if (id.length === 0 || id === DEFAULT_STYLED_REGISTRY_REFERENCE) {
      throw new Error(`Invalid Starwind config registries.${id || "<empty>"}`);
    }

    normalized[id] = normalizeStyledRegistryConfig(`registries.${id}`, registry, {
      allowBundled: false,
    })!;
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeFrameworkDirs(
  label: string,
  value: unknown,
): Partial<Record<StarwindFramework, string>> | undefined {
  if (value === undefined) return undefined;

  if (!isObject(value)) {
    throw new Error(`Invalid Starwind config ${label}`);
  }

  const normalized: Partial<Record<StarwindFramework, string>> = {};

  for (const [framework, dir] of Object.entries(value)) {
    if (framework !== "astro" && framework !== "react") {
      throw new Error(`Invalid Starwind config ${label}.${framework}`);
    }

    if (typeof dir !== "string" || dir.length === 0) {
      throw new Error(`Invalid Starwind config ${label}.${framework}`);
    }

    normalized[framework] = assertProjectRelativePath(dir, `Starwind config ${label}.${framework}`);
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

function normalizeComponentDirs(
  value: unknown,
): Partial<Record<StarwindFramework, string>> | undefined {
  return normalizeFrameworkDirs("componentDirs", value);
}

function normalizePrimitiveDirs(
  value: unknown,
): Partial<Record<StarwindFramework, string>> | undefined {
  return normalizeFrameworkDirs("primitiveDirs", value);
}

function normalizePrimitive(primitive: unknown): PrimitiveConfig {
  if (!isObject(primitive)) {
    throw new Error("Invalid Starwind config primitive entry");
  }

  if (typeof primitive.name !== "string" || primitive.name.length === 0) {
    throw new Error("Invalid Starwind config primitive name");
  }

  assertSafePathSegment(primitive.name, "Starwind config primitive name");

  if (typeof primitive.version !== "string" || primitive.version.length === 0) {
    throw new Error(`Invalid Starwind config primitive version for "${primitive.name}"`);
  }

  const normalized: PrimitiveConfig = {
    name: primitive.name,
    version: primitive.version,
  };

  if (primitive.framework !== undefined) {
    validateFramework(primitive.framework);
    normalized.framework = primitive.framework;
  }

  if (primitive.source !== undefined) {
    validateRegistrySource(primitive.source);
    normalized.source = primitive.source;
  }

  return normalized;
}

function normalizeStarwindProConfig(rawPro: unknown): StarwindProConfig | undefined {
  if (rawPro === undefined) return undefined;

  if (!isObject(rawPro)) {
    throw new Error("Invalid Starwind config pro");
  }

  if (rawPro.registry === undefined) return {};

  if (!isObject(rawPro.registry)) {
    throw new Error("Invalid Starwind config pro.registry");
  }

  const registry: StarwindProRegistryConfig = {};

  if (rawPro.registry.url !== undefined) {
    if (typeof rawPro.registry.url !== "string" || rawPro.registry.url.length === 0) {
      throw new Error("Invalid Starwind config pro.registry.url");
    }

    registry.url = rawPro.registry.url;
  }

  const headers = normalizeStringRecord("pro.registry.headers", rawPro.registry.headers);
  if (headers) registry.headers = headers;

  const params = normalizeStringRecord("pro.registry.params", rawPro.registry.params);
  if (params) registry.params = params;

  return { registry };
}

function validateCurrentComponentShape(
  component: ComponentConfig,
  registries: StyledRegistryCatalog | undefined,
): void {
  const hasFramework = component.framework !== undefined;
  const hasLegacySource = component.source === "legacy";

  if (hasFramework === hasLegacySource) {
    throw new Error(
      `Invalid Starwind config component "${component.name}". Expected exactly one of framework or source.`,
    );
  }

  if (hasLegacySource) {
    if (component.registry !== undefined) {
      throw new Error(`Invalid Starwind config legacy component "${component.name}" registry.`);
    }

    return;
  }

  if (typeof component.registry !== "string" || component.registry.length === 0) {
    throw new Error(`Invalid Starwind config component "${component.name}" registry.`);
  }

  if (
    component.registry !== DEFAULT_STYLED_REGISTRY_REFERENCE &&
    !registries?.[component.registry]
  ) {
    throw new Error(
      `Invalid Starwind config component "${component.name}" unknown styled registry "${component.registry}".`,
    );
  }
}

function normalizeConfig(rawConfig: unknown, fallback: StarwindConfig): StarwindConfig {
  const raw = isObject(rawConfig) ? rawConfig : {};
  const rawWithoutImplementation = { ...raw };
  delete rawWithoutImplementation.implementation;
  const tailwind = isObject(raw.tailwind) ? raw.tailwind : {};
  const registry =
    normalizeStyledRegistryConfig("registry", raw.registry, { allowBundled: true }) ??
    fallback.registry;
  const registries = normalizeStyledRegistryCatalog(raw.registries);
  const componentDirs = normalizeComponentDirs(raw.componentDirs);
  const primitiveDirs = normalizePrimitiveDirs(raw.primitiveDirs);
  const primitives = Array.isArray(raw.primitives)
    ? raw.primitives.map((primitive) => normalizePrimitive(primitive))
    : undefined;
  const componentLayer = typeof raw.componentLayer === "string" ? raw.componentLayer : undefined;
  const packageRequirements =
    isObject(raw.packageRequirements) &&
    Object.values(raw.packageRequirements).every((range) => typeof range === "string")
      ? (raw.packageRequirements as Record<string, string>)
      : undefined;

  return {
    ...fallback,
    ...rawWithoutImplementation,
    componentLayer,
    pro: normalizeStarwindProConfig(raw.pro),
    registry,
    registries,
    tailwind: {
      ...fallback.tailwind,
      ...tailwind,
    },
    componentDir:
      typeof raw.componentDir === "string" && raw.componentDir.length > 0
        ? assertProjectRelativePath(raw.componentDir, "Starwind config componentDir")
        : fallback.componentDir,
    componentDirs: componentDirs ?? fallback.componentDirs,
    primitiveDir:
      typeof raw.primitiveDir === "string" && raw.primitiveDir.length > 0
        ? assertProjectRelativePath(raw.primitiveDir, "Starwind config primitiveDir")
        : fallback.primitiveDir,
    primitiveDirs: primitiveDirs ?? fallback.primitiveDirs,
    utilsDir:
      typeof raw.utilsDir === "string" && raw.utilsDir.length > 0
        ? assertProjectRelativePath(raw.utilsDir, "Starwind config utilsDir")
        : fallback.utilsDir,
    components: Array.isArray(raw.components)
      ? raw.components.map((component) => normalizeComponent(component))
      : [],
    primitives,
    packageRequirements,
  };
}

function mergeStarwindProRegistryConfig(
  current: StarwindProRegistryConfig | undefined,
  updates: StarwindProRegistryConfig | undefined,
): StarwindProRegistryConfig | undefined {
  if (updates === undefined) return current;

  return {
    ...current,
    ...updates,
    headers: updates.headers ?? current?.headers,
    params: updates.params ?? current?.params,
  };
}

function mergeStarwindProConfig(
  current: StarwindProConfig | undefined,
  updates: StarwindProConfig | undefined,
): StarwindProConfig | undefined {
  if (updates === undefined) return current;

  return {
    ...current,
    ...updates,
    registry: mergeStarwindProRegistryConfig(current?.registry, updates.registry),
  };
}

function mergeStyledRegistryCatalog(
  current: StyledRegistryCatalog | undefined,
  updates: StyledRegistryCatalog | undefined,
): StyledRegistryCatalog | undefined {
  if (updates === undefined) return current;

  const merged = {
    ...current,
    ...updates,
  };

  return Object.keys(merged).length > 0 ? merged : undefined;
}

function mergeComponentDirs(
  current: Partial<Record<StarwindFramework, string>> | undefined,
  updates: Partial<Record<StarwindFramework, string>> | undefined,
): Partial<Record<StarwindFramework, string>> | undefined {
  if (updates === undefined) return current;

  const merged = {
    ...current,
    ...updates,
  };

  return Object.keys(merged).length > 0 ? merged : undefined;
}

function mergePrimitiveDirs(
  current: Partial<Record<StarwindFramework, string>> | undefined,
  updates: Partial<Record<StarwindFramework, string>> | undefined,
): Partial<Record<StarwindFramework, string>> | undefined {
  if (updates === undefined) return current;

  const merged = {
    ...current,
    ...updates,
  };

  return Object.keys(merged).length > 0 ? merged : undefined;
}

function getComponentConfigKey(
  component: ComponentConfig,
  fallbackFramework: StarwindFramework | undefined,
): string {
  if (component.source) {
    return `${component.source}:${component.name}`;
  }

  return `${component.framework ?? fallbackFramework ?? "unknown"}:${component.name}`;
}

function getPrimitiveConfigKey(
  primitive: PrimitiveConfig,
  fallbackFramework: StarwindFramework | undefined,
): string {
  return `${primitive.framework ?? fallbackFramework ?? "unknown"}:${primitive.name}`;
}

function getDefaultAlternativeComponentDir(framework: StarwindFramework): string {
  return `src/components/starwind-${framework}`;
}

export function getStyledComponentDir(
  config: StarwindConfig,
  framework?: StarwindFramework,
): string {
  const targetFramework = framework ?? config.framework;
  const primaryFramework = config.framework;

  if (targetFramework && primaryFramework && targetFramework !== primaryFramework) {
    return (
      config.componentDirs?.[targetFramework] ?? getDefaultAlternativeComponentDir(targetFramework)
    );
  }

  return config.componentDir;
}

export function getStyledComponentDirConfigUpdate(
  config: StarwindConfig,
  framework: StarwindFramework,
  componentDir: string,
): Partial<Pick<StarwindConfig, "componentDir" | "componentDirs">> {
  const primaryFramework = config.framework;

  if (!primaryFramework || framework === primaryFramework) {
    return { componentDir };
  }

  return {
    componentDirs: {
      [framework]: componentDir,
    },
  };
}

function orderStarwindConfig(config: StarwindConfig): StarwindConfig {
  const configRecord = config as StarwindConfig & Record<string, unknown>;
  const orderedConfig: Record<string, unknown> = {};
  const orderedKeys = new Set<string>(STARWIND_CONFIG_KEY_ORDER);

  for (const key of STARWIND_CONFIG_KEY_ORDER) {
    if (key in configRecord) {
      orderedConfig[key] = configRecord[key];
    }
  }

  for (const [key, value] of Object.entries(configRecord)) {
    if (!orderedKeys.has(key)) {
      orderedConfig[key] = value;
    }
  }

  return orderedConfig as unknown as StarwindConfig;
}

const envPlaceholderPattern = /\${(\w+)}/g;
const sensitiveStarwindProHeaderNames = new Set([
  "authorization",
  "proxy-authorization",
  "cookie",
  "set-cookie",
]);

function hasEnvPlaceholder(value: string): boolean {
  return /\${\w+}/.test(value);
}

function hasDefaultLicensePlaceholderInUrlQuery(url: string): boolean {
  const queryStart = url.indexOf("?");
  if (queryStart === -1) return false;

  const fragmentStart = url.indexOf("#", queryStart);
  const query = url.slice(queryStart + 1, fragmentStart === -1 ? undefined : fragmentStart);
  return query.includes("${STARWIND_LICENSE_KEY}");
}

function isSensitiveStarwindProHeader(name: string, value: string): boolean {
  const normalizedName = name.toLowerCase();

  return (
    sensitiveStarwindProHeaderNames.has(normalizedName) ||
    normalizedName.includes("api-key") ||
    normalizedName.includes("token") ||
    hasEnvPlaceholder(value)
  );
}

function hasSensitiveStarwindProHeaders(headers: Record<string, string>): boolean {
  return Object.entries(headers).some(([name, value]) => isSensitiveStarwindProHeader(name, value));
}

export function assertTrustedStarwindProRegistryOrigin(
  url: string,
  headers: Record<string, string>,
  env: Record<string, string | undefined> = process.env,
): void {
  if (!hasSensitiveStarwindProHeaders(headers)) return;

  const origin = getStarwindProRegistryOrigin(url);
  if (!origin) throw new Error("Invalid Starwind Pro registry URL.");
  if (origin === officialStarwindProRegistryOrigin) return;

  const trustedOrigins = parseTrustedStarwindProOrigins(env);
  if (!trustedOrigins.has(origin)) {
    throw new Error(
      `Untrusted Starwind Pro registry origin "${origin}" for sensitive headers. Add the exact origin to ${STARWIND_PRO_TRUSTED_ORIGINS_ENV}.`,
    );
  }
}

function invalidTrustedOriginsError(): Error {
  return new Error(
    `Invalid ${STARWIND_PRO_TRUSTED_ORIGINS_ENV}. Expected comma-separated exact HTTP(S) origins without paths, wildcards, or credentials.`,
  );
}

function hasExactOriginShape(value: string): boolean {
  const schemeSeparator = value.indexOf("://");
  if (schemeSeparator === -1) return false;

  const authorityAndSuffix = value.slice(schemeSeparator + 3);
  const suffixStart = authorityAndSuffix.search(/[/?#\\]/);
  if (suffixStart === -1) return true;

  return authorityAndSuffix.slice(suffixStart) === "/";
}

function parseTrustedStarwindProOrigins(env: Record<string, string | undefined>): Set<string> {
  const configuredOrigins = env[STARWIND_PRO_TRUSTED_ORIGINS_ENV];
  if (!configuredOrigins?.trim()) return new Set();

  const trustedOrigins = new Set<string>();

  for (const rawEntry of configuredOrigins.split(",")) {
    const entry = rawEntry.trim();
    if (!entry || entry.includes("*")) throw invalidTrustedOriginsError();

    let url: URL;
    try {
      url = new URL(entry);
    } catch {
      throw invalidTrustedOriginsError();
    }

    if (
      (url.protocol !== "https:" && url.protocol !== "http:") ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash ||
      !hasExactOriginShape(entry)
    ) {
      throw invalidTrustedOriginsError();
    }

    trustedOrigins.add(url.origin);
  }

  return trustedOrigins;
}

function expandEnvPlaceholders(value: string, env: Record<string, string | undefined>): string {
  return value.replace(envPlaceholderPattern, (_match, key: string) => env[key] ?? "");
}

function shouldIncludeExpandedValue(originalValue: string, expandedValue: string): boolean {
  const trimmedExpanded = expandedValue.trim();

  if (!trimmedExpanded) return false;
  if (!originalValue.includes("${")) return true;

  const templateWithoutVars = originalValue.replace(envPlaceholderPattern, "").trim();
  return trimmedExpanded !== templateWithoutVars;
}

function expandOptionalStringRecord(
  values: Record<string, string>,
  env: Record<string, string | undefined>,
): Record<string, string> {
  const expanded: Record<string, string> = {};

  for (const [key, value] of Object.entries(values)) {
    const expandedValue = expandEnvPlaceholders(value, env);
    if (shouldIncludeExpandedValue(value, expandedValue)) {
      expanded[key] = expandedValue;
    }
  }

  return expanded;
}

export function resolveStarwindProRegistryConfig(
  config?: Partial<StarwindConfig>,
): ResolvedStarwindProRegistryConfig {
  const registry = config?.pro?.registry;

  return {
    url: registry?.url ?? DEFAULT_STARWIND_PRO_REGISTRY_CONFIG.url,
    headers: registry?.headers
      ? { ...registry.headers }
      : isOfficialStarwindProRegistryUrl(registry?.url ?? DEFAULT_STARWIND_PRO_REGISTRY_CONFIG.url)
        ? { ...DEFAULT_STARWIND_PRO_REGISTRY_CONFIG.headers }
        : {},
    params: registry?.params ? { ...registry.params } : {},
  };
}

export function resolveStarwindProRegistryRequest(
  config?: Partial<StarwindConfig>,
  env: Record<string, string | undefined> = process.env,
): ResolvedStarwindProRegistryConfig {
  const configuredRegistry = config?.pro?.registry;
  const params = configuredRegistry?.params ?? {};
  const urlTemplate = configuredRegistry?.url ?? DEFAULT_STARWIND_PRO_REGISTRY_CONFIG.url;

  if (
    Object.values(params).some((value) => value.includes("${STARWIND_LICENSE_KEY}")) ||
    hasDefaultLicensePlaceholderInUrlQuery(urlTemplate)
  ) {
    throw new Error(
      "Invalid Starwind Pro registry query params. STARWIND_LICENSE_KEY must be sent as a header.",
    );
  }

  const url = expandEnvPlaceholders(urlTemplate, env);
  const headers =
    configuredRegistry?.headers ??
    (isOfficialStarwindProRegistryUrl(url) ? DEFAULT_STARWIND_PRO_REGISTRY_CONFIG.headers : {});
  assertTrustedStarwindProRegistryOrigin(url, configuredRegistry?.headers ?? headers, env);

  return {
    url,
    headers: expandOptionalStringRecord(headers, env),
    params: expandOptionalStringRecord(params, env),
  };
}

export function parseCurrentConfig(rawConfig: unknown): StarwindConfig {
  const raw = isObject(rawConfig) ? rawConfig : {};
  const normalized = normalizeConfig(rawConfig, defaultV2Config);

  if (normalized.version !== 2) {
    throw new Error("Invalid Starwind config version. Expected version 2.");
  }

  validateFramework(raw.framework);

  if (!normalized.registry) {
    throw new Error("Invalid Starwind config registry");
  }

  validateStyledRegistryConfig("registry", normalized.registry, { allowBundled: true });

  for (const [id, registry] of Object.entries(normalized.registries ?? {})) {
    validateStyledRegistryConfig(`registries.${id}`, registry, { allowBundled: false });
  }

  for (const component of normalized.components) {
    validateCurrentComponentShape(component, normalized.registries);
    validateSemverVersion(`component "${component.name}" version`, component.version);
  }

  for (const primitive of normalized.primitives ?? []) {
    validateSemverVersion(`primitive "${primitive.name}" version`, primitive.version);
  }

  return normalized;
}

/**
 * Get the current config, ensuring the file is fully read
 */
export async function getConfig(): Promise<StarwindConfig> {
  let config: unknown;

  try {
    config = await readJsonFile(PATHS.LOCAL_CONFIG_FILE);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return normalizeConfig({}, defaultConfig);
    }

    throw new Error(`Failed to load ${PATHS.LOCAL_CONFIG_FILE}`, { cause: error });
  }

  try {
    return isObject(config) && config.version === 2
      ? parseCurrentConfig(config)
      : normalizeConfig(config, defaultConfig);
  } catch (error) {
    throw new Error(`Failed to load ${PATHS.LOCAL_CONFIG_FILE}`, { cause: error });
  }
}

/**
 * Reads the config with enough metadata for migration-aware commands.
 */
export async function getConfigState(): Promise<StarwindConfigState> {
  if (!(await fileExists(PATHS.LOCAL_CONFIG_FILE))) {
    return { status: "missing", config: defaultV2Config };
  }

  const rawConfig = await readJsonFile(PATHS.LOCAL_CONFIG_FILE);

  if (isObject(rawConfig) && rawConfig.version === 2) {
    return { status: "current", config: parseCurrentConfig(rawConfig) };
  }

  return { status: "legacy", config: normalizeConfig(rawConfig, defaultConfig) };
}

/**
 * Options for updating the config file
 */
export interface UpdateConfigOptions {
  /** If true, append new components to existing array. If false, replace the components array. */
  appendComponents?: boolean;
}

/**
 * Update the config file, ensuring the write operation is completed
 * @param updates - Partial config object to update
 * @param options - Options for updating the config
 */
export async function updateConfig(
  updates: Partial<StarwindConfig>,
  options: UpdateConfigOptions = { appendComponents: true },
): Promise<void> {
  const currentConfig = await getConfig();

  // Ensure components array exists
  const currentComponents = Array.isArray(currentConfig.components) ? currentConfig.components : [];
  const nextFramework = updates.framework ?? currentConfig.framework;
  const nextVersion = updates.version ?? currentConfig.version;
  const nextRegistries = mergeStyledRegistryCatalog(currentConfig.registries, updates.registries);
  const nextComponentDirs = mergeComponentDirs(currentConfig.componentDirs, updates.componentDirs);
  const nextPrimitiveDirs = mergePrimitiveDirs(currentConfig.primitiveDirs, updates.primitiveDirs);
  const incomingComponents =
    updates.components?.map((component) => {
      if (
        nextVersion === 2 &&
        nextFramework &&
        component.framework === undefined &&
        component.source === undefined
      ) {
        return {
          ...component,
          framework: nextFramework,
          registry: component.registry ?? DEFAULT_STYLED_REGISTRY_REFERENCE,
        };
      }

      if (
        nextVersion === 2 &&
        component.framework !== undefined &&
        component.source === undefined &&
        component.registry === undefined
      ) {
        return {
          ...component,
          registry: DEFAULT_STYLED_REGISTRY_REFERENCE,
        };
      }

      return component;
    }) ?? undefined;

  // When appending components, deduplicate by name (newer entries override older ones)
  let finalComponents = currentComponents;
  if (incomingComponents) {
    if (options.appendComponents) {
      // Create a map to deduplicate by name, with newer entries taking precedence
      const componentMap = new Map<string, ComponentConfig>();
      for (const comp of currentComponents) {
        componentMap.set(getComponentConfigKey(comp, currentConfig.framework), comp);
      }
      for (const comp of incomingComponents) {
        componentMap.set(getComponentConfigKey(comp, nextFramework), comp);
      }
      finalComponents = Array.from(componentMap.values());
    } else {
      finalComponents = incomingComponents;
    }
  }

  const currentPrimitives = Array.isArray(currentConfig.primitives) ? currentConfig.primitives : [];
  let finalPrimitives = currentPrimitives;
  if (updates.primitives) {
    if (options.appendComponents) {
      const primitiveMap = new Map<string, PrimitiveConfig>();
      for (const primitive of currentPrimitives) {
        primitiveMap.set(getPrimitiveConfigKey(primitive, currentConfig.framework), primitive);
      }
      for (const primitive of updates.primitives) {
        primitiveMap.set(getPrimitiveConfigKey(primitive, nextFramework), primitive);
      }
      finalPrimitives = Array.from(primitiveMap.values());
    } else {
      finalPrimitives = updates.primitives;
    }
  }

  const newConfig = orderStarwindConfig({
    ...currentConfig,
    $schema: updates.$schema ?? currentConfig.$schema,
    version: nextVersion,
    framework: nextFramework,
    componentLayer: undefined,
    registry: updates.registry ?? currentConfig.registry,
    registries: nextRegistries,
    pro: mergeStarwindProConfig(currentConfig.pro, updates.pro),
    tailwind: {
      ...currentConfig.tailwind,
      ...(updates.tailwind || {}),
    },
    componentDir: updates.componentDir ? updates.componentDir : currentConfig.componentDir,
    componentDirs: nextComponentDirs,
    primitiveDir: updates.primitiveDir ? updates.primitiveDir : currentConfig.primitiveDir,
    primitiveDirs: nextPrimitiveDirs,
    utilsDir: updates.utilsDir
      ? updates.utilsDir
      : (currentConfig.utilsDir ?? defaultConfig.utilsDir),
    components: finalComponents,
    primitives: finalPrimitives.length > 0 ? finalPrimitives : undefined,
    packageRequirements: undefined,
  });

  try {
    // Compile-time project-root filename; never derived from config, registry, or CLI options.
    await writeJsonFile(PATHS.LOCAL_CONFIG_FILE, newConfig);
  } catch (error) {
    throw new Error(
      `Failed to update config: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

export async function setupStarwindProConfig(): Promise<void> {
  const currentConfig = await getConfig();
  const currentRegistry = currentConfig.pro?.registry;
  const currentHeaders = currentRegistry?.headers ?? {};
  const hasAuthorization = hasStarwindProAuthConfig(currentConfig);

  await updateConfig({
    pro: {
      registry: {
        ...currentRegistry,
        headers: {
          ...currentHeaders,
          ...(hasAuthorization ? {} : DEFAULT_STARWIND_PRO_REGISTRY_CONFIG.headers),
        },
      },
    },
  });
}
