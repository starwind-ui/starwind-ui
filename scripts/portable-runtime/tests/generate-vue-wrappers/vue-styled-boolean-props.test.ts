import { existsSync, readFileSync, realpathSync } from "node:fs";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { compileScript, parse } from "@vue/compiler-sfc";
import { afterEach, describe, expect, it } from "vitest";

import { starwindStyledContracts } from "../../contracts/styled/starwind.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { isVueBooleanCastType } from "../../renderers/framework-adapters/vue/styled/props.js";
import { selectVueStyledContracts } from "../../renderers/framework-adapters/vue/styled.js";
import { generateFrameworkStyledWrappers } from "../../renderers/framework-wrapper-generator.js";

const temporaryRoots: string[] = [];

afterEach(async () => {
  await Promise.all(
    temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
  );
});

const NEW_BOOLEAN_PROPS_FIXTURE: StyledAdapterContract = {
  component: "new-boolean-props",
  publicExports: ["NewBooleanProps"],
  defaultExport: { Root: "NewBooleanProps" },
  defaultExportMode: "component",
  components: [
    {
      exportName: "NewBooleanProps",
      props: {
        extends: [{ type: "htmlAttributes", element: "div" }],
        fields: [
          { name: "plainFlag", optional: true, type: "boolean" },
          { name: "unionFlag", optional: true, type: 'boolean | "auto"' },
          { name: "literalDefaultFlag", optional: true, type: "boolean" },
          { name: "label", optional: true, type: "string" },
        ],
      },
      destructure: {
        props: [
          { name: "plainFlag" },
          { name: "unionFlag" },
          { name: "literalDefaultFlag", defaultValue: "true" },
          { name: "label" },
        ],
        rest: "rest",
      },
      render: [
        {
          type: "element",
          tag: "div",
          attrs: [
            { name: "data-plain", value: { type: "variable", name: "plainFlag" } },
            { name: "data-union", value: { type: "variable", name: "unionFlag" } },
            { name: "data-literal", value: { type: "variable", name: "literalDefaultFlag" } },
            { name: "data-label", value: { type: "variable", name: "label" } },
            { name: "spread", value: { type: "variable", name: "rest" } },
          ],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
};

/** Lists the props Vue would cast from absent to false in one compiled SFC. */
function findAbsentBooleanCasts(source: string, filename: string): string[] {
  const { descriptor, errors } = parse(source, { filename });
  if (errors.length) throw errors[0];
  const { content } = compileScript(descriptor, {
    fs: {
      fileExists: existsSync,
      readFile: (file) => readFileSync(file, "utf8"),
      realpath: realpathSync,
    },
    id: "boolean-props-guard",
  });
  return [
    ...content.matchAll(
      /"?([\w-]+)"?: \{ type: (\[?[^{}]*?), required: false(, default: [^{}]*)? \}/g,
    ),
  ]
    .filter(([, , type, defaultValue]) => /\bBoolean\b/.test(type ?? "") && !defaultValue)
    .map(([, name]) => name!);
}

async function createRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-boolean-props-"));
  temporaryRoots.push(root);
  return root;
}

describe("Vue Styled absent Boolean props", () => {
  it("recognizes each type that Vue casts", () => {
    for (const type of [
      "boolean",
      "boolean | undefined",
      '"a" | boolean',
      "(boolean | string)",
      "true",
    ]) {
      expect(isVueBooleanCastType(type), type).toBe(true);
    }
    for (const type of ["string", '"true" | "false"', "() => boolean", "boolean[]", 'Foo["bar"]']) {
      expect(isVueBooleanCastType(type), type).toBe(false);
    }
  });

  it("detects a cast in a handwritten SFC, so the guard below cannot pass with no effect", () => {
    expect(
      findAbsentBooleanCasts(
        `<script setup lang="ts">
const { flag, kept = undefined } = defineProps<{ flag?: boolean; kept?: boolean }>();
</script>`,
        "control.vue",
      ),
    ).toEqual(["flag"]);
  });

  it("gives a new contract Boolean prop an undefined default", async () => {
    const root = await createRoot();
    const outputRoot = path.join(root, "styled");
    await generateFrameworkStyledWrappers("vue", {
      contracts: [NEW_BOOLEAN_PROPS_FIXTURE],
      generatedBy: "vue-styled-boolean-props.test.ts",
      outputRoot,
      primitiveOutputRoot: path.join(root, "primitives"),
      roots: ["new-boolean-props"],
    });
    const source = await readFile(
      path.join(outputRoot, "new-boolean-props", "NewBooleanProps.vue"),
      "utf8",
    );

    expect(source).toContain("plainFlag = undefined");
    expect(source).toContain("unionFlag = undefined");
    expect(source).toContain("literalDefaultFlag = true");
    expect(source).not.toContain("label = undefined");
    expect(findAbsentBooleanCasts(source, "NewBooleanProps.vue")).toEqual([]);
  });

  it("never casts an absent Boolean prop in any generated Styled component", async () => {
    const root = await createRoot();
    const outputRoot = path.join(root, "styled");
    const contracts = selectVueStyledContracts(starwindStyledContracts);
    await generateFrameworkStyledWrappers("vue", {
      contracts,
      generatedBy: "vue-styled-boolean-props.test.ts",
      outputRoot,
      primitiveOutputRoot: path.join(root, "primitives"),
      roots: contracts.map(({ component }) => component),
    });

    const files = (await readdir(outputRoot, { recursive: true })).filter((file) =>
      file.endsWith(".vue"),
    );
    expect(files.length).toBeGreaterThan(200);
    const casts = (
      await Promise.all(
        files.map(async (file) =>
          findAbsentBooleanCasts(await readFile(path.join(outputRoot, file), "utf8"), file).map(
            (name) => `${file}: ${name}`,
          ),
        ),
      )
    ).flat();
    expect(casts).toEqual([]);
  });
});
