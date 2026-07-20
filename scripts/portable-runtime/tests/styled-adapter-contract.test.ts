import { describe, expect, it } from "vitest";

import { buttonStyledContract } from "../contracts/styled/components/button.js";
import { carouselStyledContract } from "../contracts/styled/components/carousel.js";
import { proseStyledContract } from "../contracts/styled/components/prose.js";
import { starwindStyledContracts } from "../contracts/styled/starwind.js";
import type { StyledAdapterContract } from "../contracts/styled/types.js";
import { validateStyledAdapterContracts } from "../contracts/styled/validation.js";

describe("StyledAdapterContract inventory", () => {
  it("validates adapter-generation invariants for every styled contract", () => {
    expect(validateStyledAdapterContracts(starwindStyledContracts)).toEqual([]);
  });

  it("accepts Vue as a Styled framework target while rejecting an empty filter", () => {
    const vueOnlyButton = cloneStyledContract(buttonStyledContract);
    vueOnlyButton.frameworks = ["vue"];
    const emptyButton = cloneStyledContract(buttonStyledContract);
    emptyButton.frameworks = [];

    expect(validateStyledAdapterContracts([vueOnlyButton])).toEqual([]);
    expect(validateStyledAdapterContracts([emptyButton])).toEqual([
      expect.objectContaining({
        message: "Framework filter must include at least one target.",
        path: "frameworks",
      }),
    ]);
  });

  it("resolves variant omissions through the declared alias source and dependency", () => {
    const validCarousel = cloneStyledContract(carouselStyledContract);
    const controlProps = validCarousel.components
      .find((component) => component.exportName === "CarouselNext")
      ?.props?.extends?.find((entry) => entry.type === "variantProps");
    if (!controlProps || controlProps.type !== "variantProps") {
      throw new Error("CarouselNext is missing aliased control variants.");
    }
    controlProps.omit = ["size"];

    expect(validateStyledAdapterContracts([buttonStyledContract, validCarousel])).toEqual([]);

    const invalidOmission = cloneStyledContract(validCarousel);
    const invalidOmissionProps = invalidOmission.components
      .find((component) => component.exportName === "CarouselNext")
      ?.props?.extends?.find((entry) => entry.type === "variantProps");
    if (!invalidOmissionProps || invalidOmissionProps.type !== "variantProps") {
      throw new Error("CarouselNext is missing aliased control variants.");
    }
    invalidOmissionProps.omit = ["missing"];

    const wrongSource = cloneStyledContract(validCarousel);
    wrongSource.variantAliases!.carouselControl!.source = "../missing/variants";

    expect(
      validateStyledAdapterContracts([buttonStyledContract, invalidOmission, wrongSource]),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: "carousel",
          message: 'Variant prop omission "missing" does not match a resolved variant axis.',
        }),
        expect.objectContaining({
          component: "carousel",
          message: 'Variant alias source "missing" must be a styled component dependency.',
        }),
      ]),
    );
  });

  it("reports invalid public exports, framework filters, local styles, and render nodes", () => {
    const invalidPublicExport = cloneStyledContract(buttonStyledContract);
    invalidPublicExport.component = "invalid-public-export";
    invalidPublicExport.publicExports = ["Button", "MissingButton"];
    invalidPublicExport.defaultExport = { Root: "MissingButton" };

    const invalidFrameworkFilter = cloneStyledContract(buttonStyledContract);
    invalidFrameworkFilter.component = "invalid-framework-filter";
    invalidFrameworkFilter.frameworks = ["astro", "angular", "astro"] as never;

    const emptyFrameworkFilter = cloneStyledContract(buttonStyledContract);
    emptyFrameworkFilter.component = "empty-framework-filter";
    emptyFrameworkFilter.frameworks = [];

    const astroOnlyTarget = cloneStyledContract(buttonStyledContract);
    astroOnlyTarget.component = "astro-only-target";
    astroOnlyTarget.frameworks = ["astro"];

    const frameworkMismatchReference = cloneStyledContract(buttonStyledContract);
    frameworkMismatchReference.component = "framework-mismatch-reference";
    frameworkMismatchReference.components[0]!.props!.extends = [
      {
        component: "astro-only-target",
        exportName: "Button",
        frameworks: ["react"],
        type: "componentProps",
      },
    ];
    frameworkMismatchReference.components[0]!.render = [
      {
        component: "astro-only-target",
        exportName: "Button",
        type: "component",
      },
    ];

    const invalidStyles = cloneStyledContract(proseStyledContract);
    invalidStyles.component = "invalid-styles";
    invalidStyles.styles = {
      content: [],
      fileName: "nested/styles.scss",
      importFrom: ["MissingProse"],
    };

    const invalidRenderNode = cloneStyledContract(buttonStyledContract);
    invalidRenderNode.component = "invalid-render-node";
    invalidRenderNode.components[0]!.render = [
      {
        children: [],
        type: "portal",
      } as never,
    ];

    const invalidSpreadAttribute = cloneStyledContract(buttonStyledContract);
    invalidSpreadAttribute.component = "invalid-spread-attribute";
    invalidSpreadAttribute.components[0]!.render = [
      {
        attrs: [{ name: "spread" } as never],
        selfClosing: true,
        tag: "div",
        type: "element",
      },
    ];

    const invalidVariantReference = cloneStyledContract(buttonStyledContract);
    invalidVariantReference.component = "invalid-variant-reference";
    invalidVariantReference.components[0]!.props!.extends = [
      { type: "variantProps", variant: "missingVariant" },
    ];
    invalidVariantReference.components[0]!.render = [
      {
        attrs: [
          {
            name: "class",
            value: { type: "classVariant", variant: "missingVariant" },
          },
        ],
        selfClosing: true,
        tag: "div",
        type: "element",
      },
    ];

    expect(
      validateStyledAdapterContracts([
        invalidPublicExport,
        invalidFrameworkFilter,
        emptyFrameworkFilter,
        astroOnlyTarget,
        frameworkMismatchReference,
        invalidStyles,
        invalidRenderNode,
        invalidSpreadAttribute,
        invalidVariantReference,
      ]),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          component: "invalid-public-export",
          message: 'Public export "MissingButton" does not match a component export.',
          path: "publicExports.MissingButton",
        }),
        expect.objectContaining({
          component: "invalid-public-export",
          message: 'Default export target "MissingButton" does not match a component export.',
          path: "defaultExport.Root",
        }),
        expect.objectContaining({
          component: "invalid-framework-filter",
          message: 'Unsupported framework target "angular".',
          path: "frameworks.angular",
        }),
        expect.objectContaining({
          component: "invalid-framework-filter",
          message: 'Duplicate framework target "astro".',
          path: "frameworks.astro",
        }),
        expect.objectContaining({
          component: "empty-framework-filter",
          message: "Framework filter must include at least one target.",
          path: "frameworks",
        }),
        expect.objectContaining({
          component: "framework-mismatch-reference",
          message:
            'Component reference "astro-only-target.Button" is not available for framework "react".',
          path: "components.Button.props.extends.0.frameworks.react",
        }),
        expect.objectContaining({
          component: "framework-mismatch-reference",
          message:
            'Component reference "astro-only-target.Button" is not available for framework "react".',
          path: "components.Button.render.0.frameworks.react",
        }),
        expect.objectContaining({
          component: "invalid-styles",
          message: "Styles content must include at least one CSS line.",
          path: "styles.content",
        }),
        expect.objectContaining({
          component: "invalid-styles",
          message: 'Styles fileName must be a local ".css" file name.',
          path: "styles.fileName",
        }),
        expect.objectContaining({
          component: "invalid-styles",
          message: 'Styles import target "MissingProse" does not match a component export.',
          path: "styles.importFrom.MissingProse",
        }),
        expect.objectContaining({
          component: "invalid-render-node",
          message: 'Unsupported render node type "portal".',
          path: "components.Button.render.0.type",
        }),
        expect.objectContaining({
          component: "invalid-spread-attribute",
          message: "Spread attributes require a value expression.",
          path: "components.Button.render.0.attrs.0.value",
        }),
        expect.objectContaining({
          component: "invalid-variant-reference",
          message: 'Variant props reference missing variant "missingVariant".',
          path: "components.Button.props.extends.0.variant",
        }),
        expect.objectContaining({
          component: "invalid-variant-reference",
          message: 'Class variant reference "missingVariant" does not match a contract variant.',
          path: "components.Button.render.0.attrs.0.value.variant",
        }),
      ]),
    );
  });
});

function cloneStyledContract(contract: StyledAdapterContract): StyledAdapterContract {
  return JSON.parse(JSON.stringify(contract)) as StyledAdapterContract;
}
