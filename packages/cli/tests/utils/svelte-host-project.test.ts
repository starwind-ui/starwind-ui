import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clack/prompts", () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  cancel: vi.fn(),
  note: vi.fn(),
  confirm: vi.fn().mockResolvedValue(true),
  group: vi.fn(),
  select: vi.fn(),
  text: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  tasks: vi.fn(async (tasks: Array<{ task: () => Promise<unknown> }>) => {
    for (const task of tasks) await task.task();
  }),
  log: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));
vi.mock("../../src/utils/package-manager.js", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../src/utils/package-manager.js")>()),
  installDependencies: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../src/utils/sleep.js", () => ({ sleep: vi.fn().mockResolvedValue(undefined) }));

import * as prompts from "@clack/prompts";
import { init } from "../../src/commands/init.js";
import {
  starwindStylesheetPackageRequirements,
  tailwindConfig,
} from "../../src/templates/starwind.css.js";
import {
  createPrivateSvelteFrameworkTargetPolicy,
  PUBLIC_FRAMEWORK_TARGET_POLICY,
} from "../../src/utils/framework-target-policy.js";
import { detectHostPlan, detectPrivateHostPlan } from "../../src/utils/host-planner.js";
import { installDependencies } from "../../src/utils/package-manager.js";
import { addSvelteLayoutCssImport } from "../../src/utils/svelte-host-project.js";

const policy = createPrivateSvelteFrameworkTargetPolicy(`sha256:${"a".repeat(64)}`);
const registry = {
  version: "0.1.0",
  components: [],
  setup: {
    svelte: {
      adapterPackage: { name: "@starwind-ui/svelte", range: "0.0.0" },
      packageRequirements: [{ name: "svelte", range: ">=5.29.0" }],
    },
  },
};
const dependencies = { targetPolicy: policy, registry };
const packageRanges = {
  svelte: "^5.29.0",
  "@starwind-ui/svelte": "0.0.0",
  vite: "^7.3.5",
  "@sveltejs/vite-plugin-svelte": "^6.2.1",
  tailwindcss: "^4.3.0",
  "@tailwindcss/vite": "4.3.0",
  "tw-animate-css": "^1.4.0",
  "@tailwindcss/forms": "~0.5.11",
};
const viteConfig =
  'import { defineConfig } from "vite";\nimport { svelte as framework } from "@sveltejs/vite-plugin-svelte";\nexport default defineConfig({ plugins: [framework(), { name: "keep-plugin" }], resolve: { alias: { "@custom": "/keep" } } });\n';
const kitConfig =
  'import { sveltekit } from "@sveltejs/kit/vite";\nexport default { plugins: [sveltekit(), { name: "keep-provenance" }], server: { port: 4321 } };\n';
const astroConfig =
  'import { defineConfig as config } from "astro/config";\nimport svelte from "@astrojs/svelte";\nexport default config({ integrations: [svelte()], site: "https://example.test" });\n';
let root: string;
let originalCwd: string;

async function write(file: string, content: string) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content);
}
async function fixture(kind: "vite" | "sveltekit" | "astro") {
  const pkg = {
    type: "module",
    dependencies: {
      ...packageRanges,
      ...(kind === "sveltekit" ? { "@sveltejs/kit": "^2.70.3" } : {}),
      ...(kind === "astro" ? { astro: "^6.4.0", "@astrojs/svelte": "^7.2.0" } : {}),
    },
  };
  await write("package.json", JSON.stringify(pkg, null, 2));
  await write("src/styles/existing.css", ".keep { color: red; }\n");
  await write(
    "tsconfig.json",
    '{ "extends": "./.svelte-kit/tsconfig.json", "compilerOptions": { "strict": true } }\n',
  );
  if (kind === "vite") {
    await write("vite.config.ts", viteConfig);
    await write(
      "src/main.ts",
      'import "./styles/existing.css";\nimport { mount } from "svelte";\nimport App from "./App.svelte";\nmount(App, { target: document.body });\n',
    );
    await write("src/App.svelte", "<main>Existing app</main>\n");
  } else if (kind === "sveltekit") {
    await write("vite.config.js", kitConfig);
    await write(
      "svelte.config.js",
      'import adapter from "@sveltejs/adapter-node";\nexport default { kit: { adapter: adapter(), files: { routes: "src/routes" } } };\n',
    );
    await write(
      "src/app.html",
      "<!doctype html><html><head>%sveltekit.head%</head><body>%sveltekit.body%</body></html>\n",
    );
    await write("src/routes/+page.svelte", "<main>Home</main>\n");
  } else {
    await write("astro.config.mjs", astroConfig);
    await write(
      "src/layouts/Layout.astro",
      '---\nimport "../styles/existing.css";\nconst title = "Keep";\n---\n<html><head><title>{title}</title></head><body><slot /></body></html>\n',
    );
  }
  return pkg;
}
async function snapshot(directory = "."): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) Object.assign(result, await snapshot(file));
    else if (!entry.isSymbolicLink()) result[file] = await readFile(file, "utf8");
  }
  return result;
}

beforeEach(async () => {
  originalCwd = process.cwd();
  root = await mkdtemp(path.join(tmpdir(), "starwind-svelte-init-"));
  process.chdir(root);
  vi.clearAllMocks();
  vi.mocked(prompts.confirm).mockResolvedValue(true);
  vi.spyOn(process, "exit").mockImplementation((code) => {
    throw new Error(`exit:${code}`);
  });
});
afterEach(async () => {
  process.chdir(originalCwd);
  vi.restoreAllMocks();
  await rm(root, { recursive: true, force: true });
});

describe("Svelte beta host initialization", () => {
  it.each(["vite", "sveltekit", "astro"] as const)(
    "initializes %s with canonical CSS and preserves repeat-init bytes",
    async (kind) => {
      const pkg = await fixture(kind);
      const before = await snapshot();
      const host = await detectPrivateHostPlan(pkg, policy);
      expect(host.svelteHostProject?.hostKind).toBe(kind);
      expect(host.targets).toContainEqual({ framework: "svelte", readiness: "ready" });
      expect(
        (await detectHostPlan(pkg)).targets.some(({ framework }) => String(framework) === "svelte"),
      ).toBe(true);
      expect(
        (await detectPrivateHostPlan(pkg, PUBLIC_FRAMEWORK_TARGET_POLICY)).svelteHostProject,
      ).toBeDefined();
      await init(
        true,
        { framework: "svelte", defaults: true, packageManager: "pnpm" },
        dependencies,
      );
      const config = JSON.parse(await readFile("starwind.config.json", "utf8"));
      expect(config.framework).toBe(kind === "astro" ? "astro" : "svelte");
      expect(kind === "astro" ? config.componentDirs.svelte : config.componentDir).toBe(
        kind === "astro"
          ? "src/components/starwind-svelte"
          : kind === "sveltekit"
            ? "src/lib/starwind"
            : "src/components/starwind",
      );
      expect(await readFile("src/styles/starwind.css", "utf8")).toBe(tailwindConfig);
      expect(await readFile("package.json", "utf8")).toBe(before["package.json"]);
      expect(await readFile("tsconfig.json", "utf8")).toBe(before["tsconfig.json"]);
      expect(await readFile("src/styles/existing.css", "utf8")).toBe(
        before["src/styles/existing.css"],
      );
      expect(installDependencies).not.toHaveBeenCalled();
      const configPath =
        kind === "astro"
          ? "astro.config.mjs"
          : kind === "sveltekit"
            ? "vite.config.js"
            : "vite.config.ts";
      const generatedConfig = await readFile(configPath, "utf8");
      expect(generatedConfig.match(/tailwindcss\(\)/g)).toHaveLength(1);
      expect(generatedConfig).toContain(
        kind === "astro" ? "svelte()" : kind === "sveltekit" ? "sveltekit()" : "framework()",
      );
      if (kind === "sveltekit") {
        expect(await readFile("svelte.config.js", "utf8")).toBe(before["svelte.config.js"]);
        expect(await readFile("src/routes/+layout.svelte", "utf8")).toContain(
          "{@render children()}",
        );
      }
      const initialized = await snapshot();
      await init(
        true,
        { framework: "svelte", defaults: true, packageManager: "pnpm" },
        dependencies,
      );
      expect(await snapshot()).toEqual(initialized);
    },
  );

  it("adds only missing stylesheet requirements and retains compatible declared ranges", async () => {
    const pkg = await fixture("vite");
    const reduced = {
      ...pkg,
      dependencies: {
        svelte: "~5.57.0",
        vite: "7.3.5",
        "@sveltejs/vite-plugin-svelte": "6.2.1",
        "@starwind-ui/svelte": "0.0.0",
        tailwindcss: "^4.3.0",
      },
    };
    await write("package.json", JSON.stringify(reduced));
    await init(true, { framework: "svelte", defaults: true, packageManager: "pnpm" }, dependencies);
    expect(installDependencies).toHaveBeenCalledOnce();
    expect(vi.mocked(installDependencies).mock.calls[0]![0]).toEqual(
      starwindStylesheetPackageRequirements.filter(
        (requirement) => !requirement.startsWith("tailwindcss@"),
      ),
    );
    expect(await readFile("package.json", "utf8")).toBe(JSON.stringify(reduced));
  });

  it("uses custom directories and preserves an existing stylesheet when overwrite is declined", async () => {
    await fixture("sveltekit");
    await write("src/theme/site.css", "/* user CSS */\n");
    vi.mocked(prompts.group).mockResolvedValue({
      framework: "svelte",
      componentDir: "src/lib/ui",
      cssFile: "src/theme/site.css",
      twBaseColor: "stone",
    });
    vi.mocked(prompts.confirm).mockResolvedValue(false);
    await init(true, { framework: "svelte", packageManager: "pnpm" }, dependencies);
    expect(await readFile("src/theme/site.css", "utf8")).toBe("/* user CSS */\n");
    expect(await readFile("src/routes/+layout.svelte", "utf8")).toContain(
      'import "../theme/site.css"',
    );
    expect(JSON.parse(await readFile("starwind.config.json", "utf8")).componentDir).toBe(
      "src/lib/ui",
    );
  });

  it.each(["5.28.0", "^4", ">=5.29", "^6", "workspace:*", "latest"])(
    "rejects Svelte range %s before writes or installation",
    async (range) => {
      const pkg = await fixture("vite");
      await write(
        "package.json",
        JSON.stringify({ ...pkg, dependencies: { ...pkg.dependencies, svelte: range } }),
      );
      const before = await snapshot();
      await expect(
        init(true, { framework: "svelte", defaults: true }, dependencies),
      ).rejects.toThrow("exit:1");
      expect(prompts.log.error).toHaveBeenCalledWith(expect.stringContaining(">=5.29.0 <6"));
      expect(await snapshot()).toEqual(before);
      expect(installDependencies).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["missing plugin", "vite", "vite.config.ts", "export default { plugins: [] };"],
    ["dynamic config", "vite", "vite.config.ts", "export default () => ({ plugins: [] });"],
    [
      "spread plugins",
      "vite",
      "vite.config.ts",
      'import { svelte } from "@sveltejs/vite-plugin-svelte"; export default { plugins: [svelte(), ...other] };',
    ],
    [
      "duplicate plugin",
      "vite",
      "vite.config.ts",
      'import { svelte } from "@sveltejs/vite-plugin-svelte"; export default { plugins: [svelte(), svelte()] };',
    ],
    ["missing integration", "astro", "astro.config.mjs", "export default { integrations: [] };"],
    ["wrong Kit plugin", "sveltekit", "vite.config.js", viteConfig],
    [
      "custom Kit routes",
      "sveltekit",
      "svelte.config.js",
      'export default { kit: { files: { routes: "src/pages" } } };',
    ],
    [
      "bound custom Kit routes",
      "sveltekit",
      "svelte.config.js",
      'const config = { kit: { files: { routes: "src/pages" } } }; export default config;',
    ],

    [
      "bound Kit options",
      "sveltekit",
      "svelte.config.js",
      'const kit = { files: { routes: "src/pages" } }; export default { kit };',
    ],
    [
      "spread Kit config",
      "sveltekit",
      "svelte.config.js",
      'const base = { kit: { files: { routes: "src/pages" } } }; export default { ...base };',
    ],
    [
      "spread bound Kit config",
      "sveltekit",
      "svelte.config.js",
      'const base = { kit: { files: { routes: "src/pages" } } }; const config = { ...base }; export default config;',
    ],
    ["dynamic Kit config", "sveltekit", "svelte.config.js", "export default makeConfig();"],
    [
      "bound Kit object",
      "sveltekit",
      "svelte.config.js",
      'const options = { files: { routes: "src/pages" } }; export default { kit: options };',
    ],
    [
      "spread Kit object",
      "sveltekit",
      "svelte.config.js",
      'const options = { files: { routes: "src/pages" } }; export default { kit: { ...options } };',
    ],
    [
      "invalid layout script",
      "sveltekit",
      "src/routes/+layout.svelte",
      "<script>const = invalid;</script><main />",
    ],
  ] as const)("rejects %s before writes", async (_name, kind, file, content) => {
    await fixture(kind);
    await write(file, content);
    const before = await snapshot();
    await expect(init(true, { framework: "svelte", defaults: true }, dependencies)).rejects.toThrow(
      "exit:1",
    );
    expect(await snapshot()).toEqual(before);
    expect(installDependencies).not.toHaveBeenCalled();
  });

  it("rejects custom output paths outside the project before installation", async () => {
    await fixture("vite");
    vi.mocked(prompts.group).mockResolvedValue({
      framework: "svelte",
      componentDir: "../outside",
      cssFile: "src/styles/starwind.css",
      twBaseColor: "neutral",
    });
    const before = await snapshot();
    await expect(init(true, { framework: "svelte" }, dependencies)).rejects.toThrow("exit:1");
    expect(await snapshot()).toEqual(before);
    expect(installDependencies).not.toHaveBeenCalled();
  });

  it("rejects Pro setup for a detected Svelte host before project mutation", async () => {
    await fixture("vite");
    const before = await snapshot();

    await expect(init(true, { defaults: true, pro: true }, dependencies)).rejects.toThrow("exit:1");

    expect(await snapshot()).toEqual(before);
    expect(installDependencies).not.toHaveBeenCalled();
  });

  it("rejects a symlink stylesheet before any project mutation", async () => {
    await fixture("vite");
    await write("outside.css", "preserve\n");
    await symlink(path.join(root, "outside.css"), "src/styles/starwind.css");
    const before = await snapshot();
    await expect(init(true, { framework: "svelte", defaults: true }, dependencies)).rejects.toThrow(
      "exit:1",
    );
    expect(await snapshot()).toEqual(before);
    expect(installDependencies).not.toHaveBeenCalled();
  });

  it("preserves existing instance and module scripts after markup and ignores script text in attributes", async () => {
    await fixture("sveltekit");
    const layout =
      '<main data-code="<script>fake</script>">{@render children()}</main>\n<script context="module" lang="ts">\nexport const marker = "<script>text</script>";\n</script>\n<script lang="ts">\nlet { children } = $props();\nconst literal = "keep";\n</script>\n';
    await write("src/routes/+layout.svelte", layout);
    await init(true, { framework: "svelte", defaults: true }, dependencies);
    const changed = await readFile("src/routes/+layout.svelte", "utf8");
    expect(changed).toContain('export const marker = "<script>text</script>";');
    expect(changed).toContain('data-code="<script>fake</script>"');
    expect(changed).toContain('const literal = "keep";');
    expect(changed).toContain('<script lang="ts">\nimport "../styles/starwind.css";');
    expect(
      addSvelteLayoutCssImport(changed, "src/routes/+layout.svelte", "src/styles/starwind.css"),
    ).toBe(changed);
  });

  it("preserves normal template blocks with a later script and repeats initialization without changes", async () => {
    await fixture("sveltekit");
    const kitConfig =
      'const config = { kit: { files: { routes: "src/routes" } } }; export default config;';
    await write("svelte.config.js", kitConfig);
    const markup = `{#snippet greeting(name)}<p>{name}</p>{/snippet}
{#if visible}{#each items as item}<span>{item}</span>{/each}{:else}<p>Hidden</p>{/if}
{#key visible}<main>{@render children()}</main>{/key}
{#await ready}<p>Waiting</p>{:then value}<p>{value}</p>{/await}
`;
    await write(
      "src/routes/+layout.svelte",
      markup +
        '<script>let { children } = $props(); const visible = true; const items = ["one"]; const ready = Promise.resolve("Ready");</script>',
    );
    await init(true, { framework: "svelte", defaults: true }, dependencies);
    const layout = await readFile("src/routes/+layout.svelte", "utf8");
    expect(layout).toContain(markup);
    expect(layout.match(/import "\.\.\/styles\/starwind\.css"/g)).toHaveLength(1);
    expect(await readFile("svelte.config.js", "utf8")).toBe(kitConfig);
    expect(
      addSvelteLayoutCssImport(layout, "src/routes/+layout.svelte", "src/styles/starwind.css"),
    ).toBe(layout);
    const initialized = await snapshot();
    await init(true, { framework: "svelte", defaults: true }, dependencies);
    expect(await snapshot()).toEqual(initialized);
  });

  it("recognizes existing single-quoted imports in either script context", () => {
    for (const attributes of ["", ' context="module"']) {
      const content = `<script${attributes}>\nimport '../styles/starwind.css'\n</script>\n<main />`;
      expect(
        addSvelteLayoutCssImport(content, "src/routes/+layout.svelte", "src/styles/starwind.css"),
      ).toBe(content);
    }
    const content = '<div>{"<script>fake</script>"}</div>\n<script>let keep = 1;</script>';
    expect(
      addSvelteLayoutCssImport(content, "src/routes/+layout.svelte", "src/styles/starwind.css"),
    ).toContain('import "../styles/starwind.css";');
  });
});
