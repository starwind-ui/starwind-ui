import { describe, expect, it } from "vitest";
import { buttonRuntimeAdapterContract } from "../contracts/primitive/components/button.js";
import { checkboxRuntimeAdapterContract } from "../contracts/primitive/components/checkbox.js";
import { selectRuntimeAdapterContract } from "../contracts/primitive/components/select.js";
import { runtimeAdapterContracts } from "../contracts/primitive/representatives.js";
import type { RuntimeAdapterContract } from "../contracts/primitive/types.js";
import { validateRuntimeAdapterContracts } from "../contracts/primitive/validation.js";
import { sidebarStyledContract } from "../contracts/styled/components/sidebar.js";
import { astroFrameworkAdapter } from "../renderers/framework-adapters/astro/adapter.js";
import { reactFrameworkAdapter } from "../renderers/framework-adapters/react/adapter.js";
import { projectSpecializedAdapterOutputModel } from "../renderers/framework-adapters/react/specialized-adapter-spec.js";
import { svelteFrameworkAdapter } from "../renderers/framework-adapters/svelte/adapter.js";
import type { AdapterOutputModel } from "../renderers/framework-adapters/types.js";
import { vueFrameworkAdapter } from "../renderers/framework-adapters/vue/adapter.js";
import { projectVueSpecializedAdapterOutputModel } from "../renderers/framework-adapters/vue/specialized-adapter-spec.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
  validateGenericAdapterPlan,
} from "../renderers/generic-adapter-plan/index.js";
import { assertStyledSidebarConnection } from "../renderers/primitive-output-model/sidebar-connection.js";
import {
  buildColorPickerAdapterOutputModel,
  buildColorPickerSpecializedAdapterSpec,
  buildContextMenuAdapterOutputModel,
  buildContextMenuSpecializedAdapterSpec,
  buildDropzoneAdapterOutputModel,
  buildDropzoneSpecializedAdapterSpec,
  buildMenuAdapterOutputModel,
  buildMenuSpecializedAdapterSpec,
  buildNavigationMenuAdapterOutputModel,
  buildNavigationMenuSpecializedAdapterSpec,
  buildPreviewCardAdapterOutputModel,
  buildPreviewCardSpecializedAdapterSpec,
  buildSelectAdapterOutputModel,
  buildSelectSpecializedAdapterSpec,
  buildSidebarAdapterOutputModel,
  buildSidebarSpecializedAdapterSpec,
  buildTabsSpecializedAdapterSpec,
  buildTooltipAdapterOutputModel,
  buildTooltipSpecializedAdapterSpec,
} from "../renderers/specialized-adapter-spec/index.js";
import { projectStyledOutputModel } from "../renderers/styled-output-model/index.js";

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

describe("Cancelable Runtime Adapter Contract events", () => {
  it("declare callback-before-commit timing for every framework projection", () => {
    const cancelableEvents = (runtimeAdapterContracts as readonly RuntimeAdapterContract[]).flatMap(
      (contract) =>
        (contract.events ?? [])
          .filter((event) => event.cancelable)
          .map((event) => ({ component: contract.component, event })),
    );

    expect(cancelableEvents.length).toBeGreaterThan(0);
    expect(
      cancelableEvents.filter(({ event }) => event.callbackTiming !== "before-state-commit"),
    ).toEqual([]);
  });
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

const acceptedModelBuilders: Record<
  string,
  (contract: RuntimeAdapterContract) => AdapterOutputModel
> = {
  "color-picker": (contract) =>
    buildColorPickerAdapterOutputModel(buildColorPickerSpecializedAdapterSpec(contract)),
  "context-menu": (contract) =>
    buildContextMenuAdapterOutputModel(buildContextMenuSpecializedAdapterSpec(contract)),
  menu: (contract) => buildMenuAdapterOutputModel(buildMenuSpecializedAdapterSpec(contract)),
  "preview-card": (contract) =>
    buildPreviewCardAdapterOutputModel(buildPreviewCardSpecializedAdapterSpec(contract)),
  select: (contract) => buildSelectAdapterOutputModel(buildSelectSpecializedAdapterSpec(contract)),
  tooltip: (contract) =>
    buildTooltipAdapterOutputModel(buildTooltipSpecializedAdapterSpec(contract)),
};
const acceptedModelComponents = [
  "checkbox",
  "switch",
  "dialog",
  "alert-dialog",
  "drawer",
  "popover",
  "tooltip",
  "preview-card",
  "select",
  "menu",
  "context-menu",
  "color-picker",
];
function acceptedModelOutput(contract: RuntimeAdapterContract): AdapterOutputModel {
  return projectVueSpecializedAdapterOutputModel(
    acceptedModelBuilders[contract.component]?.(contract) ??
      buildGenericAdapterOutputModel(buildGenericAdapterPlan(contract)),
  );
}

describe("Accepted Vue model connections", () => {
  it.each(acceptedModelComponents)(
    "carries %s root proposals through its family/spec and rejects lost acceptance",
    (component) => {
      const contract = runtimeAdapterContracts.find(
        (entry) => entry.component === component,
      )! as RuntimeAdapterContract;
      const model = acceptedModelOutput(contract);
      const roots = model.files.filter(
        (file) => file.kind === "component" && file.component.acceptedModelPublications,
      );
      expect(roots).toHaveLength(1);
      const root = roots[0]!;
      if (root.kind !== "component") throw new Error("Expected component");
      const expectedStates =
        component === "select"
          ? ["open", "value"]
          : component === "color-picker"
            ? ["value"]
            : [component === "checkbox" || component === "switch" ? "checked" : "open"];
      expect(root.component.acceptedModelPublications!.map((entry) => entry.state)).toEqual(
        expectedStates,
      );
      expect(() => vueFrameworkAdapter.printOutput(model)).not.toThrow();
      for (const state of expectedStates) {
        const missingOutput = structuredClone(model);
        for (const file of missingOutput.files) {
          if (file.kind === "component" && file.component.acceptedModelPublications) {
            file.component.acceptedModelPublications =
              file.component.acceptedModelPublications.filter((entry) => entry.state !== state);
          }
        }
        expect(() => vueFrameworkAdapter.printOutput(missingOutput)).toThrow(
          /requires an accepted controller subscription/,
        );
        const missingContract = structuredClone(contract);
        const event = missingContract.events!.find((entry) => entry.stateModel === state)!;
        delete event.acceptanceNotification;
        expect(() => vueFrameworkAdapter.printOutput(acceptedModelOutput(missingContract))).toThrow(
          component === "color-picker"
            ? /must match the authoritative Color Picker Runtime Adapter Contract/
            : /requires an accepted controller subscription/,
        );
      }
    },
  );

  it("rejects acceptance subscriptions attached to post-change notifications", () => {
    const contract = structuredClone(checkboxRuntimeAdapterContract) as RuntimeAdapterContract;
    contract.events![0]!.callbackTiming = "after-state-commit";
    expect(validateRuntimeAdapterContracts([contract])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "events.checkedChange.acceptanceNotification" }),
      ]),
    );
  });

  it("keeps native Input post-change notification separate from state proposal acceptance", () => {
    const contract = runtimeAdapterContracts.find((entry) => entry.component === "input")!;
    const model = buildGenericAdapterOutputModel(buildGenericAdapterPlan(contract));
    expect(
      model.files.some(
        (file) => file.kind === "component" && file.component.acceptedModelPublications,
      ),
    ).toBe(false);
    expect(() => vueFrameworkAdapter.printOutput(model)).not.toThrow();
  });
});

describe("Boolean reset and group state policy", () => {
  for (const component of ["checkbox", "switch"]) {
    it(`carries ${component} reset ownership into every reactive projection`, () => {
      const contract = runtimeAdapterContracts.find(
        (entry) => entry.component === component,
      )! as RuntimeAdapterContract;
      const model = buildGenericAdapterOutputModel(buildGenericAdapterPlan(contract));
      for (const adapter of [reactFrameworkAdapter, vueFrameworkAdapter, svelteFrameworkAdapter]) {
        expect(() => adapter.printOutput(model)).not.toThrow();
        const missing = structuredClone(model);
        for (const file of missing.files) {
          if (file.kind === "component" && file.component.family?.kind === "boolean-form-control") {
            delete file.component.family.facts.behavior.resetBaseline;
          }
        }
        expect(() => adapter.printOutput(missing)).toThrow(/mount reset baseline/);
      }
      const missing = structuredClone(contract);
      delete missing.stateModels!.find((state) => state.name === "checked")!.resetBaseline;
      expect(() => buildGenericAdapterOutputModel(buildGenericAdapterPlan(missing))).toThrow(
        /mount reset baseline/,
      );
    });
  }

  it("projects the initial native model separately from the frozen boolean reset default", () => {
    for (const component of ["checkbox", "switch"]) {
      const contract = runtimeAdapterContracts.find((entry) => entry.component === component)!;
      const model = buildGenericAdapterOutputModel(buildGenericAdapterPlan(contract));
      const root = reactFrameworkAdapter
        .printOutput(model)
        .find((file) => file.path.endsWith("Root.tsx"))!.contents;
      expect(root).toContain("defaultChecked={initialChecked}");
      expect(root).toContain("const resetSeed = defaultChecked ?? initialChecked");
      expect(root).toContain("defaultChecked: resetSeed");
    }
  });

  it("requires the existing optional Toggle Group selection and disabled context", () => {
    const contract = structuredClone(
      runtimeAdapterContracts.find((entry) => entry.component === "toggle")!,
    ) as RuntimeAdapterContract;
    const model = buildGenericAdapterOutputModel(buildGenericAdapterPlan(contract));
    expect(model.files[0]).toMatchObject({
      component: {
        family: {
          facts: {
            group: {
              hookName: "useToggleGroupContext",
              requirement: "optional",
              valueFields: expect.arrayContaining(["value", "disabled"]),
            },
          },
        },
      },
    });
    const root = reactFrameworkAdapter
      .printOutput(model)
      .find((file) => file.path.endsWith("Root.tsx"))!.contents;
    expect(root.replace(/\s/g, "")).toContain("consttoggleGroup=useToggleGroupContext()");
    expect(root).toContain("toggleGroup!.value.includes(inputs.current.value!)");
    expect(root.replace(/\s/g, "")).toContain(
      '"disabled":inputs.current.nativeButton?effectiveDisabled:undefined',
    );
    const missing = structuredClone(model);
    for (const file of missing.files) {
      if (file.kind === "component" && file.component.family?.kind === "single-boolean-control")
        delete file.component.family.facts.group;
    }
    expect(() => reactFrameworkAdapter.printOutput(missing)).toThrow(
      /requires optional group ownership/,
    );
    contract.context = contract.context!.filter((context) => context.name !== "toggle-group");
    expect(() => buildGenericAdapterOutputModel(buildGenericAdapterPlan(contract))).toThrow(
      /requires optional toggle-group context/,
    );
  });

  it("rejects a Checkbox projection that loses group-over-child selection ownership", () => {
    const contract = structuredClone(checkboxRuntimeAdapterContract) as RuntimeAdapterContract;
    const model = buildGenericAdapterOutputModel(buildGenericAdapterPlan(contract));
    expect(model.files[0]).toMatchObject({
      component: { family: { facts: { behavior: { groupStateOwnership: "group-membership" } } } },
    });
    for (const file of model.files) {
      if (file.kind === "component" && file.component.family?.kind === "boolean-form-control") {
        delete file.component.family.facts.behavior.groupStateOwnership;
      }
    }
    for (const adapter of [reactFrameworkAdapter, vueFrameworkAdapter, svelteFrameworkAdapter]) {
      expect(() => adapter.printOutput(model)).toThrow(/group-membership state ownership/);
    }
    delete contract.context!.find((context) => context.name === "checkbox-group")!.stateOwnership;
    expect(() => buildGenericAdapterOutputModel(buildGenericAdapterPlan(contract))).toThrow(
      /group-membership state ownership/,
    );
  });
});

describe("Navigation Menu moved Content ownership", () => {
  it("preserves the Runtime movement fact and requires the React lifetime bridge", () => {
    const contract = runtimeAdapterContracts.find(
      (entry) => entry.component === "navigation-menu",
    )!;
    const spec = buildNavigationMenuSpecializedAdapterSpec(contract);
    const model = buildNavigationMenuAdapterOutputModel(spec);
    expect(() => reactFrameworkAdapter.printOutput(model)).not.toThrow();
    for (const file of model.files) {
      if (
        file.kind === "component" &&
        file.component.family?.kind === "shared-viewport-navigation"
      ) {
        expect(file.component.family.facts.content.runtimeOwnership).toBe(
          "moves-active-content-into-shared-viewport",
        );
      }
    }
    const missing = structuredClone(model);
    for (const file of missing.files) {
      if (
        file.kind === "component" &&
        file.component.family?.kind === "shared-viewport-navigation"
      ) {
        delete (
          file.component.family.facts.content as Partial<typeof file.component.family.facts.content>
        ).runtimeOwnership;
      }
    }
    expect(() => reactFrameworkAdapter.printOutput(missing)).toThrow(
      /requires Runtime-moved Content ownership/,
    );
    delete (
      spec.navigationMenu.viewportProjection.activeContent as Partial<
        typeof spec.navigationMenu.viewportProjection.activeContent
      >
    ).runtimeOwnership;
    expect(() => buildNavigationMenuAdapterOutputModel(spec)).toThrow(
      /activeContent metadata must match Runtime boundary facts/,
    );
  });
});

describe("Sidebar state connection", () => {
  it("requires the Styled mobile Sheet discovery bridge", () => {
    const group = projectStyledOutputModel([sidebarStyledContract]).componentGroups[0]!;
    expect(() => assertStyledSidebarConnection(group)).not.toThrow();
    const broken = JSON.parse(
      JSON.stringify(group).replaceAll('"value":"mobile"', '"value":"unowned-sheet"'),
    );
    expect(() => assertStyledSidebarConnection(broken)).toThrow(/owned mobile Sheet bridge marker/);
  });
  it("requires restored context and accepted nearest-provider Sheet ownership in each target", () => {
    const contract = runtimeAdapterContracts.find((entry) => entry.component === "sidebar")!;
    const spec = buildSidebarSpecializedAdapterSpec(contract);
    const model = buildSidebarAdapterOutputModel(spec);
    for (const adapter of [reactFrameworkAdapter, vueFrameworkAdapter, svelteFrameworkAdapter]) {
      expect(() => adapter.printOutput(model)).not.toThrow();
      for (const key of ["contextState", "mobileSheetOwner", "mobileSheetState"] as const) {
        const missing = structuredClone(model);
        for (const file of missing.files) {
          if (file.kind === "component" && file.component.family?.kind === "sidebar") {
            delete (
              file.component.family.facts.connection as Partial<
                typeof file.component.family.facts.connection
              >
            )[key];
          }
        }
        expect(() => adapter.printOutput(missing)).toThrow(
          /requires restored context and accepted nearest-provider Sheet state/,
        );
      }
    }
    delete (spec.sidebar.connection as Partial<typeof spec.sidebar.connection>).mobileSheetOwner;
    expect(() => buildSidebarAdapterOutputModel(spec)).toThrow(/connection must preserve/);
  });
});

describe("Runtime refresh connection", () => {
  for (const component of ["dialog", "alert-dialog", "drawer"] as const) {
    it(`requires ${component} state-preserving owned-control refresh`, () => {
      const contract = structuredClone(
        runtimeAdapterContracts.find((entry) => entry.component === component)!,
      ) as RuntimeAdapterContract;
      expect(contract.runtime.refresh).toEqual({
        method: "refresh",
        parts: "owned-controls",
        state: "preserve",
      });
      expect(validateRuntimeAdapterContracts([contract])).toEqual([]);
      const model = buildGenericAdapterOutputModel(buildGenericAdapterPlan(contract));
      for (const adapter of [
        astroFrameworkAdapter,
        reactFrameworkAdapter,
        vueFrameworkAdapter,
        svelteFrameworkAdapter,
      ])
        expect(() => adapter.printOutput(model)).not.toThrow();
      for (const refresh of [
        undefined,
        { method: "refresh", parts: "owned-descendants", state: "preserve" },
        { ...contract.runtime.refresh, formOwner: "native-input" },
      ]) {
        const invalid = structuredClone(contract);
        invalid.runtime.refresh = refresh as typeof contract.runtime.refresh;
        expect(validateRuntimeAdapterContracts([invalid])).toContainEqual(
          expect.objectContaining({ path: "runtime.refresh" }),
        );
        const plan = buildGenericAdapterPlan(invalid);
        expect(validateGenericAdapterPlan(plan)).toContainEqual(
          expect.objectContaining({ path: "runtime.refresh" }),
        );
        expect(() => buildGenericAdapterOutputModel(plan)).toThrow(/refresh/);
      }
    });
  }

  for (const component of ["avatar", "fieldset"] as const) {
    it(`requires ${component} DOM-owned refresh without changing native form reconnection`, () => {
      const contract = structuredClone(
        runtimeAdapterContracts.find((entry) => entry.component === component)!,
      ) as RuntimeAdapterContract;
      expect(contract.runtime.refresh).toEqual({
        method: "refresh",
        parts: "owned-descendants",
        state: "preserve",
      });
      expect(validateRuntimeAdapterContracts([contract])).toEqual([]);
      const model = buildGenericAdapterOutputModel(buildGenericAdapterPlan(contract));
      for (const adapter of [
        astroFrameworkAdapter,
        reactFrameworkAdapter,
        vueFrameworkAdapter,
        svelteFrameworkAdapter,
      ])
        expect(() => adapter.printOutput(model)).not.toThrow();
      delete contract.runtime.refresh;
      expect(validateRuntimeAdapterContracts([contract])).toContainEqual(
        expect.objectContaining({ path: "runtime.refresh" }),
      );
      const invalidPlan = buildGenericAdapterPlan(contract);
      expect(validateGenericAdapterPlan(invalidPlan)).toContainEqual(
        expect.objectContaining({ path: "runtime.refresh" }),
      );
      expect(() => buildGenericAdapterOutputModel(invalidPlan)).toThrow(/refresh/);
    });
  }

  for (const component of ["input", "dropzone"] as const) {
    it(`carries ${component} reconnection facts and rejects missing contract/output policy`, () => {
      const contract = structuredClone(
        runtimeAdapterContracts.find((entry) => entry.component === component)!,
      ) as RuntimeAdapterContract;
      const build = (source: RuntimeAdapterContract) =>
        component === "input"
          ? buildGenericAdapterOutputModel(buildGenericAdapterPlan(source))
          : buildDropzoneAdapterOutputModel(buildDropzoneSpecializedAdapterSpec(source));
      const withoutFormOwner = structuredClone(contract);
      delete withoutFormOwner.runtime.refresh!.formOwner;
      expect(() => build(withoutFormOwner)).toThrow(/native form ownership/);
      const model = build(contract);
      for (const adapter of [
        astroFrameworkAdapter,
        reactFrameworkAdapter,
        vueFrameworkAdapter,
        svelteFrameworkAdapter,
      ])
        expect(() => adapter.printOutput(model)).not.toThrow();
      for (const file of model.files) {
        if (file.kind !== "component") continue;
        const family = file.component.family;
        if (family?.kind !== "native-input-value" && family?.kind !== "file-drop-control") continue;
        if (family.part !== "root") continue;
        expect(family.facts.runtime.refresh).toEqual(contract.runtime.refresh);
        Reflect.deleteProperty(family.facts.runtime, "refresh");
      }
      for (const adapter of [
        astroFrameworkAdapter,
        reactFrameworkAdapter,
        vueFrameworkAdapter,
        svelteFrameworkAdapter,
      ])
        expect(() => adapter.printOutput(model)).toThrow(/Runtime reconnection requires refresh/);
      delete contract.runtime.refresh;
      expect(() => build(contract)).toThrow(/Runtime reconnection requires refresh/);
    });
  }
});

describe("Color Picker fixed model ownership", () => {
  for (const state of ["value", "format"] as const) {
    it(`requires ${state} ownership at contract, spec, and reactive output boundaries`, () => {
      const contract = structuredClone(
        runtimeAdapterContracts.find((entry) => entry.component === "color-picker")!,
      ) as RuntimeAdapterContract;
      const model = buildColorPickerAdapterOutputModel(
        buildColorPickerSpecializedAdapterSpec(contract),
      );
      for (const adapter of [reactFrameworkAdapter, vueFrameworkAdapter, svelteFrameworkAdapter]) {
        const project =
          adapter === reactFrameworkAdapter
            ? projectSpecializedAdapterOutputModel
            : adapter === vueFrameworkAdapter
              ? projectVueSpecializedAdapterOutputModel
              : (model: AdapterOutputModel) => model;
        const missing = structuredClone(model);
        expect(() => adapter.printOutput(project(structuredClone(model)))).not.toThrow();
        for (const file of missing.files) {
          if (file.kind === "component" && file.component.family?.kind === "color-picker") {
            delete file.component.family.facts.controlledness.states[state].ownership;
          }
        }
        expect(() => adapter.printOutput(project(missing))).toThrow(
          /fixed initial-defined model ownership/,
        );
      }
      delete contract.stateModels!.find((entry) => entry.name === state)!.ownership;
      expect(
        validateRuntimeAdapterContracts([contract]).some((issue) =>
          issue.message.includes("fixed initial-defined"),
        ),
      ).toBe(true);
      expect(() => buildColorPickerSpecializedAdapterSpec(contract)).toThrow(
        /fixed initial-defined model ownership/,
      );
    });
  }
});

describe("Vue disclosure and menu acceptance contracts", () => {
  it.each(["tabs", "accordion", "collapsible"])(
    "declares accepted root publication for %s",
    (component) => {
      const contract = runtimeAdapterContracts.find(
        (entry) => entry.component === component,
      )! as RuntimeAdapterContract;
      expect(contract.events).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            acceptanceNotification: "controller-subscription",
            callbackTiming: "before-state-commit",
            cancelable: true,
            emitsFrom: "root",
          }),
        ]),
      );
    },
  );
  it.each(["menu", "context-menu"])("validates accepted part settlement for %s", (component) => {
    const contract = structuredClone(
      runtimeAdapterContracts.find((entry) => entry.component === component)!,
    ) as RuntimeAdapterContract;
    for (const name of ["checkedChange", "valueChange"]) {
      const event = contract.events!.find((entry) => entry.name === name)!;
      expect(event.acceptanceNotification).toBe("after-dom-dispatch");
      const original = event.domEvent;
      delete event.domEvent;
      expect(validateRuntimeAdapterContracts([contract])).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: `events.${name}.acceptanceNotification` }),
        ]),
      );
      event.domEvent = original;
    }
  });
});

describe.each(["select", "input-otp"])("%s reset contract", (component) => {
  it("retains the mount reset baseline with native form ownership and silent state sync", () => {
    const contract = runtimeAdapterContracts.find(
      (entry) => entry.component === component,
    )! as RuntimeAdapterContract;
    expect(contract.stateModels).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "value",
          defaultProp: "defaultValue",
          resetBaseline: "mount",
          runtimeGetter: "getValue",
          runtimeSetter: "setValue",
        }),
      ]),
    );
    if (component === "select")
      expect(contract.form?.hiddenInput).toEqual({ part: "input", type: "hidden" });
    expect(contract.setters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ method: "setValue", stateModel: "value", suppressesEmit: true }),
      ]),
    );
    const invalid = structuredClone(contract);
    delete invalid.stateModels!.find((state) => state.name === "value")!.runtimeGetter;
    expect(validateRuntimeAdapterContracts([invalid])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "stateModels.value.resetBaseline" }),
      ]),
    );
  });
});

describe("Tabs creation-only sync key", () => {
  it("requires the existing constructor-only lifecycle fact", () => {
    const contract = structuredClone(
      runtimeAdapterContracts.find((entry) => entry.component === "tabs")!,
    ) as RuntimeAdapterContract;
    expect(contract.runtime!.optionPropLifecycles?.syncKey).toBe("constructor-only");
    expect(() => buildTabsSpecializedAdapterSpec(contract)).not.toThrow();
    delete contract.runtime!.optionPropLifecycles!.syncKey;
    expect(validateRuntimeAdapterContracts([contract])).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: "runtime.optionPropLifecycles.syncKey" }),
      ]),
    );
    expect(() => buildTabsSpecializedAdapterSpec(contract)).toThrow(
      /creation-only lifetime capture/,
    );
  });
});

describe("Vue overlay command seams", () => {
  it.each(["alert-dialog", "drawer", "popover", "tooltip"])(
    "retains silent current-open command support for %s",
    (component) => {
      const contract: RuntimeAdapterContract = runtimeAdapterContracts.find(
        (entry) => entry.component === component,
      )!;
      expect(contract.stateModels).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "open",
            controlledProp: "open",
            runtimeGetter: "getOpen",
            runtimeSetter: "setOpen",
          }),
        ]),
      );
      expect(contract.setters).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            method: "setOpen",
            options: { emit: false },
            suppressesEmit: true,
          }),
        ]),
      );
      if (component === "tooltip")
        expect(contract.setters).toEqual(
          expect.arrayContaining([expect.objectContaining({ method: "setDisabled" })]),
        );
    },
  );
});
