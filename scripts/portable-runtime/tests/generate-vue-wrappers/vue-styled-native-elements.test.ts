import { describe, expect, it } from "vitest";

import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { renderVueComponent } from "../../renderers/framework-adapters/vue/styled/render.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";

const NATIVE_ELEMENT_FIXTURE: StyledAdapterContract = {
  component: "generic-native-elements",
  publicExports: ["GenericNavigation", "GenericOption", "GenericOptGroup", "GenericTextarea"],
  defaultExport: {
    Navigation: "GenericNavigation",
    Option: "GenericOption",
    OptGroup: "GenericOptGroup",
    Textarea: "GenericTextarea",
  },
  components: [
    nativeElementComponent("GenericNavigation", "nav", "HTMLElement"),
    nativeElementComponent("GenericOption", "option", "HTMLOptionElement"),
    nativeElementComponent("GenericOptGroup", "optgroup", "HTMLOptGroupElement"),
    {
      ...nativeElementComponent("GenericTextarea", "textarea", "HTMLTextAreaElement"),
      props: {
        extends: [{ type: "omitHtmlAttributes", element: "textarea", keys: ["children"] }],
      },
    },
  ],
};

const group = projectStyledOutputComponentGroup(NATIVE_ELEMENT_FIXTURE);
const options = {
  directory: "/tmp/styled/generic-native-elements",
  outputRoot: "/tmp/styled",
  primitiveOutputRoot: "/tmp/primitives",
};

describe("generic Vue Styled native element semantics", () => {
  it.each([
    ["GenericNavigation", "HTMLElement"],
    ["GenericOption", "HTMLOptionElement"],
    ["GenericOptGroup", "HTMLOptGroupElement"],
  ])("exposes the %s native render root as %s", (exportName, elementType) => {
    const source = render(exportName);

    expect(source).toContain(`const element = ref<${elementType} | null>(null);`);
    expect(source.match(/ref="element"/g)).toHaveLength(1);
    expect(() => assertVueSfcCompiles(source, `${exportName}.vue`)).not.toThrow();
  });

  it("uses Vue's native optgroup attributes", () => {
    const source = render("GenericOptGroup");

    expect(source).toContain("type GenericOptGroupProps = OptgroupHTMLAttributes;");
    expect(source).toContain("type OptgroupHTMLAttributes");
  });

  it("uses Vue's native textarea attributes with contract omissions", () => {
    const source = render("GenericTextarea");

    expect(source).toContain(
      'type GenericTextareaProps = Omit<TextareaHTMLAttributes, "children">;',
    );
    expect(source).toContain("type TextareaHTMLAttributes");
    expect(() => assertVueSfcCompiles(source, "GenericTextarea.vue")).not.toThrow();
  });
});

function nativeElementComponent(exportName: string, tag: string, targetType: string) {
  return {
    exportName,
    forwardRef: { targetType },
    props: { extends: [{ type: "htmlAttributes" as const, element: tag }] },
    destructure: { props: [], rest: "rest" },
    render: [
      {
        type: "element" as const,
        tag,
        attrs: [{ name: "spread", value: { type: "variable" as const, name: "rest" } }],
        children: [{ type: "slot" as const }],
      },
    ],
  };
}

function render(exportName: string): string {
  const component = group.components.find((candidate) => candidate.exportName === exportName);
  if (!component) throw new TypeError(`Missing fixture component ${exportName}.`);
  return renderVueComponent(group, component, options);
}
