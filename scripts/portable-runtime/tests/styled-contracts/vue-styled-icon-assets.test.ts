import { describe, expect, it } from "vitest";

import { breadcrumbStyledContract } from "../../contracts/styled/components/breadcrumb.js";
import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { validateStyledAdapterContracts } from "../../contracts/styled/validation.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import type { StyledOutputRenderNode } from "../../renderers/styled-output-model/types.js";

const ICON_FIXTURE = {
  component: "generic-svg-icon",
  publicExports: ["GenericSvgIcon"],
  defaultExport: { Root: "GenericSvgIcon" },
  components: [
    {
      exportName: "GenericSvgIcon",
      imports: [
        {
          importName: "FixtureIcon",
          source: "@fixture/icon.svg",
          svg: {
            attributes: [{ name: "viewBox", value: "0 0 1 1" }],
            children: [{ attributes: [{ name: "d", value: "M0 0" }], tag: "path" }],
          },
          type: "default",
        },
      ],
      render: [{ type: "icon", importName: "FixtureIcon" }],
    },
  ],
} satisfies StyledAdapterContract;

describe("shared Styled SVG icon assets", () => {
  it("validates and projects an icon asset from its declared import", () => {
    expect(validateStyledAdapterContracts([ICON_FIXTURE])).toEqual([]);

    const icon = projectStyledOutputComponentGroup(ICON_FIXTURE).components[0]?.render[0];
    expect(icon).toMatchObject({
      asset: {
        attributes: [{ name: "viewBox", value: "0 0 1 1" }],
        children: [{ attributes: [{ name: "d", value: "M0 0" }], tag: "path" }],
      },
      importName: "FixtureIcon",
      type: "icon",
    });
  });

  it("reports an icon whose declared import has no SVG asset", () => {
    const invalid = structuredClone(ICON_FIXTURE) as StyledAdapterContract;
    delete invalid.components[0]?.imports?.[0]?.svg;

    expect(validateStyledAdapterContracts([invalid])).toContainEqual({
      component: "generic-svg-icon",
      message: 'Icon "FixtureIcon" must resolve to a declared SVG asset.',
      path: "components.GenericSvgIcon.render.0.importName",
    });
  });

  it("gives Breadcrumb's Dots fallback the same shared asset fact", () => {
    const render = projectStyledOutputComponentGroup(breadcrumbStyledContract).components.find(
      ({ exportName }) => exportName === "BreadcrumbEllipsis",
    )?.render;

    expect(findIcon(render ?? [])).toMatchObject({
      asset: expect.any(Object),
      importName: "Dots",
    });
  });
});

function findIcon(nodes: readonly StyledOutputRenderNode[]): StyledOutputRenderNode | undefined {
  for (const node of nodes) {
    if (node.type === "icon") return node;
    if (node.type === "condition") {
      const icon = findIcon([...node.then, ...node.else]);
      if (icon) return icon;
    }
    if (node.type === "slot") {
      const icon = findIcon(node.fallback);
      if (icon) return icon;
    }
    if ("children" in node) {
      const icon = findIcon(node.children);
      if (icon) return icon;
    }
  }
  return undefined;
}
