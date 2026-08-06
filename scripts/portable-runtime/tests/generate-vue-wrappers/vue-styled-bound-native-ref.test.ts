import { describe, expect, it } from "vitest";

import type { StyledAdapterContract } from "../../contracts/styled/types.js";
import { assertVueSfcCompiles } from "../../renderers/framework-adapters/vue/sfc-compiler.js";
import { renderVueComponent } from "../../renderers/framework-adapters/vue/styled/render.js";
import { projectStyledOutputComponentGroup } from "../../renderers/styled-output-model/index.js";

const BOUND_NATIVE_REF_FIXTURE = {
  component: "bound-native-ref-fixture",
  publicExports: ["BoundNativeRoot", "NarrowedBoundNativeRoot"],
  defaultExport: { Narrowed: "NarrowedBoundNativeRoot", Root: "BoundNativeRoot" },
  components: [
    {
      exportName: "BoundNativeRoot",
      forwardRef: { targetType: "HTMLElement" },
      props: { fields: [{ name: "as", optional: true, type: "string" }] },
      destructure: { props: [{ name: "as", alias: "Tag", defaultValue: '"div"' }] },
      render: [
        {
          type: "element",
          tag: "Tag",
          tagBinding: true,
          attrs: [{ name: "data-slot", value: { type: "literal", value: "bound-root" } }],
          children: [{ type: "slot" }],
        },
      ],
    },
    {
      exportName: "NarrowedBoundNativeRoot",
      forwardRef: { targetType: "HTMLButtonElement" },
      props: { fields: [{ name: "as", optional: true, type: "string" }] },
      destructure: { props: [{ name: "as", alias: "Tag", defaultValue: '"button"' }] },
      render: [
        {
          type: "element",
          tag: "Tag",
          tagBinding: true,
          attrs: [{ name: "data-slot", value: { type: "literal", value: "narrowed-bound-root" } }],
          children: [{ type: "slot" }],
        },
      ],
    },
  ],
} satisfies StyledAdapterContract;

const options = {
  directory: "/tmp/styled/bound-native-ref-fixture",
  outputRoot: "/tmp/styled",
  primitiveOutputRoot: "/tmp/primitives",
};

describe("generic Vue Styled bound native refs", () => {
  const group = projectStyledOutputComponentGroup(BOUND_NATIVE_REF_FIXTURE);

  it("exposes a bound native root through the shared HTMLElement target", () => {
    const component = group.components[0];
    if (!component) throw new TypeError("Missing bound native ref fixture component.");

    const source = renderVueComponent(group, component, options);

    expect(source).toContain("const element = ref<HTMLElement | null>(null);");
    expect(source).toContain("defineExpose({ element });");
    expect(source).toContain(':is="Tag"');
    expect(source.match(/ref="element"/g)).toHaveLength(1);
    expect(() => assertVueSfcCompiles(source, "BoundNativeRoot.vue")).not.toThrow();
  });

  it("rejects a narrowed DOM target on a bound native root", () => {
    const component = group.components[1];
    if (!component) throw new TypeError("Missing narrowed bound native ref fixture component.");

    expect(() => renderVueComponent(group, component, options)).toThrow(
      'Vue Styled NarrowedBoundNativeRoot cannot place forwardRef target "HTMLButtonElement" on its native render roots; missing HTMLButtonElement.',
    );
  });
});
