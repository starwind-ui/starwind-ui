import { describe, expect, it } from "vitest";

import { renderNodes } from "../../renderers/framework-adapters/astro/styled/render-tree.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { DYNAMIC_ELEMENT_FIXTURE } from "../styled-contracts/vue-styled-dynamic-elements.test.js";

describe("Astro Styled dynamic elements", () => {
  it("preserves Astro's existing syntax for bound and literal tags", () => {
    const group = projectStyledOutputComponentGroup(DYNAMIC_ELEMENT_FIXTURE);
    const dynamic = group.components.find(({ exportName }) => exportName === "DynamicElement");
    const literal = group.components.find(({ exportName }) => exportName === "LiteralElement");
    const staticElement = group.components.find(({ exportName }) => exportName === "StaticElement");
    if (!dynamic || !literal || !staticElement) {
      throw new TypeError("Missing dynamic-element fixture output.");
    }

    expect(renderNodes(dynamic.render, 0, {})).toBe(
      '<Tag data-slot="dynamic">\n  <slot />\n</Tag>',
    );
    expect(renderNodes(literal.render, 0, {})).toBe(
      '<Tag data-slot="literal">\n  <slot />\n</Tag>',
    );
    expect(renderNodes(staticElement.render, 0, {})).toBe(
      '<section data-slot="static">\n  <slot />\n</section>',
    );
  });
});
