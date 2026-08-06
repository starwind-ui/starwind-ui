import { describe, expect, it } from "vitest";

import { breadcrumbStyledContract } from "../../contracts/styled/components/breadcrumb.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { renderVueComponent } from "../../renderers/framework-adapters/vue/styled/render.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";
import "../styled-contracts/vue-styled-icon-assets.test.js";

const options = {
  directory: "/tmp/styled/breadcrumb",
  outputRoot: "/tmp/styled",
  primitiveOutputRoot: "/tmp/primitives",
};

describe("generated Vue Styled SVG icon assets", () => {
  it("renders Breadcrumb Dots from the projected asset without an SVG import", () => {
    const group = projectStyledOutputComponentGroup(breadcrumbStyledContract);
    const component = group.components.find(
      ({ exportName }) => exportName === "BreadcrumbEllipsis",
    );
    if (!component) throw new TypeError("Missing BreadcrumbEllipsis output.");

    const source = renderVueComponent(group, component, options);

    expect(source).toContain('<svg\n        xmlns="http://www.w3.org/2000/svg"');
    expect(source).toContain('<path d="M5 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />');
    expect(source).not.toContain("@tabler/icons/outline/dots.svg");
    expect(() => assertVueSfcCompiles(source, "BreadcrumbEllipsis.vue")).not.toThrow();
  });
});
