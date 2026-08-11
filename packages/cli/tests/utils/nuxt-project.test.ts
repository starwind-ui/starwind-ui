import fs from "fs-extra";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getNuxtProjectPlan,
  setupNuxtProject,
  updateNuxtConfigContent,
  validateNuxtProjectSetup,
} from "../../src/utils/nuxt-project.js";
import * as projectPath from "../../src/utils/project-path.js";

vi.mock("fs-extra");
vi.mock("../../src/utils/project-path.js");

const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockResolvePath = vi.mocked(projectPath.resolveProjectMutationPath);

describe("Nuxt project setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolvePath.mockImplementation(async (filePath) => filePath);
    mockWriteFile.mockResolvedValue(undefined);
  });

  it.each([
    [
      "^4.2.0",
      ["nuxt.config.ts", "app/app.vue"],
      {
        componentDir: "app/components/starwind",
        cssFile: "app/assets/css/starwind.css",
        nuxtMajor: 4,
        utilsDir: "app/lib/utils",
      },
    ],
    [
      "^3.21.0",
      ["nuxt.config.ts", "app.vue"],
      {
        componentDir: "components/starwind",
        cssFile: "assets/css/starwind.css",
        nuxtMajor: 3,
        utilsDir: "lib/utils",
      },
    ],
  ] as const)("plans the bounded Nuxt %s starter layout", (nuxt, paths, expected) => {
    expect(
      getNuxtProjectPlan({ dependencies: { nuxt, vue: "^3.5.0" } }, new Set<string>(paths)),
    ).toMatchObject({
      ...expected,
      kind: "nuxt",
      nuxtConfig: "nuxt.config.ts",
      vueUpgradeRequired: false,
    });
  });

  it.each([
    ["^4.2.0", ["nuxt.config.ts", "app.vue"]],
    ["^3.21.0", ["nuxt.config.ts", "app/app.vue"]],
    ["^4.2.0", ["nuxt.config.ts", "app.vue", "app/app.vue"]],
    ["^4.2.0", ["nuxt.config.js", "app/app.vue"]],
    ["^4.2.0", ["nuxt.config.ts", "nuxt.config.mts", "app/app.vue"]],
    [">=3", ["nuxt.config.ts", "app.vue"]],
    ["^5.0.0", ["nuxt.config.ts", "app/app.vue"]],
  ] as const)("rejects unsupported Nuxt evidence for %s", (nuxt, paths) => {
    expect(() => getNuxtProjectPlan({ dependencies: { nuxt } }, new Set<string>(paths))).toThrow(
      /manual action/i,
    );
  });

  it("adds one Tailwind plugin and one global stylesheet entry idempotently", () => {
    const source =
      'export default defineNuxtConfig({\n  compatibilityDate: "2025-07-15",\n  devtools: { enabled: true },\n});\n';
    const updated = updateNuxtConfigContent(source);

    expect(updated).not.toBeNull();
    expect(updated!.match(/from "@tailwindcss\/vite"/g)).toHaveLength(1);
    expect(updated!.match(/tailwindcss\(\)/g)).toHaveLength(1);
    expect(updated!.match(/~\/assets\/css\/starwind\.css/g)).toHaveLength(1);
    expect(updated).toContain('compatibilityDate: "2025-07-15"');
    expect(updateNuxtConfigContent(updated!)).toBe(updated);
  });

  it("preserves safe literal CSS and Vite plugin configuration", () => {
    const source =
      'import imageTools from "vite-imagetools";\nexport default defineNuxtConfig({\n  css: ["~/assets/css/existing.css"],\n  vite: { plugins: [imageTools()] },\n  ssr: true,\n});\n';
    const updated = updateNuxtConfigContent(source);

    expect(updated).not.toBeNull();
    expect(updated).toContain('"~/assets/css/existing.css"');
    expect(updated).toContain("imageTools()");
    expect(updated).toContain("ssr: true");
    expect(updated!.match(/tailwindcss\(\)/g)).toHaveLength(1);
  });

  it.each([
    [
      "double-quoted escaped slashes",
      'import tailwindcss from "@tailwindcss/vite";\nexport default defineNuxtConfig({ css: ["~\\/assets\\/css\\/starwind.css"], vite: { plugins: [tailwindcss()] } });\n',
    ],
    [
      "single-quoted Unicode escape",
      "import tailwindcss from '@tailwindcss/vite';\nexport default defineNuxtConfig({ css: ['\\u{7e}/assets/css/starwind.css'], vite: { plugins: [tailwindcss()] } });\n",
    ],
  ])("preserves an escaped canonical CSS entry in %s", (_case, source) => {
    expect(updateNuxtConfigContent(source)).toBe(source);
  });

  it.each([
    [
      "double-quoted escaped slashes",
      'export default defineNuxtConfig({ css: ["~\\/styles\\/starwind.css"] });',
    ],
    [
      "single-quoted hex escape",
      "export default defineNuxtConfig({ css: ['\\x7e/styles/starwind.css'] });",
    ],
  ])("rejects an escaped incompatible Starwind CSS entry in %s", (_case, source) => {
    expect(updateNuxtConfigContent(source)).toBeNull();
  });

  it.each([
    [
      "double-quoted escaped slash",
      'import tailwindcss from "@tailwindcss\\/vite";\nexport default defineNuxtConfig({ css: ["~/assets/css/starwind.css"], vite: { plugins: [tailwindcss()] } });\n',
    ],
    [
      "single-quoted hex escape",
      "import tailwindcss from '@tailwindcss\\x2fvite';\nexport default defineNuxtConfig({ css: ['~/assets/css/starwind.css'], vite: { plugins: [tailwindcss()] } });\n",
    ],
  ])("preserves an escaped Tailwind module specifier in %s", (_case, source) => {
    expect(updateNuxtConfigContent(source)).toBe(source);
  });

  it.each([
    [
      "line-comment delimiter in an unrelated string",
      'const marker = "safe // text";\nimport tailwindcss from "@tailwindcss/vite";\nexport default defineNuxtConfig({ css: ["~/assets/css/starwind.css"], vite: { plugins: [tailwindcss()] } });\n',
    ],
    [
      "split block-comment delimiters in unrelated strings",
      'const open = "/*";\nimport tailwindcss from "@tailwindcss/vite";\nconst close = "*/";\nexport default defineNuxtConfig({ css: ["~/assets/css/starwind.css"], vite: { plugins: [tailwindcss()] } });\n',
    ],
    [
      "real comments around the existing import",
      '// import fake from "@tailwindcss/vite";\n/* "@tailwindcss/vite" */\nimport tailwindcss from "@tailwindcss/vite";\nexport default defineNuxtConfig({ css: ["~/assets/css/starwind.css"], vite: { plugins: [tailwindcss()] } });\n',
    ],
  ])("detects an existing Tailwind import after %s", (_case, source) => {
    expect(updateNuxtConfigContent(source)).toBe(source);
  });

  it("ignores import-shaped template text and inserts a real collision-safe import", () => {
    const source =
      'const snippet = `\nimport phantom from "@tailwindcss/vite";\n`;\nexport default defineNuxtConfig({});\n';
    const updated = updateNuxtConfigContent(source);

    expect(updated).not.toBeNull();
    expect(updated).toMatch(/^import starwindTailwindcss from "@tailwindcss\/vite";/);
    expect(updated).toContain("plugins: [starwindTailwindcss()]");
    expect(updated).not.toContain("plugins: [phantom()]");
  });

  it("rejects a malformed static CSS string token", () => {
    expect(
      updateNuxtConfigContent('export default defineNuxtConfig({ css: ["\\xG1"] });'),
    ).toBeNull();
  });

  it("rejects a malformed static module string token", () => {
    expect(
      updateNuxtConfigContent(
        'import tailwindcss from "@tailwindcss/\\xG1"; export default defineNuxtConfig({});',
      ),
    ).toBeNull();
  });

  it("uses a collision-free Tailwind binding", () => {
    const source =
      "const tailwindcss = localPlugin();\nconst starwindTailwindcss = otherPlugin();\nexport default defineNuxtConfig({});\n";
    const updated = updateNuxtConfigContent(source);

    expect(updated).toContain('import starwindTailwindcss2 from "@tailwindcss/vite"');
    expect(updated).toContain("plugins: [starwindTailwindcss2()]");
  });

  it.each([
    "export default defineNuxtConfig(() => ({}));",
    "export default defineNuxtConfig({ ...shared });",
    "export default defineNuxtConfig({ [key]: true });",
    "const css = []; export default defineNuxtConfig({ css });",
    "export default defineNuxtConfig({ css: getCss() });",
    "export default defineNuxtConfig({ css: [...shared] });",
    "const vite = {}; export default defineNuxtConfig({ vite });",
    "export default defineNuxtConfig({ vite: { ...shared } });",
    "export default defineNuxtConfig({ vite: { plugins } });",
    "export default defineNuxtConfig({ vite: { plugins: [enabled && plugin()] } });",
    'export default defineNuxtConfig({ srcDir: "src" });',
    'export default defineNuxtConfig({ rootDir: "project" });',
    'export default defineNuxtConfig({ dir: { app: "custom" } });',
    'export default defineNuxtConfig({ extends: "./base" });',
    'export default defineNuxtConfig({ builder: "webpack" });',
    "export default defineNuxtConfig({ webpack: {} });",
    "export default defineNuxtConfig({ rspack: {} });",
    'export default defineNuxtConfig({ css: ["~/styles/starwind.css"] });',
    'import { tailwindcss } from "@tailwindcss/vite"; export default defineNuxtConfig({});',
  ])("rejects an unsafe managed config shape", (source) => {
    expect(updateNuxtConfigContent(source)).toBeNull();
  });

  it.each([
    ["srcDir", 'export default defineNuxtConfig({ "srcDir": "src" });'],
    ["rootDir", "export default defineNuxtConfig({ 'rootDir': 'project' });"],
    ["dir", 'export default defineNuxtConfig({ "dir": { app: "custom" } });'],
    ["css", 'export default defineNuxtConfig({ "css": [] });'],
    ["vite", 'export default defineNuxtConfig({ "vite": {} });'],
    ["plugins", 'export default defineNuxtConfig({ vite: { "plugins": [] } });'],
  ])("rejects a quoted %s key during mutation-free preflight", async (_key, source) => {
    const plan = getNuxtProjectPlan(
      { dependencies: { nuxt: "^4.2.0" } },
      new Set(["nuxt.config.ts", "app/app.vue"]),
    )!;
    mockReadFile.mockResolvedValue(source as never);

    await expect(validateNuxtProjectSetup(plan)).rejects.toThrow(/manual action/i);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it.each([
    ["double-quoted unsupported hex", 'export default defineNuxtConfig({ "\\x73rcDir": "src" });'],
    [
      "single-quoted unsupported Unicode",
      "export default defineNuxtConfig({ '\\u0072ootDir': 'project' });",
    ],
    ["double-quoted managed hex", 'export default defineNuxtConfig({ "\\x63ss": [] });'],
    ["single-quoted managed Unicode", "export default defineNuxtConfig({ '\\u0076ite': {} });"],
    [
      "nested double-quoted managed hex",
      'export default defineNuxtConfig({ vite: { "\\x70lugins": [] } });',
    ],
    [
      "nested single-quoted managed Unicode",
      "export default defineNuxtConfig({ vite: { '\\u0070lugins': [] } });",
    ],
    ["bare unsupported Unicode", "export default defineNuxtConfig({ \\u0073rcDir: 'src' });"],
    ["bare managed Unicode", "export default defineNuxtConfig({ \\u0063ss: [] });"],
    [
      "nested bare managed Unicode",
      "export default defineNuxtConfig({ vite: { \\u0070lugins: [] } });",
    ],
  ])("rejects an escaped %s key during mutation-free preflight", async (_case, source) => {
    const plan = getNuxtProjectPlan(
      { dependencies: { nuxt: "^4.2.0" } },
      new Set(["nuxt.config.ts", "app/app.vue"]),
    )!;
    mockReadFile.mockResolvedValue(source as never);

    await expect(validateNuxtProjectSetup(plan)).rejects.toThrow(/manual action/i);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it.each([
    [
      "block comment before plain quoted managed key",
      'export default defineNuxtConfig({ /* note */ "css": [] });',
    ],
    [
      "line comment before plain quoted unsupported key",
      'export default defineNuxtConfig({ // note\n "srcDir": "src" });',
    ],
    [
      "block comment before escaped quoted managed key",
      'export default defineNuxtConfig({ /* note */ "\\x63ss": [] });',
    ],
    [
      "line comment before escaped bare unsupported key",
      'export default defineNuxtConfig({ // note\n \\u0073rcDir: "src" });',
    ],
    [
      "nested block comment before escaped quoted managed key",
      'export default defineNuxtConfig({ vite: { /* note */ "\\x70lugins": [] } });',
    ],
    [
      "nested line comment before plain quoted managed key",
      'export default defineNuxtConfig({ vite: { // note\n "plugins": [] } });',
    ],
  ])("rejects a %s during mutation-free preflight", async (_case, source) => {
    const plan = getNuxtProjectPlan(
      { dependencies: { nuxt: "^4.2.0" } },
      new Set(["nuxt.config.ts", "app/app.vue"]),
    )!;
    mockReadFile.mockResolvedValue(source as never);

    await expect(validateNuxtProjectSetup(plan)).rejects.toThrow(/manual action/i);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it.each([
    [
      "block comment between a plain quoted managed key and colon",
      'export default defineNuxtConfig({ "css" /* note */ : [] });',
    ],
    [
      "line comment between a plain quoted unsupported key and colon",
      'export default defineNuxtConfig({ "srcDir" // note\n : "src" });',
    ],
    [
      "block comment between a bare unsupported key and colon",
      'export default defineNuxtConfig({ srcDir /* note */ : "src" });',
    ],
    [
      "line comment between an escaped bare managed key and colon",
      "export default defineNuxtConfig({ \\u0063ss // note\n : [] });",
    ],
    [
      "nested block comment between a plain quoted managed key and colon",
      'export default defineNuxtConfig({ vite: { "plugins" /* note */ : [] } });',
    ],
    [
      "nested line comment between an escaped quoted managed key and colon",
      'export default defineNuxtConfig({ vite: { "\\x70lugins" // note\n : [] } });',
    ],
  ])("rejects a %s during mutation-free preflight", async (_case, source) => {
    const plan = getNuxtProjectPlan(
      { dependencies: { nuxt: "^4.2.0" } },
      new Set(["nuxt.config.ts", "app/app.vue"]),
    )!;
    mockReadFile.mockResolvedValue(source as never);

    await expect(validateNuxtProjectSetup(plan)).rejects.toThrow(/manual action/i);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it.each(["srcDir", "rootDir", "dir", "builder", "webpack", "rspack"])(
    "rejects unsupported shorthand %s with and without leading comments during mutation-free preflight",
    async (key) => {
      const plan = getNuxtProjectPlan(
        { dependencies: { nuxt: "^4.2.0" } },
        new Set(["nuxt.config.ts", "app/app.vue"]),
      )!;

      for (const source of [
        `const ${key} = {}; export default defineNuxtConfig({ ${key} });`,
        `const ${key} = {}; export default defineNuxtConfig({ /* note */ ${key} });`,
      ]) {
        mockReadFile.mockResolvedValue(source as never);
        await expect(validateNuxtProjectSetup(plan)).rejects.toThrow(/manual action/i);
      }
      expect(mockWriteFile).not.toHaveBeenCalled();
    },
  );

  it.each([
    ["escaped unsupported shorthand", "export default defineNuxtConfig({ \\u0073rcDir });"],
    [
      "commented escaped managed shorthand",
      "export default defineNuxtConfig({ /* note */ \\u0063ss });",
    ],
  ])("rejects %s during mutation-free preflight", async (_case, source) => {
    const plan = getNuxtProjectPlan(
      { dependencies: { nuxt: "^4.2.0" } },
      new Set(["nuxt.config.ts", "app/app.vue"]),
    )!;
    mockReadFile.mockResolvedValue(source as never);

    await expect(validateNuxtProjectSetup(plan)).rejects.toThrow(/manual action/i);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it.each([
    ["css", "const css = []; export default defineNuxtConfig({ css });"],
    ["vite", "const vite = {}; export default defineNuxtConfig({ /* note */ vite });"],
    [
      "nested plugins",
      "const plugins = []; export default defineNuxtConfig({ vite: { plugins } });",
    ],
  ])("rejects managed shorthand %s during mutation-free preflight", async (_key, source) => {
    const plan = getNuxtProjectPlan(
      { dependencies: { nuxt: "^4.2.0" } },
      new Set(["nuxt.config.ts", "app/app.vue"]),
    )!;
    mockReadFile.mockResolvedValue(source as never);

    await expect(validateNuxtProjectSetup(plan)).rejects.toThrow(/manual action/i);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("accepts escaped values under safe unescaped keys", () => {
    const source =
      'export default defineNuxtConfig({\n  compatibilityDate: "\\x32\\x30\\x32\\x35-07-15",\n  css: ["~/assets/css/\\x65xisting.css"],\n  vite: { plugins: [imageTools("\\u0073afe-value")] },\n});\n';
    const updated = updateNuxtConfigContent(source);

    expect(updated).not.toBeNull();
    expect(updated).toContain('"~/assets/css/\\x65xisting.css"');
    expect(updated).toContain('imageTools("\\u0073afe-value")');
    expect(updated).toContain('compatibilityDate: "\\x32\\x30\\x32\\x35-07-15"');
  });

  it("preflights without writes and applies a byte-stable config update", async () => {
    const plan = getNuxtProjectPlan(
      { dependencies: { nuxt: "^4.2.0" } },
      new Set(["nuxt.config.ts", "app/app.vue"]),
    )!;
    const source = "export default defineNuxtConfig({});\n";
    mockReadFile.mockResolvedValue(source as never);

    await validateNuxtProjectSetup(plan);
    expect(mockWriteFile).not.toHaveBeenCalled();

    await setupNuxtProject(plan, plan.cssFile);
    const updated = mockWriteFile.mock.calls[0]![1] as string;
    expect(mockWriteFile).toHaveBeenCalledWith("nuxt.config.ts", updated, "utf8");

    mockReadFile.mockResolvedValue(updated as never);
    await setupNuxtProject(plan, plan.cssFile);
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
  });

  it("keeps Nuxt-owned aliases and TypeScript files outside the setup plan", () => {
    const plan = getNuxtProjectPlan(
      { dependencies: { nuxt: "^4.2.0" } },
      new Set(["nuxt.config.ts", "app/app.vue"]),
    )!;

    expect(Object.keys(plan).sort()).toEqual([
      "componentDir",
      "cssFile",
      "kind",
      "nuxtConfig",
      "nuxtMajor",
      "utilsDir",
      "vueUpgradeRequired",
    ]);
    expect(plan.vueUpgradeRequired).toBe(true);
  });
});

describe("Nuxt runtime syntax boundaries", () => {
  it.each([
    `import type tailwindcss from "@tailwindcss/vite";\nexport default defineNuxtConfig({ vite: { plugins: [] } });`,
    `export default (defineNuxtConfig)({});`,
    String.raw`export default \u0064efineNuxtConfig({});`,
  ])("fails safely without changing unsupported source", (source) => {
    const original = source;
    expect(updateNuxtConfigContent(source)).toBeNull();
    expect(source).toBe(original);
  });
});
