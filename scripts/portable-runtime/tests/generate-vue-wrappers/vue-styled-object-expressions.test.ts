import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { aspectRatioStyledContract } from "../../contracts/styled/components/aspect-ratio.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { generateFrameworkStyledWrappers } from "../../renderers/framework-wrapper-generator.js";

const VUE_TSC_TIMEOUT_MS = 30_000;
const temporaryRoots: string[] = [];

const GENERIC_OBJECT_EXPRESSION_FIXTURE: StyledAdapterContract = {
  component: "generic-object-expression",
  publicExports: ["GenericObjectExpression"],
  defaultExport: { Root: "GenericObjectExpression" },
  components: [
    {
      exportName: "GenericObjectExpression",
      props: { fields: [{ name: "ratio", optional: true, type: "number" }] },
      destructure: { props: [{ name: "ratio", defaultValue: "1" }] },
      variables: [
        {
          name: "wrapperStyle",
          value: { type: "raw", code: "{ paddingBottom: `${100 / ratio}%` }" },
        },
        {
          name: "assertedStyle",
          value: { type: "raw", code: "{ opacity: ratio } as const" },
        },
        {
          name: "satisfiedStyle",
          value: {
            type: "raw",
            code: "{ opacity: ratio } satisfies Record<string, number>",
          },
        },
        { name: "doubleRatio", value: { type: "raw", code: "ratio * 2" } },
      ],
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            { name: "style", value: { type: "variable", name: "wrapperStyle" } },
            { name: "data-ratio", value: { type: "variable", name: "doubleRatio" } },
          ],
          children: [
            { type: "slot" },
            {
              type: "element",
              tag: "span",
              attrs: [{ name: "style", value: { type: "variable", name: "assertedStyle" } }],
              children: [],
            },
            {
              type: "element",
              tag: "span",
              attrs: [{ name: "style", value: { type: "variable", name: "satisfiedStyle" } }],
              children: [],
            },
          ],
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

describe("generic Vue Styled object expressions", () => {
  it("returns a binding-aware object literal from a computed callback", async () => {
    const { outputRoot, root } = await generate([GENERIC_OBJECT_EXPRESSION_FIXTURE]);
    const source = await readFile(
      path.join(outputRoot, "generic-object-expression", "GenericObjectExpression.vue"),
      "utf8",
    );

    expect(source).toContain(
      "const wrapperStyle = computed(() => ({ paddingBottom: `${100 / ratio}%` }));",
    );
    expect(source).toContain(
      "const assertedStyle = computed(() => ({ opacity: ratio } as const));",
    );
    expect(source).toContain(
      "const satisfiedStyle = computed(() => ({ opacity: ratio } satisfies Record<string, number>));",
    );
    expect(source).toContain("const doubleRatio = computed(() => ratio * 2);");
    await expectVueTypecheck(root, outputRoot);
  });

  it("uses the same object-expression projection for Aspect Ratio", async () => {
    const { outputRoot, root } = await generate([aspectRatioStyledContract]);
    const source = await readFile(path.join(outputRoot, "aspect-ratio", "AspectRatio.vue"), "utf8");

    expect(source).toContain(
      "const wrapperStyle = computed(() => ({ paddingBottom: `${100 / ratio}%` }));",
    );
    await expectVueTypecheck(root, outputRoot);
  });
});

async function generate(contracts: StyledAdapterContract[]): Promise<{
  outputRoot: string;
  root: string;
}> {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-object-expressions-"));
  temporaryRoots.push(root);
  const outputRoot = path.join(root, "styled");

  await generateFrameworkStyledWrappers("vue", {
    contracts,
    generatedBy: "vue-styled-object-expressions.test.ts",
    outputRoot,
    primitiveOutputRoot: path.join(root, "primitives"),
    roots: contracts.map(({ component }) => component),
  });

  return { outputRoot, root };
}

async function expectVueTypecheck(root: string, outputRoot: string): Promise<void> {
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
        include: [
          `${outputRoot.split(path.sep).join("/")}/**/*.ts`,
          `${outputRoot.split(path.sep).join("/")}/**/*.vue`,
        ],
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
