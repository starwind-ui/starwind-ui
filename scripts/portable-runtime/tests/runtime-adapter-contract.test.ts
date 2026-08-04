import { describe, expect, it } from "vitest";

import { buttonRuntimeAdapterContract } from "../contracts/primitive/components/button.js";
import { checkboxRuntimeAdapterContract } from "../contracts/primitive/components/checkbox.js";
import { selectRuntimeAdapterContract } from "../contracts/primitive/components/select.js";
import type { RuntimeAdapterContract } from "../contracts/primitive/types.js";
import { validateRuntimeAdapterContracts } from "../contracts/primitive/validation.js";

import { defineRuntimeCollectionStaticTests } from "./runtime-adapter-contract/collection-static.cases.js";
import { defineRuntimeFormControlTests } from "./runtime-adapter-contract/form-control.cases.js";
import { defineRuntimeInventoryValidationTests } from "./runtime-adapter-contract/inventory-validation.cases.js";
import { defineRuntimeOverlayFloatingTests } from "./runtime-adapter-contract/overlay-floating.cases.js";

describe("RuntimeAdapterContract inventory", () => {
  defineRuntimeInventoryValidationTests();
  defineRuntimeFormControlTests();
  defineRuntimeCollectionStaticTests();
  defineRuntimeOverlayFloatingTests();
});

describe("Button Runtime Adapter Contract proof", () => {
  it("contains only the native action surface and its conditional disabled bridge facts", () => {
    expect(buttonRuntimeAdapterContract.parts).toEqual([
      expect.objectContaining({
        defaultElement: "button",
        forwardsRef: true,
        name: "root",
        ownsRuntime: true,
      }),
    ]);
    expect(buttonRuntimeAdapterContract.runtime).toEqual(
      expect.objectContaining({
        factory: "createButton",
        optionPropLifecycles: { disabled: "setter-backed" },
        optionProps: ["disabled"],
        rootPart: "root",
      }),
    );
    expect(buttonRuntimeAdapterContract.setters).toEqual([
      { method: "setDisabled", prop: "disabled" },
    ]);
    expect(buttonRuntimeAdapterContract.refs).toEqual([{ part: "root", public: true }]);

    for (const unrelatedFact of [
      "asChild",
      "context",
      "events",
      "floating",
      "form",
      "presence",
      "stateModels",
    ] as const) {
      expect(buttonRuntimeAdapterContract).not.toHaveProperty(unrelatedFact);
    }
  });

  it("rejects executable framework source hidden in contract-owned facts", () => {
    const invalid = {
      ...buttonRuntimeAdapterContract,
      frameworkProjection: {
        source: 'import { onMounted } from "vue"; onMounted(() => createButton(root));',
        target: "vue",
      },
    } as unknown as RuntimeAdapterContract;

    expect(validateRuntimeAdapterContracts([invalid])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "frameworkProjection.source",
          message: expect.stringContaining("Framework source syntax"),
        }),
      ]),
    );
  });

  it("allows declarative framework notes but rejects framework source inside them", () => {
    expect(validateRuntimeAdapterContracts([buttonRuntimeAdapterContract])).toEqual([]);

    const invalid = {
      ...buttonRuntimeAdapterContract,
      frameworkNotes: {
        ...buttonRuntimeAdapterContract.frameworkNotes,
        vue: ['import { onMounted } from "vue"; onMounted(() => createButton(root));'],
      },
    } as unknown as RuntimeAdapterContract;

    expect(validateRuntimeAdapterContracts([invalid])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "frameworkNotes.vue.0",
          message: expect.stringContaining("Framework source syntax"),
        }),
      ]),
    );
  });
});

describe("Checkbox Runtime Adapter Contract proof", () => {
  it("declares neutral cancellation, group, form, presence, and input ownership facts", () => {
    expect(checkboxRuntimeAdapterContract.events[0]).toEqual(
      expect.objectContaining({
        callbackTiming: "before-state-commit",
        cancelable: true,
      }),
    );
    expect(checkboxRuntimeAdapterContract.context[0]).toEqual(
      expect.objectContaining({
        direction: "consumes",
        requirement: "optional",
        values: ["disabled", "value"],
      }),
    );
    expect(checkboxRuntimeAdapterContract.form).toEqual(
      expect.objectContaining({
        fieldIntegration: true,
        hiddenInput: { part: "input", type: "checkbox" },
      }),
    );
    expect(checkboxRuntimeAdapterContract.presence).toEqual(
      expect.objectContaining({ initialHiddenParts: ["indicator"] }),
    );
    expect(checkboxRuntimeAdapterContract.parts).toContainEqual(
      expect.objectContaining({ name: "uncheckedInput", defaultElement: "input" }),
    );
  });

  it("rejects neutral Checkbox strategies that reference missing parts", () => {
    const invalid = {
      ...checkboxRuntimeAdapterContract,
      presence: {
        ...checkboxRuntimeAdapterContract.presence,
        initialHiddenParts: ["missingIndicator"],
      },
    } as unknown as RuntimeAdapterContract;

    expect(validateRuntimeAdapterContracts([invalid])).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: "presence.initialHiddenParts" })]),
    );
  });

  it("rejects framework source hidden inside Checkbox escape metadata", () => {
    const invalid = {
      ...checkboxRuntimeAdapterContract,
      escapeHatches: [
        {
          ...checkboxRuntimeAdapterContract.escapeHatches[0],
          boundary: 'import { onMounted } from "vue"; onMounted(() => setupRuntime());',
        },
      ],
    } as unknown as RuntimeAdapterContract;

    expect(validateRuntimeAdapterContracts([invalid])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "escapeHatches.0.boundary",
          message: expect.stringContaining("Framework source syntax"),
        }),
      ]),
    );
  });
});

describe("Select Runtime Adapter Contract proof", () => {
  it("declares cancelable dual models for synchronous adapter projection", () => {
    expect(selectRuntimeAdapterContract.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          callbackTiming: "before-state-commit",
          cancelable: true,
          name: "openChange",
        }),
        expect.objectContaining({
          callbackTiming: "before-state-commit",
          cancelable: true,
          name: "valueChange",
        }),
      ]),
    );
  });
});
