import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { formRuntimeAdapterContract } from "../../contracts/primitive/components/form.js";
import { printVueFormFieldCoordinatorIndex } from "../../renderers/framework-adapters/vue/form-field-coordinator.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../../renderers/generic-adapter-plan/index.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { generateSelectedVueStyledGroups } from "./selected-styled-groups.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";
const VUE_TSC_TIMEOUT_MS = 30_000;

describe("generated Vue Form Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects Form through form-field-coordinator facts", () => {
    const output = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(formRuntimeAdapterContract),
    );
    expect(output.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({
              kind: "form-field-coordinator",
              part: "root",
            }),
          }),
        }),
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({
              kind: "form-field-coordinator",
              part: "error-summary",
            }),
          }),
        }),
      ]),
    );
  });

  it("requires form-field coordinator index facts before reading Runtime helper exports", () => {
    const output = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(formRuntimeAdapterContract),
    );
    const index = output.files.find((file) => file.kind === "index");
    if (!index) throw new TypeError("Form index projection is missing.");
    const { family: _family, ...familylessIndex } = index;

    expect(printVueFormFieldCoordinatorIndex(index).contents).toContain(
      "createFormSchemaValidator",
    );
    expect(() => printVueFormFieldCoordinatorIndex(familylessIndex)).toThrow(
      "Vue form-field-coordinator index projection requires form-field-coordinator facts.",
    );
  });

  it("generates deterministic compiler-valid checked-in Form output", async () => {
    const first = await generateForm();
    const second = await generateForm();

    expect(first).toEqual(second);
    expect(() => assertVueSfcCompiles(first.root, "FormRoot.vue")).not.toThrow();
    expect(() => assertVueSfcCompiles(first.errorSummary, "FormErrorSummary.vue")).not.toThrow();
    expect(first.root).toContain("instance = createForm(element);");
    expect(first.root).toContain(`props.dataValidationTiming ?? props.validationTiming`);
    expect(first.root).toContain("onBeforeUnmount(destroyOwnedInstance);");
    expect(first.errorSummary).toContain('ariaLive: "polite"');
    expect(first.errorSummary).toContain(':aria-live="props.ariaLive"');
    expect(first.errorSummary).toContain('v-bind="$attrs"');
    expect(first.index).toContain("createFormSchemaValidator");
    await expect(first.root).toBe(
      await readFile(path.join(process.cwd(), "packages/vue/src/form/FormRoot.vue"), "utf8"),
    );
  });

  it("generates compiler-valid Styled Form without enabling Styled Fieldset", async () => {
    const repoRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-styled-form-"));
    temporaryRoots.push(repoRoot);
    const outputRoot = path.join(repoRoot, "styled");
    await generateSelectedVueStyledGroups({
      format: true,
      groups: ["form"],
      outputDir: "styled",
      repoRoot,
    });
    const styled = await readFile(path.join(outputRoot, "form/Form.vue"), "utf8");

    expect(() => assertVueSfcCompiles(styled, "Form.vue")).not.toThrow();
    expect(styled).toContain("type FormHTMLAttributes");
    expect(styled).toContain("FormProps = Omit<\n  FormHTMLAttributes,");
    expect(styled).toContain('data-slot="form"');
    expect(styled).toContain("validationTiming?:");
    await expectStyledFormNativeAttributesTypecheck(repoRoot, outputRoot);
    await expect(
      readFile(path.join(outputRoot, "fieldset/Fieldset.vue"), "utf8"),
    ).rejects.toThrow();
  });

  async function generateForm(): Promise<{
    errorSummary: string;
    index: string;
    root: string;
  }> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-form-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "form");
    if (!entry) throw new Error("Form Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    return {
      errorSummary: await readFile(path.join(outputRoot, "form/FormErrorSummary.vue"), "utf8"),
      index: await readFile(path.join(outputRoot, "form/index.ts"), "utf8"),
      root: await readFile(path.join(outputRoot, "form/FormRoot.vue"), "utf8"),
    };
  }
});

async function expectStyledFormNativeAttributesTypecheck(
  fixtureRoot: string,
  outputRoot: string,
): Promise<void> {
  const fixturePath = path.join(fixtureRoot, "valid-form-native-attributes.vue");
  await writeFile(
    fixturePath,
    `<script setup lang="ts">
import { Form, type FormProps } from "#styled/form";

const props: FormProps = {
  action: "/review",
  enctype: "multipart/form-data",
  method: "post",
  novalidate: true,
  target: "_self",
};
</script>

<template>
  <Form v-bind="props" />
</template>
`,
    "utf8",
  );

  const workspaceRoot = process.cwd().split(path.sep).join("/");
  const workspaceRequire = createRequire(path.join(process.cwd(), "apps/react-demo/package.json"));
  const tailwindVariants = path
    .join(
      path.dirname(workspaceRequire.resolve("tailwind-variants/package.json")),
      "dist/index.d.ts",
    )
    .split(path.sep)
    .join("/");
  const configPath = path.join(fixtureRoot, "form-native-attributes.tsconfig.json");
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
            "#styled/*": [`${outputRoot.split(path.sep).join("/")}/*/index.ts`],
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
          fixturePath.split(path.sep).join("/"),
          `${outputRoot.split(path.sep).join("/")}/form/**/*`,
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
  if (result.error) {
    const reason = result.error.message.includes("ETIMEDOUT")
      ? `timed out after ${VUE_TSC_TIMEOUT_MS}ms`
      : "failed to execute";
    throw new Error(`Vue Styled Form typecheck ${reason}: ${result.error.message}`, {
      cause: result.error,
    });
  }
  expect(result.status, diagnostics).toBe(0);
}
