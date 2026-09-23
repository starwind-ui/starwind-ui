import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { radioRuntimeAdapterContract } from "../../contracts/primitive/components/radio.js";
import { createVueComponentHeader } from "../../renderers/framework-adapters/vue/primitive-package.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
} from "../../renderers/generic-adapter-plan/index.js";
import { primitiveGeneratorRegistry } from "../../renderers/primitive-generator-registry.js";
import { createTsHeader } from "../../renderers/shared.js";
import { compactCode, normalizeVueSource } from "../source-comparison.js";

const GENERATED_BY = "scripts/portable-runtime/generate-vue-wrappers.ts";

describe("generated Vue Radio Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects optional Radio Group ownership and accepted state synchronization from facts", () => {
    const output = buildGenericAdapterOutputModel(
      buildGenericAdapterPlan(radioRuntimeAdapterContract),
    );
    expect(output.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({
              facts: expect.objectContaining({
                behavior: expect.objectContaining({
                  acceptedChangeNotification: "detail-on-accepted",
                  groupStrategy: "value-equals",
                }),
                group: expect.objectContaining({
                  requirement: "optional",
                  valueFields: ["disabled", "form", "name", "readOnly", "required", "value"],
                }),
                state: expect.objectContaining({ syncEvent: "stateSync" }),
              }),
              kind: "boolean-form-control",
              part: "root",
            }),
          }),
        }),
      ]),
    );
  });

  it("generates deterministic compiler-valid accepted/current Radio output", async () => {
    const first = await generateRadio();
    const second = await generateRadio();

    expect(first).toEqual(second);
    expect(() => assertVueSfcCompiles(first.root, "RadioRoot.vue")).not.toThrow();
    expect(() => assertVueSfcCompiles(first.indicator, "RadioIndicator.vue")).not.toThrow();
    expect(() => assertVueSfcCompiles(first.root, "Component.vue")).not.toThrow();

    expect(compactCode(first.root)).toContain(compactCode("data-sw-radio-input"));

    expect(first.index).toContain('export { default as RadioRoot } from "./RadioRoot.vue";');
    expect(first.index).toContain(
      'export { default as RadioIndicator } from "./RadioIndicator.vue";',
    );

    for (const [fileName, contents] of Object.entries({
      "RadioIndicator.vue": first.indicator,
      "RadioRoot.vue": first.root,
    })) {
      expect(normalizeVueSource(contents)).toBe(
        normalizeVueSource(
          await readFile(path.join(process.cwd(), "packages/vue/src/radio", fileName), "utf8"),
        ),
      );
    }
  });

  async function generateRadio(): Promise<{ index: string; indicator: string; root: string }> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-radio-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "radio");
    if (!entry) throw new Error("Radio Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });
    return {
      index: await readFile(path.join(outputRoot, "radio/index.ts"), "utf8"),
      indicator: await readFile(path.join(outputRoot, "radio/RadioIndicator.vue"), "utf8"),
      root: await readFile(path.join(outputRoot, "radio/RadioRoot.vue"), "utf8"),
    };
  }
});
