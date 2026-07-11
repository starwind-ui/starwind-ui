import path from "node:path";

import fs from "fs-extra";
import { z } from "zod";

import {
  assertTrustedStarwindProRegistryOrigin,
  resolveStarwindProRegistryRequest,
  type StarwindConfig,
  type StarwindProRegistryConfig,
} from "./config.js";
import { PATHS } from "./constants.js";
import { filterUninstalledDependencies } from "./dependency-resolver.js";
import { installDependencies, type PackageManager } from "./package-manager.js";
import { parsePackageSpec } from "./package-spec.js";
import { resolveProjectMutationPath, resolveProjectPathLexically } from "./project-path.js";

export const STARWIND_PRO_REGISTRY_PREFIX = "@starwind-pro/";

const proRegistryFileSchema = z.object({
  path: z.string().optional(),
  type: z.enum(["registry:block", "registry:lib"]),
  target: z.string().min(1),
  content: z.string(),
});

function proRegistryPackageSpecSchema(field: string) {
  return z.string().superRefine((value, ctx) => {
    try {
      parsePackageSpec(value, field);
    } catch (error) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: error instanceof Error ? error.message : `Invalid ${field}`,
      });
    }
  });
}

const proRegistryDependencySchema = proRegistryPackageSpecSchema("Pro registry dependency");
const proRegistryDevDependencySchema = proRegistryPackageSpecSchema("Pro registry dev dependency");

const proRegistryItemSchema = z
  .object({
    $schema: z.string().optional(),
    name: z.string().min(1),
    type: z.enum(["registry:block", "registry:lib"]),
    title: z.string().optional(),
    description: z.string().optional(),
    author: z.string().optional(),
    dependencies: z.array(proRegistryDependencySchema).default([]),
    devDependencies: z.array(proRegistryDevDependencySchema).default([]),
    registryDependencies: z.array(z.string()).default([]),
    files: z.array(proRegistryFileSchema).min(1),
    categories: z.array(z.string()).optional(),
    meta: z
      .object({
        plan: z.enum(["free", "pro"]).optional(),
        version: z.string().optional(),
        framework: z.string().optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();

export type ProRegistryItem = z.infer<typeof proRegistryItemSchema>;

export type ProRegistryInstallStatus = {
  name: string;
  status: "installed" | "skipped" | "failed";
  authFailure?: boolean;
  version?: string;
  error?: string;
  skippedFiles?: string[];
  writtenFiles?: string[];
};

export type ProRegistryInstallSummary = {
  failed: ProRegistryInstallStatus[];
  installed: ProRegistryInstallStatus[];
  skipped: ProRegistryInstallStatus[];
};

export type InstallProRegistryItemsOptions = {
  config: StarwindConfig;
  env?: Record<string, string | undefined>;
  fetcher?: typeof fetch;
  overwrite?: boolean;
  packageManager?: PackageManager;
};

type PreparedProRegistryFile = {
  content: string;
  destination: string;
  path: string;
};

type PlannedProRegistryItem = {
  item: ProRegistryItem;
  ref: string;
};

type ProRegistryInstallPlanContext = {
  options: InstallProRegistryItemsOptions;
  orderedItems: PlannedProRegistryItem[];
  requestEnv: Record<string, string | undefined>;
  resolving: string[];
  seen: Set<string>;
};

const PRO_REGISTRY_ENV_FILES = [".env.local", ".env.development.local", ".env.development", ".env"];

class ProRegistryHttpError extends Error {
  readonly authFailure: boolean;

  constructor(message: string, options: { authFailure: boolean }) {
    super(message);
    this.name = "ProRegistryHttpError";
    this.authFailure = options.authFailure;
  }
}

export function isStarwindProRegistryItem(value: string): boolean {
  return (
    value.startsWith(STARWIND_PRO_REGISTRY_PREFIX) &&
    value.length > STARWIND_PRO_REGISTRY_PREFIX.length
  );
}

export function getStarwindProRegistryItemName(value: string): string {
  if (!isStarwindProRegistryItem(value)) {
    throw new Error(`Unsupported Pro registry item "${value}". Expected @starwind-pro/<name>.`);
  }

  return value.slice(STARWIND_PRO_REGISTRY_PREFIX.length);
}

export async function installProRegistryItems(
  itemRefs: string[],
  options: InstallProRegistryItemsOptions,
): Promise<ProRegistryInstallSummary> {
  const summary: ProRegistryInstallSummary = {
    failed: [],
    installed: [],
    skipped: [],
  };
  const requestEnv = options.env ?? (await loadProRegistryEnv());
  const context: ProRegistryInstallPlanContext = {
    options,
    orderedItems: [],
    requestEnv,
    resolving: [],
    seen: new Set(),
  };

  try {
    for (const itemRef of itemRefs) {
      await collectProRegistryInstallPlan(itemRef, context);
    }

    const preparedItems = await Promise.all(
      context.orderedItems.map(async ({ item, ref }) => ({
        item,
        ref,
        files: await resolvePreparedProRegistryFiles(prepareProRegistryFiles(item, options.config)),
      })),
    );

    await installProRegistryPackages(context.orderedItems, options.packageManager ?? "npm");

    for (const { files, item, ref } of preparedItems) {
      const writeResult = await writePreparedProRegistryFiles(files, options.overwrite);
      const status = writeResult.skipped.length > 0 ? "skipped" : "installed";

      summary[status === "installed" ? "installed" : "skipped"].push({
        name: ref,
        status,
        version: item.meta?.version,
        skippedFiles: writeResult.skipped,
        writtenFiles: writeResult.written,
      });
    }
  } catch (error) {
    const authFailure = error instanceof ProRegistryHttpError && error.authFailure;

    summary.failed.push(
      ...itemRefs.map((itemRef) => ({
        name: itemRef,
        status: "failed" as const,
        ...(authFailure ? { authFailure } : {}),
        error: error instanceof Error ? error.message : String(error),
      })),
    );
  }

  return summary;
}

async function collectProRegistryInstallPlan(
  itemRef: string,
  context: ProRegistryInstallPlanContext,
): Promise<void> {
  validateProRegistryDependencyRef(itemRef);

  if (context.seen.has(itemRef)) return;

  const cycleStartIndex = context.resolving.indexOf(itemRef);
  if (cycleStartIndex !== -1) {
    const cycle = [...context.resolving.slice(cycleStartIndex), itemRef].join(" -> ");
    throw new Error(`Dependency cycle detected in Pro registry dependencies: ${cycle}`);
  }

  context.resolving.push(itemRef);

  try {
    const itemName = getStarwindProRegistryItemName(itemRef);
    const item = await fetchProRegistryItem(itemName, itemRef, context);

    for (const dependencyRef of item.registryDependencies) {
      validateProRegistryDependencyRef(dependencyRef);
      await collectProRegistryInstallPlan(dependencyRef, context);
    }

    context.seen.add(itemRef);
    context.orderedItems.push({ item, ref: itemRef });
  } finally {
    context.resolving.pop();
  }
}

function validateProRegistryDependencyRef(itemRef: string): void {
  if (!isStarwindProRegistryItem(itemRef)) {
    throw new Error(
      `Unsupported Pro registry dependency "${itemRef}". Only @starwind-pro/<name> dependencies are supported.`,
    );
  }
}

async function installProRegistryPackages(
  plannedItems: PlannedProRegistryItem[],
  packageManager: PackageManager,
): Promise<void> {
  const dependencies = dedupeStrings(plannedItems.flatMap(({ item }) => item.dependencies));
  const devDependencies = dedupeStrings(plannedItems.flatMap(({ item }) => item.devDependencies));

  const dependenciesToInstall = await filterUninstalledDependencies(dependencies);
  if (dependenciesToInstall.length > 0) {
    await installDependencies(dependenciesToInstall, packageManager);
  }

  const devDependenciesToInstall = await filterUninstalledDependencies(devDependencies);
  if (devDependenciesToInstall.length > 0) {
    await installDependencies(devDependenciesToInstall, packageManager, true);
  }
}

function dedupeStrings(values: string[]): string[] {
  return [...new Set(values)];
}

async function fetchProRegistryItem(
  itemName: string,
  itemRef: string,
  context: ProRegistryInstallPlanContext,
): Promise<ProRegistryItem> {
  const request = resolveStarwindProRegistryRequest(context.options.config, context.requestEnv);
  const url = buildProRegistryItemUrl(request, itemName);
  const fetcher = context.options.fetcher ?? globalThis.fetch;

  const response = await fetchProRegistryResponse(
    fetcher,
    url,
    request.headers,
    context.requestEnv,
  );

  if (!response.ok) {
    const responseError = await formatRegistryResponseError(response);
    throw new ProRegistryHttpError(responseError.message, {
      authFailure: responseError.authFailure,
    });
  }

  return parseProRegistryItem(await response.json(), itemRef, itemName);
}

async function fetchProRegistryResponse(
  fetcher: typeof fetch,
  initialUrl: string,
  headers: Record<string, string>,
  env: Record<string, string | undefined>,
): Promise<Response> {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= 5; redirectCount += 1) {
    assertTrustedStarwindProRegistryOrigin(currentUrl, headers, env);
    const response = await fetcher(currentUrl, { headers, redirect: "manual" });

    if (response.status < 300 || response.status >= 400) return response;

    const location = response.headers?.get("location");
    if (!location) {
      throw new Error(
        `Starwind Pro registry redirect from ${new URL(currentUrl).origin} is missing a Location header.`,
      );
    }

    currentUrl = new URL(location, currentUrl).href;
  }

  throw new Error("Starwind Pro registry exceeded the maximum redirect depth.");
}

function parseProRegistryItem(
  rawItem: unknown,
  itemRef: string,
  itemName: string,
): ProRegistryItem {
  let item: ProRegistryItem;

  try {
    item = proRegistryItemSchema.parse(rawItem);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstIssue = error.issues[0];
      const issuePath = firstIssue?.path.join(".") || "item";
      const message = firstIssue?.message || "Invalid registry item";
      throw new Error(
        `Invalid Starwind Pro registry item for ${itemRef} at ${issuePath}: ${message}`,
      );
    }

    throw error;
  }

  if (item.name !== itemName) {
    throw new Error(
      `Invalid Starwind Pro registry item for ${itemRef}: expected item name "${itemName}" but received "${item.name}".`,
    );
  }

  return item;
}

function buildProRegistryItemUrl(config: StarwindProRegistryConfig, itemName: string): string {
  const encodedName = encodeURIComponent(itemName);
  const baseUrl = (config.url ?? PATHS.STARWIND_PRO_REGISTRY).includes("{name}")
    ? (config.url ?? PATHS.STARWIND_PRO_REGISTRY).replaceAll("{name}", encodedName)
    : `${(config.url ?? PATHS.STARWIND_PRO_REGISTRY).replace(/\/+$/, "")}/${encodedName}`;

  let url: URL;
  try {
    url = new URL(baseUrl);
  } catch {
    throw new Error(
      `Invalid Starwind Pro registry URL "${config.url ?? PATHS.STARWIND_PRO_REGISTRY}".`,
    );
  }

  for (const [key, value] of Object.entries(config.params ?? {})) {
    url.searchParams.set(key, value);
  }

  return url.toString();
}

function prepareProRegistryFiles(
  item: ProRegistryItem,
  config: StarwindConfig,
): PreparedProRegistryFile[] {
  return item.files.map((file) => {
    const destination = resolveSafeRegistryTargetPath(file.target, config);

    return {
      content: file.content,
      destination,
      path: toPortablePath(path.relative(process.cwd(), destination)),
    };
  });
}

function resolveSafeRegistryTargetPath(target: string, config: StarwindConfig): string {
  const normalized = target.replace(/\\/g, "/");

  if (path.posix.isAbsolute(normalized) || path.win32.isAbsolute(target)) {
    throw new Error(`Registry file target "${target}" must be a relative path.`);
  }

  const safePath = path.posix.normalize(normalized);
  if (safePath.startsWith("..") || safePath === ".") {
    throw new Error(`Registry file target "${target}" contains an invalid path.`);
  }

  const projectRelativeTarget = mapShadcnTargetToProjectPath(safePath, config);
  return resolveProjectPathLexically(projectRelativeTarget);
}

function mapShadcnTargetToProjectPath(target: string, config: StarwindConfig): string {
  if (target === "components" || target.startsWith("components/")) {
    const componentRoot = inferComponentAliasRoot(config.componentDir);
    return toPortablePath(path.posix.join(componentRoot, target.slice("components".length)));
  }

  if (target === "lib/utils" || target.startsWith("lib/utils/")) {
    const utilsDir = toPortablePath(config.utilsDir ?? PATHS.LOCAL_UTILS_DIR);
    return toPortablePath(path.posix.join(utilsDir, target.slice("lib/utils".length)));
  }

  return target;
}

function inferComponentAliasRoot(componentDir: string): string {
  const normalized = toPortablePath(componentDir);

  if (normalized.endsWith("/starwind")) {
    return normalized.slice(0, -"/starwind".length);
  }

  return PATHS.LOCAL_COMPONENTS_DIR;
}

async function writePreparedProRegistryFiles(
  files: PreparedProRegistryFile[],
  overwrite = false,
): Promise<{ skipped: string[]; written: string[] }> {
  const result = {
    skipped: [] as string[],
    written: [] as string[],
  };

  for (const file of files) {
    if (!overwrite && (await fs.pathExists(file.destination))) {
      result.skipped.push(file.path);
      continue;
    }

    const directoryDestination = await resolveProjectMutationPath(file.path);
    await fs.ensureDir(path.dirname(directoryDestination));
    const fileDestination = await resolveProjectMutationPath(file.path);
    await fs.writeFile(fileDestination, file.content, "utf-8");
    result.written.push(file.path);
  }

  return result;
}

async function resolvePreparedProRegistryFiles(
  files: PreparedProRegistryFile[],
): Promise<PreparedProRegistryFile[]> {
  return Promise.all(
    files.map(async (file) => ({
      ...file,
      destination: await resolveProjectMutationPath(file.path),
    })),
  );
}

async function formatRegistryResponseError(
  response: Response,
): Promise<{ authFailure: boolean; message: string }> {
  let error: string | undefined;
  let message: string | undefined;
  let detail = "";

  try {
    const payload = await response.json();
    if (isObject(payload)) {
      message = typeof payload.message === "string" ? payload.message : undefined;
      error = typeof payload.error === "string" ? payload.error : undefined;
      detail = message ?? error ?? "";
    }
  } catch {
    // Ignore non-JSON error bodies.
  }

  const baseMessage = `${response.status} ${response.statusText}${detail ? ` - ${detail}` : ""}`;
  const authFailure = isAuthRelatedRegistryFailure(response.status, error, message);

  return {
    authFailure,
    message: baseMessage,
  };
}

async function loadProRegistryEnv(
  cwd = process.cwd(),
): Promise<Record<string, string | undefined>> {
  const env: Record<string, string | undefined> = { ...process.env };

  for (const envFile of PRO_REGISTRY_ENV_FILES) {
    const envPath = path.join(cwd, envFile);
    if (!(await fs.pathExists(envPath))) continue;

    const parsed = parseDotenv(await fs.readFile(envPath, "utf-8"));
    for (const [key, value] of Object.entries(parsed)) {
      env[key] ??= value;
    }
  }

  return env;
}

function parseDotenv(content: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const normalized = trimmed.startsWith("export ")
      ? trimmed.slice("export ".length).trim()
      : trimmed;
    const separatorIndex = normalized.indexOf("=");
    if (separatorIndex <= 0) continue;

    const key = normalized.slice(0, separatorIndex).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue;

    values[key] = normalizeDotenvValue(normalized.slice(separatorIndex + 1).trim());
  }

  return values;
}

function normalizeDotenvValue(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  const commentIndex = value.indexOf(" #");
  return (commentIndex === -1 ? value : value.slice(0, commentIndex)).trim();
}

function isAuthRelatedRegistryFailure(
  status: number,
  error: string | undefined,
  message: string | undefined,
): boolean {
  const text = `${error ?? ""} ${message ?? ""}`.toLowerCase();

  if (status === 401 || status === 403 || status === 422) {
    return true;
  }

  return text.includes("license") || text.includes("unauthorized") || text.includes("forbidden");
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toPortablePath(filePath: string): string {
  return filePath.replace(/\\/g, "/").replace(/\/+$/, "");
}
