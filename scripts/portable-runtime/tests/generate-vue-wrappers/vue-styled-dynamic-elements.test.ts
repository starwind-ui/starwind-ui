import { describe, expect, it } from "vitest";

import { aspectRatioStyledContract } from "../../contracts/styled/components/aspect-ratio.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { renderVueComponent } from "../../renderers/framework-adapters/vue/styled/render.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { DYNAMIC_ELEMENT_FIXTURE } from "../styled-contracts/vue-styled-dynamic-elements.test.js";

const options = {
  directory: "/tmp/styled/dynamic-element-fixture",
  outputRoot: "/tmp/styled",
  primitiveOutputRoot: "/tmp/primitives",
};

describe("generic Vue Styled dynamic elements", () => {
  const fixture = projectStyledOutputComponentGroup(DYNAMIC_ELEMENT_FIXTURE);

  it("renders bound tags through Vue's dynamic element form", () => {
    const source = renderFixture("DynamicElement");

    expect(source).toMatch(/<component[\s\S]+:is="Tag"[\s\S]+<slot \/>[\s\S]+<\/component>/);
    expect(source).not.toContain("<Tag");
    expect(() => assertVueSfcCompiles(source, "DynamicElement.vue")).not.toThrow();
  });

  it("keeps an unmarked capitalized tag literal", () => {
    const source = renderFixture("LiteralElement");

    expect(source).toMatch(/<Tag[\s\S]+data-slot="literal"[\s\S]+<\/Tag>/);
    expect(source).not.toContain("<component");
  });

  it("keeps static lowercase tags literal", () => {
    const source = renderFixture("StaticElement");

    expect(source).toMatch(/<section[\s\S]+data-slot="static"[\s\S]+<\/section>/);
    expect(source).not.toContain("<component");
  });

  it("renders self-closing bound tags through Vue's dynamic element form", () => {
    const source = renderFixture("VoidDynamicElement");

    expect(source).toMatch(/<component[\s\S]+:is="Tag"[\s\S]+data-slot="void-dynamic"[\s\S]+\/>/);
    expect(source).not.toContain("</component>");
    expect(() => assertVueSfcCompiles(source, "VoidDynamicElement.vue")).not.toThrow();
  });

  it("uses the generic dynamic element renderer for Aspect Ratio", () => {
    const group = projectStyledOutputComponentGroup(aspectRatioStyledContract);
    const component = group.components[0];
    if (!component) throw new TypeError("Missing Aspect Ratio output component.");

    const source = renderVueComponent(group, component, options);

    expect(source).toMatch(/<component[\s\S]+:is="Tag"[\s\S]+data-slot="aspect-ratio"/);
    expect(source).not.toContain("<Tag");
  });

  function renderFixture(exportName: string): string {
    const component = fixture.components.find((candidate) => candidate.exportName === exportName);
    if (!component) throw new TypeError(`Missing fixture component ${exportName}.`);
    return renderVueComponent(fixture, component, options);
  }
});
