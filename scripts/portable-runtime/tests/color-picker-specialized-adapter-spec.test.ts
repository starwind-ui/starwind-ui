import { describe, expect, it } from "vitest";

import {
  colorPickerRuntimeAdapterContract,
  colorPickerRuntimeFacade,
} from "../contracts/primitive/color-picker.js";
import {
  astroFrameworkAdapterTarget,
  reactFrameworkAdapterTarget,
} from "../renderers/framework-adapters/index.js";
import {
  assertColorPickerFamilyProjected,
  COLOR_PICKER_PART_NAMES,
} from "../renderers/primitive-output-model/index.js";
import {
  buildColorPickerAdapterOutputModel,
  buildColorPickerSpecializedAdapterSpec,
  type ColorPickerSpecializedAdapterSpec,
  validateColorPickerSpecializedAdapterSpec,
} from "../renderers/specialized-adapter-spec/index.js";

describe("Color Picker specialized adapter model", () => {
  it("deterministically consumes the complete contract-owned adapter surface", () => {
    const firstSpec = buildColorPickerSpecializedAdapterSpec(colorPickerRuntimeAdapterContract);
    const secondSpec = buildColorPickerSpecializedAdapterSpec(colorPickerRuntimeAdapterContract);
    const firstModel = buildColorPickerAdapterOutputModel(firstSpec);
    const secondModel = buildColorPickerAdapterOutputModel(secondSpec);

    expect(secondSpec).toEqual(firstSpec);
    expect(secondModel).toEqual(firstModel);
    expect(validateColorPickerSpecializedAdapterSpec(firstSpec)).toEqual([]);
    expect(Object.keys(firstSpec.colorPicker.parts)).toEqual(COLOR_PICKER_PART_NAMES);
    expect(Object.keys(firstSpec.colorPicker.props)).toEqual(
      colorPickerRuntimeAdapterContract.props.map((prop) => prop.name),
    );
    expect(Object.keys(firstSpec.colorPicker.events)).toEqual(
      colorPickerRuntimeAdapterContract.events.map((event) => event.name),
    );
    expect(firstSpec.colorPicker.setters.map((setter) => setter.method)).toEqual(
      colorPickerRuntimeAdapterContract.setters.map((setter) => setter.method),
    );
    expect(firstSpec.colorPicker.cssVariables).toEqual(
      colorPickerRuntimeAdapterContract.cssVariables,
    );
    expect(firstModel.files).toHaveLength(COLOR_PICKER_PART_NAMES.length + 1);
    expect(firstModel.files.map((file) => file.path)).toEqual([
      ...COLOR_PICKER_PART_NAMES.map(
        (part) => `color-picker/${firstSpec.colorPicker.exports.parts[part]}`,
      ),
      "color-picker/index.ts",
    ]);
  });

  it("carries controlledness, form, facade, CSS, and escape-hatch facts without Runtime behavior", () => {
    const facts = buildColorPickerSpecializedAdapterSpec(
      colorPickerRuntimeAdapterContract,
    ).colorPicker;

    expect(facts.controlledness).toEqual(
      expect.objectContaining({ fixedAtCreation: true, refreshBeforeSync: true }),
    );
    expect(facts.controlledness.states.value).toEqual(
      expect.objectContaining({
        controlledStateSync: "imperative",
        runtimeSetter: "setValue",
      }),
    );
    expect(facts.form).toEqual(
      expect.objectContaining({
        fieldIntegration: true,
        hiddenInput: { part: "hiddenInput", type: "text" },
        soleSubmissionPart: "hiddenInput",
      }),
    );
    expect(facts.exports.runtimeFacades).toEqual({
      importSource: "@starwind-ui/runtime/color-picker",
      types: colorPickerRuntimeFacade.types,
      values: colorPickerRuntimeFacade.values,
    });
    expect(facts.exports.runtimeFacades.types).toHaveLength(colorPickerRuntimeFacade.types.length);
    expect(facts.initialStateProjection).toEqual(
      colorPickerRuntimeAdapterContract.initialStateProjection,
    );
    expect(facts.escapeHatch.affectedFrameworks).toEqual(["astro", "react"]);
    expect(facts.escapeHatch.boundary).toContain("Runtime owns parsing");
    expect(facts.cssVariables).toHaveLength(15);
    expect(JSON.stringify(facts)).not.toMatch(
      /<\w|\.astro\b|\.tsx\b|\bJSX\b|useEffect\(|onMount\(|addEventListener\(|parseColor\(|rgbTo|hslTo|hsbTo|pointermove/i,
    );
  });

  it("fails loudly when required contract facts drift", () => {
    const withoutArea = {
      ...colorPickerRuntimeAdapterContract,
      parts: colorPickerRuntimeAdapterContract.parts.filter((part) => part.name !== "area"),
    };
    const withoutSetValue = {
      ...colorPickerRuntimeAdapterContract,
      setters: colorPickerRuntimeAdapterContract.setters.filter(
        (setter) => setter.method !== "setValue",
      ),
    };
    const withoutCssVariable = {
      ...colorPickerRuntimeAdapterContract,
      cssVariables: colorPickerRuntimeAdapterContract.cssVariables.slice(1),
    };
    const withStaleCssVariable = {
      ...colorPickerRuntimeAdapterContract,
      cssVariables: colorPickerRuntimeAdapterContract.cssVariables.map((variable) =>
        variable.name === "--sw-color-picker-area-thumb-color"
          ? { ...variable, name: "--sw-color-picker-stale-thumb-color" as `--${string}` }
          : variable,
      ),
    };
    const withReorderedParts = {
      ...colorPickerRuntimeAdapterContract,
      parts: swapAdjacent(colorPickerRuntimeAdapterContract.parts),
    };
    const withReorderedCssVariables = {
      ...colorPickerRuntimeAdapterContract,
      cssVariables: swapAdjacent(colorPickerRuntimeAdapterContract.cssVariables),
    };

    expect(() => buildColorPickerSpecializedAdapterSpec(withoutArea)).toThrow(
      /parts mismatch; missing \[area\]/,
    );
    expect(() => buildColorPickerSpecializedAdapterSpec(withoutSetValue)).toThrow(
      /setters mismatch; missing \[setValue\]/,
    );
    expect(() => buildColorPickerSpecializedAdapterSpec(withoutCssVariable)).toThrow(
      /CSS variables mismatch; missing \[--sw-color-picker-color\]/,
    );
    expect(() => buildColorPickerSpecializedAdapterSpec(withStaleCssVariable)).toThrow(
      /CSS variables mismatch; missing \[--sw-color-picker-area-thumb-color\], unexpected \[--sw-color-picker-stale-thumb-color\]/,
    );
    expect(() => buildColorPickerSpecializedAdapterSpec(withReorderedParts)).toThrow(
      /parts must preserve canonical contract order/,
    );
    expect(() => buildColorPickerSpecializedAdapterSpec(withReorderedCssVariables)).toThrow(
      /CSS variables must preserve canonical contract order/,
    );
  });

  it("rejects every malformed dedicated-family fact category before output construction", () => {
    const valid = buildColorPickerSpecializedAdapterSpec(colorPickerRuntimeAdapterContract);
    const cases: Array<{
      category: string;
      mutate: (spec: ColorPickerSpecializedAdapterSpec) => unknown;
    }> = [
      {
        category: "initialStateProjection.rootStateProps",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            initialStateProjection: {
              ...spec.colorPicker.initialStateProjection,
              rootStateProps: [...spec.colorPicker.initialStateProjection.rootStateProps].reverse(),
            },
          },
        }),
      },
      {
        category: "colorPicker.component",
        mutate: (spec) => ({
          ...spec,
          colorPicker: { ...spec.colorPicker, component: "drifted-color-picker" },
        }),
      },
      {
        category: "colorPicker.displayName",
        mutate: (spec) => ({
          ...spec,
          colorPicker: { ...spec.colorPicker, displayName: "Drifted Color Picker" },
        }),
      },
      {
        category: "parts",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            parts: withoutKey(spec.colorPicker.parts, "area"),
          },
        }),
      },
      {
        category: "parts must preserve canonical contract order",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            parts: swapRecordEntries(spec.colorPicker.parts),
          },
        }),
      },
      {
        category: "props",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            props: withoutKey(spec.colorPicker.props, "alpha"),
          },
        }),
      },
      {
        category: "events.valueChange",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            events: {
              ...spec.colorPicker.events,
              valueChange: { ...spec.colorPicker.events.valueChange, domEvent: "drifted:event" },
            },
          },
        }),
      },
      {
        category: "controlledness.states",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            controlledness: {
              ...spec.colorPicker.controlledness,
              states: withoutKey(spec.colorPicker.controlledness.states, "format"),
            },
          },
        }),
      },
      {
        category: "setters",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            setters: spec.colorPicker.setters.filter((setter) => setter.method !== "setValue"),
          },
        }),
      },
      {
        category: "setters has duplicate facts",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            setters: duplicateFirst(spec.colorPicker.setters),
          },
        }),
      },
      {
        category: "setters must preserve canonical contract order",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            setters: swapAdjacent(spec.colorPicker.setters),
          },
        }),
      },
      {
        category: "form",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            form: { ...spec.colorPicker.form, props: [] },
          },
        }),
      },
      {
        category: "runtime",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            runtime: { ...spec.colorPicker.runtime, factory: "createDriftedPicker" },
          },
        }),
      },
      {
        category: "runtimeFacades.types",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            exports: {
              ...spec.colorPicker.exports,
              runtimeFacades: {
                ...spec.colorPicker.exports.runtimeFacades,
                types: spec.colorPicker.exports.runtimeFacades.types.slice(1),
              },
            },
          },
        }),
      },
      {
        category: "runtimeFacades.types has duplicate facts",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            exports: {
              ...spec.colorPicker.exports,
              runtimeFacades: {
                ...spec.colorPicker.exports.runtimeFacades,
                types: duplicateFirst(spec.colorPicker.exports.runtimeFacades.types),
              },
            },
          },
        }),
      },
      {
        category: "runtimeFacades.types must preserve canonical contract order",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            exports: {
              ...spec.colorPicker.exports,
              runtimeFacades: {
                ...spec.colorPicker.exports.runtimeFacades,
                types: swapAdjacent(spec.colorPicker.exports.runtimeFacades.types),
              },
            },
          },
        }),
      },
      {
        category: "optionLifecycles",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            optionLifecycles: withoutKey(spec.colorPicker.optionLifecycles, "alpha"),
          },
        }),
      },
      {
        category: "controlledness",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            controlledness: { ...spec.colorPicker.controlledness, fixedAtCreation: false },
          },
        }),
      },
      {
        category: "initialMarkup",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            initialMarkup: spec.colorPicker.initialMarkup.slice(1),
          },
        }),
      },
      {
        category: "initialMarkup has duplicate facts",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            initialMarkup: duplicateFirst(spec.colorPicker.initialMarkup),
          },
        }),
      },
      {
        category: "initialMarkup must preserve canonical contract order",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            initialMarkup: swapAdjacent(spec.colorPicker.initialMarkup),
          },
        }),
      },
      {
        category: "cssVariables",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            cssVariables: spec.colorPicker.cssVariables.slice(1),
          },
        }),
      },
      {
        category: "cssVariables has duplicate facts",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            cssVariables: duplicateFirst(spec.colorPicker.cssVariables),
          },
        }),
      },
      {
        category: "cssVariables must preserve canonical contract order",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            cssVariables: swapAdjacent(spec.colorPicker.cssVariables),
          },
        }),
      },
      {
        category: "escapeHatch",
        mutate: (spec) => ({
          ...spec,
          colorPicker: {
            ...spec.colorPicker,
            escapeHatch: { ...spec.colorPicker.escapeHatch, contractOwnedFacts: [] },
          },
        }),
      },
      {
        category: "sourceContract",
        mutate: (spec) => ({ ...spec, sourceContract: "drifted-color-picker" }),
      },
      {
        category: "sourcePrimitiveContract",
        mutate: (spec) => ({
          ...spec,
          sourcePrimitiveContract: {
            ...spec.sourcePrimitiveContract,
            displayName: "Drifted Color Picker",
          },
        }),
      },
    ];

    for (const testCase of cases) {
      const malformed = testCase.mutate(valid) as ColorPickerSpecializedAdapterSpec;
      const errors = validateColorPickerSpecializedAdapterSpec(malformed);

      expect(errors.some((error) => error.includes(testCase.category))).toBe(true);
      expect(() => buildColorPickerAdapterOutputModel(malformed)).toThrow(
        new RegExp(`Invalid Color Picker specialized adapter spec:[\\s\\S]*${testCase.category}`),
      );
    }
  });

  it("projects the dedicated family through every supported target", () => {
    const model = buildColorPickerAdapterOutputModel(
      buildColorPickerSpecializedAdapterSpec(colorPickerRuntimeAdapterContract),
    );

    for (const target of [astroFrameworkAdapterTarget, reactFrameworkAdapterTarget]) {
      const projected = target.primitive.outputModel.projectSpecialized(model);
      expect(projected.files.every((file) => file.target === target.target)).toBe(true);
      expect(() => assertColorPickerFamilyProjected(projected, target.target)).not.toThrow();
    }
  });
});

function withoutKey<T extends object>(record: T, key: PropertyKey): Partial<T> {
  return Object.fromEntries(Object.entries(record).filter(([name]) => name !== key)) as Partial<T>;
}

function duplicateFirst<T>(values: readonly T[]): T[] {
  return values.length === 0 ? [] : [...values, values[0]!];
}

function swapAdjacent<T>(values: readonly T[]): T[] {
  if (values.length < 2) return [...values];
  return [values[1]!, values[0]!, ...values.slice(2)];
}

function swapRecordEntries<T extends object>(record: T): Record<string, unknown> {
  return Object.fromEntries(swapAdjacent(Object.entries(record)));
}
