import { readFile } from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { progressStyledContract } from "../../contracts/styled/components/progress.js";
import { selectStyledContract } from "../../contracts/styled/components/select.js";
import {
  projectVueComputedExpression,
  renderVueComputedExpression,
  renderVueExpression,
} from "../../renderers/framework-adapters/vue/styled/expressions.js";
import { projectVueStyledComponent } from "../../renderers/framework-adapters/vue/styled/projection.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";

const STYLED_RENDERER_ROOT = path.join(
  process.cwd(),
  "scripts/portable-runtime/renderers/framework-adapters/vue/styled",
);
const OPTIONS = {
  directory: "generated/component",
  outputRoot: "generated",
  primitiveOutputRoot: "primitives",
};

describe("Vue Styled renderer structure", () => {
  it("projects concrete target-owned props, setup, refs, bindings, slots, and render nodes", () => {
    const group = projectStyledOutputComponentGroup(progressStyledContract);
    const component = group.components.find(({ exportName }) => exportName === "Progress")!;
    const projection = projectVueStyledComponent(group, component, OPTIONS);

    expect(projection.props.public.name).toBe("ProgressProps");
    expect(projection.props.declared.fields.map(({ name }) => name)).toContain("class");
    expect(projection.props.destructure.map(({ name }) => name)).toContain("value");
    expect(projection.computed.map(({ name }) => name)).toContain("progressPercent");
    expect(projection.models).toEqual([]);
    expect(projection.emits).toEqual([]);
    expect(projection.slots).toEqual([]);
    expect(projection.exposedRefs).toHaveLength(1);
    expect(projection.rootBindings).toEqual([
      { attribute: "ref", target: "progress primitive root" },
    ]);
    expect(projection.render).not.toBe(component.render);
    expect(projection.render[0]).toMatchObject({ type: "primitive", component: "progress" });
  });

  it("projects Select specializations as typed data and routes both through common serialization", async () => {
    const group = projectStyledOutputComponentGroup(selectStyledContract);
    const trigger = projectVueStyledComponent(
      group,
      group.components.find(({ exportName }) => exportName === "SelectTrigger")!,
      OPTIONS,
    );
    const value = projectVueStyledComponent(
      group,
      group.components.find(({ exportName }) => exportName === "SelectValue")!,
      OPTIONS,
    );

    expect(trigger.specialization).toMatchObject({
      kind: "select-trigger",
      contextName: "StyledTrigger",
    });
    expect(trigger.slots.map(({ name }) => name)).toEqual(["default", "icon"]);
    expect(value.specialization).toMatchObject({ kind: "select-value" });
    expect(value.slots[0]?.signature).toContain("label: string | null");

    const renderer = await readFile(path.join(STYLED_RENDERER_ROOT, "render.ts"), "utf8");
    expect(renderer).toContain("serializeVueSfc(projectSelectTriggerSfc(projection))");
    expect(renderer).toContain("serializeVueSfc(projectSelectValueSfc(projection))");
    expect(renderer).not.toContain('<script setup lang="ts">');
  });

  it("does not mutate rendered source or reparse raw expressions", async () => {
    const rendererFiles = [
      "expressions.ts",
      "imports.ts",
      "projection.ts",
      "props.ts",
      "ref-bridges.ts",
      "render-tree.ts",
      "render.ts",
      "serialization.ts",
      "specializations.ts",
    ];
    const source = (
      await Promise.all(
        rendererFiles.map((file) => readFile(path.join(STYLED_RENDERER_ROOT, file), "utf8")),
      )
    ).join("\n");

    expect(source).not.toMatch(/\.replace(?:All)?\s*\(/);
    expect(source).not.toContain("renderComputedDependencies");
    expect(source).not.toContain("renderCodeIdentifiers");
    expect(source).not.toContain("new RegExp");
  });

  it("renders explicit computed references without touching adversarial raw syntax", () => {
    const raw = {
      type: "raw" as const,
      code: "value.member + ({ value: 1 }).value + /value/.test(text) /* value */",
    };
    expect(renderVueExpression(raw)).toBe(raw.code);
    expect(() => projectVueComputedExpression(raw)).toThrow(
      /Add an explicit target-local expression projection/,
    );

    const projected = projectVueComputedExpression({
      type: "raw",
      code: "progressValue === null",
    });
    expect(renderVueComputedExpression(projected)).toBe("progressValue.value === null");
  });
});
