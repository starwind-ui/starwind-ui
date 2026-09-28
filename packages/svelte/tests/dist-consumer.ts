import { execFile } from "node:child_process";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  readdir,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const sourceRequire = createRequire(import.meta.url);

interface Manifest {
  name: string;
  version: string;
  dependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  peerDependenciesMeta?: Record<string, { optional?: boolean }>;
}

export const consumerFamilies = [
  "color-picker",
  "sidebar",
  "combobox",
  "navigation-menu",
  "context-menu",
  "menu",
  "alert-dialog",
  "drawer",
  "popover",
  "preview-card",
  "tooltip",
  "dropzone",
  "tabs",
  "input-otp",
  "field",
  "toggle",
  "toggle-group",
  "radio",
  "radio-group",
  "checkbox-group",
  "switch",
  "form",
  "fieldset",
  "input",
  "collapsible",
  "scroll-area",
  "progress",
  "avatar",
  "accordion",
  "button",
  "carousel",
  "checkbox",
  "dialog",
  "select",
  "slider",
  "toast",
] as const;

export interface DistConsumer {
  root: string;
  tools: Record<"compiler" | "checker" | "typescript", string>;
  dispose(): Promise<void>;
  write(files: Record<string, string>): Promise<void>;
  check(): Promise<{ code: number; output: string }>;
  run(script: string, options?: { loader?: boolean }): Promise<string>;
}

/** Call after installing consumer-local tools to reuse this runner with exact-version installs. */
export async function openDistConsumer(root: string): Promise<DistConsumer> {
  root = await realpath(root);
  for (const name of ["svelte", "svelte-check", "typescript"]) {
    assertWithin(root, await realpath(path.join(root, "node_modules", name)), `consumer ${name}`);
  }
  const localRequire = createRequire(path.join(root, "package.json"));
  const tools = {
    compiler: localRequire.resolve("svelte/compiler"),
    checker: localRequire.resolve("svelte-check/bin/svelte-check"),
    typescript: localRequire.resolve("typescript"),
  };
  for (const [name, file] of Object.entries(tools)) {
    assertWithin(root, await realpath(file), `consumer ${name}`);
  }
  for (const name of ["svelte", "runtime"]) {
    const install = path.join(root, "node_modules/@starwind-ui", name);
    assertWithin(root, await realpath(install), name);
    if (JSON.stringify((await readdir(install)).sort()) !== '["dist","package.json"]') {
      throw new Error(`${name} consumer must contain only dist and package.json`);
    }
  }
  const env = { ...process.env };
  delete env.NODE_OPTIONS;
  delete env.NODE_PATH;
  const execute = (args: string[]) =>
    execFileAsync(process.execPath, args, {
      cwd: root,
      env,
      timeout: 60_000,
      maxBuffer: 4 * 1024 * 1024,
    });
  return {
    root,
    tools,
    dispose: () => rm(root, { recursive: true, force: true }),
    async write(files) {
      for (const [file, source] of Object.entries(files)) {
        const destination = path.resolve(root, file);
        assertWithin(root, destination, "fixture");
        await mkdir(path.dirname(destination), { recursive: true });
        await writeFile(destination, source);
      }
    },
    async check() {
      const config = JSON.parse(await readFile(path.join(root, "tsconfig.json"), "utf8"));
      if (config.extends || config.compilerOptions?.paths || config.compilerOptions?.baseUrl) {
        throw new Error(
          "The distribution consumer must not use tsconfig inheritance or source aliases",
        );
      }
      try {
        const result = await execute([
          tools.checker,
          "--workspace",
          root,
          "--tsconfig",
          "./tsconfig.json",
          "--output",
          "machine-verbose",
        ]);
        return { code: 0, output: result.stdout + result.stderr };
      } catch (error) {
        const failure = error as Error & {
          code?: number;
          stdout?: string;
          stderr?: string;
          killed?: boolean;
        };
        if (typeof failure.code !== "number" || failure.killed) throw error;
        return { code: failure.code, output: (failure.stdout ?? "") + (failure.stderr ?? "") };
      }
    },
    async run(script, { loader = false } = {}) {
      const result = await execute([
        ...(loader ? ["--import", "./register-loader.mjs"] : []),
        script,
      ]);
      if (result.stderr) throw new Error(result.stderr);
      return result.stdout;
    },
  };
}

export async function createDistConsumer(
  options: {
    installTools?: (root: string) => Promise<void>;
    packageRoot?: string;
    additionalPackages?: readonly { name: string; from: string }[];
  } = {},
): Promise<DistConsumer> {
  const packageRoot = options.packageRoot ?? process.cwd();
  const root = await realpath(
    await mkdtemp(path.join(os.tmpdir(), "starwind-svelte-dist-consumer-")),
  );
  try {
    await writeFile(
      path.join(root, "package.json"),
      JSON.stringify({ name: "svelte-dist-consumer", private: true, type: "module" }),
    );
    await (
      options.installTools ??
      ((consumerRoot) => copyConsumerTools(consumerRoot, packageRoot, options.additionalPackages))
    )(root);
    await installBuiltPackage(packageRoot, path.join(root, "node_modules/@starwind-ui/svelte"));
    await installBuiltPackage(
      path.resolve(packageRoot, "../runtime"),
      path.join(root, "node_modules/@starwind-ui/runtime"),
    );
    await writeFile(
      path.join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
          types: ["svelte"],
        },
        include: ["*.ts", "*.svelte"],
      }),
    );
    await writeFile(
      path.join(root, "register-loader.mjs"),
      `import { register } from "node:module"; register("./svelte-loader.mjs", import.meta.url);`,
    );
    await writeFile(path.join(root, "svelte-loader.mjs"), SSR_LOADER);
    return await openDistConsumer(root);
  } catch (error) {
    await rm(root, { recursive: true, force: true });
    throw error;
  }
}

function assertWithin(root: string, file: string, label: string): void {
  const relative = path.relative(root, file);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`${label} resolved outside the consumer: ${file}`);
  }
}

async function installBuiltPackage(source: string, destination: string): Promise<void> {
  await mkdir(destination, { recursive: true });
  await cp(path.join(source, "dist"), path.join(destination, "dist"), { recursive: true });
  await cp(path.join(source, "package.json"), path.join(destination, "package.json"));
}

/** Copy the installed tool dependency closure. Every symlink stays inside this consumer. */
async function copyConsumerTools(
  root: string,
  packageRoot: string,
  additionalPackages: readonly { name: string; from: string }[] = [],
): Promise<void> {
  const copied = new Map<string, string>();
  async function locatePackageRoot(name: string, from: NodeRequire): Promise<string> {
    // Reading metadata through lookup directories also supports import-only export maps.
    for (const lookup of from.resolve.paths(name) ?? []) {
      const directory = path.join(lookup, name);
      try {
        const manifest = JSON.parse(
          await readFile(path.join(directory, "package.json"), "utf8"),
        ) as Manifest;
        if (manifest.name === name) return directory;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      }
    }
    throw new Error(`Cannot locate installed tool dependency ${name}`);
  }
  async function copyPackage(name: string, from: NodeRequire): Promise<string> {
    const source = await realpath(await locatePackageRoot(name, from));
    const prior = copied.get(source);
    if (prior) return prior;
    const manifest = JSON.parse(
      await readFile(path.join(source, "package.json"), "utf8"),
    ) as Manifest;
    const destination = path.join(
      root,
      "node_modules/.consumer-tools",
      `${copied.size}-${name.replaceAll("/", "-")}`,
    );
    copied.set(source, destination);
    await cp(source, destination, {
      recursive: true,
      filter: (file) => path.basename(file) !== "node_modules",
    });
    const requireDependency = createRequire(path.join(source, "package.json"));
    for (const dependency of Object.keys({
      ...manifest.dependencies,
      ...manifest.peerDependencies,
    })) {
      if (manifest.peerDependenciesMeta?.[dependency]?.optional) continue;
      const installed = await copyPackage(
        dependency,
        ["svelte", "typescript"].includes(dependency) ? sourceRequire : requireDependency,
      );
      const link = path.join(destination, "node_modules", dependency);
      await mkdir(path.dirname(link), { recursive: true });
      await symlink(path.relative(path.dirname(link), installed), link, "junction");
    }
    return destination;
  }
  for (const name of [
    "svelte",
    "svelte-check",
    "typescript",
    "@floating-ui/dom",
    "embla-carousel",
  ]) {
    const from =
      name.startsWith("@floating-ui") || name === "embla-carousel"
        ? createRequire(path.resolve(packageRoot, "../runtime/package.json"))
        : sourceRequire;
    const installed = await copyPackage(name, from);
    const link = path.join(root, "node_modules", name);
    await mkdir(path.dirname(link), { recursive: true });
    await symlink(path.relative(path.dirname(link), installed), link, "junction");
  }
  for (const { name, from } of additionalPackages) {
    const installed = await copyPackage(name, createRequire(from));
    const link = path.join(root, "node_modules", name);
    await mkdir(path.dirname(link), { recursive: true });
    await symlink(path.relative(path.dirname(link), installed), link, "junction");
  }
}

const SSR_LOADER = `
import { readFile, realpath } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { compile } from "svelte/compiler";
const root = path.dirname(fileURLToPath(import.meta.url));
export async function resolve(specifier, context, next) {
  // Svelte packages use bundler resolution for extensionless relative JS imports.
  const request = specifier.startsWith(".") && !path.extname(specifier) ? specifier + ".js" : specifier;
  const result = await next(request, context);
  if (result.url.startsWith("file:")) {
    const file = await realpath(fileURLToPath(result.url));
    if (path.relative(root, file).startsWith("..")) throw new Error("SSR escaped consumer: " + file);
    if (file.includes("/node_modules/@starwind-ui/") && !file.includes("/dist/")) throw new Error("SSR used a non-dist package file: " + file);
  }
  return result;
}
export async function load(url, context, next) {
  // Styles are copied and verified by the consumer; Node SSR has no CSS execution phase.
  if (url.endsWith(".css")) {
    await readFile(fileURLToPath(url), "utf8");
    return { format: "module", source: "export {};", shortCircuit: true };
  }
  if (!url.endsWith(".svelte")) return next(url, context);
  const filename = fileURLToPath(url);
  const output = compile(await readFile(filename, "utf8"), { filename, generate: "server" });
  if (output.warnings.length) throw new Error(JSON.stringify(output.warnings));
  return { format: "module", source: output.js.code, shortCircuit: true };
}
`;
