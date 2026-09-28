import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { buttonRuntimeAdapterContract } from "../../contracts/primitive/components/button.js";
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

describe("generated Vue Button Primitive", () => {
  const temporaryRoots: string[] = [];

  afterEach(async () => {
    await Promise.all(
      temporaryRoots.splice(0).map((root) => rm(root, { force: true, recursive: true })),
    );
  });

  it("projects the Button Generic Adapter Plan through the action-surface family", () => {
    const plan = buildGenericAdapterPlan(buttonRuntimeAdapterContract);
    const outputModel = buildGenericAdapterOutputModel(plan);

    expect(plan.component).toBe("button");
    expect(outputModel.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: expect.objectContaining({
            family: expect.objectContaining({ kind: "action-surface", part: "root" }),
          }),
          kind: "component",
        }),
      ]),
    );
  });

  it("generates deterministic, compiler-valid Button-owned output", async () => {
    const first = await generateButton();
    const second = await generateButton();

    expect(first.source).toBe(second.source);
    expect(first.index).toBe(second.index);
    expect(() => assertVueSfcCompiles(first.source, "ButtonRoot.vue")).not.toThrow();

    const checkedIn = await readFile(
      path.join(process.cwd(), "packages/vue/src/button/ButtonRoot.vue"),
      "utf8",
    );
    expect(normalizeVueSource(first.source)).toBe(normalizeVueSource(checkedIn));
  });

  it("prints the fixed native Button contract without Primitive asChild or wrapper leakage", async () => {
    const { source } = await generateButton();

    expect(compactCode(source)).toContain(
      compactCode('import { createButton } from "@starwind-ui/runtime/button";'),
    );
    expect(() => assertVueSfcCompiles(source, "Component.vue")).not.toThrow();

    expect(compactCode(source)).not.toContain(compactCode("asChild"));
    expect(compactCode(source)).not.toContain(compactCode("<component"));
    expect(compactCode(source)).not.toContain(compactCode("Teleport"));
  });

  async function generateButton(): Promise<{ index: string; source: string }> {
    const outputRoot = await mkdtemp(path.join(os.tmpdir(), "starwind-vue-button-"));
    temporaryRoots.push(outputRoot);
    const entry = primitiveGeneratorRegistry.find((candidate) => candidate.component === "button");
    if (!entry) throw new Error("Button Primitive generator is missing.");

    await entry.generateTarget({
      componentHeader: createVueComponentHeader(GENERATED_BY),
      moduleHeader: createTsHeader(GENERATED_BY),
      outputRoot,
      target: "vue",
    });

    return {
      index: await readFile(path.join(outputRoot, "button/index.ts"), "utf8"),
      source: await readFile(path.join(outputRoot, "button/ButtonRoot.vue"), "utf8"),
    };
  }
});
