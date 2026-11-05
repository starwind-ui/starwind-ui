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
// The exact files that `sv create --template minimal --types ts` writes without a svelte.config.
const kitPluginConfig = `import adapter from '@sveltejs/adapter-auto';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
\tplugins: [
\t\tsveltekit({
\t\t\tcompilerOptions: {
\t\t\t\t// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
\t\t\t\trunes: ({ filename }) =>
\t\t\t\t\tfilename.split(/[/\\\\]/).includes('node_modules') ? undefined : true
\t\t\t},

\t\t\tadapter: adapter()
\t\t})
\t]
});
`;
const kitStarterLayout = `<script lang="ts">
\timport favicon from '#lib/assets/favicon.svg';
\timport type { LayoutProps } from './$types';

\tlet { children }: LayoutProps = $props();
</script>

<svelte:head>
\t<link rel="icon" href={favicon} />
</svelte:head>

{@render children()}
`;
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
      ...(kind === "astro" ? { astro: "^6.4.0", "@astrojs/svelte": "^8.1.2" } : {}),
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
async function kitPluginFixture(kitRange: string) {
  const pkg = {
    type: "module",
    devDependencies: {
      ...packageRanges,
      "@sveltejs/kit": kitRange,
      "@sveltejs/vite-plugin-svelte": "^7.2.0",
      svelte: "^5.57.2",
      vite: "^8.3.0",
    },
  };
  await write("package.json", JSON.stringify(pkg, null, 2));
  await write("tsconfig.json", '{ "extends": "$app/tsconfig" }\n');
  await write("vite.config.ts", kitPluginConfig);
  await write(
    "src/app.html",
    "<!doctype html><html><head>%sveltekit.head%</head><body>%sveltekit.body%</body></html>\n",
  );
  await write("src/routes/+layout.svelte", kitStarterLayout);
  await write("src/routes/+page.svelte", "<main>Home</main>\n");
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
  it.each([
    ["^5.0.0", "5.18.2", false],
    ["^5.0.0", "5.6.2", true],
    ["^5.0.0", undefined, false],
    ["~5.6.0", undefined, true],
  ] as const)(
    "plans the Astro SVG flag for declared %s with installed %s",
    async (declared, installed, flagged) => {
      const pkg = await fixture("astro");
      const astro5 = {
        ...pkg,
        dependencies: { ...pkg.dependencies, astro: declared, "@astrojs/svelte": "^7.2.0" },
      };
      await write("package.json", JSON.stringify(astro5, null, 2));
      if (installed) {
        await write(
          "node_modules/astro/package.json",
          JSON.stringify({ name: "astro", version: installed }),
        );
      }
      const host = await detectPrivateHostPlan(astro5, policy);
      await host.svelteHostProject!.setup("src/styles/starwind.css");
      expect((await readFile("astro.config.mjs", "utf8")).includes("svg: true")).toBe(flagged);
    },
  );

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
      if (kind === "vite") {
        expect(JSON.parse(await readFile("tsconfig.json", "utf8")).compilerOptions).toEqual({
          strict: true,
          paths: { "@/*": ["./src/*"] },
        });
      } else {
        expect(await readFile("tsconfig.json", "utf8")).toBe(before["tsconfig.json"]);
      }
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
      if (kind === "vite") {
        expect(generatedConfig).toContain(
          'import { getThemeInitScript } from "@starwind-ui/svelte/theme"',
        );
        expect(generatedConfig.match(/starwindThemeInitPlugin\(\), /g)).toHaveLength(1);
        expect(generatedConfig).toContain('"@custom": "/keep"');
        expect(generatedConfig).toContain(
          '"@": fileURLToPath(new globalThis.URL("./src", import.meta.url))',
        );
      } else {
        expect(generatedConfig).not.toContain("getThemeInitScript");
        expect(generatedConfig).not.toContain('"@":');
      }
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

  it.each([
    ["SvelteKit 3", "^3.0.0"],
    ["a recent SvelteKit 2", "^2.63.0"],
  ])("initializes %s with no Svelte config file", async (_name, kitRange) => {
    const pkg = await kitPluginFixture(kitRange);
    const host = await detectPrivateHostPlan(pkg, policy);
    expect(host.svelteHostProject?.hostKind).toBe("sveltekit");

    await init(true, { framework: "svelte", defaults: true, packageManager: "pnpm" }, dependencies);

    const config = await readFile("vite.config.ts", "utf8");
    expect(config).toContain('import tailwindcss from "@tailwindcss/vite";');
    expect(config).toContain("plugins: [tailwindcss(), \n\t\tsveltekit({");
    expect(config).toContain("adapter: adapter()");
    expect(config).not.toContain("getThemeInitScript");
    const layout = await readFile("src/routes/+layout.svelte", "utf8");
    expect(layout).toContain('import "../styles/starwind.css";');
    expect(layout).toContain("import favicon from '#lib/assets/favicon.svg';");
    expect(JSON.parse(await readFile("starwind.config.json", "utf8")).componentDir).toBe(
      "src/lib/starwind",
    );
    expect(await readdir(".")).not.toContain("svelte.config.js");

    const initialized = await snapshot();
    await init(true, { framework: "svelte", defaults: true, packageManager: "pnpm" }, dependencies);
    expect(await snapshot()).toEqual(initialized);
  });

  it.each([
    ["custom plugin routes", 'sveltekit({ files: { routes: "src/pages" } })'],
    ["bound plugin options", "sveltekit(options)"],
    ["spread plugin options", "sveltekit({ ...options })"],
    ["bound plugin files", "sveltekit({ files })"],
  ])("rejects %s with no Svelte config file before writes", async (_name, call) => {
    await kitPluginFixture("^3.0.0");
    await write(
      "vite.config.ts",
      `import { sveltekit } from "@sveltejs/kit/vite";\nimport { defineConfig } from "vite";\nexport default defineConfig({ plugins: [${call}] });\n`,
    );
    const before = await snapshot();
    await expect(init(true, { framework: "svelte", defaults: true }, dependencies)).rejects.toThrow(
      "exit:1",
    );
    expect(await snapshot()).toEqual(before);
    expect(installDependencies).not.toHaveBeenCalled();
  });

  it("rejects two SvelteKit config files before writes", async () => {
    await fixture("sveltekit");
    await write("svelte.config.ts", "export default {};\n");
    const before = await snapshot();
    await expect(init(true, { framework: "svelte", defaults: true }, dependencies)).rejects.toThrow(
      "exit:1",
    );
    expect(await snapshot()).toEqual(before);
    expect(prompts.log.error).toHaveBeenCalledWith(
      expect.stringContaining("Expected one SvelteKit config; found 2"),
    );
  });

  it("adds the source alias to tsconfig.app.json in a Vite Svelte starter", async () => {
    await fixture("vite");
    const root = '{ "files": [], "references": [{ "path": "./tsconfig.app.json" }] }\n';
    await write("tsconfig.json", root);
    await write("tsconfig.app.json", '{ "compilerOptions": { "strict": true } }\n');

    await init(true, { framework: "svelte", defaults: true }, dependencies);

    expect(await readFile("tsconfig.json", "utf8")).toBe(root);
    expect(JSON.parse(await readFile("tsconfig.app.json", "utf8")).compilerOptions.paths).toEqual({
      "@/*": ["./src/*"],
    });
  });

  it("adds the source alias to jsconfig.json in a JavaScript Vite Svelte starter", async () => {
    await fixture("vite");
    await rm("tsconfig.json");
    await write("jsconfig.json", '{ "compilerOptions": { "checkJs": true } }\n');

    await init(true, { framework: "svelte", defaults: true }, dependencies);

    expect(JSON.parse(await readFile("jsconfig.json", "utf8")).compilerOptions).toEqual({
      checkJs: true,
      paths: { "@/*": ["./src/*"] },
    });
    expect(await readdir(".")).not.toContain("tsconfig.json");
  });

  it("rejects a Vite Svelte source alias that points elsewhere before writes", async () => {
    await fixture("vite");
    await write(
      "vite.config.ts",
      'import { defineConfig } from "vite";\nimport { svelte } from "@sveltejs/vite-plugin-svelte";\nexport default defineConfig({ plugins: [svelte()], resolve: { alias: { "@": "/elsewhere" } } });\n',
    );
    const before = await snapshot();
    await expect(init(true, { framework: "svelte", defaults: true }, dependencies)).rejects.toThrow(
      "exit:1",
    );
    expect(await snapshot()).toEqual(before);
    expect(installDependencies).not.toHaveBeenCalled();
  });

  it("reuses a Svelte Theme plugin that the docs sample already added", async () => {
    await fixture("vite");
    const config = `import { getThemeInitScript } from "@starwind-ui/svelte/theme";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";

function starwindThemeInitPlugin() {
  return { name: "starwind-theme-init", transformIndexHtml: () => getThemeInitScript() };
}

export default defineConfig({ plugins: [starwindThemeInitPlugin(), svelte()] });
`;
    await write("vite.config.ts", config);
    await init(true, { framework: "svelte", defaults: true }, dependencies);
    const updated = await readFile("vite.config.ts", "utf8");
    expect(updated.match(/function starwindThemeInitPlugin/g)).toHaveLength(1);
    expect(updated.match(/getThemeInitScript }/g)).toHaveLength(1);
    expect(updated).toContain("plugins: [tailwindcss(), starwindThemeInitPlugin(), svelte()]");
    expect(updated).toContain('"@": fileURLToPath(new globalThis.URL("./src", import.meta.url))');
  });

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

describe("Svelte beta initialization in a plain Astro project", () => {
  const plainConfig =
    'import { defineConfig } from "astro/config";\nexport default defineConfig({ site: "https://example.test" });\n';
  const layout =
    '---\nconst title = "Keep";\n---\n<html><head><title>{title}</title></head><body><slot /></body></html>\n';
  const page = "---\n---\n<html><body><h1>Home</h1></body></html>\n";

  async function plainFixture(dependencies: Record<string, string> = { astro: "^6.4.0" }) {
    const pkg = { type: "module", dependencies };
    await write("package.json", JSON.stringify(pkg, null, 2));
    await write("astro.config.mjs", plainConfig);
    await write("tsconfig.json", '{ "extends": "astro/tsconfigs/strict" }\n');
    return pkg;
  }
  const initSvelte = () =>
    init(true, { framework: "svelte", defaults: true, packageManager: "pnpm" }, dependencies);

  it("offers Svelte as a configurable target without selecting it", async () => {
    const pkg = await plainFixture();
    const host = await detectPrivateHostPlan(pkg, policy);
    expect(host.diagnostic).toBeUndefined();
    expect(host.targets).toContainEqual({ framework: "svelte", readiness: "configurable" });
    expect(host.targets).toContainEqual({ framework: "astro", readiness: "ready" });
    expect(host.svelteHostProject?.hostKind).toBe("astro");
  });

  it("keeps non-Astro hosts without Svelte evidence undetected", async () => {
    const pkg = { dependencies: { vite: "^7.3.5" } };
    await write("package.json", JSON.stringify(pkg));
    await write("vite.config.ts", "export default {};\n");
    expect((await detectPrivateHostPlan(pkg, policy)).svelteHostProject).toBeUndefined();
  });

  it("installs and configures the integration and Svelte, then connects the layout", async () => {
    await plainFixture();
    await write("src/layouts/Layout.astro", layout);
    await initSvelte();

    expect(installDependencies).toHaveBeenCalledWith(["@astrojs/svelte@^8.1.2"], "pnpm");
    expect(installDependencies).toHaveBeenCalledWith(
      expect.arrayContaining(["svelte@>=5.29.0", ...starwindStylesheetPackageRequirements]),
      "pnpm",
      false,
      false,
    );
    const config = await readFile("astro.config.mjs", "utf8");
    expect(config).toContain('import svelte from "@astrojs/svelte";');
    expect(config).toContain("svelte()");
    expect(config).toContain('site: "https://example.test"');
    expect(config.match(/tailwindcss\(\)/g)).toHaveLength(1);
    expect(await readFile("src/layouts/Layout.astro", "utf8")).toContain(
      'import "../styles/starwind.css";',
    );
    const starwind = JSON.parse(await readFile("starwind.config.json", "utf8"));
    expect(starwind.framework).toBe("astro");
    expect(starwind.componentDirs.svelte).toBe("src/components/starwind-svelte");
    expect(prompts.log.error).not.toHaveBeenCalled();

    // A second run finds the finished setup and changes nothing.
    const initialized = await snapshot();
    vi.mocked(installDependencies).mockClear();
    await initSvelte();
    expect(await snapshot()).toEqual(initialized);
    expect(installDependencies).not.toHaveBeenCalled();
  });

  it.each([
    ["5", "^5.17.0", "@astrojs/svelte@^7.2.5"],
    ["6", "^6.4.0", "@astrojs/svelte@^8.1.2"],
    ["7", "^7.0.0", "@astrojs/svelte@^9.1.2"],
  ])("selects the integration for Astro %s", async (_major, astro, integration) => {
    await plainFixture({ astro });
    await write("src/layouts/Layout.astro", layout);
    await initSvelte();
    expect(installDependencies).toHaveBeenCalledWith([integration], "pnpm");
  });

  it("replaces a declared integration that does not match the Astro major", async () => {
    await plainFixture({ astro: "^6.4.0", "@astrojs/svelte": "^7.2.5", svelte: "^5.43.6" });
    await write(
      "astro.config.mjs",
      'import { defineConfig } from "astro/config";\nimport svelte from "@astrojs/svelte";\nexport default defineConfig({ integrations: [svelte()] });\n',
    );
    await write("src/layouts/Layout.astro", layout);
    await initSvelte();
    expect(installDependencies).toHaveBeenCalledWith(["@astrojs/svelte@^8.1.2"], "pnpm");
    expect((await readFile("astro.config.mjs", "utf8")).match(/svelte\(\)/g)).toHaveLength(1);
  });

  it("imports the stylesheet in the home page when no named layout exists", async () => {
    await plainFixture();
    await write("src/pages/index.astro", page);
    await initSvelte();
    expect(await readFile("src/pages/index.astro", "utf8")).toContain(
      'import "@/styles/starwind.css";',
    );
    // The page import needs the "@" alias, which the Astro starter does not define.
    expect(JSON.parse(await readFile("tsconfig.json", "utf8")).compilerOptions.paths).toEqual({
      "@/*": ["src/*"],
    });
    expect(prompts.note).not.toHaveBeenCalledWith(
      expect.any(String),
      "Import Starwind CSS to finish setup",
    );
    expect(prompts.log.error).not.toHaveBeenCalled();
  });

  it("reports a manual import and finishes when no layout or page exists", async () => {
    await plainFixture();
    await initSvelte();
    expect(prompts.note).toHaveBeenCalledWith(
      expect.stringContaining('import "@/styles/starwind.css";'),
      "Import Starwind CSS to finish setup",
    );
    expect(prompts.log.error).not.toHaveBeenCalled();
    expect(prompts.cancel).not.toHaveBeenCalled();
    expect(JSON.parse(await readFile("starwind.config.json", "utf8")).framework).toBe("astro");
    expect(await readFile("astro.config.mjs", "utf8")).toContain("svelte()");
  });

  it("stops before any write when Astro 5 meets TypeScript 6", async () => {
    await plainFixture({ astro: "^5.17.0", typescript: "^6.0.0" });
    const before = await snapshot();
    await expect(initSvelte()).rejects.toThrow("exit:1");
    expect(prompts.log.error).toHaveBeenCalledWith(
      expect.stringContaining("needs TypeScript ^5.3.3"),
    );
    expect(await snapshot()).toEqual(before);
    expect(installDependencies).not.toHaveBeenCalled();
  });

  it("stops before any write when the Astro config cannot take the integration", async () => {
    await plainFixture();
    await write("astro.config.mjs", "export default makeConfig();\n");
    const before = await snapshot();
    await expect(initSvelte()).rejects.toThrow("exit:1");
    expect(await snapshot()).toEqual(before);
    expect(installDependencies).not.toHaveBeenCalled();
  });

  it("rejects a declared Svelte range outside Svelte 5.29 or later", async () => {
    await plainFixture({ astro: "^6.4.0", svelte: "^4.2.0" });
    const before = await snapshot();
    await expect(initSvelte()).rejects.toThrow("exit:1");
    expect(prompts.log.error).toHaveBeenCalledWith(expect.stringContaining(">=5.29.0 <6"));
    expect(await snapshot()).toEqual(before);
  });
});
