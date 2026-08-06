import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { compileScript, parse } from "@vue/compiler-sfc";
import { afterEach, describe, expect, it } from "vitest";

import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { generateFrameworkStyledWrappers } from "../../renderers/framework-wrapper-generator.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const VUE_TSC_TIMEOUT_MS = 30_000;
const temporaryRoots: string[] = [];

const BROWSER_PROOF_SOURCE = String.raw`
import { createApp, defineComponent, h, nextTick } from "vue";
import { GenericClassForwarder } from "./styled/generic-child-forwarding/index.ts";

let clicks = 0;
const Fixture = defineComponent({
  setup() {
    return () =>
      h(
        GenericClassForwarder,
        {
          "aria-label": "forwarded label",
          class: "caller-class",
          "data-slot": "caller-slot",
          "data-tone": "accent",
          id: "forwarded-id",
          onClick: () => {
            clicks += 1;
          },
          style: { backgroundColor: "blue", color: "blue" },
          title: "caller title",
        },
        { default: () => "Content" },
      );
  },
});

try {
  const warnings = [];
  const app = createApp(Fixture);
  app.config.warnHandler = (message) => warnings.push(message);
  app.mount("#app");
  await nextTick();

  const element = document.querySelector('[data-slot="generic-class-child"]');
  if (!(element instanceof HTMLDivElement)) throw new Error("Generated forwarding child did not mount.");
  element.click();
  await nextTick();

  document.documentElement.dataset.ticket15ForwardingResult = JSON.stringify({
    ariaLabel: element.getAttribute("aria-label"),
    backgroundColor: element.style.backgroundColor,
    className: element.className,
    clicks,
    color: element.style.color,
    dataSlot: element.dataset.slot,
    dataTone: element.dataset.tone,
    id: element.id,
    title: element.title,
    warnings,
  });
  app.unmount();
} catch (error) {
  document.documentElement.dataset.ticket15ForwardingResult = JSON.stringify({
    error: error instanceof Error ? error.stack ?? error.message : String(error),
  });
}
`;

const GENERIC_NATIVE_CLASS_FIXTURE: StyledAdapterContract = {
  component: "generic-native-class",
  publicExports: ["GenericNativeClass"],
  defaultExport: { Root: "GenericNativeClass" },
  components: [
    {
      exportName: "GenericNativeClass",
      props: { extends: [{ type: "htmlAttributes", element: "nav" }] },
      destructure: { props: [{ name: "class", alias: "className" }], rest: "rest" },
      render: [
        {
          type: "element",
          tag: "nav",
          attrs: [
            { name: "class", value: { type: "variable", name: "className" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "generic-native-class" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};

const GENERIC_CHILD_FORWARDING_FIXTURE: StyledAdapterContract = {
  component: "generic-child-forwarding",
  publicExports: ["GenericClassChild", "GenericClassForwarder"],
  defaultExport: { Child: "GenericClassChild", Root: "GenericClassForwarder" },
  components: [
    {
      exportName: "GenericClassChild",
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "class", optional: true, type: "ClassValue" },
          {
            name: "style",
            optional: true,
            type: 'import("vue").StyleValue',
            frameworks: ["vue"],
          },
        ],
      },
      destructure: {
        props: [
          { name: "class", alias: "className" },
          { name: "style", alias: "styleValue" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            { name: "class", value: { type: "variable", name: "className" } },
            { name: "style", value: { type: "variable", name: "styleValue" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "generic-class-child" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "GenericClassForwarder",
      props: { extends: [{ type: "htmlAttributes", element: "div" }] },
      destructure: { props: [], rest: "rest" },
      render: [
        {
          type: "component",
          component: "generic-child-forwarding",
          exportName: "GenericClassChild",
          attrs: [
            { name: "class", value: { type: "literal", value: "owned-class" } },
            { name: "style", value: { type: "raw", code: "{ color: 'red' }" } },
            { name: "title", value: { type: "literal", value: "owned title" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
            { name: "data-slot", value: { type: "literal", value: "generic-class-forwarder" } },
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

describe("generic Vue Styled class and attribute forwarding", () => {
  it("accepts a permissive public class value on a native element", async () => {
    const { outputRoot, root } = await generate([GENERIC_NATIVE_CLASS_FIXTURE]);
    const source = await readFile(
      path.join(outputRoot, "generic-native-class", "GenericNativeClass.vue"),
      "utf8",
    );

    expect(source).toContain(`:class="className as import('vue').ClassValue"`);

    const fixturePath = path.join(root, "native-class.fixture.vue");
    await writeFile(
      fixturePath,
      `<script setup lang="ts">
import type { ClassValue } from "tailwind-variants";
import { GenericNativeClass } from "./styled/generic-native-class";

const permissiveClass: ClassValue = 0;
</script>

<template>
  <GenericNativeClass :class="permissiveClass">Content</GenericNativeClass>
</template>
`,
      "utf8",
    );
    await expectVueTypecheck(root, [fixturePath]);
  });

  it("excludes explicit child attributes and preserves unowned fallthrough attrs", async () => {
    const { outputRoot, root } = await generate([GENERIC_CHILD_FORWARDING_FIXTURE]);
    const source = await readFile(
      path.join(outputRoot, "generic-child-forwarding", "GenericClassForwarder.vue"),
      "utf8",
    );

    expect(source).toContain(
      `v-bind="omitForwardedAttrs(attrs, ['class', 'style', 'title', 'data-slot']) as Omit<InstanceType<typeof GenericClassChild>['$props'], 'class' | 'style' | 'title' | 'data-slot'>"`,
    );
    expect(source).toMatch(
      /Object\.fromEntries\(\s*Object\.entries\(source\)\.filter\(\(\[name\]\) => !ownedNames\.includes\(name\)\),\s*\)/,
    );

    const fixturePath = path.join(root, "child-forwarding.fixture.vue");
    await writeFile(
      fixturePath,
      `<script setup lang="ts">
import { GenericClassForwarder } from "./styled/generic-child-forwarding";

function handleClick(): void {}
</script>

<template>
  <GenericClassForwarder
    class="caller-class"
    style="background: blue"
    id="forwarded-id"
    aria-label="forwarded label"
    data-tone="accent"
    @click="handleClick"
  >
    Content
  </GenericClassForwarder>
</template>
`,
      "utf8",
    );
    await expectVueTypecheck(root, [fixturePath]);
  });

  it("mounts generated forwarding without overriding owned child attributes", async () => {
    const { root } = await generate([GENERIC_CHILD_FORWARDING_FIXTURE]);
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
      if (!url) throw new TypeError("Ticket 15 browser server did not expose a local URL.");
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      const browserErrors: string[] = [];
      page.on("pageerror", (error) => browserErrors.push(String(error)));
      page.on("console", (message) => {
        if (message.type() === "error") browserErrors.push(message.text());
      });
      await page.goto(url);
      await page.waitForFunction(
        () => document.documentElement.dataset.ticket15ForwardingResult !== undefined,
        undefined,
        { timeout: 15_000 },
      );
      const serialized = await page.evaluate(
        () => document.documentElement.dataset.ticket15ForwardingResult,
      );
      expect(browserErrors).toEqual([]);
      expect(JSON.parse(serialized ?? "null")).toEqual({
        ariaLabel: "forwarded label",
        backgroundColor: "",
        className: "owned-class",
        clicks: 1,
        color: "red",
        dataSlot: "generic-class-child",
        dataTone: "accent",
        id: "forwarded-id",
        title: "owned title",
        warnings: [],
      });
    } finally {
      await browser?.close();
      await server.close();
    }
  });

  it("reuses the generic rules across all seven affected exports", async () => {
    const root = await createTemporaryRoot();
    const outputRoot = await generateSelectedVueStyledGroups({
      format: true,
      groups: ["breadcrumb", "button-group", "item", "pagination"],
      outputDir: "styled",
      repoRoot: root,
    });
    const affectedFiles = [
      ["breadcrumb", "Breadcrumb.vue"],
      ["pagination", "PaginationItem.vue"],
      ["button-group", "ButtonGroupSeparator.vue"],
      ["item", "ItemSeparator.vue"],
      ["pagination", "PaginationLink.vue"],
      ["pagination", "PaginationNext.vue"],
      ["pagination", "PaginationPrevious.vue"],
    ] as const;
    const sources = new Map(
      await Promise.all(
        affectedFiles.map(
          async ([group, file]) =>
            [file, await readFile(path.join(outputRoot, group, file), "utf8")] as const,
        ),
      ),
    );

    expect(sources.get("Breadcrumb.vue")).toContain(
      `:class="className as import('vue').ClassValue"`,
    );
    expect(sources.get("PaginationItem.vue")).toContain(
      `:class="className as import('vue').ClassValue"`,
    );
    for (const file of [
      "ButtonGroupSeparator.vue",
      "ItemSeparator.vue",
      "PaginationLink.vue",
      "PaginationNext.vue",
      "PaginationPrevious.vue",
    ] as const) {
      expect(sources.get(file)).toMatch(/v-bind="\s*omitForwardedAttrs\(attrs,/);
      expect(sources.get(file)).toMatch(/as Omit<\s*InstanceType<typeof/);
    }

    await expectVueTypecheck(
      root,
      affectedFiles.map(([group, file]) => path.join(outputRoot, group, file)),
    );
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
    configFile: false,
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: true,
    },
    logLevel: "silent",
    plugins: [
      {
        name: "ticket-15-generated-vue-sfc",
        async transform(source: string, id: string) {
          if (!id.split("?")[0]?.endsWith(".vue")) return undefined;
          const { descriptor, errors } = parse(source, { filename: id });
          if (errors.length) throw errors[0];
          const compiled = compileScript(descriptor, {
            id: `ticket-15-${Buffer.from(id).toString("hex").slice(-12)}`,
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

async function generate(contracts: StyledAdapterContract[]): Promise<{
  outputRoot: string;
  root: string;
}> {
  const root = await createTemporaryRoot();
  const outputRoot = path.join(root, "styled");

  await generateFrameworkStyledWrappers("vue", {
    contracts,
    generatedBy: "vue-styled-class-forwarding.test.ts",
    outputRoot,
    primitiveOutputRoot: path.join(root, "primitives"),
    roots: contracts.map(({ component }) => component),
  });

  return { outputRoot, root };
}

async function createTemporaryRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-class-forwarding-"));
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
        include: includedPaths.map((file) => file.split(path.sep).join("/")),
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
