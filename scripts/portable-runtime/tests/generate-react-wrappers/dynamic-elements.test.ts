import { describe, expect, it } from "vitest";

import { renderNodes } from "../../renderers/framework-adapters/react/styled/render-tree.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import { DYNAMIC_ELEMENT_FIXTURE } from "../styled-contracts/vue-styled-dynamic-elements.test.js";

describe("React Styled dynamic elements", () => {
  it("preserves React's existing syntax for bound and literal tags", () => {
    const group = projectStyledOutputComponentGroup(DYNAMIC_ELEMENT_FIXTURE);
    const dynamic = group.components.find(({ exportName }) => exportName === "DynamicElement");
    const literal = group.components.find(({ exportName }) => exportName === "LiteralElement");
    const staticElement = group.components.find(({ exportName }) => exportName === "StaticElement");
    if (!dynamic || !literal || !staticElement) {
      throw new TypeError("Missing dynamic-element fixture output.");
    }

    expect(renderNodes(dynamic.render, 0, {})).toBe(
      '<Tag\n  data-slot="dynamic"\n>\n  {children}\n</Tag>',
    );
    expect(renderNodes(literal.render, 0, {})).toBe(
      '<Tag\n  data-slot="literal"\n>\n  {children}\n</Tag>',
    );
    expect(renderNodes(staticElement.render, 0, {})).toBe(
      '<section\n  data-slot="static"\n>\n  {children}\n</section>',
    );
  });
});
