import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { compileScript, parse } from "@vue/compiler-sfc";
import { afterEach, describe, expect, it } from "vitest";

import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { renderVueComponent } from "../../renderers/framework-adapters/vue/styled/render.js";
import { vuePrimitiveComponents } from "../../renderers/framework-adapters/vue/inventory.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const VUE_TSC_TIMEOUT_MS = 30_000;
const temporaryRoots: string[] = [];
const vuePrimitiveSubpathPattern = vuePrimitiveComponents.join("|");

const BROWSER_PROOF_SOURCE = String.raw`
import { createApp, h, nextTick } from "vue";
import { PaginationLink } from "./styled/pagination/index.ts";

try {
  const warnings = [];
  const app = createApp({
    render: () =>
      h(
        PaginationLink,
        { "data-slot": "catalog-pagination-link" },
        { default: () => "Page 2" },
      ),
  });
  app.config.warnHandler = (message) => warnings.push(message);
  app.mount("#app");
  await nextTick();

  const element = document.querySelector("a");
  if (!(element instanceof HTMLAnchorElement)) {
    throw new Error("Generated Pagination Link did not mount an anchor.");
  }
  document.documentElement.dataset.ticket18AliasResult = JSON.stringify({
    dataSlot: element.dataset.slot,
    text: element.textContent,
    warnings,
  });
  app.unmount();
} catch (error) {
  document.documentElement.dataset.ticket18AliasResult = JSON.stringify({
    error: error instanceof Error ? error.stack ?? error.message : String(error),
  });
}
`;

const GENERIC_ALIAS_FIXTURE: StyledAdapterContract = {
  component: "declared-prop-alias-fixture",
  publicExports: ["AliasFixture"],
  defaultExport: { Root: "AliasFixture" },
  components: [
    {
      exportName: "AliasFixture",
      props: {
        fields: [
          { name: "data-slot", optional: true, type: "string" },
          { name: "title", optional: true, type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "data-slot", alias: "dataSlot", defaultValue: '"fallback-slot"' },
          { name: "title" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            { name: "title", value: { type: "variable", name: "title" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "variable", name: "dataSlot" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

describe("generic Vue Styled declared prop aliases", () => {
  it("replaces an aliased public source key on the internal props surface", () => {
    const group = projectStyledOutputComponentGroup(GENERIC_ALIAS_FIXTURE);
    const source = renderVueComponent(group, group.components[0]!, {
      directory: "/tmp/styled/declared-prop-alias-fixture",
      outputRoot: "/tmp/styled",
      primitiveOutputRoot: "/tmp/primitives",
    });

    expect(source).toContain('"data-slot"?: string;');
    const declaredBody = source.match(/type AliasFixtureDeclaredProps = \{([\s\S]*?)\}\s*&/)?.[1];
    expect(declaredBody).toContain('"dataSlot"?: string;');
    expect(declaredBody).not.toContain('"data-slot"?: string;');
    expect(source).toContain('/* @vue-ignore */ Omit<AliasFixtureProps, "data-slot">;');
    expect(source).toContain('dataSlot = "fallback-slot",');
  });

  it("reuses the replacement for Button and Toggle without changing their public props", async () => {
    const root = await createTemporaryRoot();
    const outputRoot = await generateSelectedVueStyledGroups({
      format: true,
      groups: ["button", "dropzone", "toggle"],
      outputDir: "styled",
      repoRoot: root,
    });
    const button = await readFile(path.join(outputRoot, "button", "Button.vue"), "utf8");
    const toggle = await readFile(path.join(outputRoot, "toggle", "Toggle.vue"), "utf8");

    for (const [exportName, source] of [
      ["Button", button],
      ["Toggle", toggle],
    ] as const) {
      expect(source).toContain('"data-slot"?: string;');
      const declaredBody = source.match(
        new RegExp(`type ${exportName}DeclaredProps = \\{([\\s\\S]*?)\\}\\s*&`),
      )?.[1];
      expect(declaredBody).toContain("dataSlot?: string;");
      expect(declaredBody).not.toContain('"data-slot"?: string;');
      expect(source).toContain(`/* @vue-ignore */ Omit<${exportName}Props, "data-slot">;`);
      const { descriptor } = parse(source, { filename: `${exportName}.vue` });
      const compiled = compileScript(descriptor, {
        id: `ticket-18-${exportName.toLowerCase()}`,
        inlineTemplate: true,
      }).content;
      expect(compiled).toContain(
        `dataSlot: { type: String, required: false, default: "${exportName.toLowerCase()}" }`,
      );
      expect(compiled).not.toMatch(/["']data-slot["']:\s*\{\s*type:/);
    }

    const dropzone = await readFile(path.join(outputRoot, "dropzone", "Dropzone.vue"), "utf8");
    const dropzoneDeclaredBody = dropzone.match(
      /type DropzoneDeclaredProps = \{([\s\S]*?)\};/,
    )?.[1];
    expect(dropzoneDeclaredBody).toContain('ariaInvalid?: DropzoneProps["aria-invalid"];');
    expect(dropzoneDeclaredBody).not.toMatch(/^\s*"aria-invalid"\?:/m);
    const { descriptor: dropzoneDescriptor } = parse(dropzone, {
      filename: "Dropzone.vue",
    });
    const compiledDropzone = compileScript(dropzoneDescriptor, {
      id: "ticket-18-dropzone",
      inlineTemplate: true,
    }).content;
    expect(compiledDropzone).toMatch(/\bariaInvalid:\s*\{\s*type:/);
    expect(compiledDropzone).not.toMatch(/["']aria-invalid["']:\s*\{\s*type:/);

    const fixturePath = path.join(root, "declared-prop-aliases.fixture.vue");
    await writeFile(
      fixturePath,
      `<script setup lang="ts">
import { Button } from "./styled/button";
import { Toggle } from "./styled/toggle";
</script>

<template>
  <Button data-slot="action-slot">Action</Button>
  <Toggle data-slot="toggle-slot">Toggle</Toggle>
</template>
`,
      "utf8",
    );
    await expectVueTypecheck(root, [outputRoot, fixturePath]);
  });

  it("mounts composed Pagination Link with its caller-provided slot identity", async () => {
    const root = await createTemporaryRoot();
    const outputRoot = await generateSelectedVueStyledGroups({
      groups: ["pagination"],
      outputDir: "styled",
      repoRoot: root,
    });
    const paginationLink = await readFile(
      path.join(outputRoot, "pagination", "PaginationLink.vue"),
      "utf8",
    );
    const { descriptor } = parse(paginationLink, { filename: "PaginationLink.vue" });
    const compiled = compileScript(descriptor, {
      id: "ticket-18-pagination-link",
      inlineTemplate: true,
    }).content;
    expect(compiled).toContain('"data-slot": __props.dataSlot');
    await writeFile(
      path.join(root, "index.html"),
      '<div id="app"></div><script type="module" src="/proof.ts"></script>\n',
      "utf8",
    );
    await writeFile(path.join(root, "proof.ts"), BROWSER_PROOF_SOURCE, "utf8");

    const server = await createVueBrowserServer(root);
    const { chromium } = await loadPlaywright();
    let browser: Browser | undefined;
    try {
      await server.listen();
      const url = server.resolvedUrls?.local[0];
      if (!url) throw new TypeError("Ticket 18 browser server did not expose a local URL.");
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(String(error)));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });
      await page.goto(url);
      await page.waitForFunction(
        () => document.documentElement.dataset.ticket18AliasResult !== undefined,
        undefined,
        { timeout: 15_000 },
      );
      const serialized = await page.evaluate(
        () => document.documentElement.dataset.ticket18AliasResult,
      );
      expect(browserErrors).toEqual([]);
      expect(JSON.parse(serialized ?? "null")).toEqual({
        dataSlot: "catalog-pagination-link",
        text: "Page 2",
        warnings: [],
      });
    } finally {
      await browser?.close();
      await server.close();
    }
  });
});

type BrowserConsoleMessage = {
  text(): string;
  type(): string;
};

type BrowserPage = {
  evaluate<T>(pageFunction: () => T): Promise<T>;
  goto(url: string): Promise<unknown>;
  on(event: "console", handler: (message: BrowserConsoleMessage) => void): BrowserPage;
  on(event: "pageerror", handler: (error: unknown) => void): BrowserPage;
  waitForFunction(
    pageFunction: () => unknown,
    argument: unknown,
    options: { timeout: number },
  ): Promise<unknown>;
};

type Browser = {
  close(): Promise<void>;
  newPage(): Promise<BrowserPage>;
};

type PlaywrightModule = {
  chromium: {
    launch(options: { headless: boolean }): Promise<Browser>;
  };
};

type VueViteServer = {
  close(): Promise<void>;
  listen(): Promise<void>;
  resolvedUrls: { local: string[] } | null;
};

type TransformWithEsbuild = (
  source: string,
  filename: string,
  options: Record<string, unknown>,
) => Promise<{ code: string; map: unknown }>;

type VueViteTools = {
  createServer(options: Record<string, unknown>): Promise<VueViteServer>;
  transformWithEsbuild: TransformWithEsbuild;
};

async function loadPlaywright(): Promise<PlaywrightModule> {
  const workspaceRequire = createRequire(path.join(process.cwd(), "apps/react-demo/package.json"));
  return (await import(
    pathToFileURL(workspaceRequire.resolve("playwright")).href
  )) as PlaywrightModule;
}

async function createVueBrowserServer(root: string): Promise<VueViteServer> {
  const workspaceRequire = createRequire(path.join(process.cwd(), "apps/react-demo/package.json"));
  const rootRequire = createRequire(path.join(process.cwd(), "package.json"));
  const vite = (await import(pathToFileURL(workspaceRequire.resolve("vite")).href)) as VueViteTools;
  const tailwindVariants = path.join(
    path.dirname(workspaceRequire.resolve("tailwind-variants/package.json")),
    "dist/index.js",
  );
  const vue = rootRequire.resolve("vue/dist/vue.runtime.esm-bundler.js");

  return vite.createServer({
    appType: "spa",
    configFile: false,
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
    },
    logLevel: "silent",
    plugins: [
      {
        name: "ticket-18-generated-vue-sfc",
        async transform(source: string, id: string) {
          if (!id.split("?")[0]?.endsWith(".vue")) return undefined;
          const { descriptor, errors } = parse(source, { filename: id });
          if (errors.length) throw errors[0];
          const compiled = compileScript(descriptor, {
            id: `ticket-18-${Buffer.from(id).toString("hex").slice(-12)}`,
            inlineTemplate: true,
          }).content;
          const transformed = await vite.transformWithEsbuild(compiled, id, {
            format: "esm",
            loader: "ts",
            target: "esnext",
          });
          return { code: transformed.code, map: transformed.map };
        },
      },
    ],
    resolve: {
      alias: [
        { find: "vue", replacement: vue },
        {
          find: new RegExp(`^@starwind-ui/vue/(${vuePrimitiveSubpathPattern})$`),
          replacement: path.resolve(process.cwd(), "packages/vue/src/$1/index.ts"),
        },
        {
          find: /^@starwind-ui\/runtime\/(.+)$/,
          replacement: path.resolve(process.cwd(), "packages/runtime/src/components/$1/index.ts"),
        },
        {
          find: "@starwind-ui/runtime",
          replacement: path.resolve(process.cwd(), "packages/runtime/src/index.ts"),
        },
        { find: "tailwind-variants", replacement: tailwindVariants },
      ],
    },
    root,
    server: {
      fs: { allow: [process.cwd(), root] },
      host: "127.0.0.1",
      port: 0,
      strictPort: false,
    },
  });
}

async function createTemporaryRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-declared-prop-aliases-"));
  temporaryRoots.push(root);
  return root;
}

async function expectVueTypecheck(root: string, includedPaths: readonly string[]): Promise<void> {
  const workspaceRoot = process.cwd().split(path.sep).join("/");
  const workspaceRequire = createRequire(path.join(process.cwd(), "apps/react-demo/package.json"));
  const tailwindVariants = path
    .join(
      path.dirname(workspaceRequire.resolve("tailwind-variants/package.json")),
      "dist/index.d.ts",
    )
    .split(path.sep)
    .join("/");
  const configPath = path.join(root, "tsconfig.json");

  await writeFile(
    configPath,
    `${JSON.stringify(
      {
        compilerOptions: {
          baseUrl: workspaceRoot,
          lib: ["DOM", "DOM.Iterable", "ES2022"],
          module: "ESNext",
          moduleResolution: "Bundler",
          noEmit: true,
          paths: {
            "@starwind-ui/runtime": ["packages/runtime/src/index.ts"],
            "@starwind-ui/runtime/*": ["packages/runtime/src/components/*/index.ts"],
            "@starwind-ui/vue": ["packages/vue/src/index.ts"],
            "@starwind-ui/vue/*": ["packages/vue/src/*/index.ts"],
            "tailwind-variants": [tailwindVariants],
            vue: ["node_modules/vue/dist/vue.d.mts"],
          },
          skipLibCheck: true,
          strict: true,
          target: "ES2022",
        },
        include: includedPaths.flatMap((entry) => {
          const normalized = entry.split(path.sep).join("/");
          return path.extname(entry)
            ? [normalized]
            : [`${normalized}/**/*.ts`, `${normalized}/**/*.vue`];
        }),
        vueCompilerOptions: { dataAttributes: ["data-*"], strictTemplates: true },
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  const vueTsc = path.join(process.cwd(), "node_modules", "vue-tsc", "bin", "vue-tsc.js");
  const result = spawnSync(process.execPath, [vueTsc, "--noEmit", "-p", configPath], {
    cwd: process.cwd(),
    encoding: "utf8",
    timeout: VUE_TSC_TIMEOUT_MS,
  });
  const diagnostics = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  expect(result.error, diagnostics).toBeUndefined();
  expect(result.status, diagnostics).toBe(0);
}
