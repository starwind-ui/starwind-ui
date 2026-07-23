import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  alertDialogRuntimeAdapterContract,
  avatarRuntimeAdapterContract,
  buttonRuntimeAdapterContract,
  collapsibleRuntimeAdapterContract,
  dialogRuntimeAdapterContract,
  drawerRuntimeAdapterContract,
  fieldsetRuntimeAdapterContract,
  formRuntimeAdapterContract,
  inputRuntimeAdapterContract,
  popoverRuntimeAdapterContract,
  previewCardRuntimeAdapterContract,
  progressRuntimeAdapterContract,
  runtimeAdapterContracts,
  scrollAreaRuntimeAdapterContract,
  toggleGroupRuntimeAdapterContract,
  toggleRuntimeAdapterContract,
  tooltipRuntimeAdapterContract,
} from "../contracts/primitive/representatives.js";
import type { RuntimeAdapterContract } from "../contracts/primitive/types.js";
import { normalizeAstroPrimitiveOutput } from "../renderers/framework-adapters/astro/primitive-output-writer.js";
import { applyReactRefCleanup } from "../renderers/framework-adapters/react/primitive-output-writer.js";
import {
  astroFrameworkAdapter,
  reactFrameworkAdapter,
} from "../renderers/framework-adapters/index.js";
import {
  buildGenericAdapterOutputModel,
  buildGenericAdapterPlan,
  classifyGenericAdapterPlanInventory,
  type GenericAdapterPlan,
  genericAdapterFutureFrameworkTracerClassifications,
  getGenericAdapterOutputFamilyPlanId,
  getGenericAdapterOutputFamilyPlanIds,
  printGenericAdapterOutputModel,
  renderGenericAdapterPlanCoverageReport,
  validateGenericAdapterPlan,
  validateGenericAdapterPlanCoverageManifest,
} from "../renderers/generic-adapter-plan/index.js";
import { timedFloatingOverlayContractSummary } from "../renderers/generic-adapter-plan/timed-floating-overlay-contract-summary.js";

function printAstroGenericAdapterOutputModel(plan: GenericAdapterPlan) {
  return printGenericAdapterOutputModel(
    astroFrameworkAdapter,
    buildGenericAdapterOutputModel(plan),
  );
}

function printReactGenericAdapterOutputModel(plan: GenericAdapterPlan) {
  return printGenericAdapterOutputModel(
    reactFrameworkAdapter,
    buildGenericAdapterOutputModel(plan),
  );
}

describe("GenericAdapterPlan", () => {
  it("builds and validates a minimal generic adapter plan from a primitive contract", () => {
    const plan = buildGenericAdapterPlan(syntheticStaticContract);

    expect(validateGenericAdapterPlan(plan)).toEqual([]);
    expect(plan.component).toBe("synthetic-static");
    expect(plan.displayName).toBe("SyntheticStatic");
    expect(plan.outputDirectory).toBe("synthetic-static");
    expect(plan.runtime).toEqual({
      destroys: true,
      factory: "createSyntheticStatic",
      importSource: "@starwind-ui/runtime/synthetic-static",
      rootPart: "root",
    });
    expect(plan.files).toEqual([
      {
        exportName: "SyntheticStaticRoot",
        kind: "part",
        part: "root",
        path: "synthetic-static/SyntheticStaticRoot",
      },
      {
        exportName: "SyntheticStaticLabel",
        kind: "part",
        part: "label",
        path: "synthetic-static/SyntheticStaticLabel",
      },
      {
        exportName: "SyntheticStatic",
        kind: "index",
        path: "synthetic-static/index",
      },
    ]);
    expect(plan.staticAttributes).toEqual([
      { name: "data-state", part: "root", source: "state" },
      { name: "aria-hidden", part: "label", source: "constant", value: "true" },
    ]);
    expect(plan.exports.members.map((member) => member.name)).toEqual([
      "SyntheticStaticRoot",
      "SyntheticStaticLabel",
    ]);
  });

  it("suppresses internal form input parts without dropping public input parts", () => {
    const plan = buildGenericAdapterPlan(syntheticBooleanFormControlContract);

    expect(plan.parts.map((part) => part.name)).toEqual([
      "root",
      "input",
      "uncheckedInput",
      "debugInput",
    ]);
    expect(plan.files.map((file) => file.path)).toEqual([
      "synthetic-boolean-form/SyntheticBooleanFormRoot",
      "synthetic-boolean-form/SyntheticBooleanFormDebugInput",
      "synthetic-boolean-form/index",
    ]);
    expect(plan.exports.members.map((member) => member.part)).toEqual(["root", "debugInput"]);
  });

  it("builds the Scroll Area viewport-measurement plan without encoding measurement behavior", () => {
    const plan = buildGenericAdapterPlan(scrollAreaRuntimeAdapterContract);

    expect(validateGenericAdapterPlan(plan)).toEqual([]);
    expect(plan.component).toBe("scroll-area");
    expect(plan.category).toBe("viewport-measurement");
    expect(plan.runtime).toEqual({
      destroys: true,
      factory: "createScrollArea",
      importSource: "@starwind-ui/runtime/scroll-area",
      optionProps: ["overflowEdgeThreshold"],
      rootPart: "root",
    });
    expect(plan.parts.map((part) => part.name)).toEqual([
      "root",
      "viewport",
      "content",
      "scrollbar",
      "thumb",
      "corner",
    ]);
    expect(plan.files.map((file) => file.path)).toEqual([
      "scroll-area/ScrollAreaRoot",
      "scroll-area/ScrollAreaViewport",
      "scroll-area/ScrollAreaContent",
      "scroll-area/ScrollAreaScrollbar",
      "scroll-area/ScrollAreaThumb",
      "scroll-area/ScrollAreaCorner",
      "scroll-area/index",
    ]);
    expect(plan.props.map((prop) => [prop.name, prop.kind, prop.targets])).toEqual([
      ["overflowEdgeThreshold", "option", ["root"]],
      ["keepMounted", "rendering", ["scrollbar"]],
      ["orientation", "option", ["scrollbar"]],
    ]);
    expect(plan.staticAttributes).toEqual([
      { name: "data-overflow-edge-threshold", part: "root", source: "prop" },
      { name: "tabindex", part: "viewport", source: "constant", value: "-1" },
      { name: "tabIndex", part: "viewport", source: "constant", value: "-1" },
      { name: "style", part: "viewport", source: "constant", value: "overflow: scroll;" },
      { name: "data-keep-mounted", part: "scrollbar", source: "prop" },
      { name: "data-orientation", part: "scrollbar", source: "prop" },
      { name: "aria-hidden", part: "scrollbar", source: "constant", value: "true" },
      { name: "aria-hidden", part: "corner", source: "constant", value: "true" },
    ]);
    expect(plan.events).toEqual([]);
    expect(plan.setters).toEqual([]);
    expect(plan.stateModels).toEqual([]);
  });

  it("registers structured Adapter Output Model families in dispatch order", () => {
    expect(getGenericAdapterOutputFamilyPlanIds()).toEqual([
      "action-surface",
      "disclosure-presence",
      "single-boolean-control",
      "boolean-form-control",
      "grouped-value-control",
      "form-field-coordinator",
      "media-status",
      "range-status",
      "native-disabled",
      "native-input-value",
      "viewport-measurement",
      "native-overlay",
      "presence-floating-overlay",
    ]);
  });

  it("dispatches representative Generic Adapter Plans to structured output families", () => {
    expectAdapterFamilyPlan(buttonRuntimeAdapterContract, "action-surface");
    expectAdapterFamilyPlan(avatarRuntimeAdapterContract, "media-status");
    expectAdapterFamilyPlan(progressRuntimeAdapterContract, "range-status");
    expectAdapterFamilyPlan(fieldsetRuntimeAdapterContract, "native-disabled");
    expectAdapterFamilyPlan(inputRuntimeAdapterContract, "native-input-value");
    expectAdapterFamilyPlan(collapsibleRuntimeAdapterContract, "disclosure-presence");
    expectAdapterFamilyPlan(formRuntimeAdapterContract, "form-field-coordinator");
    expectAdapterFamilyPlan(scrollAreaRuntimeAdapterContract, "viewport-measurement");
    expectAdapterFamilyPlan(dialogRuntimeAdapterContract, "native-overlay");
    expectAdapterFamilyPlan(alertDialogRuntimeAdapterContract, "native-overlay");
    expectAdapterFamilyPlan(drawerRuntimeAdapterContract, "native-overlay");
    expectAdapterFamilyPlan(popoverRuntimeAdapterContract, "presence-floating-overlay");
    expectAdapterFamilyPlan(toggleRuntimeAdapterContract, "single-boolean-control");
    expectAdapterFamilyPlan(toggleGroupRuntimeAdapterContract, "grouped-value-control");
  });

  it("rejects unsupported adapter family shapes instead of target-specific fallback printing", () => {
    const formPlan = buildGenericAdapterPlan(formRuntimeAdapterContract);
    const invalidFormPlan: GenericAdapterPlan = {
      ...formPlan,
      parts: formPlan.parts.filter((part) => part.name === "root"),
    };

    expect(() => getGenericAdapterOutputFamilyPlanId(invalidFormPlan)).toThrow(
      /Form generic adapter plan does not match a structured Adapter Output Model family\./,
    );
  });

  it("does not classify multi-part Button-like plans as action-surface output models", () => {
    const buttonPlan = buildGenericAdapterPlan(buttonRuntimeAdapterContract);
    const buttonPlanWithLabel: GenericAdapterPlan = {
      ...buttonPlan,
      exports: {
        ...buttonPlan.exports,
        members: [
          ...buttonPlan.exports.members,
          {
            file: "button/ButtonLabel",
            name: "ButtonLabel",
            part: "label",
          },
        ],
      },
      files: [
        ...buttonPlan.files.filter((file) => file.kind === "part"),
        {
          exportName: "ButtonLabel",
          kind: "part",
          part: "label",
          path: "button/ButtonLabel",
        },
        ...buttonPlan.files.filter((file) => file.kind === "index"),
      ],
      parts: [
        ...buttonPlan.parts,
        {
          defaultElement: "span",
          discoveryAttribute: "data-sw-button-label",
          name: "label",
        },
      ],
      refs: [...buttonPlan.refs, { part: "label", public: true }],
    };

    expect(() => buildGenericAdapterOutputModel(buttonPlanWithLabel)).toThrow(
      /Button generic adapter plan does not match a structured Adapter Output Model family\./,
    );
  });

  it("prints representative family output equal to checked-in generated output", () => {
    const plan = buildGenericAdapterPlan(scrollAreaRuntimeAdapterContract);

    expectPrintedFilesToMatchPackage(
      "packages/astro/src",
      printAstroGenericAdapterOutputModel(plan),
    );
    expectPrintedFilesToMatchPackage(
      "packages/react/src",
      printReactGenericAdapterOutputModel(plan),
    );
  });

  it("prints Dialog through a native overlay family without owning native dialog behavior", () => {
    const plan = buildGenericAdapterPlan(dialogRuntimeAdapterContract);

    expect(validateGenericAdapterPlan(plan)).toEqual([]);
    expect(plan.component).toBe("dialog");
    expect(plan.category).toBe("dialog-native-overlay");
    expect(plan.parts.map((part) => part.name)).toEqual([
      "root",
      "trigger",
      "backdrop",
      "popup",
      "title",
      "description",
      "close",
    ]);
    expect(plan.runtime).toEqual({
      destroys: true,
      factory: "createDialog",
      importSource: "@starwind-ui/runtime/dialog",
      optionProps: [
        "closeOnEscape",
        "closeOnOutsideInteract",
        "defaultOpen",
        "modal",
        "onCloseComplete",
        "onOpenChange",
        "open",
      ],
      rootPart: "root",
    });
    expect(plan.presence).toEqual({
      initialHiddenParts: ["backdrop"],
      unmountPolicy: "runtime-owned",
    });
    expect(
      plan.events.map((event) => [event.name, event.callbackTiming, event.cancelable]),
    ).toEqual([
      ["openChange", "before-state-commit", true],
      ["closeComplete", "after-state-commit", false],
    ]);
    expect(plan.setters).toEqual([
      { method: "setOpen", options: { emit: false }, stateModel: "open", suppressesEmit: true },
    ]);
    expect(getGenericAdapterOutputFamilyPlanId(plan)).toBe("native-overlay");
    expectPrintedFilesToMatchPackage(
      "packages/astro/src",
      printAstroGenericAdapterOutputModel(plan),
    );
    expectPrintedFilesToMatchPackage(
      "packages/react/src",
      printReactGenericAdapterOutputModel(plan),
    );
  });

  it("prints Alert Dialog and Drawer through the native overlay family without changing output", () => {
    const alertDialogPlan = buildGenericAdapterPlan(alertDialogRuntimeAdapterContract);
    const drawerPlan = buildGenericAdapterPlan(drawerRuntimeAdapterContract);

    expect(alertDialogPlan.parts.map((part) => part.name)).toEqual([
      "root",
      "trigger",
      "portal",
      "backdrop",
      "viewport",
      "popup",
      "title",
      "description",
      "close",
    ]);
    expect(drawerPlan.parts.map((part) => part.name)).toEqual([
      "root",
      "trigger",
      "portal",
      "backdrop",
      "viewport",
      "popup",
      "title",
      "description",
      "close",
    ]);
    expect(alertDialogPlan.parts.find((part) => part.name === "popup")?.role).toBe("alertdialog");
    expect(drawerPlan.props.find((prop) => prop.name === "side")).toMatchObject({
      defaultValue: '"right"',
      targets: ["popup"],
      type: '"top" | "right" | "bottom" | "left"',
    });
    expect(getGenericAdapterOutputFamilyPlanId(alertDialogPlan)).toBe("native-overlay");
    expect(getGenericAdapterOutputFamilyPlanId(drawerPlan)).toBe("native-overlay");
    expectPrintedFilesToMatchPackage(
      "packages/astro/src",
      printAstroGenericAdapterOutputModel(alertDialogPlan),
    );
    expectPrintedFilesToMatchPackage(
      "packages/react/src",
      printReactGenericAdapterOutputModel(alertDialogPlan),
    );
    expectPrintedFilesToMatchPackage(
      "packages/astro/src",
      printAstroGenericAdapterOutputModel(drawerPlan),
    );
    expectPrintedFilesToMatchPackage(
      "packages/react/src",
      printReactGenericAdapterOutputModel(drawerPlan),
    );
  });

  it("prints Popover through the floating overlay family without changing output", () => {
    const plan = buildGenericAdapterPlan(popoverRuntimeAdapterContract);

    expect(validateGenericAdapterPlan(plan)).toEqual([]);
    expect(plan.category).toBe("presence-floating-overlay");
    expect(plan.parts.map((part) => part.name)).toEqual([
      "root",
      "trigger",
      "portal",
      "positioner",
      "popup",
      "arrow",
      "backdrop",
      "title",
      "description",
      "close",
      "viewport",
    ]);
    expect(plan.floating).toEqual({
      anchorPart: "trigger",
      optionProps: ["side", "align", "sideOffset", "avoidCollisions", "collisionStrategy"],
      portalPart: "portal",
      positionerPart: "positioner",
      popupPart: "popup",
    });
    expect(plan.asChild).toEqual([
      {
        merges: ["aria", "className", "data", "ref"],
        part: "trigger",
      },
    ]);
    expect(getGenericAdapterOutputFamilyPlanId(plan)).toBe("presence-floating-overlay");
    expectPrintedFilesToMatchPackage(
      "packages/astro/src",
      printAstroGenericAdapterOutputModel(plan),
    );
    expectPrintedFilesToMatchPackage(
      "packages/react/src",
      printReactGenericAdapterOutputModel(plan),
    );
  });

  it("rejects Popover floating overlay plans when key adapter metadata drifts", () => {
    const plan = buildGenericAdapterPlan(popoverRuntimeAdapterContract);
    const driftPlans: GenericAdapterPlan[] = [
      {
        ...plan,
        runtime: {
          ...plan.runtime,
          factory: "createTooltip",
        },
      },
      {
        ...plan,
        runtime: {
          ...plan.runtime,
          importSource: "@starwind-ui/runtime/tooltip",
        },
      },
      {
        ...plan,
        presence: {
          ...plan.presence!,
          initialHiddenParts: ["popup"],
        },
      },
      {
        ...plan,
        floating: {
          ...plan.floating!,
          popupPart: "positioner",
        },
      },
      {
        ...plan,
        asChild: [
          {
            ...plan.asChild![0],
            merges: ["aria", "className", "data"],
          },
        ],
      },
      {
        ...plan,
        staticAttributes: plan.staticAttributes.filter(
          (attribute) => !(attribute.part === "popup" && attribute.name === "role"),
        ),
      },
    ];
    const orderOnlyDriftPlans: GenericAdapterPlan[] = [
      {
        ...plan,
        runtime: {
          ...plan.runtime,
          optionProps: [...(plan.runtime.optionProps ?? [])].reverse(),
        },
      },
      {
        ...plan,
        parts: [plan.parts[1], plan.parts[0], ...plan.parts.slice(2)],
      },
      {
        ...plan,
        props: [plan.props[1], plan.props[0], ...plan.props.slice(2)],
      },
    ];

    for (const driftPlan of driftPlans) {
      expect(() => getGenericAdapterOutputFamilyPlanId(driftPlan)).toThrow(
        /Popover generic adapter plan does not match a structured Adapter Output Model family\./,
      );
    }
    for (const driftPlan of orderOnlyDriftPlans) {
      expect(getGenericAdapterOutputFamilyPlanId(driftPlan)).toBe("presence-floating-overlay");
    }
  });

  it("keeps same-category Preview Card and Tooltip out of the Popover floating overlay family", () => {
    const previewCardPlan = buildGenericAdapterPlan(previewCardRuntimeAdapterContract);
    const tooltipPlan = buildGenericAdapterPlan(tooltipRuntimeAdapterContract);

    expect(previewCardPlan.category).toBe("presence-floating-overlay");
    expect(tooltipPlan.category).toBe("presence-floating-overlay");
    expect(() => getGenericAdapterOutputFamilyPlanId(previewCardPlan)).toThrow(
      /PreviewCard generic adapter plan does not match a structured Adapter Output Model family\./,
    );
    expect(() => getGenericAdapterOutputFamilyPlanId(tooltipPlan)).toThrow(
      /Tooltip generic adapter plan does not match a structured Adapter Output Model family\./,
    );
  });

  it("keeps timed floating overlay contract facts aligned", () => {
    expect(timedFloatingOverlayContractSummary.components.map((entry) => entry.component)).toEqual([
      "popover",
      "tooltip",
      "preview-card",
    ]);
    expect(timedFloatingOverlayContractSummary.sharedAdapterFacts).toEqual([
      "presence-floating-overlay category",
      "open/defaultOpen state with getOpen and setOpen",
      "cancelable openChange event emitted from root",
      "trigger/portal/positioner/popup floating anatomy",
      "side/align/sideOffset/avoidCollisions floating options",
      "runtime-owned hidden popup presence",
    ]);
    expect(timedFloatingOverlayContractSummary.runtimeOwnedBehavior).toEqual([
      "hover/focus timing",
      "non-interactive tooltip popup rules",
      "aria-describedby wiring",
      "hoverable-content coordination",
      "delayed hide and presence cleanup",
      "portal movement",
      "Floating UI auto-update",
      "controller destroy cleanup",
    ]);
    for (const component of timedFloatingOverlayContractSummary.components) {
      expect(component.invariantChecks).toEqual({
        "cancelable root openChange": true,
        "floating anatomy": true,
        "floating options": true,
        "open state bridge": true,
        "presence hidden popup": true,
        "static floating attrs": true,
        "trigger asChild ref": true,
      });
      expect(component.category).toBe("presence-floating-overlay");
      expect(component.state).toEqual({
        controlledProp: "open",
        defaultProp: "defaultOpen",
        runtimeGetter: "getOpen",
        runtimeSetter: "setOpen",
        valueType: "boolean",
      });
      expect(component.floating).toEqual({
        anchorPart: "trigger",
        optionProps:
          component.component === "popover"
            ? ["side", "align", "sideOffset", "avoidCollisions", "collisionStrategy"]
            : ["side", "align", "sideOffset", "avoidCollisions"],
        popupPart: "popup",
        portalPart: "portal",
        positionerPart: "positioner",
      });
      expect(component.presence?.initialHiddenParts).toContain("popup");
      expect(component.presence?.unmountPolicy).toBe("runtime-owned");
      expect(component.asChildMerges).toContain("ref");
      expect(component.staticAttributesByPart.positioner).toEqual([
        "data-state",
        "data-side",
        "data-align",
        "data-side-offset",
        "data-avoid-collisions",
        ...(component.component === "popover" ? ["data-collision-strategy"] : []),
      ]);
      expect(component.staticAttributesByPart.popup).toEqual(
        expect.arrayContaining([
          "role",
          "data-state",
          "data-side",
          "data-align",
          "data-side-offset",
          "data-avoid-collisions",
          ...(component.component === "popover" ? ["data-collision-strategy"] : []),
          "hidden",
        ]),
      );
    }

    const popover = timedFloatingOverlayContractSummary.components.find(
      (entry) => entry.component === "popover",
    );
    const tooltip = timedFloatingOverlayContractSummary.components.find(
      (entry) => entry.component === "tooltip",
    );
    const previewCard = timedFloatingOverlayContractSummary.components.find(
      (entry) => entry.component === "preview-card",
    );

    expect(popover).toMatchObject({
      adapterBoundary: "baseline dialog-like floating overlay",
      eventNames: ["openChange", "closeComplete"],
      optionProps: expect.arrayContaining(["closeDelay", "openOnHover"]),
      popupRole: "dialog",
    });
    expect(tooltip).toMatchObject({
      adapterBoundary: "timed descriptive floating overlay",
      eventNames: ["openChange"],
      optionProps: expect.arrayContaining([
        "closeDelay",
        "disabled",
        "disableHoverableContent",
        "openDelay",
      ]),
      popupRole: "tooltip",
      setters: ["setOpen", "setDisabled"],
    });
    expect(previewCard).toMatchObject({
      adapterBoundary: "timed rich preview floating overlay",
      eventNames: ["openChange"],
      optionProps: expect.arrayContaining(["closeDelay", "disableHoverableContent", "openDelay"]),
      optionalOverlayParts: ["backdrop", "viewport", "arrow"],
      popupRole: "tooltip",
    });
  });

  it("rejects Dialog-like native overlay plans when runtime or setter metadata drifts", () => {
    const plan = buildGenericAdapterPlan(dialogRuntimeAdapterContract);
    const setterDriftPlan: GenericAdapterPlan = {
      ...plan,
      setters: [
        {
          ...plan.setters[0],
          options: { emit: true },
          suppressesEmit: false,
        },
      ],
    };
    const runtimeDriftPlan: GenericAdapterPlan = {
      ...plan,
      runtime: {
        ...plan.runtime,
        factory: "createAlertDialog",
      },
    };

    expect(() => getGenericAdapterOutputFamilyPlanId(setterDriftPlan)).toThrow(
      /Dialog generic adapter plan does not match a structured Adapter Output Model family\./,
    );
    expect(() => getGenericAdapterOutputFamilyPlanId(runtimeDriftPlan)).toThrow(
      /Dialog generic adapter plan does not match a structured Adapter Output Model family\./,
    );
  });

  it("rejects native overlay variants when emitted static attributes drift", () => {
    const alertDialogPlan = buildGenericAdapterPlan(alertDialogRuntimeAdapterContract);
    const drawerPlan = buildGenericAdapterPlan(drawerRuntimeAdapterContract);
    const alertDialogRoleDriftPlan: GenericAdapterPlan = {
      ...alertDialogPlan,
      staticAttributes: alertDialogPlan.staticAttributes.map((attribute) =>
        attribute.part === "popup" && attribute.name === "role"
          ? { ...attribute, value: "dialog" }
          : attribute,
      ),
    };
    const drawerSideDriftPlan: GenericAdapterPlan = {
      ...drawerPlan,
      staticAttributes: drawerPlan.staticAttributes.filter(
        (attribute) => !(attribute.part === "popup" && attribute.name === "data-side"),
      ),
    };

    expect(() => getGenericAdapterOutputFamilyPlanId(alertDialogRoleDriftPlan)).toThrow(
      /AlertDialog generic adapter plan does not match a structured Adapter Output Model family\./,
    );
    expect(() => getGenericAdapterOutputFamilyPlanId(drawerSideDriftPlan)).toThrow(
      /Drawer generic adapter plan does not match a structured Adapter Output Model family\./,
    );
  });

  it("reports invalid generic-adapter-plan references", () => {
    const invalidPlan: GenericAdapterPlan = {
      ...buildGenericAdapterPlan(syntheticStaticContract),
      component: "",
      escapeDeclarations: [
        {
          boundary: "",
          reason: "Synthetic invalid escape.",
          tests: [],
        },
      ],
      exports: {
        defaultNamespace: true,
        members: [
          {
            file: "synthetic-static/MissingPart",
            name: "MissingPart",
            part: "missingPart",
          },
        ],
        namespace: "",
      },
      files: [
        {
          exportName: "SyntheticStaticRoot",
          kind: "part",
          part: "root",
          path: "synthetic-static/SyntheticStaticRoot",
        },
        {
          exportName: "DuplicateRoot",
          kind: "part",
          part: "root",
          path: "synthetic-static/SyntheticStaticRoot",
        },
      ],
      parts: [
        {
          defaultElement: "div",
          discoveryAttribute: "data-sw-synthetic-static",
          name: "root",
          ownsRuntime: true,
        },
        {
          defaultElement: "span",
          discoveryAttribute: "data-sw-synthetic-static-duplicate",
          name: "root",
        },
      ],
      refs: [{ part: "missingRef", public: true }],
      runtime: {
        destroys: true,
        factory: "createSyntheticStatic",
        importSource: "@starwind-ui/runtime/synthetic-static",
        rootPart: "missingRoot",
      },
      staticAttributes: [{ name: "data-missing", part: "missingPart", source: "constant" }],
    };

    expect(validateGenericAdapterPlan(invalidPlan)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          message: "Missing component id.",
          path: "component",
        }),
        expect.objectContaining({
          message: 'Duplicate file path "synthetic-static/SyntheticStaticRoot".',
          path: "files.synthetic-static/SyntheticStaticRoot",
        }),
        expect.objectContaining({
          message: 'Duplicate part "root".',
          path: "parts.root",
        }),
        expect.objectContaining({
          message: 'Missing part "missingRoot".',
          path: "runtime.rootPart",
        }),
        expect.objectContaining({
          message: 'Missing part "missingPart".',
          path: "staticAttributes.data-missing.part",
        }),
        expect.objectContaining({
          message: 'Missing part "missingRef".',
          path: "refs.missingRef.part",
        }),
        expect.objectContaining({
          message: "Missing export namespace.",
          path: "exports.namespace",
        }),
        expect.objectContaining({
          message: 'Export member "MissingPart" references missing part "missingPart".',
          path: "exports.members.MissingPart.part",
        }),
        expect.objectContaining({
          message:
            'Export member "MissingPart" references missing file "synthetic-static/MissingPart".',
          path: "exports.members.MissingPart.file",
        }),
        expect.objectContaining({
          message: "Escape declaration is missing a boundary.",
          path: "escapeDeclarations.0.boundary",
        }),
        expect.objectContaining({
          message: "Escape declaration must list at least one test.",
          path: "escapeDeclarations.0.tests",
        }),
      ]),
    );
  });

  it("classifies every current primitive contract by generation strategy", () => {
    const classifications = classifyGenericAdapterPlanInventory(runtimeAdapterContracts);

    expect(classifications.map((entry) => entry.component)).toEqual(
      runtimeAdapterContracts.map((contract) => contract.component),
    );
    expect(
      classifications
        .filter((entry) => entry.strategy === "adapter-family-plan")
        .map((entry) => entry.component),
    ).toEqual([
      "button",
      "toggle",
      "fieldset",
      "form",
      "input",
      "switch",
      "checkbox",
      "radio",
      "collapsible",
      "toggle-group",
      "radio-group",
      "checkbox-group",
      "avatar",
      "progress",
      "scroll-area",
      "popover",
      "dialog",
      "alert-dialog",
      "drawer",
    ]);
    expect(classifications.filter((entry) => entry.strategy === "custom-island").length).toBe(0);
    expect(
      classifications
        .filter((entry) => entry.strategy === "specialized-adapter-spec")
        .map((entry) => entry.component),
    ).toEqual([
      "carousel",
      "field",
      "slider",
      "tabs",
      "accordion",
      "input-otp",
      "tooltip",
      "preview-card",
      "dropzone",
      "menu",
      "navigation-menu",
      "context-menu",
      "select",
      "sidebar",
      "combobox",
      "color-picker",
      "toast",
    ]);
    expect(
      classifications.filter((entry) => entry.strategy === "future-framework-tracer").length,
    ).toBe(0);
    expect(classifications.find((entry) => entry.component === "toggle")).toEqual({
      component: "toggle",
      reason:
        "Generated through a typed Adapter Family Plan while preserving existing Astro and React output.",
      strategy: "adapter-family-plan",
    });
    expect(classifications.find((entry) => entry.component === "select")).toEqual({
      component: "select",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "menu")).toEqual({
      component: "menu",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "context-menu")).toEqual({
      component: "context-menu",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "navigation-menu")).toEqual({
      component: "navigation-menu",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "combobox")).toEqual({
      component: "combobox",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "color-picker")).toEqual({
      component: "color-picker",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "accordion")).toEqual({
      component: "accordion",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "tabs")).toEqual({
      component: "tabs",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "field")).toEqual({
      component: "field",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "slider")).toEqual({
      component: "slider",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "input-otp")).toEqual({
      component: "input-otp",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "dropzone")).toEqual({
      component: "dropzone",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "sidebar")).toEqual({
      component: "sidebar",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "carousel")).toEqual({
      component: "carousel",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "scroll-area")).toEqual({
      component: "scroll-area",
      reason:
        "Generated through a typed Adapter Family Plan while preserving existing Astro and React output.",
      strategy: "adapter-family-plan",
    });
    expect(classifications.find((entry) => entry.component === "dialog")).toEqual({
      component: "dialog",
      reason:
        "Generated through a typed Adapter Family Plan while preserving existing Astro and React output.",
      strategy: "adapter-family-plan",
    });
    expect(classifications.find((entry) => entry.component === "popover")).toEqual({
      component: "popover",
      reason:
        "Generated through a typed Adapter Family Plan while preserving existing Astro and React output.",
      strategy: "adapter-family-plan",
    });
    expect(classifications.find((entry) => entry.component === "alert-dialog")).toEqual({
      component: "alert-dialog",
      reason:
        "Generated through a typed Adapter Family Plan while preserving existing Astro and React output.",
      strategy: "adapter-family-plan",
    });
    expect(classifications.find((entry) => entry.component === "drawer")).toEqual({
      component: "drawer",
      reason:
        "Generated through a typed Adapter Family Plan while preserving existing Astro and React output.",
      strategy: "adapter-family-plan",
    });
    expect(classifications.find((entry) => entry.component === "tooltip")).toEqual({
      component: "tooltip",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "preview-card")).toEqual({
      component: "preview-card",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
    expect(classifications.find((entry) => entry.component === "toast")).toEqual({
      component: "toast",
      reason:
        "Generated through a component-specific Specialized Adapter Spec while preserving existing Astro and React output and keeping behavior in Runtime.",
      strategy: "specialized-adapter-spec",
    });
  });

  it("fails when a primitive contract is missing a coverage classification", () => {
    const unclassifiedContract = {
      ...syntheticStaticContract,
      component: "synthetic-unclassified",
      displayName: "SyntheticUnclassified",
    } as const satisfies RuntimeAdapterContract;

    expect(() => classifyGenericAdapterPlanInventory([unclassifiedContract])).toThrow(
      "Generic adapter plan coverage is missing classifications for: synthetic-unclassified.",
    );
  });

  it("reports duplicate and stale coverage manifest entries", () => {
    expect(
      validateGenericAdapterPlanCoverageManifest([syntheticStaticContract], {
        customIsland: ["synthetic-static", "synthetic-stale"],
        adapterFamilyPlan: ["synthetic-static"],
      }),
    ).toEqual([
      "Generic adapter plan coverage has duplicate classifications for: synthetic-static.",
      "Generic adapter plan coverage has stale classifications for: synthetic-stale.",
    ]);
  });

  it("keeps future-framework tracer classifications current", () => {
    expect(
      genericAdapterFutureFrameworkTracerClassifications.map((entry) => entry.component),
    ).toEqual([
      "toggle/vue",
      "collapsible/vue",
      "menu/vue",
      "navigation-menu/vue",
      "combobox/vue",
      "button/solid",
      "toggle/solid",
      "collapsible/solid",
      "select/solid",
      "menu/solid",
      "navigation-menu/solid",
      "combobox/solid",
    ]);
    expect(genericAdapterFutureFrameworkTracerClassifications).toContainEqual({
      component: "select/solid",
      reason:
        "Non-shipping Solid TSX tracer fixture for the Select Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
      strategy: "future-framework-tracer",
    });
    expect(genericAdapterFutureFrameworkTracerClassifications).toContainEqual({
      component: "menu/vue",
      reason:
        "Unsupported, non-normative Vue SFC tracer evidence for the Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
      strategy: "future-framework-tracer",
    });
    expect(genericAdapterFutureFrameworkTracerClassifications).toContainEqual({
      component: "menu/solid",
      reason:
        "Non-shipping Solid TSX tracer fixture for the Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
      strategy: "future-framework-tracer",
    });
    expect(genericAdapterFutureFrameworkTracerClassifications).toContainEqual({
      component: "navigation-menu/vue",
      reason:
        "Unsupported, non-normative Vue SFC tracer evidence for the Navigation Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
      strategy: "future-framework-tracer",
    });
    expect(genericAdapterFutureFrameworkTracerClassifications).toContainEqual({
      component: "navigation-menu/solid",
      reason:
        "Non-shipping Solid TSX tracer fixture for the Navigation Menu Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
      strategy: "future-framework-tracer",
    });
    expect(genericAdapterFutureFrameworkTracerClassifications).toContainEqual({
      component: "combobox/vue",
      reason:
        "Unsupported, non-normative Vue SFC tracer evidence for the Combobox Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
      strategy: "future-framework-tracer",
    });
    expect(genericAdapterFutureFrameworkTracerClassifications).toContainEqual({
      component: "combobox/solid",
      reason:
        "Non-shipping Solid TSX tracer fixture for the Combobox Specialized Adapter Spec; not included in package exports, CLI registry output, or demo dependencies.",
      strategy: "future-framework-tracer",
    });
  });

  it("validates generic-adapter-plan coverage in memory and checks private drift when present", () => {
    const reportPath = join(
      process.cwd(),
      "docs/portable-runtime/diagnostics/generic-adapter-plan-coverage.md",
    );
    const report = renderGenericAdapterPlanCoverageReport(
      runtimeAdapterContracts,
      genericAdapterFutureFrameworkTracerClassifications,
    );

    expect(report).not.toContain("static-adapter-plan");
    expect(report).toMatch(/^\| Adapter Family Plan \(`adapter-family-plan`\)\s+\|\s+19 \|$/m);
    expect(report).toMatch(
      /^\| Specialized Adapter Spec \(`specialized-adapter-spec`\)\s+\|\s+17 \|$/m,
    );
    expect(report).toMatch(/^\| Manual Island Escape Hatch \(`custom-island`\)\s+\|\s+0 \|$/m);

    expectOptionalPrivateReportToMatch(reportPath, report);
  });

  it("accepts an absent private generic-adapter-plan coverage diagnostic", () => {
    const report = renderGenericAdapterPlanCoverageReport(
      runtimeAdapterContracts,
      genericAdapterFutureFrameworkTracerClassifications,
    );
    const missingPath = join(
      process.cwd(),
      "docs/portable-runtime/diagnostics/missing-generic-adapter-plan-coverage.md",
    );

    expect(() => expectOptionalPrivateReportToMatch(missingPath, report)).not.toThrow();
  });

  it("enforces private generic-adapter-plan coverage drift when the artifact exists", () => {
    const root = mkdtempSync(join(tmpdir(), "starwind-generic-coverage-"));
    const reportPath = join(root, "generic-adapter-plan-coverage.md");

    try {
      writeFileSync(reportPath, "stale\n");
      expect(() => expectOptionalPrivateReportToMatch(reportPath, "current\n")).toThrow();

      writeFileSync(reportPath, "current\n");
      expect(() => expectOptionalPrivateReportToMatch(reportPath, "current\n")).not.toThrow();
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it("does not treat private generic coverage read failures as absence", () => {
    const root = mkdtempSync(join(tmpdir(), "starwind-generic-coverage-"));

    try {
      expect(() => expectOptionalPrivateReportToMatch(root, "current\n")).toThrow();
    } finally {
      rmSync(root, { force: true, recursive: true });
    }
  });

  it("keeps the future-framework readiness gate aligned with coverage classifications", () => {
    const gate = readWorkspaceFile("docs/portable-runtime/framework-readiness-gate.md");
    const readinessSpecializedAdapterSpecList = readListBlockAfterLabel(
      gate,
      "Specialized Adapter Spec generated primitives:",
    );
    const readinessManualIslandList = readListBlockAfterLabel(gate, "Current manual islands:");
    const readinessFutureTracerList = readListBlockAfterLabel(
      gate,
      "Non-shipping future-framework tracers exist only for:",
    );

    expect(gate).toContain("Adapter Family Plan components:");
    for (const component of ["popover", "dialog", "alert-dialog", "drawer"]) {
      expect(gate).toContain(`- \`${component}\``);
    }

    expect(gate).toContain("Specialized Adapter Spec generated primitives:");
    expect(readinessSpecializedAdapterSpecList).toContain("- `select`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `menu`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `context-menu`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `navigation-menu`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `combobox`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `color-picker`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `tooltip`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `preview-card`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `tabs`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `accordion`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `sidebar`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `slider`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `input-otp`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `dropzone`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `field`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `carousel`");
    expect(readinessSpecializedAdapterSpecList).toContain("- `toast`");
    expect(gate).toContain("Current manual islands:");
    expect(readinessManualIslandList).not.toContain("- `tabs`");
    expect(readinessManualIslandList).not.toContain("- `accordion`");
    expect(readinessManualIslandList).not.toContain("- `combobox`");
    expect(readinessManualIslandList).not.toContain("- `color-picker`");
    expect(readinessManualIslandList).not.toContain("- `select`");
    expect(readinessManualIslandList).not.toContain("- `menu`");
    expect(readinessManualIslandList).not.toContain("- `context-menu`");
    expect(readinessManualIslandList).not.toContain("- `navigation-menu`");
    expect(readinessManualIslandList).not.toContain("- `tooltip`");
    expect(readinessManualIslandList).not.toContain("- `preview-card`");
    expect(readinessManualIslandList).not.toContain("- `sidebar`");
    expect(readinessManualIslandList).not.toContain("- `slider`");
    expect(readinessManualIslandList).not.toContain("- `input-otp`");
    expect(readinessManualIslandList).not.toContain("- `dropzone`");
    expect(readinessManualIslandList).not.toContain("- `field`");
    expect(readinessManualIslandList).not.toContain("- `carousel`");
    expect(readinessManualIslandList).not.toContain("- `toast`");
    expect(gate).toContain("Non-shipping future-framework tracers exist only for:");
    expect(readinessFutureTracerList).not.toContain("- `button/vue`");
    expect(readinessFutureTracerList).not.toContain("- `checkbox/vue`");
    expect(readinessFutureTracerList).not.toContain("- `select/vue`");
    expect(readinessFutureTracerList).toContain("- `select/solid`");
    expect(readinessFutureTracerList).toContain("- `menu/vue`");
    expect(readinessFutureTracerList).toContain("- `menu/solid`");
    expect(readinessFutureTracerList).toContain("- `navigation-menu/vue`");
    expect(readinessFutureTracerList).toContain("- `navigation-menu/solid`");
    expect(readinessFutureTracerList).toContain("- `combobox/vue`");
    expect(readinessFutureTracerList).toContain("- `combobox/solid`");
    expect(readinessFutureTracerList).not.toContain("- `tooltip/vue`");
    expect(readinessFutureTracerList).not.toContain("- `tooltip/solid`");
    expect(readinessFutureTracerList).not.toContain("- `preview-card/vue`");
    expect(readinessFutureTracerList).not.toContain("- `preview-card/solid`");
    expect(readinessFutureTracerList).not.toContain("- `tabs/vue`");
    expect(readinessFutureTracerList).not.toContain("- `tabs/solid`");
    expect(readinessFutureTracerList).not.toContain("- `accordion/vue`");
    expect(readinessFutureTracerList).not.toContain("- `accordion/solid`");
    expect(readinessFutureTracerList).not.toContain("- `sidebar/vue`");
    expect(readinessFutureTracerList).not.toContain("- `sidebar/solid`");
    expect(gate).toContain(
      "Vue has private, non-shipping generated output for Button, Checkbox, and Select",
    );
    expect(gate).toMatch(/Existing Solid\s+tracers are frozen comparison artifacts/);
  });

  it("keeps Specialized Adapter Spec migrations out of current manual-island coverage", () => {
    const coverage = renderGenericAdapterPlanCoverageReport(
      runtimeAdapterContracts,
      genericAdapterFutureFrameworkTracerClassifications,
    );
    const manualIslandSection = readMarkdownSection(coverage, "Manual Island Escape Hatches");

    for (const component of [
      "select",
      "menu",
      "context-menu",
      "navigation-menu",
      "combobox",
      "color-picker",
      "tooltip",
      "preview-card",
      "tabs",
      "accordion",
      "sidebar",
      "slider",
      "input-otp",
      "dropzone",
      "field",
      "carousel",
      "toast",
    ]) {
      expect(manualIslandSection).not.toContain(`- \`${component}\``);
    }
  });

  it("keeps active readiness and coverage docs on accepted adapter vocabulary", () => {
    const activeDocs = [
      {
        name: "docs/portable-runtime/framework-readiness-gate.md",
        source: readWorkspaceFile("docs/portable-runtime/framework-readiness-gate.md"),
      },
      {
        name: "rendered generic adapter plan coverage",
        source: renderGenericAdapterPlanCoverageReport(
          runtimeAdapterContracts,
          genericAdapterFutureFrameworkTracerClassifications,
        ),
      },
    ];
    const deprecatedPhrases = [
      ["Primitive", "AdapterContract"].join(""),
      ["Primitive", "RenderPlan"].join(""),
      ["Component", "AdapterSpec"].join(""),
      ["Primitive", " Adapter Contract"].join(""),
      ["Primitive", " Render Plan"].join(""),
      ["Component", " Adapter Spec"].join(""),
      ["component", "-adapter-spec"].join(""),
      ["static", "-plan"].join(""),
      ["family", "-builder"].join(""),
      ["custom", " island"].join(""),
      ["custom", " islands"].join(""),
      ["Custom", " Island"].join(""),
      ["Custom", " Islands"].join(""),
    ];

    for (const { name, source } of activeDocs) {
      for (const phrase of deprecatedPhrases) {
        expect(source, `${name} contains deprecated vocabulary: ${phrase}`).not.toContain(phrase);
      }
    }
  });

  it("keeps durable generator architecture docs aligned with the current target-authoring flow", () => {
    const readme = readWorkspaceFile("docs/portable-runtime/README.md").replace(/\s+/g, " ");
    const vocabulary = readWorkspaceFile("docs/portable-runtime/adapter-vocabulary.md");
    const readinessGate = readWorkspaceFile("docs/portable-runtime/framework-readiness-gate.md");

    expect(readme).toContain("## Primitive Creation Flow");
    expect(readme).toContain("## Styled Component Creation Flow");
    expect(readme).toContain("## Future Framework Authoring Path");
    expect(readme).toContain("## Current Exceptions And Follow-Ups");
    expect(readme).toContain("scripts/portable-runtime/renderers/primitive-inventory.ts");
    expect(readme).toContain("primitive-index.ts` consumes Primitive Inventory facts");
    expect(readme).toContain(
      "scripts/portable-runtime/renderers/framework-adapters/target-registry.ts",
    );
    expect(readme).toContain("one target home plus one target registration");

    expect(vocabulary).toContain("Primitive Inventory");
    expect(vocabulary).toContain("Adapter Family Plan locality");
    expect(vocabulary).toContain("targetRegistration.primitive.outputModel.write");
    expect(vocabulary).toContain("targetRegistration.styled.project");
    expect(vocabulary).toContain("targetRegistration.styled.write");
    expect(vocabulary).toContain("one target home plus one target registration");

    const generatorNotesPath = join(process.cwd(), "docs/portable-runtime/generator-notes.md");
    if (existsSync(generatorNotesPath)) {
      const generatorNotes = readFileSync(generatorNotesPath, "utf8");
      expect(generatorNotes).toContain("## Primitive Creation Flow");
      expect(generatorNotes).toContain("## Styled Component Creation Flow");
      expect(generatorNotes).toContain("## Current Exceptions And Follow-Ups");
      expect(generatorNotes).toContain("primitive-index.ts` consumes that inventory");
      expect(generatorNotes).toContain("Raw prebuilt generated-file wrappers");
      expect(generatorNotes).toContain("Media Status");
    }

    expect(readinessGate).toContain("Target Home Checklist");
    expect(readinessGate).toContain("target-registry.ts");
    expect(readinessGate).toContain("generic-adapter-plan/families/");
    expect(readinessGate).toContain("generic-adapter-output-model.ts");
    expect(readinessGate).toContain("primitive.outputModel.write");
    expect(readinessGate).toContain("styled.project");
    expect(readinessGate).toContain("styled.write");
  });
});

function expectAdapterFamilyPlan(contract: RuntimeAdapterContract, familyPlanId: string): void {
  expect(getGenericAdapterOutputFamilyPlanId(buildGenericAdapterPlan(contract))).toBe(familyPlanId);
}

function expectOptionalPrivateReportToMatch(reportPath: string, expected: string): void {
  let actual: string;
  try {
    actual = readFileSync(reportPath, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") return;
    throw error;
  }

  expect(actual).toBe(expected);
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error;
}

function expectPrintedFilesToMatchPackage(
  packageSourceDirectory: string,
  files: { contents: string; path: string }[],
): void {
  for (const file of files) {
    const contents = packageSourceDirectory.includes("/astro/")
      ? normalizeAstroPrimitiveOutput(file.path.split("/").at(-1)!, file.contents)
      : applyReactRefCleanup(file.contents);
    expect(normalizePrintedComparison(contents)).toBe(
      normalizePrintedComparison(readGeneratedPackageBody(packageSourceDirectory, file.path)),
    );
  }
}

function normalizePrintedComparison(contents: string): string {
  return contents
    .replace(/\s+/g, " ")
    .replace(/\s*([(){}\[\],;])\s*/g, "$1")
    .replace(/,([)\]}])/g, "$1");
}

function readWorkspaceFile(path: string): string {
  return readFileSync(join(process.cwd(), path), "utf8").replace(/\r\n/g, "\n");
}

function readListBlockAfterLabel(source: string, label: string): string {
  const lines = source.split("\n");
  const startIndex = lines.findIndex((line) => line.trim() === label);
  if (startIndex < 0) {
    throw new Error(`Missing markdown label "${label}".`);
  }

  const listLines: string[] = [];
  let listStarted = false;
  for (const line of lines.slice(startIndex + 1)) {
    if (line.trim() === "") {
      if (listStarted) break;
      continue;
    }

    listStarted = true;
    listLines.push(line);
  }

  return listLines.join("\n");
}

function readMarkdownSection(source: string, heading: string): string {
  const headingLine = `## ${heading}`;
  const startIndex = source.indexOf(headingLine);
  if (startIndex < 0) {
    throw new Error(`Missing markdown section "${heading}".`);
  }

  const afterHeading = source.slice(startIndex + headingLine.length);
  const nextHeadingIndex = afterHeading.search(/\n## /);
  return nextHeadingIndex < 0 ? afterHeading : afterHeading.slice(0, nextHeadingIndex);
}

function readGeneratedPackageBody(packageSourceDirectory: string, path: string): string {
  return readFileSync(join(process.cwd(), packageSourceDirectory, path), "utf8")
    .replace(/\r\n/g, "\n")
    .replace(
      /^---\n\/\*\*\n \* Generated by scripts\/portable-runtime\/generate-astro-wrappers\.ts\.\n \* Do not edit by hand; update the contract\/template instead\.\n \*\/\n/,
      "---\n",
    )
    .replace(
      /^\/\*\*\n \* Generated by scripts\/portable-runtime\/generate-astro-wrappers\.ts\.\n \* Do not edit by hand; update the contract\/template instead\.\n \*\/\n\n/,
      "",
    )
    .replace(
      /^\/\*\*\n \* Generated by scripts\/portable-runtime\/generate-react-wrappers\.ts\.\n \* Do not edit by hand; update the contract\/template instead\.\n \*\/\n\n/,
      "",
    )
    .replace(
      'import { useIsomorphicLayoutEffect } from "../internal/use-isomorphic-layout-effect";\n',
      "",
    )
    .replace(/\buseIsomorphicLayoutEffect\(/g, "React.useEffect(");
}

const syntheticStaticContract = {
  category: "static-semantic",
  component: "synthetic-static",
  displayName: "SyntheticStatic",
  frameworkNotes: {
    astro: ["Synthetic Astro note."],
    react: ["Synthetic React note."],
  },
  initialMarkup: [
    {
      attributes: ["data-sw-synthetic-static", "data-state"],
      part: "root",
      reason: "Synthetic root initial markup.",
    },
    {
      attributes: ["data-sw-synthetic-static-label", "aria-hidden"],
      part: "label",
      reason: "Synthetic label initial markup.",
    },
  ],
  parts: [
    {
      defaultElement: "div",
      discoveryAttribute: "data-sw-synthetic-static",
      forwardsRef: true,
      name: "root",
      ownsRuntime: true,
      initialAttributes: [{ name: "data-state", source: "state" }],
    },
    {
      defaultElement: "span",
      discoveryAttribute: "data-sw-synthetic-static-label",
      forwardsRef: true,
      name: "label",
      initialAttributes: [{ name: "aria-hidden", source: "constant", value: "true" }],
    },
  ],
  props: [],
  refs: [
    { part: "root", public: true },
    { part: "label", public: true },
  ],
  runtime: {
    destroys: true,
    factory: "createSyntheticStatic",
    importSource: "@starwind-ui/runtime/synthetic-static",
    rootPart: "root",
  },
} as const satisfies RuntimeAdapterContract;

const syntheticBooleanFormControlContract = {
  category: "single-boolean-control",
  component: "synthetic-boolean-form",
  displayName: "SyntheticBooleanForm",
  initialMarkup: [
    {
      attributes: ["data-sw-synthetic-boolean-form"],
      part: "root",
      reason: "Synthetic boolean form root.",
    },
  ],
  parts: [
    {
      defaultElement: "span",
      discoveryAttribute: "data-sw-synthetic-boolean-form",
      forwardsRef: true,
      name: "root",
      ownsRuntime: true,
    },
    {
      defaultElement: "input",
      discoveryAttribute: "data-sw-synthetic-boolean-form-input",
      name: "input",
    },
    {
      defaultElement: "input",
      discoveryAttribute: "data-sw-synthetic-boolean-form-unchecked-input",
      name: "uncheckedInput",
    },
    {
      defaultElement: "input",
      discoveryAttribute: "data-sw-synthetic-boolean-form-debug-input",
      forwardsRef: true,
      name: "debugInput",
    },
  ],
  props: [],
  refs: [
    { part: "root", public: true },
    { part: "debugInput", public: true },
  ],
  runtime: {
    destroys: true,
    factory: "createSyntheticBooleanForm",
    importSource: "@starwind-ui/runtime/synthetic-boolean-form",
    rootPart: "root",
  },
  form: {
    hiddenInput: { part: "input", type: "checkbox" },
    fieldIntegration: true,
    props: ["name", "value"],
  },
} as const satisfies RuntimeAdapterContract;
