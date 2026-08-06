import { describe, expect, it } from "vitest";

import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { renderVueComponent } from "../../renderers/framework-adapters/vue/styled/render.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { FORWARD_REF_SCOPE_FIXTURE } from "../styled-contracts/vue-styled-forward-ref-scope.test.js";

const group = projectStyledOutputComponentGroup(FORWARD_REF_SCOPE_FIXTURE);
const options = {
  directory: "/tmp/styled/forward-ref-scope-fixture",
  outputRoot: "/tmp/styled",
  primitiveOutputRoot: "/tmp/primitives",
};

describe("Vue Styled forward-ref applicability", () => {
  it("exposes Vue-scoped and unscoped refs while ignoring a React-scoped fact", () => {
    const vueOnly = render("VueOnlyTarget");
    const reactOnly = render("ReactOnlyTarget");
    const unscoped = render("UnscopedTarget");

    for (const [fileName, source] of [
      ["VueOnlyTarget.vue", vueOnly],
      ["ReactOnlyTarget.vue", reactOnly],
      ["UnscopedTarget.vue", unscoped],
    ] as const) {
      expect(() => assertVueSfcCompiles(source, fileName)).not.toThrow();
    }

    expect(vueOnly).toContain("const element = ref<HTMLDivElement | null>(null);");
    expect(vueOnly).toContain("defineExpose({ element });");
    expect(vueOnly).toContain('ref="element"');
    expect(reactOnly).not.toContain("defineExpose({ element });");
    expect(reactOnly).not.toContain('ref="element"');
    expect(unscoped).toContain("defineExpose({ element });");
    expect(unscoped).toContain('ref="element"');
  });
});

function render(exportName: string): string {
  const component = group.components.find((candidate) => candidate.exportName === exportName);
  if (!component) throw new TypeError(`Missing fixture component ${exportName}.`);
  return renderVueComponent(group, component, options);
}
