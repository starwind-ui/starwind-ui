import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { compile } from "svelte/compiler";
import ts from "typescript";
import { afterEach, describe, expect, it } from "vitest";

import { buttonStyledContract } from "../contracts/styled/components/button.js";
import { proseStyledContract } from "../contracts/styled/components/prose.js";
import type { StyledAdapterContract } from "../contracts/styled/types.js";
import { generateStarwindAstroWrappers } from "../generate-astro-wrappers.js";
import { generateStarwindReactWrappers } from "../generate-react-wrappers.js";
import { projectSvelteStyledGroup } from "../renderers/framework-adapters/svelte/styled/projection.js";
import { renderSvelteStyledFiles } from "../renderers/framework-adapters/svelte/styled/render.js";
import { assertVueSfcCompiles } from "../renderers/framework-adapters/vue/sfc-compiler.js";
import { renderVueComponent } from "../renderers/framework-adapters/vue/styled/render.js";
import { projectStyledOutputComponentGroup } from "../renderers/styled-output-model/index.js";
import { TYPE_PARAMETERS_FIXTURE } from "./styled-contracts/styled-type-parameters.test.js";

const DECLARATIONS = "T extends Record<string, unknown>, K extends keyof T = keyof T";

const roots: string[] = [];
afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { force: true, recursive: true })));
});

async function createRoot(prefix: string): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), prefix));
  roots.push(root);
  return root;
}

function expectValidTypeScript(source: string, fileName: string): void {
  const result = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.Preserve, module: ts.ModuleKind.ESNext },
    fileName,
    reportDiagnostics: true,
  });
  expect(result.diagnostics ?? []).toEqual([]);
}

describe("Styled type parameters in each target", () => {
  it("prints React function generics and a generic props type", async () => {
    const root = await createRoot("starwind-react-type-parameters-");
    await generateStarwindReactWrappers({
      contracts: [TYPE_PARAMETERS_FIXTURE],
      outputDir: "generated/styled",
      primitiveOutputDir: "generated/primitives",
      repoRoot: root,
    });
    const outputRoot = path.join(root, "generated/styled", TYPE_PARAMETERS_FIXTURE.component);
    const typed = await readFile(path.join(outputRoot, "TypedList.tsx"), "utf8");
    const plain = await readFile(path.join(outputRoot, "PlainItem.tsx"), "utf8");

    expect(typed).toContain(`export type TypedListProps<${DECLARATIONS}> =`);
    expect(typed).toContain(`function TypedList<${DECLARATIONS}>(props: TypedListProps<T, K>) {`);
    expect(plain).toContain("export type PlainItemProps = React.ComponentPropsWithoutRef<");
    expect(plain).toContain("function PlainItem(props: PlainItemProps) {");
    expectValidTypeScript(typed, "TypedList.tsx");
  });

  it("rejects React forwardRef with type parameters", async () => {
    const root = await createRoot("starwind-react-type-parameters-ref-");
    const contract = structuredClone(TYPE_PARAMETERS_FIXTURE) as StyledAdapterContract;
    contract.components[0]!.forwardRef = { targetType: "HTMLDivElement" };

    await expect(
      generateStarwindReactWrappers({
        contracts: [contract],
        outputDir: "generated/styled",
        primitiveOutputDir: "generated/primitives",
        repoRoot: root,
      }),
    ).rejects.toThrow(/type parameters cannot combine with forwardRef/);
  });

  it("prints the Vue script setup generic attribute and generic props types", () => {
    const group = projectStyledOutputComponentGroup(TYPE_PARAMETERS_FIXTURE);
    const options = {
      directory: "/tmp/styled/type-parameters-fixture",
      outputRoot: "/tmp/styled",
      primitiveOutputRoot: "/tmp/primitives",
    };
    const [typedComponent, plainComponent] = group.components;
    const typed = renderVueComponent(group, typedComponent!, options);
    const plain = renderVueComponent(group, plainComponent!, options);

    // A generic script setup cannot export types, so they live in a plain module script.
    expect(typed.indexOf('<script lang="ts">')).toBe(0);
    expect(typed.indexOf(`export type TypedListProps<${DECLARATIONS}> =`)).toBeLessThan(
      typed.indexOf(`<script setup lang="ts" generic="${DECLARATIONS}">`),
    );
    expect(typed).toContain(`<script setup lang="ts" generic="${DECLARATIONS}">`);
    expect(typed).toContain(`export type TypedListProps<${DECLARATIONS}> =`);
    expect(typed).toContain(`type TypedListDeclaredProps<${DECLARATIONS}> = {`);
    expect(typed).toContain("& /* @vue-ignore */ TypedListProps<T, K>;");
    expect(typed).toContain("defineProps<TypedListDeclaredProps<T, K>>();");
    expect(plain).toContain('<script setup lang="ts">');
    expect(plain).not.toContain("generic=");
    expect(() => assertVueSfcCompiles(typed, "TypedList.vue")).not.toThrow();
  });

  it("prints Svelte instance generics and parameterizes the module props type", () => {
    const contract = structuredClone(proseStyledContract) as StyledAdapterContract;
    contract.components[0]!.typeParameters = [{ name: "T", constraint: "object", default: "{}" }];
    const files = renderSvelteStyledFiles(
      projectSvelteStyledGroup(projectStyledOutputComponentGroup(contract), {
        primitiveImportBase: "@starwind-ui/svelte",
      }),
    );
    const source = files.find((file) => file.relativePath === "prose/Prose.svelte")!.content;
    const untouched = renderSvelteStyledFiles(
      projectSvelteStyledGroup(projectStyledOutputComponentGroup(proseStyledContract), {
        primitiveImportBase: "@starwind-ui/svelte",
      }),
    ).find((file) => file.relativePath === "prose/Prose.svelte")!.content;

    expect(source).toContain('<script lang="ts" generics="T extends object = {}">');
    expect(source).toContain("export type ProseProps<T extends object = {}> =");
    expect(source).toContain("}: ProseProps<T> = $props();");
    expect(untouched).toContain('<script lang="ts">');
    expect(untouched).toContain("export type ProseProps =");
    expect(untouched).toContain("}: ProseProps = $props();");
    expect(source.replace(/<T[^>]*>| generics="[^"]*"/g, "")).toBe(
      untouched.replace(/<T[^>]*>/g, ""),
    );
    expect(compile(source, { filename: "Prose.svelte", generate: "client" }).warnings).toEqual([]);
  });

  it("rejects Svelte type parameters on a projection that declares helper types", () => {
    // Button builds CommonProps from contract fields, outside the scope of the parameters.
    const contract = structuredClone(buttonStyledContract) as StyledAdapterContract;
    contract.components[0]!.typeParameters = [{ name: "T" }];
    const projection = projectSvelteStyledGroup(projectStyledOutputComponentGroup(contract), {
      primitiveImportBase: "@starwind-ui/svelte",
    });

    expect(() => renderSvelteStyledFiles(projection)).toThrow(
      "Svelte Styled Button.svelte: type parameters are not supported by a projection that declares helper types (NativeButtonProps, CommonProps, AnchorProps).",
    );
  });

  it("prints a generic Astro Props type", async () => {
    const root = await createRoot("starwind-astro-type-parameters-");
    await generateStarwindAstroWrappers({
      contracts: [TYPE_PARAMETERS_FIXTURE],
      outputDir: "generated/styled",
      primitiveOutputDir: "generated/primitives",
      repoRoot: root,
    });
    const outputRoot = path.join(root, "generated/styled", TYPE_PARAMETERS_FIXTURE.component);
    const typed = await readFile(path.join(outputRoot, "TypedList.astro"), "utf8");
    const plain = await readFile(path.join(outputRoot, "PlainItem.astro"), "utf8");

    expect(typed).toContain(`type Props<${DECLARATIONS}> = HTMLAttributes<"div"> & {`);
    expect(typed).toContain("} = Astro.props;");
    expect(plain).toContain('type Props = HTMLAttributes<"div">;');
  });
});
