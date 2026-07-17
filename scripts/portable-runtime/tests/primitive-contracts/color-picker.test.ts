import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  colorPickerRuntimeAdapterContract,
  colorPickerRuntimeFacade,
} from "../../contracts/primitive/color-picker.js";
import { runtimeAdapterContracts } from "../../contracts/primitive/representatives.js";
import type { RuntimeAdapterContract } from "../../contracts/primitive/types.js";
import { validateRuntimeAdapterContracts } from "../../contracts/primitive/validation.js";

const PUBLIC_PARTS = [
  "root",
  "label",
  "control",
  "valueInput",
  "valueSwatch",
  "valueText",
  "area",
  "areaBackground",
  "areaThumb",
  "areaInput",
  "channelSlider",
  "channelSliderTrack",
  "channelSliderThumb",
  "channelSliderInput",
  "channelInput",
  "formatSelect",
  "formatControl",
  "transparencyGrid",
  "swatchGroup",
  "swatch",
  "eyeDropperTrigger",
  "clear",
  "hiddenInput",
] as const;

describe("Color Picker Runtime Adapter Contract", () => {
  it("captures the complete compound surface and participates in aggregate registration", () => {
    expect(colorPickerRuntimeAdapterContract.parts.map((part) => part.name)).toEqual(PUBLIC_PARTS);
    expect(colorPickerRuntimeAdapterContract.refs?.map((ref) => ref.part)).toEqual(PUBLIC_PARTS);
    expect(
      new Set(colorPickerRuntimeAdapterContract.parts.map((part) => part.discoveryAttribute)).size,
    ).toBe(PUBLIC_PARTS.length);
    expect(colorPickerRuntimeAdapterContract.runtime).toMatchObject({
      factory: "createColorPicker",
      importSource: "@starwind-ui/runtime/color-picker",
      rootPart: "root",
      destroys: true,
    });
    expect(colorPickerRuntimeAdapterContract.form).toEqual({
      fieldIntegration: true,
      hiddenInput: { part: "hiddenInput", type: "text" },
      props: ["form", "name", "required", "value"],
    });
    expect(colorPickerRuntimeAdapterContract.escapeHatches?.[0]).toMatchObject({
      affectedFrameworks: ["astro", "react"],
    });
    expect(runtimeAdapterContracts.map((contract) => contract.component)).toContain("color-picker");
    expect(validateRuntimeAdapterContracts([colorPickerRuntimeAdapterContract])).toEqual([]);
    expect(validateRuntimeAdapterContracts(runtimeAdapterContracts)).toEqual([]);
  });

  it("pins the Runtime facade handoff to public subpath exports", async () => {
    const source = await readFile(
      new URL("../../../../packages/runtime/src/components/color-picker/index.ts", import.meta.url),
      "utf8",
    );

    for (const value of colorPickerRuntimeFacade.values) {
      expect(source).toMatch(new RegExp(`\\b${value}\\b`));
    }
    for (const type of colorPickerRuntimeFacade.types) {
      expect(source).toContain(`type ${type}`);
    }
    expect(colorPickerRuntimeAdapterContract.escapeHatches?.[0]?.contractOwnedFacts).toContain(
      "Runtime facade value parseColor",
    );
    expect(
      colorPickerRuntimeAdapterContract.escapeHatches?.[0]?.contractOwnedFacts.some((fact) =>
        fact.includes(colorPickerRuntimeFacade.types.join(", ")),
      ),
    ).toBe(true);
  });

  it("owns ordered initial-state projection and rejects incomplete or duplicate facts", () => {
    const projection = colorPickerRuntimeAdapterContract.initialStateProjection!;
    expect(projection).toMatchObject({
      importSource: "@starwind-ui/runtime/color-picker",
      createFunction: "createColorPickerInitialState",
      projectFunction: "projectColorPickerInitialPart",
      ownershipAttribute: "data-sw-color-picker-initial-owned",
    });
    expect(projection.compositionDependencies.map((entry) => entry.part)).toEqual(PUBLIC_PARTS);
    expect(
      projection.compositionDependencies.find((entry) => entry.part === "areaInput")?.dependsOn,
    ).toEqual(["root", "area"]);
    expect(
      projection.compositionDependencies.find((entry) => entry.part === "swatch")?.dependsOn,
    ).toEqual(["root", "swatch"]);
    expect(
      projection.compositionDependencies.find((entry) => entry.part === "formatControl")?.dependsOn,
    ).toEqual(["root"]);

    expect(
      colorPickerRuntimeAdapterContract.parts.find((part) => part.name === "formatSelect")
        ?.initialAttributes,
    ).toEqual([{ name: "aria-readonly", source: "state" }]);
    expect(
      colorPickerRuntimeAdapterContract.parts.find((part) => part.name === "formatControl")
        ?.initialAttributes,
    ).toEqual([
      { name: "data-format", source: "state" },
      { name: "data-disabled", source: "state" },
      { name: "data-readonly", source: "state" },
    ]);

    const invalid = clone(colorPickerRuntimeAdapterContract);
    invalid.initialStateProjection!.ownershipAttribute = "aria-Bad" as `data-${string}`;
    invalid.initialStateProjection!.rootStateProps = [
      ...invalid.initialStateProjection!.rootStateProps,
      "value",
    ];
    invalid.initialStateProjection!.compositionDependencies = [
      ...invalid.initialStateProjection!.compositionDependencies.slice(1),
      {
        part: "label",
        dependsOn: ["root", "root", "missingPart"],
      },
    ];
    const issues = validateRuntimeAdapterContracts([invalid]);
    expect(issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ message: 'Duplicate root state prop "value".' }),
        expect.objectContaining({
          path: "initialStateProjection.ownershipAttribute",
          message: "Projection ownership attribute must be a lowercase kebab-case data attribute.",
        }),
        expect.objectContaining({
          message:
            "Projection composition dependencies must cover every part once in contract part order.",
        }),
        expect.objectContaining({
          message: 'Duplicate projection dependency entry for part "label".',
        }),
        expect.objectContaining({ message: 'Duplicate composition dependency "root".' }),
        expect.objectContaining({ message: 'Missing part "missingPart".' }),
      ]),
    );
  });

  it("preserves inherited direction unless an explicit dir prop is supplied", () => {
    const dir = colorPickerRuntimeAdapterContract.props.find((prop) => prop.name === "dir");
    const root = colorPickerRuntimeAdapterContract.parts.find((part) => part.name === "root");
    const initialRoot = colorPickerRuntimeAdapterContract.initialMarkup?.find(
      (entry) => entry.part === "root",
    );

    expect(dir).toEqual({ name: "dir", kind: "option", type: "ColorPickerDirection" });
    expect(dir).not.toHaveProperty("defaultValue");
    expect(root?.initialAttributes).toContainEqual({ name: "dir", source: "prop" });
    expect(initialRoot?.attributes).toContain("dir");
    expect(
      colorPickerRuntimeAdapterContract.props
        .filter((prop) => ["dir", "locale"].includes(prop.name))
        .every((prop) => !("defaultValue" in prop)),
    ).toBe(true);
  });

  it("publishes unique, described CSS-variable metadata with valid part owners", () => {
    const variables = colorPickerRuntimeAdapterContract.cssVariables ?? [];
    expect(variables.map((variable) => variable.name)).toEqual([
      "--sw-color-picker-color",
      "--sw-color-picker-hue",
      "--sw-color-picker-saturation",
      "--sw-color-picker-brightness",
      "--sw-color-picker-alpha",
      "--sw-color-picker-area-x",
      "--sw-color-picker-area-y",
      "--sw-color-picker-area-thumb-color",
      "--sw-color-picker-channel-position",
      "--sw-color-picker-channel-thumb-color",
      "--sw-color-picker-swatch-color",
      "--sw-color-picker-area-background",
      "--sw-color-picker-area-background-overlay",
      "--sw-color-picker-channel-gradient",
      "--sw-color-picker-transparency-grid-size",
    ]);
    expect(new Set(variables.map((variable) => variable.name)).size).toBe(variables.length);
    expect(variables.every((variable) => variable.description.trim().length > 0)).toBe(true);
  });

  it("rejects malformed, duplicate, undocumented, and unowned CSS variables", () => {
    const invalid = clone(colorPickerRuntimeAdapterContract);
    invalid.component = "invalid-color-picker-css-variables";
    invalid.cssVariables = [
      {
        name: "--Bad_Name",
        description: "",
        parts: [] as unknown as [string, ...string[]],
        source: "runtime",
      },
      {
        name: "--sw-color-picker-color",
        description: "First duplicate.",
        parts: ["missingPart"],
        source: "runtime",
      },
      {
        name: "--sw-color-picker-color",
        description: "Second duplicate.",
        parts: ["root"],
        source: "styled-adapter",
      },
    ];

    expect(validateRuntimeAdapterContracts([invalid])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "cssVariables.0.name",
          message: expect.stringContaining("Invalid CSS variable"),
        }),
        expect.objectContaining({
          path: "cssVariables.0.description",
          message: "CSS variable is missing a description.",
        }),
        expect.objectContaining({
          path: "cssVariables.0.parts",
          message: "CSS variable must reference a part.",
        }),
        expect.objectContaining({
          path: "cssVariables.1.parts",
          message: 'Missing part "missingPart".',
        }),
        expect.objectContaining({
          path: "cssVariables.2.name",
          message: 'Duplicate CSS variable "--sw-color-picker-color".',
        }),
      ]),
    );
  });
});

function clone(contract: RuntimeAdapterContract): RuntimeAdapterContract {
  return JSON.parse(JSON.stringify(contract)) as RuntimeAdapterContract;
}
