import fs from "fs-extra";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  getQuasarProjectPlan,
  setupQuasarProject,
  updateQuasarConfigContent,
  validateQuasarProjectSetup,
} from "../../src/utils/quasar-project.js";
import * as projectPath from "../../src/utils/project-path.js";

vi.mock("fs-extra");
vi.mock("../../src/utils/project-path.js");

const mockReadFile = vi.mocked(fs.readFile);
const mockWriteFile = vi.mocked(fs.writeFile);
const mockResolvePath = vi.mocked(projectPath.resolveProjectMutationPath);

const pkg = {
  dependencies: { quasar: "^2.18.0", vue: "^3.5.13" },
  devDependencies: { "@quasar/app-vite": "^3.0.0" },
};

function configSource(extension: "ts" | "js" = "ts"): string {
  const typeLine = extension === "ts" ? "    // TypeScript scaffold\n" : "";
  return `import { defineConfig } from '#q-app';
export default defineConfig((ctx) => {
  return {
${typeLine}    css: ['app.scss'],
    build: {
      target: { browser: ['es2022'], node: 'node22' },
      vitePlugins: [],
    },
  };
});
`;
}

function evidence(
  config: "quasar.config.ts" | "quasar.config.js" = "quasar.config.ts",
  mode: "spa" | "ssr" = "spa",
) {
  const paths = [config, "src/App.vue", "src/router", "src/layouts", "src/pages", "src/css"];
  if (mode === "ssr") paths.push("src-ssr");
  return {
    existingPaths: new Set(paths),
    projectFiles: { [config]: configSource(config.endsWith(".ts") ? "ts" : "js") },
  };
}

describe("Quasar CLI with Vite project setup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockResolvePath.mockImplementation(async (filePath) => filePath);
    mockWriteFile.mockResolvedValue(undefined);
  });

  it.each([
    ["TypeScript SPA", "quasar.config.ts", "spa"],
    ["JavaScript SPA", "quasar.config.js", "spa"],
    ["TypeScript SSR", "quasar.config.ts", "ssr"],
    ["JavaScript SSR", "quasar.config.js", "ssr"],
  ] as const)("plans the official %s layout", (_label, config, mode) => {
    expect(getQuasarProjectPlan(pkg, evidence(config, mode))).toEqual({
      componentDir: "src/components/starwind",
      cssFile: "src/css/starwind.css",
      kind: "quasar",
      mode,
      quasarConfig: config,
      utilsDir: "src/lib/utils",
      vueUpgradeRequired: false,
    });
  });

  it("adds Starwind before host CSS and one Tailwind tuple idempotently", () => {
    const updated = updateQuasarConfigContent(configSource())!;

    expect(updated.indexOf('"starwind.css"')).toBeLessThan(updated.indexOf("'app.scss'"));
    expect(updated).toContain('["@tailwindcss/vite", {}, { server: true, client: true }]');
    expect(updated.match(/starwind\.css/g)).toHaveLength(1);
    expect(updated.match(/@tailwindcss\/vite/g)).toHaveLength(1);
    expect(updateQuasarConfigContent(updated)).toBe(updated);
  });

  it("creates missing css, build, and vitePlugins properties", () => {
    const source =
      "import { defineConfig } from '#q-app';\nexport default defineConfig(() => ({ framework: {} }));\n";
    const updated = updateQuasarConfigContent(source)!;

    expect(updated).toContain('css: ["starwind.css"]');
    expect(updated).toContain("build: { vitePlugins:");
    expect(updateQuasarConfigContent(updated)).toBe(updated);
  });

  it.each([
    [
      "documented package tuple",
      configSource()
        .replace("css: ['app.scss']", "css: ['starwind.css', 'app.scss']")
        .replace("vitePlugins: []", "vitePlugins: [['@tailwindcss/vite', {}]]"),
    ],
    [
      "imported direct call",
      `import { defineConfig } from '#q-app';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(() => ({
  css: ['starwind.css', 'app.css'],
  build: { vitePlugins: [tailwindcss()] },
}));
`,
    ],
    [
      "imported documented tuple",
      `import { defineConfig } from '#q-app';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig(() => ({
  css: ['starwind.css', 'app.css'],
  build: { vitePlugins: [[tailwindcss, {}, { server: true, client: true }]] },
}));
`,
    ],
  ])("recognizes an equivalent existing Tailwind %s", (_case, source) => {
    expect(updateQuasarConfigContent(source)).toBe(source);
  });

  it.each(["vite-plugin-checker", "@quasar/vite-plugin-checker"])(
    "preserves an existing static %s package tuple",
    (pluginName) => {
      const source = configSource().replace(
        "vitePlugins: []",
        `vitePlugins: [[${JSON.stringify(pluginName)}, {}]]`,
      );
      const updated = updateQuasarConfigContent(source)!;

      expect(updated).toContain(`[${JSON.stringify(pluginName)}, {}]`);
      expect(updated).toContain('["@tailwindcss/vite", {}, { server: true, client: true }]');
      expect(updateQuasarConfigContent(updated)).toBe(updated);
    },
  );

  it.each([
    ["block", `css: [/* 'nested/starwind.css' */ 'app.css' /* "starwind.css" */]`],
    [
      "line",
      `css: [// "nested/starwind.css"
      'app.css' // 'starwind.css'
    ]`,
    ],
  ])("accepts static CSS entries wrapped in %s comments", (_case, cssProperty) => {
    const source = configSource().replace("css: ['app.scss']", cssProperty);
    const updated = updateQuasarConfigContent(source)!;

    expect(updated).toContain(`css: ["starwind.css",`);
    expect(updateQuasarConfigContent(updated)).toBe(updated);
  });

  it.each([
    ["block", "css: [/* only a block comment */]"],
    [
      "line",
      `css: [// only a line comment
    ]`,
    ],
  ])("treats a %s-comment-only CSS array as empty", (_case, cssProperty) => {
    const source = configSource().replace("css: ['app.scss']", cssProperty);
    const updated = updateQuasarConfigContent(source)!;

    expect(updated).toContain(`css: ["starwind.css",`);
    expect(updateQuasarConfigContent(updated)).toBe(updated);
  });

  it.each(["css: [,]", "css: [, 'app.css']", "css: ['app.css',,]", "css: [/* comment */,]"])(
    "rejects a CSS array hole in %s",
    (cssProperty) => {
      const source = configSource().replace("css: ['app.scss']", cssProperty);
      expect(updateQuasarConfigContent(source)).toBeNull();
    },
  );

  it("accepts literal Tailwind thread values followed by comments", () => {
    const source = configSource()
      .replace("css: ['app.scss']", "css: ['starwind.css', 'app.scss']")
      .replace(
        "vitePlugins: []",
        `vitePlugins: [['@tailwindcss/vite', {}, { server: true /* server */, client: true // client
      }]]`,
      );

    expect(updateQuasarConfigContent(source)).toBe(source);
  });

  it.each([
    ["\"server\": true, 'client': true"],
    ['"\\x73erver": true, "\\u0063lient": true'],
    ["\\u0073erver: true, \\u0063lient: true"],
    ["\\u{73}erver: true, \\u{63}lient: true"],
  ])("accepts static quoted or escaped Tailwind thread keys in %s", (threadOptions) => {
    const source = configSource()
      .replace("css: ['app.scss']", "css: ['starwind.css', 'app.scss']")
      .replace("vitePlugins: []", `vitePlugins: [['@tailwindcss/vite', {}, { ${threadOptions} }]]`);

    expect(updateQuasarConfigContent(source)).toBe(source);
  });

  it.each([
    ['server: true, "server": false, client: true'],
    ['"server": false, server: true, client: true'],
    ['server: true, client: true, "client": false'],
    ['server: true, "client": false, client: true'],
    ["server: true, \\u{73}erver: false, client: true"],
    ["\\u{73}erver: false, server: true, client: true"],
    ["server: true, client: true, \\u{63}lient: false"],
    ["server: true, \\u{63}lient: false, client: true"],
    ['server: true, "\\x73erver": false, client: true'],
    ['"server": false, "client": true'],
    ['"server": true, "client": false'],
  ])("rejects duplicate or false static Tailwind thread keys in %s", (threadOptions) => {
    const source = configSource().replace(
      "vitePlugins: []",
      `vitePlugins: [['@tailwindcss/vite', {}, { ${threadOptions} }]]`,
    );

    expect(updateQuasarConfigContent(source)).toBeNull();
  });

  it.each([
    ["\\u{2d}: true, server: true, client: true"],
    ["\\u{110000}: true, server: true, client: true"],
    ["ser\\u{2d}ver: true, client: true"],
  ])("rejects decoded keys outside JavaScript identifier grammar in %s", (threadOptions) => {
    const source = configSource().replace(
      "vitePlugins: []",
      `vitePlugins: [['@tailwindcss/vite', {}, { ${threadOptions} }]]`,
    );

    expect(updateQuasarConfigContent(source)).toBeNull();
  });

  it.each([
    ["quoted css", configSource().replace("css:", '"css":')],
    ["single-quoted build", configSource().replace("build:", "'build':")],
    ["quoted vitePlugins", configSource().replace("vitePlugins:", '"vitePlugins":')],
    ["escaped quoted css", configSource().replace("css:", '"\\x63ss":')],
    ["escaped bare css", configSource().replace("css:", "c\\u0073s:")],
    ["escaped quoted build", configSource().replace("build:", "'b\\u0069ld':")],
    ["mixed bare and quoted css", configSource().replace("build:", '"css": [],\n    build:')],
    ["mixed bare and quoted build", configSource().replace("css:", '"build": {},\n    css:')],
    [
      "mixed bare and quoted vitePlugins",
      configSource().replace("target:", '"vitePlugins": [],\n      target:'),
    ],
  ])("rejects %s managed keys", (_case, source) => {
    expect(updateQuasarConfigContent(source)).toBeNull();
  });

  it.each([
    ["server conjunction", "server: true && false, client: true"],
    ["server conditional", "server: true ? true : false, client: true"],
    ["client conjunction", "server: true, client: true && false"],
    ["client conditional", "server: true, client: true ? true : false"],
  ])("rejects Tailwind %s thread expressions", (_case, threadOptions) => {
    const source = configSource().replace(
      "vitePlugins: []",
      `vitePlugins: [['@tailwindcss/vite', {}, { ${threadOptions} }]]`,
    );

    expect(updateQuasarConfigContent(source)).toBeNull();
  });

  it.each([
    ["async callback", configSource().replace("defineConfig((ctx)", "defineConfig(async (ctx)")],
    [
      "aliased object",
      "import { defineConfig } from '#q-app'; const config = {}; export default defineConfig(() => config);",
    ],
    ["root spread", configSource().replace("return {", "return { ...shared,")],
    ["computed root key", configSource().replace("css:", "['css']:")],
    ["dynamic css array", configSource().replace("css: ['app.scss']", "css: getCss()")],
    ["conditional css", configSource().replace("'app.scss'", "ctx.mode.spa ? 'app.css' : null")],
    [
      "dynamic plugin array",
      configSource().replace("vitePlugins: []", "vitePlugins: getPlugins()"),
    ],
    ["plugin spread", configSource().replace("vitePlugins: []", "vitePlugins: [...plugins]")],
    ["incompatible Starwind CSS", configSource().replace("'app.scss'", "'nested/starwind.css'")],
    [
      "client-only Tailwind",
      configSource().replace(
        "vitePlugins: []",
        "vitePlugins: [['@tailwindcss/vite', {}, { server: false, client: true }]]",
      ),
    ],
    ["duplicate css", configSource().replace("build:", "css: ['other.css'],\n    build:")],
    [
      "duplicate Tailwind thread option",
      configSource().replace(
        "vitePlugins: []",
        "vitePlugins: [['@tailwindcss/vite', {}, { server: true, server: false, client: true }]]",
      ),
    ],
    [
      "duplicate vitePlugins",
      configSource().replace("target:", "vitePlugins: getPlugins(),\n      target:"),
    ],
  ])("rejects %s config before mutation", (_case, source) => {
    expect(updateQuasarConfigContent(source)).toBeNull();
  });

  it.each(["src-ssg", "src-pwa", "src-bex", "src-cordova", "src-capacitor", "src-electron"])(
    "rejects unsupported %s mode evidence",
    (mode) => {
      const projectEvidence = evidence();
      projectEvidence.existingPaths.add(mode);
      expect(() => getQuasarProjectPlan(pkg, projectEvidence)).toThrow(/manual action/i);
    },
  );

  it("rejects several mode folders and Quasar Webpack", () => {
    const several = evidence("quasar.config.ts", "ssr");
    several.existingPaths.add("src-pwa");
    expect(() => getQuasarProjectPlan(pkg, several)).toThrow(/manual action/i);

    const webpack = {
      ...pkg,
      devDependencies: { ...pkg.devDependencies, "@quasar/app-webpack": "^4.0.0" },
    };
    expect(() => getQuasarProjectPlan(webpack, evidence())).toThrow(/manual action/i);
  });

  it("leaves Quasar Vite-plugin-only projects for generic Vite detection", () => {
    expect(
      getQuasarProjectPlan(
        {
          dependencies: { quasar: "^2.18.0", vue: "^3.5.13" },
          devDependencies: { "@quasar/vite-plugin": "^1.10.0", vite: "^8.0.0" },
        },
        { existingPaths: new Set(["vite.config.ts", "src/main.ts", "src/App.vue"]) },
      ),
    ).toBeUndefined();
  });

  it("marks Vue below 3.5 for registry-derived correction", () => {
    const oldVue = { ...pkg, dependencies: { ...pkg.dependencies, vue: "^3.4.0" } };
    expect(getQuasarProjectPlan(oldVue, evidence())).toMatchObject({ vueUpgradeRequired: true });
  });

  it("preflights without writes and mutates only quasar.config once", async () => {
    const plan = getQuasarProjectPlan(pkg, evidence())!;
    let source = configSource();
    mockReadFile.mockImplementation(async () => source as never);

    await validateQuasarProjectSetup(plan);
    expect(mockWriteFile).not.toHaveBeenCalled();

    await setupQuasarProject(plan, plan.cssFile);
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    expect(mockWriteFile).toHaveBeenCalledWith(
      "quasar.config.ts",
      expect.stringContaining('"starwind.css"'),
      "utf8",
    );

    source = mockWriteFile.mock.calls[0]![1] as string;
    mockWriteFile.mockClear();
    await setupQuasarProject(plan, plan.cssFile);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("rejects a custom stylesheet destination before writes", async () => {
    const plan = getQuasarProjectPlan(pkg, evidence())!;
    await expect(setupQuasarProject(plan, "src/css/custom.css")).rejects.toThrow(
      /plan-owned stylesheet path/i,
    );
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
